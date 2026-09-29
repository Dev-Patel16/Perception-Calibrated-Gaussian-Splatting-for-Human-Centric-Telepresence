/**
 * Aperture - Screen 6: 3D Volumetric Session Replay
 */

export class SessionReplayScreen {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.isPlaying = true;
    this.currentTimeSec = 14.2;
    this.durationSec = 45.0;
    this.playbackSpeed = 1.0;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="replay-container">
        <!-- 3D Replay Viewport -->
        <canvas class="replay-canvas" id="replay-3d-canvas"></canvas>

        <div style="position: absolute; top: 20px; left: 20px; z-index: 20; display: flex; gap: 8px;">
          <span class="telemetry-chip">
            <span class="pulse-dot"></span>
            <span>VOLUMETRIC 3D REPLAY</span>
          </span>
          <span class="tier-badge">Free Orbit / Walk-Around Active</span>
        </div>

        <!-- Floating Timeline Scrubber Dock -->
        <div class="replay-controls-bar">
          <div class="timeline-slider-row">
            <span class="time-stamp" id="replay-current-time">00:14</span>
            <input type="range" class="timeline-slider" id="replay-scrubber" min="0" max="45" step="0.1" value="14.2" />
            <span class="time-stamp">00:45</span>
          </div>

          <div class="replay-actions-row">
            <div style="display: flex; align-items: center; gap: 12px;">
              <button class="dock-btn" id="replay-play-btn" style="width: 38px; height: 38px;">
                <svg id="play-icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>

              <button class="btn-ghost" id="speed-btn" style="padding: 4px 12px; font-size: 11px;">
                1.0x Speed
              </button>

              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">
                Session: Strategy Sync (Dr. Elena Rostova) &bull; Recorded with PCE Saliency
              </span>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn-ghost" id="export-splat-btn" style="padding: 6px 14px; font-size: 12px;">
                Export .SPLAT
              </button>
              <button class="btn-primary" id="export-video-btn" style="padding: 6px 18px; font-size: 12px;">
                Render 2D MP4
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupListeners();
    this.initReplayRender();
  }

  setupListeners() {
    const playBtn = this.container.querySelector('#replay-play-btn');
    const playIcon = this.container.querySelector('#play-icon');
    const scrubber = this.container.querySelector('#replay-scrubber');
    const timeLabel = this.container.querySelector('#replay-current-time');
    const speedBtn = this.container.querySelector('#speed-btn');

    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playIcon.innerHTML = this.isPlaying
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' // Pause icon
        : '<path d="M8 5v14l11-7z"/>'; // Play icon
    });

    scrubber.addEventListener('input', (e) => {
      this.currentTimeSec = parseFloat(e.target.value);
      timeLabel.textContent = this.formatTime(this.currentTimeSec);
    });

    speedBtn.addEventListener('click', () => {
      if (this.playbackSpeed === 1.0) this.playbackSpeed = 1.5;
      else if (this.playbackSpeed === 1.5) this.playbackSpeed = 2.0;
      else this.playbackSpeed = 1.0;
      speedBtn.textContent = `${this.playbackSpeed.toFixed(1)}x Speed`;
    });

    this.container.querySelector('#export-splat-btn').addEventListener('click', () => {
      this.app.showNotification('Exporting volumetric 3D Gaussian Splat sequence (42.8 MB)...');
    });

    this.container.querySelector('#export-video-btn').addEventListener('click', () => {
      this.app.showNotification('Rendering cinematic 4K camera fly-through MP4 video...');
    });
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  initReplayRender() {
    const canvas = this.container.querySelector('#replay-3d-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor((rect.width || 1000) * dpr);
    canvas.height = Math.floor((rect.height || 700) * dpr);

    const splats = this.app.avatarRegistry.getAvatar('elena').generator();
    let orbitAngle = 0;

    const render = () => {
      if (!this.container.classList.contains('active')) return;

      if (this.isPlaying) {
        this.currentTimeSec = (this.currentTimeSec + 0.016 * this.playbackSpeed) % this.durationSec;
        const scrubber = this.container.querySelector('#replay-scrubber');
        const timeLabel = this.container.querySelector('#replay-current-time');
        if (scrubber) scrubber.value = this.currentTimeSec;
        if (timeLabel) timeLabel.textContent = this.formatTime(this.currentTimeSec);
      }

      orbitAngle += 0.005;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, w, h);

      // Draw replay 3D avatar with animated fly-through orbit
      const cx = w / 2;
      const cy = h / 2 + 20;

      for (let i = 0; i < splats.length; i++) {
        const s = splats[i];
        const dist = Math.hypot(s.x, s.z);
        const theta = Math.atan2(s.z, s.x) + orbitAngle;

        const rx = Math.cos(theta) * dist;
        const rz = Math.sin(theta) * dist;

        const sx = cx + rx * 340;
        const sy = cy - s.y * 340;

        const r = Math.floor(s.color[0] * 255);
        const g = Math.floor(s.color[1] * 255);
        const b = Math.floor(s.color[2] * 255);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${s.alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Replay Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = '14px JetBrains Mono';
      ctx.fillText('APERTURE 3DGS REPLAY BUFFER #0042', 30, h - 30);

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}
