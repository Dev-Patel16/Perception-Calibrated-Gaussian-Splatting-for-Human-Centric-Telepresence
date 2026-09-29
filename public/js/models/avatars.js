/**
 * Aperture Telepresence - Realistic 3D Human Gaussian Splat Avatars
 * 
 * Generates volumetric 3D Gaussian Splat models with anatomical segmentation:
 * - Eyes (irises, pupils, specular glint)
 * - Mouth (lips, corners, phonation anchors)
 * - Face Core (cheekbones, nose bridge, chin, brow)
 * - Hair & Head volume
 * - Articulated Hands & Gestures
 * - Torso & Clothing
 */

export class AvatarModelRegistry {
  constructor() {
    this.avatars = {
      elena: {
        id: 'elena',
        name: 'Dr. Elena Rostova',
        role: 'Director of Cognitive Telepresence',
        organization: 'Aperture Research Lab',
        baseColor: '#00f0ff',
        reconstructionVersion: 'v2.4 (HVS-Refined)',
        splatCount: 1850,
        generator: () => this.generateHumanAvatar({
          skinTone: [0.93, 0.78, 0.70],
          hairColor: [0.18, 0.12, 0.10],
          eyeColor: [0.15, 0.55, 0.85],
          clothingColor: [0.12, 0.16, 0.26],
          collarColor: [0.95, 0.95, 0.98]
        })
      },
      marcus: {
        id: 'marcus',
        name: 'Marcus Vance',
        role: 'Spatial Robotics Engineer',
        organization: 'OmniPresence Tech',
        baseColor: '#10b981',
        reconstructionVersion: 'v1.8 (Active Session)',
        splatCount: 1720,
        generator: () => this.generateHumanAvatar({
          skinTone: [0.65, 0.48, 0.38],
          hairColor: [0.08, 0.08, 0.08],
          eyeColor: [0.35, 0.22, 0.12],
          clothingColor: [0.18, 0.28, 0.24],
          collarColor: [0.25, 0.45, 0.38]
        })
      },
      maya: {
        id: 'maya',
        name: 'Maya Lin',
        role: 'Spatial Computing Architect',
        organization: 'Studio Hyperion',
        baseColor: '#8a2be2',
        reconstructionVersion: 'v3.1 (Multi-Rig Master)',
        splatCount: 1940,
        generator: () => this.generateHumanAvatar({
          skinTone: [0.88, 0.72, 0.62],
          hairColor: [0.12, 0.10, 0.14],
          eyeColor: [0.20, 0.45, 0.35],
          clothingColor: [0.30, 0.15, 0.40],
          collarColor: [0.85, 0.80, 0.95]
        })
      }
    };
  }

  getAvatar(id = 'elena') {
    return this.avatars[id] || this.avatars.elena;
  }

  getAllAvatars() {
    return Object.values(this.avatars);
  }

  /**
   * Generates volumetric 3D Gaussian Splats with anatomical realism
   */
  generateHumanAvatar(params) {
    const splats = [];

    const { skinTone, hairColor, eyeColor, clothingColor, collarColor } = params;

    // Helper to add a Gaussian Splat
    const addSplat = (x, y, z, sx, sy, sz, rot, color, alpha, region, baseLayer) => {
      splats.push({
        x, y, z,
        sx, sy, sz,
        rot: rot || 0,
        color: [...color],
        alpha: Math.min(0.95, alpha),
        region, // 'eyes', 'mouth', 'faceCore', 'hands', 'torso', 'background'
        baseLayer // 0 = Base, 1 = Mid, 2 = High, 3 = Foveal Detail
      });
    };

    // ==========================================
    // 1. EYES & GAZE CORRIDOR (Highest Saliency)
    // ==========================================
    const eyeZ = 0.34;
    const eyeY = 0.28;
    const leftEyeX = -0.16;
    const rightEyeX = 0.16;

    // Left & Right Irises
    [leftEyeX, rightEyeX].forEach((eyeX, idx) => {
      // Sclera (White of eye)
      addSplat(eyeX, eyeY, eyeZ - 0.01, 0.055, 0.032, 0.025, 0, [0.94, 0.95, 0.97], 0.92, 'eyes', 1);
      
      // Iris disc (Colored Gaussians)
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const r = 0.018 + Math.random() * 0.008;
        const ix = eyeX + Math.cos(angle) * r;
        const iy = eyeY + Math.sin(angle) * r * 0.9;
        addSplat(ix, iy, eyeZ + 0.005, 0.012, 0.012, 0.008, angle, eyeColor, 0.95, 'eyes', 2);
      }

      // Pupil (Deep dark center)
      addSplat(eyeX, eyeY, eyeZ + 0.008, 0.014, 0.014, 0.008, 0, [0.03, 0.03, 0.04], 0.98, 'eyes', 3);

      // Specular Cornea Glint (Creates life & emotional connection!)
      addSplat(eyeX + 0.007, eyeY + 0.008, eyeZ + 0.012, 0.007, 0.007, 0.005, 0, [1.0, 1.0, 1.0], 1.0, 'eyes', 3);

      // Upper & Lower Eyelids and lash line
      for (let l = -0.04; l <= 0.04; l += 0.012) {
        const lidY = eyeY + 0.024 - (l * l) * 2.2;
        addSplat(eyeX + l, lidY, eyeZ + 0.01, 0.018, 0.008, 0.01, 0, [skinTone[0] * 0.85, skinTone[1] * 0.78, skinTone[2] * 0.75], 0.88, 'eyes', 2);
      }

      // Eyebrow arch
      for (let b = -0.055; b <= 0.055; b += 0.01) {
        const browY = eyeY + 0.065 - (b * b) * 1.8;
        addSplat(eyeX + b, browY, eyeZ + 0.005, 0.018, 0.012, 0.01, b * 0.4, hairColor, 0.85, 'faceCore', 1);
      }
    });

