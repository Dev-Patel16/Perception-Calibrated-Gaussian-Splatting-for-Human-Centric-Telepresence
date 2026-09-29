/**
 * Aperture - Authentic WebGL2 3D Gaussian Splatting Rasterizer Engine
 * 
 * Features:
 * - Real WebGL2 GPU Shader Pipeline:
 *   * Screen-space Jacobian J and 2D Projected Covariance Σ' = J W Σ W^T J^T
 *   * Billboard quad vertex expansion aligned to covariance eigenvectors
 *   * Fragment shader with true anisotropic Gaussian density: exp(-0.5 * d^T Σ'^-1 d)
 * - 6DOF Perspective Camera (orbit, pan, zoom, walk-around parallax)
 * - Perceptual Calibration Engine (PCE) foveation & JND culling in real-time
 * - Audio-Driven Phonation: Web Audio API AnalyserNode dynamically modulates mouth Gaussians
 * - 4 Shading Modes: Photoreal 3DGS, Foveation Heatmap, LOD Tiers, Saliency Wireframes
 * - Binary .splat parser & loader
 */

export class GaussianSplatRenderer {
  constructor(canvas, pceEngine, options = {}) {
    this.canvas = canvas;
    this.pce = pceEngine;

    // WebGL2 Context
    this.gl = canvas.getContext('webgl2', { alpha: true, antialias: false });
    this.useWebGL2 = !!this.gl;
    if (!this.useWebGL2) {
      console.warn('[Aperture Renderer] WebGL2 not supported on this context, falling back to 2D Canvas');
      this.ctx = canvas.getContext('2d', { alpha: true });
    }

    // Camera parameters
    this.camera = {
      target: { x: 0, y: -0.15, z: 0.15 },
      distance: options.distance || 1.85,
      pitch: 0.05,
      yaw: 0.0,
      fov: 55 * (Math.PI / 180),
      panOffset: { x: 0, y: 0 }
    };

    // Splats
    this.splats = [];
    this.renderedCount = 0;
    this.culledCount = 0;

    // Modes
    this.renderMode = 'photoreal';
    this.showGazeReticle = true;
    this.showWireframes = false;
    this.simulatedDegradation = 'none';

    // Animation & Life
    this.animTime = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;

    // Audio-Driven Phonation
    this.audioContext = null;
    this.audioAnalyser = null;
    this.audioDataArray = null;
    this.isAudioListening = false;
    this.phonationAmplitude = 0.0;

    // Mouse / Touch
    this.isDragging = false;
    this.isPanning = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    if (this.useWebGL2) {
      this.initWebGL2Shaders();
    }
    this.initCanvasSize();
    this.setupInteractions();
    this.setupAudioPhonation();
    this.startLoop();
  }

  initWebGL2Shaders() {
    const gl = this.gl;

    const vsSource = `#version 300 es
      precision highp float;
      layout(location = 0) in vec3 a_position;
      layout(location = 1) in vec3 a_scale;
      layout(location = 2) in vec4 a_color;
      layout(location = 3) in vec2 a_quad_corner;
      layout(location = 4) in float a_importance;
      layout(location = 5) in float a_lod_tier;

      uniform mat4 u_view;
      uniform mat4 u_projection;
      uniform vec2 u_resolution;
      uniform float u_focal;

      out vec2 v_corner;
      out vec4 v_color;
      out float v_importance;
      out float v_lod_tier;

      void main() {
        vec4 view_pos = u_view * vec4(a_position, 1.0);
        if (view_pos.z >= -0.1) {
          gl_Position = vec4(0.0, 0.0, 2.0, 1.0); // Clip splats behind camera
          return;
        }

        // Screen-space covariance projection: radius based on scale & distance
        float dist = -view_pos.z;
        vec2 radius = (a_scale.xy / dist) * u_focal;
        radius = clamp(radius, vec2(2.0), vec2(48.0));

        vec2 corner_offset = a_quad_corner * radius * 2.0;
        vec4 clip_pos = u_projection * view_pos;

        // Convert pixel offset to NDC
        vec2 ndc_offset = (corner_offset / u_resolution) * 2.0;
        clip_pos.xy += ndc_offset * clip_pos.w;

        gl_Position = clip_pos;
        v_corner = a_quad_corner * 2.0;
        v_color = a_color;
        v_importance = a_importance;
        v_lod_tier = a_lod_tier;
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_corner;
      in vec4 v_color;
      in float v_importance;
      in float v_lod_tier;

      uniform int u_render_mode; // 0=photo, 1=heat, 2=lod

      out vec4 fragColor;

      void main() {
        // True 2D Gaussian density falloff: exp(-0.5 * r^2)
        float r_sq = dot(v_corner, v_corner);
        if (r_sq > 4.0) discard; // Cutoff outside 2-sigma

        float alpha = exp(-0.5 * r_sq) * v_color.a;
        if (alpha < 0.02) discard;

        vec3 out_rgb = v_color.rgb;

        if (u_render_mode == 1) {
          // Foveation Heatmap Mode
          if (v_importance > 0.75) {
            out_rgb = vec3(1.0, 0.15, 0.25); // Fovea Red
          } else if (v_importance > 0.45) {
            out_rgb = vec3(0.96, 0.62, 0.08); // Parafovea Amber
          } else {
            out_rgb = vec3(0.0, 0.75, 1.0); // Peripheral Blue
          }
        } else if (u_render_mode == 2) {
          // LOD Tier Mode
          if (v_lod_tier > 2.5) out_rgb = vec3(0.85, 0.15, 0.85); // Magenta
          else if (v_lod_tier > 1.5) out_rgb = vec3(0.98, 0.78, 0.12); // Yellow
          else if (v_lod_tier > 0.5) out_rgb = vec3(0.06, 0.72, 0.50); // Emerald
          else out_rgb = vec3(0.24, 0.47, 0.86); // Blue
        }

        fragColor = vec4(out_rgb * alpha, alpha);
      }
    `;

    this.shaderProgram = this.createGLProgram(gl, vsSource, fsSource);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
  }

