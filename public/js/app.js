/**
 * Aperture - Master Telepresence Application Controller
 * 
 * Orchestrates:
 * - Perceptual Calibration Engine (PCE)
 * - 3D Gaussian Splatting Renderer
 * - WebRTC Network Transport & Degradation Ladder
 * - Multi-Screen Routing & State Management
 */

import { PerceptualCalibrationEngine } from './engine/pce.js';
import { AvatarModelRegistry } from './models/avatars.js';
import { GaussianSplatRenderer } from './engine/splat_renderer.js';
import { NetworkTransport } from './engine/network_transport.js';

import { OnboardingWizardScreen } from './ui/screens/onboarding_wizard.js';
import { LobbyScreen } from './ui/screens/lobby.js';
import { LiveCallScreen } from './ui/screens/live_call.js';
import { CalibrationLabScreen } from './ui/screens/calibration_lab.js';
import { MultiPartyScreen } from './ui/screens/multi_party.js';
import { SessionReplayScreen } from './ui/screens/session_replay.js';
import { AdminDashboardScreen } from './ui/screens/admin_dashboard.js';

class ApertureApp {
  constructor() {
    this.currentScreen = 'live'; // Default to primary live telepresence screen for instant WOW factor
    this.screens = {};

    // 1. Initialize Engines
    this.pce = new PerceptualCalibrationEngine();
    this.avatarRegistry = new AvatarModelRegistry();

    // Splat renderer will attach to #splat-canvas when Live screen mounts
    this.renderer = null;
    this.networkTransport = null;

    this.init();
  }

  init() {
    console.log('[Aperture] Initializing Telepresence Platform...');

    // Setup master canvases & renderer
    const liveCanvas = document.querySelector('#splat-canvas');
    if (liveCanvas) {
      this.renderer = new GaussianSplatRenderer(liveCanvas, this.pce);
      const defaultAvatar = this.avatarRegistry.getAvatar('elena');
      this.renderer.loadAvatarSplats(defaultAvatar.generator());
    }

    this.networkTransport = new NetworkTransport(this.pce, this.renderer);

    // Initialize UI Screens
    this.initScreens();
    this.initNavigation();
    this.initHeaderTelemetry();

    // Default route
    this.navigateTo('live');

    this.showNotification('Aperture PCE Engine Online &bull; Foveated 3DGS Calibrated');
  }

  initScreens() {
    this.screens = {
      onboarding: new OnboardingWizardScreen(document.querySelector('#screen-onboarding'), this),
      lobby: new LobbyScreen(document.querySelector('#screen-lobby'), this),
      live: new LiveCallScreen(document.querySelector('#screen-live'), this),
      lab: new CalibrationLabScreen(document.querySelector('#screen-lab'), this),
      multiparty: new MultiPartyScreen(document.querySelector('#screen-multiparty'), this),
      replay: new SessionReplayScreen(document.querySelector('#screen-replay'), this),
      admin: new AdminDashboardScreen(document.querySelector('#screen-admin'), this)
    };
  }

  initNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const screenKey = tab.dataset.screen;
        if (screenKey) {
          this.navigateTo(screenKey);
        }
      });
    });

    // Brand logo click returns to Live screen
    document.querySelector('.brand-logo')?.addEventListener('click', () => {
      this.navigateTo('live');
    });
  }

  navigateTo(screenKey) {
    if (!this.screens[screenKey]) return;

    this.currentScreen = screenKey;

    // Update Nav Tab UI
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.screen === screenKey);
    });

    // Toggle screen DOM views
    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    const activeView = document.querySelector(`#screen-${screenKey}`);
    if (activeView) {
      activeView.classList.add('active');
    }

    // Inform renderer or canvases of resize
    if (screenKey === 'live' && this.renderer) {
      setTimeout(() => this.renderer.resize(), 50);
    }
  }

  initHeaderTelemetry() {
    const bitrateVal = document.querySelector('#header-bitrate-val');
    const qoeVal = document.querySelector('#header-qoe-val');
    const savingsVal = document.querySelector('#header-savings-val');

    this.pce.onTelemetryUpdate(t => {
      if (bitrateVal) bitrateVal.textContent = `${t.bitrateMbps} Mbps`;
      if (qoeVal) qoeVal.textContent = `${t.qoeScore}`;
      if (savingsVal) savingsVal.textContent = `-${t.bandwidthSavedPercent}%`;
    });
  }

  showNotification(message, duration = 3500) {
    const container = document.querySelector('#toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="pulse-dot"></span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.ApertureApp = new ApertureApp();
});
