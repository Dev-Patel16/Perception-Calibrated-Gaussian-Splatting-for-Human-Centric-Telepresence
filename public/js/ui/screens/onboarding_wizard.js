/**
 * Aperture - Screen 1: Onboarding & Avatar Setup Wizard
 */

export class OnboardingWizardScreen {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.currentStep = 1;
    this.totalSteps = 4;

    this.selectedMode = 'webcam'; // 'multicam' | 'webcam'
    this.captureProgress = 0; // 0 to 100
    this.reconIteration = 0;
    this.isCapturing = false;
    this.reconTimer = null;

    this.lossHistory = { lpips: [], ssim: [] };

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="wizard-screen-container">
        <div class="wizard-card">
          <!-- Stepper Header -->
          <div class="wizard-stepper">
            <div class="wizard-step-item active" id="wiz-step-1">
              <div class="step-num-circle">1</div>
              <div class="step-info-text">
                <span class="step-title">Capture Rig</span>
                <span class="step-desc">Hardware mode</span>
              </div>
            </div>
            <div class="wizard-step-item" id="wiz-step-2">
              <div class="step-num-circle">2</div>
              <div class="step-info-text">
                <span class="step-title">360° Coverage</span>
                <span class="step-desc">Guided scan</span>
              </div>
            </div>
            <div class="wizard-step-item" id="wiz-step-3">
              <div class="step-num-circle">3</div>
              <div class="step-info-text">
                <span class="step-title">HVS Reconstruction</span>
                <span class="step-desc">Saliency training</span>
              </div>
            </div>
            <div class="wizard-step-item" id="wiz-step-4">
              <div class="step-num-circle">4</div>
              <div class="step-info-text">
                <span class="step-title">Privacy & Consent</span>
                <span class="step-desc">Local-only encryption</span>
              </div>
            </div>
          </div>

          <!-- Wizard Body -->
          <div class="wizard-content" id="wizard-body">
            <!-- Step contents injected dynamically -->
          </div>