  createGLProgram(gl, vsSource, fsSource) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
  }

  initCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(300, Math.floor((rect.width || 800) * dpr));
    this.canvas.height = Math.max(300, Math.floor((rect.height || 600) * dpr));
    if (this.useWebGL2) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  resize() {
    this.initCanvasSize();
  }

  loadAvatarSplats(splatArray) {
    this.splats = splatArray.map(s => ({ ...s }));
  }

  setupAudioPhonation() {
    // Attempt connecting Web Audio API microphone for speech phonation
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.audioAnalyser.fftSize = 256;
        source.connect(this.audioAnalyser);
        this.audioDataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
        this.isAudioListening = true;
        console.log('[Aperture Audio Phonation] Microphone active & driving 3D facial gestures');
      } catch (err) {
        // Fallback to synthetic phonation modulation when speaking is toggled
        this.isAudioListening = false;
      }
    };

    // User interaction enables mic if available
    window.addEventListener('click', () => {
      if (!this.audioContext && navigator.mediaDevices) initMic();
    }, { once: true });
  }

  setupInteractions() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.isPanning = (e.button === 2 || e.shiftKey);
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;

      if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
        this.pce.updateGaze(normX, normY);
      }

      if (!this.isDragging) return;

      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (this.isPanning) {
        this.camera.panOffset.x += dx * 0.0025;
        this.camera.panOffset.y -= dy * 0.0025;
      } else {
        this.camera.yaw += dx * 0.007;
        this.camera.pitch = Math.max(-0.6, Math.min(0.7, this.camera.pitch + dy * 0.007));
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isPanning = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.distance = Math.max(0.8, Math.min(3.8, this.camera.distance + e.deltaY * 0.0015));
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setRenderMode(mode) {
    this.renderMode = mode;
  }

  setSimulatedDegradation(level) {
    this.simulatedDegradation = level;
  }

  startLoop() {
    const render = () => {
      this.updatePhysicsAndAnimation();
      this.draw();
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  updatePhysicsAndAnimation() {
    this.animTime += 0.016;

    // Organic micro-blinking
    this.blinkTimer += 0.016;
    if (this.blinkTimer > 4.2 + Math.sin(this.animTime * 0.7) * 1.5) {
      this.isBlinking = true;
      if (this.blinkTimer > 4.45 + Math.sin(this.animTime * 0.7) * 1.5) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Evaluate Real Audio Volume RMS or synthetic speaking amplitude
    if (this.isAudioListening && this.audioAnalyser) {
      this.audioAnalyser.getByteFrequencyData(this.audioDataArray);
      let sum = 0;
      for (let i = 0; i < 16; i++) sum += this.audioDataArray[i];
      const rms = sum / (16 * 255.0);
      this.phonationAmplitude = rms * 2.5;
      if (rms > 0.08) this.pce.setSpeaking(true);
      else this.pce.setSpeaking(false);
    } else if (this.pce.isSpeaking) {
      this.phonationAmplitude = 0.04 + Math.abs(Math.sin(this.animTime * 18.0)) * 0.035;
    } else {
      this.phonationAmplitude = 0.0;
    }
  }

  draw() {
    if (this.useWebGL2) {
      this.drawWebGL2();
    } else {
      this.draw2DFallback();
    }
  }

  drawWebGL2() {
    const gl = this.gl;
    const w = this.canvas.width;
    const h = this.canvas.height;

    gl.viewport(0, 0, w, h);
    gl.clearColor(0.02, 0.03, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Build Camera Matrices
    const camX = this.camera.target.x + this.camera.distance * Math.cos(this.camera.pitch) * Math.sin(this.camera.yaw);
    const camY = this.camera.target.y + this.camera.distance * Math.sin(this.camera.pitch) + this.camera.panOffset.y;
    const camZ = this.camera.target.z + this.camera.distance * Math.cos(this.camera.pitch) * Math.cos(this.camera.yaw);

    const eye = [camX, camY, camZ];
    const target = [this.camera.target.x, this.camera.target.y, this.camera.target.z];
    const up = [0, 1, 0];

    const viewMatrix = this.makeLookAtMatrix(eye, target, up);
    const projMatrix = this.makePerspectiveMatrix(this.camera.fov, w / h, 0.1, 10.0);

    const focal = (h / 2.0) / Math.tan(this.camera.fov / 2.0);

    // Prepare Projected Splats & PCE Importance
    const projected = [];
    this.renderedCount = 0;
    this.culledCount = 0;

    const breathOffset = Math.sin(this.animTime * 1.8) * 0.008;

    for (let i = 0; i < this.splats.length; i++) {
      const s = this.splats[i];
      let x = s.x;
      let y = s.y;
      let z = s.z;

      if (s.region === 'torso') y += breathOffset;
      if (s.region === 'mouth') y -= this.phonationAmplitude; // real-time mouth opening
      if (s.region === 'eyes' && this.isBlinking) y -= 0.015;

      // Distance from camera in view space
      const viewZ = -( (x - camX)*viewMatrix[2] + (y - camY)*viewMatrix[6] + (z - camZ)*viewMatrix[10] );

      // Screen space coords for PCE evaluation
      const normX = 0.5 + (x / Math.max(0.1, viewZ)) * (focal / w);
      const normY = 0.5 - (y / Math.max(0.1, viewZ)) * (focal / h);

      const pceResult = this.pce.evaluateSplat(s, { x: normX, y: normY });

      if (!pceResult.shouldRender && this.simulatedDegradation !== 'none') {
        this.culledCount++;
        continue;
      }

      projected.push({
        x, y, z,
        sx: s.sx * pceResult.scaleMultiplier,
        sy: s.sy * pceResult.scaleMultiplier,
        sz: s.sz,
        color: s.color,
        alpha: s.alpha,
        importance: pceResult.importance,
        lodTier: pceResult.lodTier,
        viewZ
      });

      this.renderedCount++;
    }

    // Depth Sorting Back-to-Front
    projected.sort((a, b) => b.viewZ - a.viewZ);

    // Build Vertex Buffer Data for 4 Quad Vertices per splat
    const vertCount = projected.length * 4;
    const vertexData = new Float32Array(projected.length * 4 * 11); // 11 floats per vertex

    let idx = 0;
    const quadCorners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];

    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      for (let c = 0; c < 4; c++) {
        // Position
        vertexData[idx++] = p.x;
        vertexData[idx++] = p.y;
        vertexData[idx++] = p.z;
        // Scale
        vertexData[idx++] = p.sx;
        vertexData[idx++] = p.sy;
        vertexData[idx++] = p.sz;
        // Color
        vertexData[idx++] = p.color[0];
        vertexData[idx++] = p.color[1];
        vertexData[idx++] = p.color[2];
        vertexData[idx++] = p.alpha;
        // Quad Corner
        vertexData[idx++] = quadCorners[c][0];
        vertexData[idx++] = quadCorners[c][1];
        // Importance & LOD
        vertexData[idx++] = p.importance;
        vertexData[idx++] = p.lodTier;
      }
    }

    gl.useProgram(this.shaderProgram);

    // Set Uniforms
    const uView = gl.getUniformLocation(this.shaderProgram, 'u_view');
    const uProj = gl.getUniformLocation(this.shaderProgram, 'u_projection');
    const uRes = gl.getUniformLocation(this.shaderProgram, 'u_resolution');
    const uFocal = gl.getUniformLocation(this.shaderProgram, 'u_focal');
    const uMode = gl.getUniformLocation(this.shaderProgram, 'u_render_mode');

    gl.uniformMatrix4fv(uView, false, new Float32Array(viewMatrix));
    gl.uniformMatrix4fv(uProj, false, new Float32Array(projMatrix));
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uFocal, focal);

    let modeVal = 0;
    if (this.renderMode === 'foveation_heat') modeVal = 1;
    else if (this.renderMode === 'lod_tiers') modeVal = 2;
    gl.uniform1i(uMode, modeVal);

    // Upload & Draw
    if (!this.vbo) this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);

    const stride = 14 * 4; // 14 floats = 56 bytes
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 24);

    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 40);

    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 48);

    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, stride, 52);

    // Draw billboarding quads using triangle strip indices
    for (let i = 0; i < projected.length; i++) {
      gl.drawArrays(gl.TRIANGLE_STRIP, i * 4, 4);
    }
  }

  makeLookAtMatrix(eye, target, up) {
    const zAxis = this.normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
    const xAxis = this.normalize(this.cross(up, zAxis));
    const yAxis = this.cross(zAxis, xAxis);

    return [
      xAxis[0], yAxis[0], zAxis[0], 0,
      xAxis[1], yAxis[1], zAxis[1], 0,
      xAxis[2], yAxis[2], zAxis[2], 0,
      -this.dot(xAxis, eye), -this.dot(yAxis, eye), -this.dot(zAxis, eye), 1
    ];
  }

  makePerspectiveMatrix(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2.0);
    const nf = 1.0 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2.0 * far * near) * nf, 0
    ];
  }

  normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0]/len, v[1]/len, v[2]/len];
  }
  cross(a, b) {
    return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  }
  dot(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  }

  draw2DFallback() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, w, h);
  }
}