    // ==========================================
    // 2. MOUTH & PHONATION REGION (High Saliency)
    // ==========================================
    const mouthY = -0.08;
    const mouthZ = 0.38;

    // Upper Lip arch (Cupid's bow)
    for (let u = -0.09; u <= 0.09; u += 0.012) {
      const cupidCurve = Math.abs(u) < 0.025 ? Math.abs(u) * 0.15 : (0.09 - Math.abs(u)) * 0.12;
      const uy = mouthY + cupidCurve + 0.012;
      const lipColor = [skinTone[0] * 0.95, skinTone[1] * 0.52, skinTone[2] * 0.52];
      addSplat(u, uy, mouthZ - Math.abs(u) * 0.15, 0.018, 0.012, 0.01, 0, lipColor, 0.92, 'mouth', 2);
    }

    // Lower Lip fullness
    for (let d = -0.08; d <= 0.08; d += 0.012) {
      const lowerCurve = -(0.08 - Math.abs(d)) * 0.22;
      const dy = mouthY + lowerCurve - 0.008;
      const lipColor = [skinTone[0] * 0.98, skinTone[1] * 0.55, skinTone[2] * 0.55];
      addSplat(d, dy, mouthZ - Math.abs(d) * 0.15 + 0.005, 0.02, 0.014, 0.01, 0, lipColor, 0.94, 'mouth', 2);
    }

    // Micro phonation anchors (teeth/oral depth inside mouth)
    addSplat(0, mouthY, mouthZ - 0.02, 0.06, 0.015, 0.02, 0, [0.25, 0.1, 0.1], 0.85, 'mouth', 3);

    // ==========================================
    // 3. FACE CORE (Nose, Cheeks, Forehead, Chin)
    // ==========================================
    // Nose Bridge & Tip
    for (let ny = 0.22; ny >= -0.02; ny -= 0.025) {
      const t = (0.22 - ny) / 0.24;
      const nZ = 0.33 + t * 0.11; // nose protrudes forward in Z
      const nWidth = 0.02 + t * 0.028;
      addSplat(0, ny, nZ, nWidth, 0.025, 0.025, 0, skinTone, 0.9, 'faceCore', 1);
      // Nostril wings
      if (t > 0.75) {
        addSplat(-0.042, ny - 0.01, nZ - 0.02, 0.02, 0.018, 0.015, -0.2, skinTone, 0.88, 'faceCore', 2);
        addSplat(0.042, ny - 0.01, nZ - 0.02, 0.02, 0.018, 0.015, 0.2, skinTone, 0.88, 'faceCore', 2);
      }
    }

    // Cheekbones (Left & Right curves)
    for (let cy = 0.15; cy >= -0.05; cy -= 0.035) {
      for (let cx = 0.12; cx <= 0.32; cx += 0.04) {
        const cZ = 0.30 - (cx - 0.12) * 0.8;
        const shade = 1.0 - (cx - 0.12) * 0.4;
        const color = [skinTone[0] * shade, skinTone[1] * shade, skinTone[2] * shade];
        // Left & Right symmetric splats
        addSplat(cx, cy, cZ, 0.045, 0.04, 0.03, 0.2, color, 0.85, 'faceCore', 1);
        addSplat(-cx, cy, cZ, 0.045, 0.04, 0.03, -0.2, color, 0.85, 'faceCore', 1);
      }
    }

    // Chin & Jawline
    for (let jx = -0.25; jx <= 0.25; jx += 0.035) {
      const jy = -0.22 + (Math.abs(jx) * 0.35);
      const jz = 0.32 - Math.abs(jx) * 0.9;
      addSplat(jx, jy, jz, 0.042, 0.035, 0.03, jx * 0.5, skinTone, 0.88, 'faceCore', 1);
    }

    // Forehead dome
    for (let fy = 0.35; fy <= 0.58; fy += 0.04) {
      for (let fx = -0.28; fx <= 0.28; fx += 0.045) {
        if (fx * fx + (fy - 0.35) * (fy - 0.35) < 0.11) {
          const fz = 0.32 - (fx * fx) * 1.8 - (fy - 0.35) * 0.6;
          addSplat(fx, fy, fz, 0.045, 0.04, 0.03, 0, skinTone, 0.88, 'faceCore', 0);
        }
      }
    }