          <!-- Wizard Footer Controls -->
          <div class="wizard-footer">
            <button class="btn-ghost" id="wiz-back-btn">Back</button>
            <div style="display:flex; align-items:center; gap: 14px;">
              <span id="wiz-step-counter" style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">Step 1 of 4</span>
              <button class="btn-primary" id="wiz-next-btn">Continue &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupListeners();
    this.showStep(1);
  }

  setupListeners() {
    this.container.querySelector('#wiz-back-btn').addEventListener('click', () => {
      if (this.currentStep > 1) {
        this.showStep(this.currentStep - 1);
      }
    });

    this.container.querySelector('#wiz-next-btn').addEventListener('click', () => {
      if (this.currentStep < this.totalSteps) {
        this.showStep(this.currentStep + 1);
      } else {
        // Complete onboarding -> navigate to Lobby
        this.app.showNotification('Avatar successfully reconstructed and calibrated!');
        this.app.navigateTo('lobby');
      }
    });
  }

  showStep(stepNum) {
    this.currentStep = stepNum;
    const body = this.container.querySelector('#wizard-body');
    const backBtn = this.container.querySelector('#wiz-back-btn');
    const nextBtn = this.container.querySelector('#wiz-next-btn');
    const counter = this.container.querySelector('#wiz-step-counter');

    // Update stepper classes
    for (let i = 1; i <= this.totalSteps; i++) {
      const item = this.container.querySelector(`#wiz-step-1`.replace('1', i));
      if (item) {
        item.classList.remove('active', 'completed');
        if (i < stepNum) item.classList.add('completed');
        if (i === stepNum) item.classList.add('active');
      }
    }

    backBtn.style.visibility = (stepNum === 1) ? 'hidden' : 'visible';
    counter.textContent = `Step ${stepNum} of ${this.totalSteps}`;

    if (stepNum === 1) {
      nextBtn.innerHTML = `Continue &rarr;`;
      body.innerHTML = `
        <div style="margin-bottom: 24px; text-align: center;">
          <h2 style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Choose Capture & Sensor Setup</h2>
          <p style="font-size: 14px; color: var(--text-secondary); margin-top: 6px;">
            Aperture's Perceptual Calibration Engine supports multi-camera volumetric rigs or standard webcams with monocular depth priors.
          </p>
        </div>
        <div class="mode-cards-grid">
          <div class="mode-card ${this.selectedMode === 'webcam' ? 'selected' : ''}" id="mode-opt-webcam">
            <div class="mode-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <div>
              <div class="mode-title">Standard Consumer Webcam</div>
              <div class="mode-details">Zero-hardware onboarding. Uses monocular depth estimation, facial landmark priors, and dynamic deformation. Instant setup.</div>
            </div>
          </div>
          <div class="mode-card ${this.selectedMode === 'multicam' ? 'selected' : ''}" id="mode-opt-multicam">
            <div class="mode-icon" style="background: rgba(138, 43, 226, 0.15); color: var(--accent-violet);">
              <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
            </div>
            <div>
              <div class="mode-title">Multi-Camera Volumetric Rig</div>
              <div class="mode-details">4–12 synchronized RGBD cameras. Guided ArUco extrinsic calibration for cinema-grade millimeter 3D Gaussian precision.</div>
            </div>
          </div>
        </div>
      `;

      body.querySelector('#mode-opt-webcam').addEventListener('click', () => {
        this.selectedMode = 'webcam';
        this.showStep(1);
      });
      body.querySelector('#mode-opt-multicam').addEventListener('click', () => {
        this.selectedMode = 'multicam';
        this.showStep(1);
      });
    } else if (stepNum === 2) {
      nextBtn.innerHTML = `Start Reconstruction &rarr;`;
      body.innerHTML = `
        <div class="capture-ring-stage">
          <div style="text-align: center;">
            <h2 style="font-size: 22px; font-weight: 800;">Guided 360° Coverage Scan</h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
              Slowly rotate your head left, right, and center. The coverage ring fills green as views are captured.
            </p>
          </div>

          <div class="ring-visualizer">
            <canvas class="ring-canvas" id="ring-canvas" width="260" height="260"></canvas>
            <div class="ring-center-preview">
              <canvas id="user-face-preview" width="160" height="160"></canvas>
            </div>
          </div>

          <div class="capture-status-text" id="capture-status-label">
            <span class="pulse-dot"></span>
            <span>Detecting facial landmarks & camera poses...</span>
          </div>

          <div class="coverage-metrics-bar">
            <div style="display:flex; justify-content:space-between; font-size: 12px; font-family: var(--font-mono);">
              <span style="color: var(--text-muted);">Hemispherical Coverage</span>
              <span style="color: var(--accent-cyan);" id="coverage-pct">0%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" id="coverage-fill" style="width: 0%;"></div>
            </div>
          </div>
        </div>
      `;

      this.initCaptureRingSimulation();
    } else if (stepNum === 3) {
      nextBtn.innerHTML = `Verify Calibration &rarr;`;
      body.innerHTML = `
        <div class="recon-preview-stage">
          <div class="recon-canvas-box">
            <canvas id="recon-live-canvas" width="400" height="280"></canvas>
            <div style="position: absolute; bottom: 12px; left: 16px; font-family: var(--font-mono); font-size: 11px; background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border-subtle);">
              Iteration: <span id="recon-iter-val" style="color: var(--accent-cyan);">0</span> / 2000
            </div>
          </div>

          <div class="recon-metrics-box">
            <div>
              <h3 style="font-size: 16px; font-weight: 700;">HVS-Weighted Loss Optimization</h3>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Loss function: <code>L = L1 + SSIM + (Saliency ⊙ L_LPIPS)</code>. The optimizer is focusing splat density on eyes, lips, and facial contours.
              </p>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: var(--font-mono); margin-bottom: 4px;">
                <span style="color: var(--accent-cyan);">LPIPS Perceptual Loss (Lower is better)</span>
                <span id="recon-lpips-val" style="color: var(--accent-cyan);">0.280</span>
              </div>
              <canvas class="loss-curve-canvas" id="recon-loss-canvas" width="300" height="80"></canvas>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="stat-box">
                <div class="stat-num highlight-cyan" id="recon-splats-val">120,400</div>
                <div class="stat-desc">3D Gaussians Densified</div>
              </div>
              <div class="stat-box">
                <div class="stat-num highlight-green" id="recon-pruned-val">42.5%</div>
                <div class="stat-desc">JND Redundant Pruned</div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.initReconstructionSimulation();
    } else if (stepNum === 4) {
      nextBtn.innerHTML = `Save & Launch Telepresence &rarr;`;
      body.innerHTML = `
        <div style="max-width: 650px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
          <div style="text-align: center;">
            <h2 style="font-size: 24px; font-weight: 800;">Privacy, Trust & Avatar Security</h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">
              Aperture provides local-only edge reconstruction and zero-knowledge end-to-end encryption.
            </p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <label style="display: flex; gap: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 16px; border-radius: var(--radius-md); cursor: pointer;">
              <input type="radio" name="privacy-opt" checked style="margin-top: 3px; accent-color: var(--accent-cyan);" />
              <div>
                <div style="font-weight: 700; font-size: 14px;">Local-Only Avatar Protection (Recommended)</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Raw webcam and depth scans remain strictly on your local device. Only anonymized 3D Gaussian splat deltas are streamed over WebRTC DTLS/SRTP.
                </div>
              </div>
            </label>

            <label style="display: flex; gap: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 16px; border-radius: var(--radius-md); cursor: pointer;">
              <input type="radio" name="privacy-opt" style="margin-top: 3px; accent-color: var(--accent-cyan);" />
              <div>
                <div style="font-weight: 700; font-size: 14px;">Private Edge Refinement</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Allows encrypted background re-optimization on your private self-hosted SFU relay for higher fidelity splat densities.
                </div>
              </div>
            </label>
          </div>

          <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: var(--radius-md); padding: 14px; font-size: 12px; color: #a5f3fc; display: flex; align-items: center; gap: 10px;">
            <svg style="width: 20px; height: 20px; fill: var(--accent-cyan); flex-shrink: 0;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
            <span>Biometric consent verified: Gaze vectors are evaluated client-side for foveated rendering and never recorded without opt-in.</span>
          </div>
        </div>
      `;
    }
  }

  /**
   * Interactive 360° coverage ring animation
   */
  initCaptureRingSimulation() {
    const ringCanvas = this.container.querySelector('#ring-canvas');
    const faceCanvas = this.container.querySelector('#user-face-preview');
    const statusLabel = this.container.querySelector('#capture-status-label');
    const pctLabel = this.container.querySelector('#coverage-pct');
    const fillBar = this.container.querySelector('#coverage-fill');

    if (!ringCanvas || !faceCanvas) return;

    const rCtx = ringCanvas.getContext('2d');
    const fCtx = faceCanvas.getContext('2d');

    let currentAngle = 0;
    this.captureProgress = 0;

    const anim = () => {
      if (this.currentStep !== 2) return;

      this.captureProgress = Math.min(100, this.captureProgress + 0.65);
      const angle = (this.captureProgress / 100) * Math.PI * 2;

      // Draw ring
      rCtx.clearRect(0, 0, 260, 260);
      rCtx.lineWidth = 10;

      // Background gray circle
      rCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      rCtx.beginPath();
      rCtx.arc(130, 130, 110, 0, Math.PI * 2);
      rCtx.stroke();

      // Green progress arc
      const grad = rCtx.createLinearGradient(0, 0, 260, 260);
      grad.addColorStop(0, '#00f0ff');
      grad.addColorStop(1, '#10b981');
      rCtx.strokeStyle = grad;
      rCtx.beginPath();
      rCtx.arc(130, 130, 110, -Math.PI / 2, -Math.PI / 2 + angle);
      rCtx.stroke();

      // Draw simulated camera viewpoint dots
      const numCams = 12;
      for (let c = 0; c < numCams; c++) {
        const camAngle = -Math.PI / 2 + (c / numCams) * Math.PI * 2;
        const cx = 130 + Math.cos(camAngle) * 110;
        const cy = 130 + Math.sin(camAngle) * 110;

        const isCovered = (c / numCams) <= (this.captureProgress / 100);
        rCtx.fillStyle = isCovered ? '#10b981' : 'rgba(255, 255, 255, 0.2)';
        rCtx.beginPath();
        rCtx.arc(cx, cy, 4, 0, Math.PI * 2);
        rCtx.fill();
      }

      // Draw animated simulated face silhouette in center
      fCtx.fillStyle = '#0b0f19';
      fCtx.fillRect(0, 0, 160, 160);

      // Facial oval
      const headTurn = Math.sin(this.captureProgress * 0.08) * 18;
      fCtx.fillStyle = '#1e293b';
      fCtx.beginPath();
      fCtx.ellipse(80 + headTurn, 80, 42, 54, 0, 0, Math.PI * 2);
      fCtx.fill();

      // Eyes
      fCtx.fillStyle = '#00f0ff';
      fCtx.beginPath();
      fCtx.arc(70 + headTurn * 1.1, 74, 4, 0, Math.PI * 2);
      fCtx.arc(90 + headTurn * 1.1, 74, 4, 0, Math.PI * 2);
      fCtx.fill();

      // Landmark grid
      fCtx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      fCtx.lineWidth = 1;
      fCtx.strokeRect(60 + headTurn, 55, 40, 50);

      const p = Math.floor(this.captureProgress);
      pctLabel.textContent = `${p}%`;
      fillBar.style.width = `${p}%`;

      if (p < 30) {
        statusLabel.innerHTML = `<span class="pulse-dot"></span> <span>Center pose verified. Slowly tilt head right...</span>`;
      } else if (p < 70) {
        statusLabel.innerHTML = `<span class="pulse-dot"></span> <span>Right profile locked. Now turn slowly left...</span>`;
      } else if (p < 100) {
        statusLabel.innerHTML = `<span class="pulse-dot"></span> <span>Left profile acquired. Finalizing depth envelope...</span>`;
      } else {
        statusLabel.innerHTML = `<span class="pulse-dot" style="background:#10b981;"></span> <span style="color:#10b981;">360° Volumetric Envelope Complete (128 keyframes)</span>`;
      }

      if (this.captureProgress < 100) {
        requestAnimationFrame(anim);
      }
    };

    requestAnimationFrame(anim);
  }

  /**
   * Progressive 3DGS densification & loss curve simulation
   */
  initReconstructionSimulation() {
    const liveCanvas = this.container.querySelector('#recon-live-canvas');
    const lossCanvas = this.container.querySelector('#recon-loss-canvas');
    const iterLabel = this.container.querySelector('#recon-iter-val');
    const lpipsLabel = this.container.querySelector('#recon-lpips-val');
    const splatsLabel = this.container.querySelector('#recon-splats-val');

    if (!liveCanvas || !lossCanvas) return;

    const lCtx = liveCanvas.getContext('2d');
    const lossCtx = lossCanvas.getContext('2d');

    this.reconIteration = 0;
    this.lossHistory = { lpips: [] };

    const reconAnim = () => {
      if (this.currentStep !== 3) return;

      this.reconIteration = Math.min(2000, this.reconIteration + 28);
      const t = this.reconIteration / 2000;

      // Draw progressive splat avatar refinement
      lCtx.fillStyle = '#05070c';
      lCtx.fillRect(0, 0, 400, 280);

      const splatCount = Math.floor(2000 + t * 140000);
      const pointsToDraw = Math.min(splatCount, 450);

      for (let p = 0; p < pointsToDraw; p++) {
        const seed = p * 43.123;
        const u = ((Math.sin(seed) * 10000) % 1);
        const v = ((Math.cos(seed) * 10000) % 1);

        // Concentrate around face silhouette
        const x = 200 + (u - 0.5) * 120 * (1 - t * 0.2);
        const y = 135 + (v - 0.5) * 150 * (1 - t * 0.15);

        // As t grows, splats become sharper and color-accurate
        const splatRad = Math.max(1.8, 6.0 * (1 - t * 0.65));
        const alpha = 0.4 + t * 0.55;

        // Color transitions from sparse cyan point cloud to photoreal skin tone
        const r = Math.floor(40 + t * 180);
        const g = Math.floor(180 - t * 40);
        const b = Math.floor(220 - t * 80);

        lCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        lCtx.beginPath();
        lCtx.arc(x, y, splatRad, 0, Math.PI * 2);
        lCtx.fill();
      }

      // Draw loss curve
      const currentLpips = 0.32 * Math.exp(-t * 3.2) + 0.038 + (Math.random() - 0.5) * 0.004;
      this.lossHistory.lpips.push(currentLpips);
      if (this.lossHistory.lpips.length > 50) this.lossHistory.lpips.shift();

      lossCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      lossCtx.fillRect(0, 0, 300, 80);

      lossCtx.strokeStyle = '#00f0ff';
      lossCtx.lineWidth = 1.5;
      lossCtx.beginPath();
      for (let i = 0; i < this.lossHistory.lpips.length; i++) {
        const lx = (i / 50) * 300;
        const ly = 75 - (this.lossHistory.lpips[i] / 0.35) * 65;
        if (i === 0) lossCtx.moveTo(lx, ly);
        else lossCtx.lineTo(lx, ly);
      }
      lossCtx.stroke();

      iterLabel.textContent = this.reconIteration.toLocaleString();
      lpipsLabel.textContent = currentLpips.toFixed(3);
      splatsLabel.textContent = splatCount.toLocaleString();

      if (this.reconIteration < 2000) {
        requestAnimationFrame(reconAnim);
      }
    };

    requestAnimationFrame(reconAnim);
  }
}
