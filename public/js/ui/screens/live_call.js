/**
 * Aperture - Screen 3: Live Telepresence (Primary Call Viewport)
 */

export class LiveCallScreen {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.isDiagnosticsOpen = false;
    this.sparklineHistory = [];

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="live-viewport-container">
        <!-- Master 3D Gaussian Splat Canvas -->
        <canvas id="splat-canvas"></canvas>

        <!-- Viewport Overlay HUD -->
        <div class="viewport-overlay-hud">
          <!-- Top Bar: Participant Info & Quick Modes -->
          <div class="hud-top-bar">
            <!-- Remote Participant Status Card -->
            <div class="participant-card">
              <div class="participant-avatar-ring status-optimal" id="participant-status-ring">
                <div class="avatar-placeholder">ER</div>
              </div>
              <div class="participant-info">
                <h3 id="participant-name">
                  Dr. Elena Rostova
                  <span class="brand-badge">REMOTE 3DGS</span>
                </h3>
                <p id="participant-role">Director of Cognitive Telepresence &bull; Cambridge, UK</p>
                <div class="participant-badges">
                  <span class="qoe-badge" id="hud-qoe-badge">
                    <span class="pulse-dot"></span> QoE: 95.2
                  </span>
                  <span class="tier-badge" id="hud-tier-badge">Tier: 3DGS Ultra</span>
                  <span class="tier-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);" id="hud-savings-badge">
                    -68.4% Bandwidth
                  </span>
                </div>
              </div>
            </div>

            <!-- Top Right HUD Quick Toggles -->
            <div class="hud-actions">
              <button class="hud-btn" id="toggle-fovea-overlay-btn" title="Toggle Foveation Detail Heatmap">
                <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                <span>Foveation Overlay</span>
              </button>

              <button class="hud-btn" id="toggle-saliency-box-btn" title="Toggle Landmark & Saliency Regions">
                <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M3 3v6h2V5h4V3H3zm2 14H3v6h6v-2H5v-4zm14 4h-4v2h6v-6h-2v4zm0-18h-4v2h4v4h2V3h-2z"/></svg>
                <span>Saliency Regions</span>
              </button>

              <button class="hud-btn" id="toggle-diagnostics-btn">
                <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                <span>Diagnostics</span>
              </button>
            </div>
          </div>

          <!-- Gaze Reticle & Saccade Indicator in 3D scene -->
          <div class="gaze-reticle" id="live-gaze-reticle">
            <div class="gaze-reticle-fovea-ring"></div>
          </div>
        </div>

        <!-- Floating Bottom Dock Control Bar -->
        <div class="bottom-control-dock">
          <!-- Mic Toggle -->
          <button class="dock-btn" id="dock-mic-btn" title="Toggle Spatial Microphone">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          </button>

          <!-- Cam Toggle -->
          <button class="dock-btn" id="dock-cam-btn" title="Toggle 3D Avatar Capture">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </button>

          <!-- Screen / Spatial Sharing -->
          <button class="dock-btn" id="dock-share-btn" title="Share 3D Spatial Canvas / Screen">
            <svg viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>
          </button>

          <div class="dock-divider"></div>

          <!-- Quality ↔ Data Usage Dial Slider -->
          <div class="dial-container">
            <div class="dial-label-group">
              <span class="dial-title">
                <svg style="width: 12px; height: 12px; fill: var(--accent-cyan);" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                Perceptual Dial
              </span>
              <span class="dial-value" id="dial-display-text">Balanced (8.2 Mbps)</span>
            </div>

            <div class="dial-slider-wrapper">
              <input type="range" class="dial-slider" id="quality-data-slider" min="0.05" max="1.0" step="0.01" value="0.75" />
            </div>
          </div>

          <div class="dock-divider"></div>

          <!-- Phonation / Gesture Simulation (For interactive demo) -->
          <button class="dock-btn" id="dock-speak-btn" title="Simulate Remote Talking (Phonation Saliency Boost)">
            <svg viewBox="0 0 24 24"><path d="M9 13c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-6 4c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2H3zM15.08 7.05c.84 1.18.84 2.71 0 3.89l1.42 1.42c1.67-1.79 1.67-4.94 0-6.73l-1.42 1.42z"/></svg>
          </button>

          <!-- Leave Call Button -->
          <button class="dock-btn danger" id="dock-leave-btn" title="Leave Telepresence Room">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>
          </button>
        </div>

        <!-- Slide-Up Diagnostics & Analytics Drawer -->
        <div class="diagnostics-drawer" id="diagnostics-drawer">
          <div class="drawer-header">
            <div class="drawer-title">
              <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
              <span>Perceptual Calibration Engine (PCE) &mdash; Real-Time Telemetry</span>
            </div>
            <button class="drawer-close-btn" id="drawer-close-btn">&times;</button>
          </div>