    // ==========================================
    // 4. HAIR & CRANIAL VOLUME
    // ==========================================
    for (let hy = 0.40; hy <= 0.72; hy += 0.035) {
      for (let hx = -0.38; hx <= 0.38; hx += 0.04) {
        const radSq = hx * hx + (hy - 0.42) * (hy - 0.42);
        if (radSq > 0.06 && radSq < 0.18) {
          const hz = 0.30 - radSq * 1.6;
          addSplat(hx, hy, hz, 0.05, 0.045, 0.035, hx * 0.8, hairColor, 0.92, 'faceCore', 0);
        }
      }
    }

    // Back of head & neck
    for (let by = -0.3; by <= 0.5; by += 0.06) {
      for (let bx = -0.3; bx <= 0.3; bx += 0.06) {
        addSplat(bx, by, -0.15 - Math.random() * 0.08, 0.065, 0.065, 0.05, 0, hairColor, 0.8, 'background', 0);
      }
    }

    // Neck column
    for (let ny = -0.22; ny >= -0.42; ny -= 0.04) {
      for (let nx = -0.14; nx <= 0.14; nx += 0.045) {
        addSplat(nx, ny, 0.12 - Math.abs(nx) * 0.3, 0.045, 0.04, 0.03, 0, skinTone, 0.85, 'faceCore', 0);
      }
    }

    // ==========================================
    // 5. TORSO & PROFESSIONAL CLOTHING (Upper Body)
    // ==========================================
    // Executive Collar / Shirt
    for (let cx = -0.18; cx <= 0.18; cx += 0.035) {
      const cy = -0.38 - Math.abs(cx) * 0.45;
      addSplat(cx, cy, 0.22, 0.045, 0.035, 0.025, cx * 0.4, collarColor, 0.9, 'torso', 1);
    }

    // Blazer & Shoulders (Dense volumetric splats)
    for (let ty = -0.42; ty >= -1.05; ty -= 0.05) {
      const shoulderSpread = 0.65 + (ty + 0.42) * 0.25;
      for (let tx = -shoulderSpread; tx <= shoulderSpread; tx += 0.055) {
        const tz = 0.18 - Math.abs(tx) * 0.4;
        const shade = 0.85 + Math.random() * 0.25;
        const c = [clothingColor[0] * shade, clothingColor[1] * shade, clothingColor[2] * shade];
        addSplat(tx, ty, tz, 0.065, 0.06, 0.045, tx * 0.3, c, 0.92, 'torso', 0);
      }
    }

    // ==========================================
    // 6. ARTICULATED HANDS (High Social Saliency)
    // ==========================================
    // Right Hand (Gesturing forward in telepresence conversation)
    const rightHandPos = { x: 0.38, y: -0.45, z: 0.42 };
    
    // Palm
    addSplat(rightHandPos.x, rightHandPos.y, rightHandPos.z, 0.055, 0.06, 0.035, 0.35, skinTone, 0.9, 'hands', 1);

    // 5 Articulated Fingers
    const fingerOffsets = [
      { name: 'thumb', dx: -0.045, dy: 0.02, dz: 0.03, len: 3 },
      { name: 'index', dx: -0.015, dy: 0.06, dz: 0.04, len: 4 },
      { name: 'middle', dx: 0.01, dy: 0.07, dz: 0.045, len: 4 },
      { name: 'ring', dx: 0.035, dy: 0.06, dz: 0.035, len: 4 },
      { name: 'pinky', dx: 0.055, dy: 0.04, dz: 0.02, len: 3 }
    ];

    fingerOffsets.forEach(finger => {
      for (let seg = 1; seg <= finger.len; seg++) {
        const fx = rightHandPos.x + finger.dx * (seg / finger.len);
        const fy = rightHandPos.y + finger.dy * (seg / finger.len);
        const fz = rightHandPos.z + finger.dz * (seg / finger.len);
        // Fingernail and micro-ridge on distal segment
        const isFingertip = (seg === finger.len);
        const fColor = isFingertip ? [skinTone[0] * 1.05, skinTone[1] * 0.9, skinTone[2] * 0.9] : skinTone;
        const layer = isFingertip ? 3 : 2;
        addSplat(fx, fy, fz, 0.018, 0.02, 0.015, 0.3, fColor, 0.92, 'hands', layer);
      }
    });

    // Left Hand (Relaxed on conference armrest)
    const leftHandPos = { x: -0.42, y: -0.68, z: 0.35 };
    addSplat(leftHandPos.x, leftHandPos.y, leftHandPos.z, 0.06, 0.06, 0.04, -0.2, skinTone, 0.88, 'hands', 1);
    for (let f = -0.04; f <= 0.04; f += 0.02) {
      addSplat(leftHandPos.x + f, leftHandPos.y + 0.05, leftHandPos.z + 0.02, 0.018, 0.035, 0.018, -0.2, skinTone, 0.9, 'hands', 2);
    }

    return splats;
  }
}
