/**
 * Aperture - Screen 4: Interactive HVS Calibration Lab & Avatar Sandbox
 */

export class CalibrationLabScreen {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.simGaze = { x: 0.5, y: 0.4 };
    this.isDraggingGaze = false;
    this.selectedAvatarId = 'elena';

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="lab-container">
        <!-- Left: Interactive Gaze Sandbox Canvas -->
        <div class="lab-viewport-card">
          <div style="position: absolute; top: 16px; left: 16px; z-index: 10; display: flex; gap: 8px;">
            <span class="telemetry-chip">
              <span class="pulse-dot"></span>
              <span>INTERACTIVE HVS SANDBOX</span>
            </span>
            <span class="tier-badge">Drag crosshair across face/eyes/hands</span>
          </div>

          <canvas class="lab-canvas" id="lab-sandbox-canvas"></canvas>

          <!-- Overlay Stats Readout -->
          <div style="position: absolute; bottom: 16px; left: 16px; right: 16px; background: rgba(10, 15, 26, 0.85); backdrop-filter: blur(20px); padding: 14px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;">
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Gaze Target Region</div>
              <div style="font-size: 15px; font-weight: 700; color: var(--accent-cyan);" id="lab-target-region">EYES / IRIS</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">CSF Acuity Falloff</div>
              <div style="font-size: 15px; font-weight: 700; color: #fff;" id="lab-csf-acuity">1.00 (Fovea)</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Bandwidth Saved</div>
              <div style="font-size: 15px; font-weight: 700; color: var(--accent-emerald);" id="lab-saved-val">71.2%</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Instant Bitrate</div>
              <div style="font-size: 15px; font-weight: 700; color: var(--accent-amber);" id="lab-instant-bitrate">7.4 Mbps</div>
            </div>
          </div>
        </div>

        <!-- Right: HVS Mathematical Controls & Avatar Management -->
        <div class="lab-controls-panel">
          <!-- Card 1: CSF Acuity Curve -->
          <div class="lab-card">
            <div class="panel-title">
              <span>Contrast Sensitivity Function (CSF)</span>
              <span style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 11px;">A(e) = 1 / (1 + k·e^1.42)</span>
            </div>
            <canvas class="csf-graph-canvas" id="csf-curve-canvas" width="360" height="120"></canvas>
            <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
              Visual acuity drops sharply outside the central 2° foveal cone. Aperture allocates full 3D Gaussian splat density only within this radius while preserving peripheral social anchors.
            </div>
          </div>

          <!-- Card 2: Social Saliency Prior Weights -->
          <div class="lab-card">
            <div class="panel-title">
              <span>Human-Centric Saliency Priors</span>
              <button class="btn-ghost" id="reset-priors-btn" style="padding: 3px 10px; font-size: 10px;">Reset Default</button>
            </div>

            <div class="saliency-weights-list">
              <div class="saliency-weight-row">
                <span class="weight-name">
                  <span style="color: var(--accent-cyan);">&bull;</span> Eyes & Irises (Empathy anchor)
                </span>
                <span class="weight-val" id="val-prior-eyes">5.0x</span>
              </div>
              <input type="range" class="dial-slider" id="prior-eyes" min="1.0" max="6.0" step="0.1" value="5.0" style="width: 100%;" />

              <div class="saliency-weight-row">
                <span class="weight-name">
                  <span style="color: var(--accent-cyan);">&bull;</span> Mouth & Phonation (Speech anchor)
                </span>
                <span class="weight-val" id="val-prior-mouth">4.2x</span>
              </div>
              <input type="range" class="dial-slider" id="prior-mouth" min="1.0" max="6.0" step="0.1" value="4.2" style="width: 100%;" />

              <div class="saliency-weight-row">
                <span class="weight-name">
                  <span style="color: var(--accent-emerald);">&bull;</span> Articulated Hands (Non-verbal gestures)
                </span>
                <span class="weight-val" id="val-prior-hands">2.8x</span>
              </div>
              <input type="range" class="dial-slider" id="prior-hands" min="1.0" max="5.0" step="0.1" value="2.8" style="width: 100%;" />

              <div class="saliency-weight-row">
                <span class="weight-name">
                  <span style="color: var(--text-muted);">&bull;</span> Clothing & Peripheral Torso
                </span>
                <span class="weight-val" id="val-prior-torso">1.2x</span>
              </div>
              <input type="range" class="dial-slider" id="prior-torso" min="0.2" max="3.0" step="0.1" value="1.2" style="width: 100%;" />
            </div>
          </div>