          <div class="drawer-body">
            <!-- Column 1: Stream Bitrate & History -->
            <div class="diagnostic-panel">
              <div class="panel-title">
                <span>Stream Bitrate & Savings</span>
                <span style="color: var(--accent-emerald);" id="diag-savings-header">-68.4%</span>
              </div>
              <div class="stat-grid">
                <div class="stat-box">
                  <div class="stat-num highlight-cyan" id="diag-bitrate-val">8.2 Mbps</div>
                  <div class="stat-desc">Aperture Calibrated</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num" id="diag-baseline-val">28.5 Mbps</div>
                  <div class="stat-desc">Naive Uniform 3DGS</div>
                </div>
              </div>
              <canvas class="sparkline-canvas" id="bitrate-sparkline" width="260" height="65"></canvas>
            </div>

            <!-- Column 2: Perceptual QoE & HVS Metrics -->
            <div class="diagnostic-panel">
              <div class="panel-title">
                <span>Perceptual Quality (HVS)</span>
                <span style="color: var(--accent-cyan);">ISO/IEC 29170</span>
              </div>
              <div class="stat-grid">
                <div class="stat-box">
                  <div class="stat-num highlight-green" id="diag-qoe-val">95.2 / 100</div>
                  <div class="stat-desc">Perceptual QoE Score</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num" id="diag-gaze-hit-val">96.8%</div>
                  <div class="stat-desc">Gaze-Hit Prediction</div>
                </div>
              </div>
              <div class="stat-grid">
                <div class="stat-box">
                  <div class="stat-num" id="diag-lpips-val">0.052</div>
                  <div class="stat-desc">LPIPS Saliency Loss</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num" id="diag-ssim-val">0.968</div>
                  <div class="stat-desc">Structural SSIM</div>
                </div>
              </div>
            </div>

            <!-- Column 3: Splat Densities & JND Pruning -->
            <div class="diagnostic-panel">
              <div class="panel-title">
                <span>Gaussian Splat Rasterizer</span>
                <span id="diag-splat-rate" style="color: var(--text-muted); font-family: var(--font-mono);">60.0 FPS</span>
              </div>
              <div class="stat-grid">
                <div class="stat-box">
                  <div class="stat-num highlight-cyan" id="diag-active-splats">1,240</div>
                  <div class="stat-desc">Rendered (Foveated)</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num" id="diag-culled-splats">610</div>
                  <div class="stat-desc">JND Peripheral Pruned</div>
                </div>
              </div>

              <!-- Render Mode Switcher -->
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                <span style="font-size: 11px; color: var(--text-muted);">Renderer Shading Mode:</span>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                  <button class="net-btn active" id="mode-btn-photo">Photoreal 3DGS</button>
                  <button class="net-btn" id="mode-btn-heat">Foveation Heat</button>
                  <button class="net-btn" id="mode-btn-lod">LOD Tiers</button>
                  <button class="net-btn" id="mode-btn-regions">Saliency Boxes</button>
                </div>
              </div>
            </div>

            <!-- Column 4: Network Injector & Degradation Simulation -->
            <div class="diagnostic-panel">
              <div class="panel-title">
                <span>Network Degradation Injector</span>
                <span style="color: var(--accent-amber);" id="diag-net-status">Wi-Fi 6</span>
              </div>

