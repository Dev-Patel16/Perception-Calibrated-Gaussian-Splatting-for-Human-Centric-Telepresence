/**
 * Aperture - Screen 5: Multi-Party Spatial Rooms & Seating
 */

export class MultiPartyScreen {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.currentLayout = 'boardroom'; // 'one_to_one' | 'boardroom' | 'theater'
    this.participants = [
      { id: 'elena', name: 'Dr. Elena Rostova', role: 'Director', x: -0.65, z: 0.1, gazeAt: 'marcus', status: 'optimal', qoe: 95.8, bitrate: 8.2 },
      { id: 'marcus', name: 'Marcus Vance', role: 'Robotics Lead', x: 0.65, z: 0.1, gazeAt: 'elena', status: 'optimal', qoe: 94.2, bitrate: 7.8 },
      { id: 'maya', name: 'Maya Lin', role: 'Spatial Architect', x: 0.0, z: 0.9, gazeAt: 'elena', status: 'adapting', qoe: 92.0, bitrate: 5.6 }
    ];

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="multiparty-container">
        <!-- 3D Spatial Room Viewport -->
        <canvas class="spatial-stage-canvas" id="spatial-room-canvas"></canvas>

        <!-- Top HUD Controls -->
        <div class="multiparty-hud">
          <!-- Room Title & Presence -->
          <div class="participant-card">
            <div class="participant-avatar-ring status-optimal">
              <div class="avatar-placeholder">R1</div>
            </div>
            <div class="participant-info">
              <h3>Executive Spatial Boardroom <span class="brand-badge">ENCRYPTED SFU</span></h3>
              <p>Room: APTR-GLOBAL-01 &bull; 3 Volumetric Avatars Synced</p>
              <div class="participant-badges">
                <span class="qoe-badge"><span class="pulse-dot"></span> Spatial Audio 3D</span>
                <span class="tier-badge">Gaze Parallax On</span>
              </div>
            </div>
          </div>

          <!-- Layout Switcher Pills -->
          <div class="layout-switcher">
            <button class="layout-btn ${this.currentLayout === 'one_to_one' ? 'active' : ''}" data-layout="one_to_one">1:1 Executive</button>
            <button class="layout-btn ${this.currentLayout === 'boardroom' ? 'active' : ''}" data-layout="boardroom">Circular Boardroom</button>
            <button class="layout-btn ${this.currentLayout === 'theater' ? 'active' : ''}" data-layout="theater">Auditorium Theater</button>
          </div>

          <!-- Spatial Minimap & Gaze Visualizer -->
          <div class="seating-minimap-card">
            <div class="panel-title">
              <span>Seating Minimap</span>
              <span style="color: var(--accent-cyan); font-size: 10px;">Gaze Vectors</span>
            </div>
            <canvas class="minimap-canvas" id="spatial-minimap-canvas" width="188" height="120"></canvas>
            <div style="font-size: 10px; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>Elena &harr; Marcus</span>
              <span style="color: var(--accent-emerald);">Mutual Gaze (92%)</span>
            </div>
          </div>
        </div>

        <!-- Floating Host Controls Card at bottom right -->
        <div style="position: absolute; bottom: 24px; right: 24px; z-index: 50; background: var(--bg-glass-heavy); backdrop-filter: blur(28px); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px; width: 280px;">
          <div class="panel-title" style="margin-bottom: 12px;">
            <span>Host Bandwidth Allocation</span>
            <span class="brand-badge">QoS ENGINE</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Dr. Elena Rostova</span>
              <span style="color: var(--accent-cyan); font-family: var(--font-mono);">8.2 Mbps (LOD 3)</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Marcus Vance</span>
              <span style="color: var(--accent-cyan); font-family: var(--font-mono);">7.8 Mbps (LOD 2)</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Maya Lin</span>
              <span style="color: var(--accent-amber); font-family: var(--font-mono);">5.6 Mbps (LOD 1)</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupListeners();
    this.initSpatialRoomRender();
    this.initMinimapRender();
  }

  setupListeners() {
    this.container.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLayout = btn.dataset.layout;
        this.app.showNotification(`Room layout switched to: ${btn.textContent}`);
      });
    });
  }

  initSpatialRoomRender() {
    const canvas = this.container.querySelector('#spatial-room-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor((rect.width || 1200) * dpr);
    canvas.height = Math.floor((rect.height || 800) * dpr);

    let angle = 0;

    const renderRoom = () => {
      if (!this.container.classList.contains('active')) return;
      angle += 0.004;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, w, h);

      // Draw conference boardroom table in 3D perspective
      const cx = w / 2;
      const cy = h / 2 + 120;

      // Table Ellipse
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 380, 110, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Render 3 Spatial Avatars at Table
      const avatarSlots = [
        { name: 'Dr. Elena Rostova', x: cx - 280, y: cy - 90, color: [0.93, 0.78, 0.70], gazeTo: { x: cx + 280, y: cy - 90 } },
        { name: 'Marcus Vance', x: cx + 280, y: cy - 90, color: [0.65, 0.48, 0.38], gazeTo: { x: cx - 280, y: cy - 90 } },
        { name: 'Maya Lin', x: cx, y: cy - 160, color: [0.88, 0.72, 0.62], gazeTo: { x: cx - 280, y: cy - 90 } }
      ];

      avatarSlots.forEach(av => {
        // Draw 3D Gaussian Splat Cluster for Avatar
        for (let i = 0; i < 90; i++) {
          const sx = av.x + Math.sin(i * 3.7) * 35;
          const sy = av.y - 40 + Math.cos(i * 2.1) * 60;
          ctx.fillStyle = `rgba(${Math.floor(av.color[0]*255)}, ${Math.floor(av.color[1]*255)}, ${Math.floor(av.color[2]*255)}, 0.65)`;
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Visible 3D Gaze Orientation Vector
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(av.x, av.y - 50);
        ctx.lineTo(av.gazeTo.x, av.gazeTo.y - 50);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '13px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(av.name, av.x, av.y + 45);

        // Status Ring
        ctx.strokeStyle = 'var(--accent-emerald)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(av.x, av.y - 40, 52, 0, Math.PI * 2);
        ctx.stroke();
      });

      requestAnimationFrame(renderRoom);
    };

    requestAnimationFrame(renderRoom);
  }

  initMinimapRender() {
    const canvas = this.container.querySelector('#spatial-minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderMinimap = () => {
      if (!this.container.classList.contains('active')) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, w, h);

      // Table oval
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, 55, 30, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Participants dots
      const pSlots = [
        { x: w / 2 - 60, y: h / 2, target: { x: w / 2 + 60, y: h / 2 }, color: '#00f0ff' },
        { x: w / 2 + 60, y: h / 2, target: { x: w / 2 - 60, y: h / 2 }, color: '#10b981' },
        { x: w / 2, y: h / 2 - 38, target: { x: w / 2 - 60, y: h / 2 }, color: '#8a2be2' }
      ];

      pSlots.forEach(p => {
        // Gaze line
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.target.x, p.target.y);
        ctx.stroke();

        // Dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(renderMinimap);
    };

    requestAnimationFrame(renderMinimap);
  }
}