          <!-- Card 3: Avatar Asset Store & Versioning -->
          <div class="lab-card">
            <div class="panel-title">
              <span>Avatar Library & Versioning</span>
              <span class="brand-badge">3 RECONSTRUCTIONS</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="mode-card selected" style="padding: 12px; gap: 8px;" id="avatar-item-elena">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <b style="font-size: 13px;">Dr. Elena Rostova</b>
                  <span class="qoe-badge">v2.4 (Master)</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary);">1,850 Gaussians &bull; 95.2 QoE &bull; HVS Loss</div>
              </div>

              <div class="mode-card" style="padding: 12px; gap: 8px;" id="avatar-item-marcus">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <b style="font-size: 13px;">Marcus Vance</b>
                  <span class="tier-badge">v1.8</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary);">1,720 Gaussians &bull; 93.8 QoE &bull; Robotics Rig</div>
              </div>

              <div class="mode-card" style="padding: 12px; gap: 8px;" id="avatar-item-maya">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <b style="font-size: 13px;">Maya Lin</b>
                  <span class="tier-badge">v3.1</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary);">1,940 Gaussians &bull; 96.5 QoE &bull; Multi-Rig Master</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupLabListeners();
    this.drawCSFGraph();
    this.initLabSandbox();
  }

  setupLabListeners() {
    const pce = this.app.pce;

    // Prior sliders
    const setupSlider = (id, key, valId) => {
      const slider = this.container.querySelector(`#${id}`);
      const valLabel = this.container.querySelector(`#${valId}`);
      slider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        valLabel.textContent = `${v.toFixed(1)}x`;
        pce.saliencyPriors[key] = v;
      });
    };

    setupSlider('prior-eyes', 'eyes', 'val-prior-eyes');
    setupSlider('prior-mouth', 'mouth', 'val-prior-mouth');
    setupSlider('prior-hands', 'hands', 'val-prior-hands');
    setupSlider('prior-torso', 'torso', 'val-prior-torso');

    // Reset button
    this.container.querySelector('#reset-priors-btn').addEventListener('click', () => {
      pce.saliencyPriors = { eyes: 5.0, mouth: 4.2, faceCore: 3.5, hands: 2.8, torso: 1.2, background: 0.35 };
      this.container.querySelector('#prior-eyes').value = 5.0;
      this.container.querySelector('#val-prior-eyes').textContent = '5.0x';
      this.container.querySelector('#prior-mouth').value = 4.2;
      this.container.querySelector('#val-prior-mouth').textContent = '4.2x';
      this.container.querySelector('#prior-hands').value = 2.8;
      this.container.querySelector('#val-prior-hands').textContent = '2.8x';
      this.container.querySelector('#prior-torso').value = 1.2;
      this.container.querySelector('#val-prior-torso').textContent = '1.2x';
      this.app.showNotification('Saliency priors reset to default physiological model');
    });

    // Avatar selection
    const setAvatar = (id) => {
      this.selectedAvatarId = id;
      ['elena', 'marcus', 'maya'].forEach(aId => {
        this.container.querySelector(`#avatar-item-${aId}`)?.classList.toggle('selected', aId === id);
      });
      const newSplats = this.app.avatarRegistry.getAvatar(id).generator();
      this.app.renderer.loadAvatarSplats(newSplats);
      this.app.showNotification(`Avatar switched to: ${this.app.avatarRegistry.getAvatar(id).name}`);
    };

    this.container.querySelector('#avatar-item-elena').addEventListener('click', () => setAvatar('elena'));
    this.container.querySelector('#avatar-item-marcus').addEventListener('click', () => setAvatar('marcus'));
    this.container.querySelector('#avatar-item-maya').addEventListener('click', () => setAvatar('maya'));
  }

  drawCSFGraph() {
    const canvas = this.container.querySelector('#csf-curve-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Foveal 2 deg boundary
    const foveaX = (2.2 / 30.0) * w;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.fillRect(0, 0, foveaX, h);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.beginPath(); ctx.moveTo(foveaX, 0); ctx.lineTo(foveaX, h); ctx.stroke();

    // Draw CSF Curve: A(e) = 1 / (1 + 0.045 * e^1.42)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let deg = 0; deg <= 30; deg += 0.2) {
      const x = (deg / 30.0) * w;
      const acuity = (deg <= 2.2) ? 1.0 : (1.0 / (1.0 + 0.045 * Math.pow(deg - 2.2, 1.42)));
      const y = h - 10 - acuity * (h - 25);
      if (deg === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('0° (Fovea)', 6, h - 4);
    ctx.fillText('15° (Parafovea)', w * 0.45, h - 4);
    ctx.fillText('30° (Periphery)', w - 80, h - 4);
  }

  initLabSandbox() {
    const canvas = this.container.querySelector('#lab-sandbox-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor((rect.width || 700) * dpr);
    canvas.height = Math.floor((rect.height || 550) * dpr);

    const splats = this.app.avatarRegistry.getAvatar('elena').generator();

    const updateGazePos = (e) => {
      const cRect = canvas.getBoundingClientRect();
      this.simGaze.x = (e.clientX - cRect.left) / cRect.width;
      this.simGaze.y = (e.clientY - cRect.top) / cRect.height;
      this.app.pce.updateGaze(this.simGaze.x, this.simGaze.y);
      this.updateLabReadouts();
    };

    canvas.addEventListener('mousedown', (e) => {
      this.isDraggingGaze = true;
      updateGazePos(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingGaze) updateGazePos(e);
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingGaze = false;
    });

    const renderSandbox = () => {
      if (!this.container.classList.contains('active')) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, w, h);

      // Render avatar with real-time foveation heat & splats
      const cx = w / 2;
      const cy = h / 2 + 30;
      const gx = this.simGaze.x * w;
      const gy = this.simGaze.y * h;

      for (let i = 0; i < splats.length; i++) {
        const s = splats[i];
        const sx = cx + s.x * 320;
        const sy = cy - s.y * 320;

        // Dist from gaze
        const dist = Math.hypot(sx - gx, sy - gy);
        const deg = (dist / w) * 55.0;
        const csf = this.app.pce.computeCSF(deg);

        let rad = (deg < 2.5) ? 4.5 : 2.0;
        let color = s.color;

        // Visual Heatmap in Sandbox
        if (deg < 2.5) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.95)'; // Crimson Fovea
        } else if (deg < 8.0) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.85)'; // Amber
        } else {
          ctx.fillStyle = `rgba(${Math.floor(color[0]*255)}, ${Math.floor(color[1]*255)}, ${Math.floor(color[2]*255)}, 0.45)`;
        }

        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Draggable Gaze Reticle & Rings
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gy, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Foveal 2° radius cone
      const foveaPx = (2.2 / 55.0) * w;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(gx, gy, foveaPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      requestAnimationFrame(renderSandbox);
    };

    requestAnimationFrame(renderSandbox);
  }

  updateLabReadouts() {
    const gx = this.simGaze.x;
    const gy = this.simGaze.y;

    let region = 'BACKGROUND';
    if (Math.abs(gx - 0.5) < 0.15 && Math.abs(gy - 0.35) < 0.08) {
      region = 'EYES & IRIS (5.0x Prior)';
    } else if (Math.abs(gx - 0.5) < 0.12 && Math.abs(gy - 0.48) < 0.07) {
      region = 'MOUTH & PHONATION (4.2x Prior)';
    } else if (Math.abs(gx - 0.5) < 0.22 && Math.abs(gy - 0.42) < 0.22) {
      region = 'FACE CORE (3.5x Prior)';
    } else if (gx > 0.6 && gy > 0.6) {
      region = 'ARTICULATED HANDS (2.8x Prior)';
    } else if (gy > 0.65) {
      region = 'TORSO & CLOTHING (1.2x Prior)';
    }

    const deg = Math.hypot(gx - 0.5, gy - 0.4) * 55.0;
    const csf = this.app.pce.computeCSF(deg);

    const rRegion = this.container.querySelector('#lab-target-region');
    const rCsf = this.container.querySelector('#lab-csf-acuity');
    const rSaved = this.container.querySelector('#lab-saved-val');
    const rBitrate = this.container.querySelector('#lab-instant-bitrate');

    if (rRegion) rRegion.textContent = region;
    if (rCsf) rCsf.textContent = `${csf.toFixed(2)} (${deg < 2.5 ? 'Fovea 100%' : 'Peripheral Falloff'})`;
    if (rSaved) rSaved.textContent = `${(60 + (1 - csf) * 28).toFixed(1)}%`;
    if (rBitrate) rBitrate.textContent = `${(5.2 + csf * 5.8).toFixed(1)} Mbps`;
  }
}