              <div class="net-profiles-grid">
                <button class="net-btn" data-net="fiber">5G / Fiber (30M)</button>
                <button class="net-btn active" data-net="wifi">Home Wi-Fi (14M)</button>
                <button class="net-btn" data-net="mobile4g">4G LTE (4.8M)</button>
                <button class="net-btn" data-net="congested">Congested (1.8M)</button>
                <button class="net-btn" data-net="extreme">Edge Drop (0.7M)</button>
              </div>

              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: flex; justify-content: space-between; font-family: var(--font-mono);">
                <span>RTT: <b id="diag-rtt-val" style="color:#fff;">26ms</b></span>
                <span>Loss: <b id="diag-loss-val" style="color:#fff;">0.1%</b></span>
                <span>Jitter: <b id="diag-jitter-val" style="color:#fff;">3.2ms</b></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupListeners();
  }

  setupListeners() {
    const pce = this.app.pce;
    const renderer = this.app.renderer;
    const net = this.app.networkTransport;

    // Connect Canvas to the shared 3D Gaussian Splat Renderer
    const canvas = this.container.querySelector('#splat-canvas');
    if (renderer) {
      // Re-assign canvas
      renderer.canvas = canvas;
      renderer.ctx = canvas.getContext('2d', { alpha: true });
      renderer.resize();
    }

    // Diagnostics Drawer Toggle
    const drawer = this.container.querySelector('#diagnostics-drawer');
    const diagBtn = this.container.querySelector('#toggle-diagnostics-btn');
    const closeBtn = this.container.querySelector('#drawer-close-btn');

    const toggleDrawer = () => {
      this.isDiagnosticsOpen = !this.isDiagnosticsOpen;
      if (this.isDiagnosticsOpen) {
        drawer.classList.add('open');
        diagBtn.classList.add('active');
      } else {
        drawer.classList.remove('open');
        diagBtn.classList.remove('active');
      }
    };

    diagBtn.addEventListener('click', toggleDrawer);
    closeBtn.addEventListener('click', toggleDrawer);

    // Foveation Heatmap Overlay HUD Button
    const foveaBtn = this.container.querySelector('#toggle-fovea-overlay-btn');
    foveaBtn.addEventListener('click', () => {
      if (renderer.renderMode === 'foveation_heat') {
        renderer.setRenderMode('photoreal');
        foveaBtn.classList.remove('active');
        this.updateModeButtons('photoreal');
      } else {
        renderer.setRenderMode('foveation_heat');
        foveaBtn.classList.add('active');
        this.updateModeButtons('heat');
      }
    });

    // Saliency Region Boxes HUD Button
    const saliencyBtn = this.container.querySelector('#toggle-saliency-box-btn');
    saliencyBtn.addEventListener('click', () => {
      if (renderer.renderMode === 'saliency_regions') {
        renderer.setRenderMode('photoreal');
        saliencyBtn.classList.remove('active');
        this.updateModeButtons('photoreal');
      } else {
        renderer.setRenderMode('saliency_regions');
        saliencyBtn.classList.add('active');
        this.updateModeButtons('regions');
      }
    });

    // Shading Mode buttons in Diagnostics Drawer
    this.container.querySelector('#mode-btn-photo').addEventListener('click', () => {
      renderer.setRenderMode('photoreal');
      this.updateModeButtons('photoreal');
    });
    this.container.querySelector('#mode-btn-heat').addEventListener('click', () => {
      renderer.setRenderMode('foveation_heat');
      this.updateModeButtons('heat');
    });
    this.container.querySelector('#mode-btn-lod').addEventListener('click', () => {
      renderer.setRenderMode('lod_tiers');
      this.updateModeButtons('lod');
    });
    this.container.querySelector('#mode-btn-regions').addEventListener('click', () => {
      renderer.setRenderMode('saliency_regions');
      this.updateModeButtons('regions');
    });

    // Quality ↔ Data Slider
    const slider = this.container.querySelector('#quality-data-slider');
    const dialLabel = this.container.querySelector('#dial-display-text');

    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      pce.setCalibrationDial(val);

      let text = 'Balanced';
      if (val > 0.85) text = 'Ultra 3DGS';
      else if (val > 0.65) text = 'High Quality';
      else if (val > 0.4) text = 'Balanced';
      else if (val > 0.2) text = 'Data Saver';
      else text = 'Extreme Mobile';

      const t = pce.getTelemetry();
      dialLabel.textContent = `${text} (${t.bitrateMbps} Mbps)`;
    });

    // Phonation speech simulation toggle
    const speakBtn = this.container.querySelector('#dock-speak-btn');
    speakBtn.addEventListener('click', () => {
      const active = !pce.isSpeaking;
      pce.setSpeaking(active);
      speakBtn.classList.toggle('active', active);
      this.app.showNotification(active ? 'Participant speaking: Mouth & Lip phonation saliency boosted (+1.8x)' : 'Speech ended');
    });

    // Leave call
    this.container.querySelector('#dock-leave-btn').addEventListener('click', () => {
      this.app.navigateTo('lobby');
      this.app.showNotification('Disconnected from telepresence session.');
    });

    // Network Simulation buttons
    this.container.querySelectorAll('[data-net]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('[data-net]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const netKey = btn.dataset.net;
        net.setProfile(netKey);
        this.app.showNotification(`Simulating Network: ${btn.textContent}`);
      });
    });

    // Subscribe to telemetry updates
    pce.onTelemetryUpdate((telemetry) => this.updateTelemetryHUD(telemetry));
    net.onNetworkUpdate((netStats) => this.updateNetworkHUD(netStats));
  }

  updateModeButtons(activeMode) {
    const bPhoto = this.container.querySelector('#mode-btn-photo');
    const bHeat = this.container.querySelector('#mode-btn-heat');
    const bLod = this.container.querySelector('#mode-btn-lod');
    const bReg = this.container.querySelector('#mode-btn-regions');
    const foveaHudBtn = this.container.querySelector('#toggle-fovea-overlay-btn');
    const saliencyHudBtn = this.container.querySelector('#toggle-saliency-box-btn');

    [bPhoto, bHeat, bLod, bReg].forEach(b => b?.classList.remove('active'));

    if (activeMode === 'heat') {
      bHeat?.classList.add('active');
      foveaHudBtn?.classList.add('active');
      saliencyHudBtn?.classList.remove('active');
    } else if (activeMode === 'regions') {
      bReg?.classList.add('active');
      saliencyHudBtn?.classList.add('active');
      foveaHudBtn?.classList.remove('active');
    } else if (activeMode === 'lod') {
      bLod?.classList.add('active');
      foveaHudBtn?.classList.remove('active');
      saliencyHudBtn?.classList.remove('active');
    } else {
      bPhoto?.classList.add('active');
      foveaHudBtn?.classList.remove('active');
      saliencyHudBtn?.classList.remove('active');
    }
  }

  updateTelemetryHUD(telemetry) {
    // HUD chips
    const qoeBadge = this.container.querySelector('#hud-qoe-badge');
    const savingsBadge = this.container.querySelector('#hud-savings-badge');
    if (qoeBadge) qoeBadge.innerHTML = `<span class="pulse-dot"></span> QoE: ${telemetry.qoeScore}`;
    if (savingsBadge) savingsBadge.textContent = `-${telemetry.bandwidthSavedPercent}% Bandwidth`;

    // Drawer readouts
    const diagBitrate = this.container.querySelector('#diag-bitrate-val');
    const diagSavings = this.container.querySelector('#diag-savings-header');
    const diagQoe = this.container.querySelector('#diag-qoe-val');
    const diagGaze = this.container.querySelector('#diag-gaze-hit-val');
    const diagLpips = this.container.querySelector('#diag-lpips-val');
    const diagSsim = this.container.querySelector('#diag-ssim-val');

    if (diagBitrate) diagBitrate.textContent = `${telemetry.bitrateMbps} Mbps`;
    if (diagSavings) diagSavings.textContent = `-${telemetry.bandwidthSavedPercent}%`;
    if (diagQoe) diagQoe.textContent = `${telemetry.qoeScore} / 100`;
    if (diagGaze) diagGaze.textContent = `${telemetry.gazeHitRate}%`;
    if (diagLpips) diagLpips.textContent = telemetry.lpips;
    if (diagSsim) diagSsim.textContent = telemetry.ssim;

    // Splat renderer counts
    const activeSplats = this.container.querySelector('#diag-active-splats');
    const culledSplats = this.container.querySelector('#diag-culled-splats');
    if (activeSplats && this.app.renderer) activeSplats.textContent = this.app.renderer.renderedCount.toLocaleString();
    if (culledSplats && this.app.renderer) culledSplats.textContent = this.app.renderer.culledCount.toLocaleString();

    // Push to sparkline
    this.sparklineHistory.push(telemetry.bitrateMbps);
    if (this.sparklineHistory.length > 40) this.sparklineHistory.shift();
    this.drawSparkline();
  }

  updateNetworkHUD(netStats) {
    const ring = this.container.querySelector('#participant-status-ring');
    const tierBadge = this.container.querySelector('#hud-tier-badge');
    const netStatus = this.container.querySelector('#diag-net-status');

    if (ring) {
      ring.className = `participant-avatar-ring ${netStats.participantStatus.cssClass}`;
    }
    if (tierBadge) {
      tierBadge.textContent = `Tier: ${netStats.participantStatus.label}`;
    }
    if (netStatus) {
      netStatus.textContent = netStats.profileName;
    }

    const rtt = this.container.querySelector('#diag-rtt-val');
    const loss = this.container.querySelector('#diag-loss-val');
    const jitter = this.container.querySelector('#diag-jitter-val');
    if (rtt) rtt.textContent = `${netStats.rttMs}ms`;
    if (loss) loss.textContent = `${netStats.packetLossPct}%`;
    if (jitter) jitter.textContent = `${netStats.jitterMs}ms`;
  }

  drawSparkline() {
    const canvas = this.container.querySelector('#bitrate-sparkline');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, w, h);

    if (this.sparklineHistory.length < 2) return;

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    const maxVal = 25.0;
    for (let i = 0; i < this.sparklineHistory.length; i++) {
      const x = (i / (this.sparklineHistory.length - 1)) * w;
      const y = h - (this.sparklineHistory[i] / maxVal) * (h - 10) - 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Baseline reference line (Naive 28.5 Mbps)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(w, 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
