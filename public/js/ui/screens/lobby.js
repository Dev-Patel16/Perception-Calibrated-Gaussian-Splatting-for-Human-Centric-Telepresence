/**
 * Aperture - Screen 2: Telepresence Lobby & Pre-Flight Check
 */

export class LobbyScreen {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.selectedEnv = 'studio';
    this.micVuInterval = null;
    this.render();
  }

  render() {
    const defaultRoom = 'APTR-882-FOVEA';

    this.container.innerHTML = `
      <div class="lobby-container">
        <!-- Left: Live 3D Splat Self-Preview -->
        <div class="lobby-self-preview-card">
          <canvas class="self-preview-canvas" id="lobby-splat-canvas"></canvas>
          <div class="preview-badge-overlay">
            <span class="telemetry-chip">
              <span class="pulse-dot"></span>
              <span>LIVE 3DGS SELF-AVATAR</span>
            </span>
            <span class="qoe-badge">QoE: 98.4 / 100</span>
          </div>

          <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; background: rgba(10, 15, 26, 0.75); backdrop-filter: blur(16px); padding: 10px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: var(--text-secondary);">
              Orbit & inspect yourself: <span style="color: var(--accent-cyan);">Click + Drag</span>
            </div>
            <div style="font-size: 11px; font-family: var(--font-mono); color: var(--accent-emerald);">
              Gaze Synced (120 Hz)
            </div>
          </div>
        </div>

        <!-- Right: Pre-flight Hardware Check & Room Join -->
        <div class="lobby-config-panel">
          <div class="lobby-title-block">
            <h1>Pre-Flight Telepresence Check</h1>
            <p>Verify sensor feeds and foveated rendering acceleration before entering the room.</p>
          </div>

          <!-- Hardware Matrix -->
          <div class="health-matrix">
            <div class="health-chip">
              <div class="health-chip-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5z"/></svg>
              </div>
              <div class="health-chip-text">
                <span class="health-chip-label">Camera Sensor</span>
                <span class="health-chip-status"><span class="pulse-dot"></span> 4K RGBD Active</span>
              </div>
            </div>

            <div class="health-chip">
              <div class="health-chip-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-emerald);">
                <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              </div>
              <div class="health-chip-text">
                <span class="health-chip-label">Spatial Mic (VU)</span>
                <span class="health-chip-status"><span class="pulse-dot"></span> 48 kHz Stereo</span>
                <div class="vu-bar-wrapper">
                  <div class="vu-bar-fill" id="lobby-vu-bar"></div>
                </div>
              </div>
            </div>

            <div class="health-chip">
              <div class="health-chip-icon" style="background: rgba(138, 43, 226, 0.1); color: var(--accent-violet);">
                <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              </div>
              <div class="health-chip-text">
                <span class="health-chip-label">Gaze Tracker (PCE)</span>
                <span class="health-chip-status"><span class="pulse-dot"></span> 98% Confidence</span>
              </div>
            </div>

            <div class="health-chip">
              <div class="health-chip-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--accent-amber);">
                <svg viewBox="0 0 24 24"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/></svg>
              </div>
              <div class="health-chip-text">
                <span class="health-chip-label">GPU Acceleration</span>
                <span class="health-chip-status"><span class="pulse-dot"></span> WebGPU / WebGL2</span>
              </div>
            </div>
          </div>

          <!-- Environment Preset Picker -->
          <div class="env-picker">
            <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Virtual Room Environment</span>
            <div class="env-pills-row">
              <button class="env-pill active" data-env="studio">Studio Minimalist</button>
              <button class="env-pill" data-env="lounge">Cybernetic Lounge</button>
              <button class="env-pill" data-env="glass">Gaussian Glass Office</button>
              <button class="env-pill" data-env="passthrough">Blurred Passthrough</button>
            </div>
          </div>

          <!-- Room Code & Join -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Spatial Room Code</span>
            <div class="join-room-box">
              <input type="text" class="room-input" id="room-code-input" value="${defaultRoom}" />
              <button class="btn-ghost" id="copy-link-btn" title="Copy Invite Link">
                <svg style="width: 16px; height: 16px; fill: currentColor; vertical-align: middle;" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              </button>
              <button class="btn-primary" id="join-call-btn" style="padding: 12px 32px; font-size: 14px;">
                Enter Telepresence &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupLobbyListeners();
    this.initLobbySplatPreview();
  }

  setupLobbyListeners() {
    // Copy link button
    this.container.querySelector('#copy-link-btn').addEventListener('click', () => {
      const code = this.container.querySelector('#room-code-input').value;
      navigator.clipboard?.writeText(`https://aperture.telepresence/join/${code}`);
      this.app.showNotification('Telepresence room link copied to clipboard!');
    });

    // Environment picker buttons
    this.container.querySelectorAll('.env-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.env-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedEnv = btn.dataset.env;
        this.app.showNotification(`Environment updated to: ${btn.textContent}`);
      });
    });

    // Enter call
    this.container.querySelector('#join-call-btn').addEventListener('click', () => {
      const room = this.container.querySelector('#room-code-input').value;
      this.app.showNotification(`Connecting to ${room}...`);
      this.app.navigateTo('live');
    });

    // Mic VU meter simulation
    const vuBar = this.container.querySelector('#lobby-vu-bar');
    this.micVuInterval = setInterval(() => {
      if (vuBar) {
        const level = 25 + Math.random() * 55;
        vuBar.style.width = `${level}%`;
      }
    }, 120);
  }

  initLobbySplatPreview() {
    const canvas = this.container.querySelector('#lobby-splat-canvas');
    if (!canvas) return;

    // We can instantiate a mini renderer for the self-avatar preview
    const selfSplats = this.app.avatarRegistry.getAvatar('elena').generator();
    const ctx = canvas.getContext('2d');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 600 * dpr;
    canvas.height = 580 * dpr;

    let rot = 0;

    const renderSelf = () => {
      if (!this.container.classList.contains('active')) {
        // Stop if not in lobby
        return;
      }

      rot += 0.008;

      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render simplified preview
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 30;

      for (let i = 0; i < Math.min(selfSplats.length, 300); i++) {
        const s = selfSplats[i];
        const rad = Math.hypot(s.x, s.z);
        const curAngle = Math.atan2(s.z, s.x) + rot;

        const rx = Math.cos(curAngle) * rad;
        const rz = Math.sin(curAngle) * rad;

        const sx = cx + rx * 280;
        const sy = cy - s.y * 280;

        const r = Math.floor(s.color[0] * 255);
        const g = Math.floor(s.color[1] * 255);
        const b = Math.floor(s.color[2] * 255);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${s.alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(renderSelf);
    };

    requestAnimationFrame(renderSelf);
  }
}
