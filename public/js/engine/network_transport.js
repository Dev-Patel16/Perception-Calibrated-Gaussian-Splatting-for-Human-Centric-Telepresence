/**
 * Aperture - WebRTC & Layered Splat Streaming Network Transport Simulator
 * 
 * Features:
 * - 4-Layer Progressive Splat Encoding (Base Layer 0 -> Layer 3 Foveal)
 * - Adaptive Bitrate (ABR) Controller driven by bandwidth and Quality Dial
 * - Network condition profiles (5G, Wi-Fi 6, 4G Mobile, Constrained Edge)
 * - Graceful Degradation Ladder: 3DGS -> 2.5D Point Cloud -> 2D Video -> Audio Only
 * - Real-time network statistics (Bitrate, RTT, Jitter, Packet Loss, Bytes Saved)
 */

export class NetworkTransport {
  constructor(pceEngine, renderer) {
    this.pce = pceEngine;
    this.renderer = renderer;

    // Network Profiles
    this.profiles = {
      fiber: { name: '5G / Fiber Ultra', bandwidthCap: 30.0, rttMs: 12, jitterMs: 1.5, packetLossPct: 0.0 },
      wifi: { name: 'Home Wi-Fi 6', bandwidthCap: 14.0, rttMs: 26, jitterMs: 3.2, packetLossPct: 0.1 },
      mobile4g: { name: '4G LTE Mobile', bandwidthCap: 4.8, rttMs: 68, jitterMs: 8.5, packetLossPct: 1.4 },
      congested: { name: 'Congested / Throttled', bandwidthCap: 1.8, rttMs: 150, jitterMs: 22.0, packetLossPct: 5.2 },
      extreme: { name: 'Extreme Drop / Edge', bandwidthCap: 0.7, rttMs: 260, jitterMs: 45.0, packetLossPct: 16.5 }
    };

    this.activeProfileKey = 'wifi';
    this.activeProfile = this.profiles[this.activeProfileKey];

    // Dynamic stats
    this.currentThroughputMbps = 8.2;
    this.currentRttMs = 26;
    this.currentPacketLossPct = 0.1;
    this.currentJitterMs = 3.2;

    // Active streamed layers (boolean flags)
    this.activeLayers = [true, true, true, false]; // Layer 0, 1, 2, 3
    this.degradationTier = 'tier1_3dgs_full'; // 'tier1_3dgs_full' | 'tier2_3dgs_pruned' | 'tier3_pointcloud' | 'tier4_audio_only'

    // Cumulative stats
    this.totalBytesStreamedMb = 142.5;
    this.totalBytesSavedMb = 312.8;

    this.listeners = [];
    this.startSimulationLoop();
  }

  setProfile(profileKey) {
    if (this.profiles[profileKey]) {
      this.activeProfileKey = profileKey;
      this.activeProfile = this.profiles[profileKey];
      this.evaluateAdaptiveBitrate();
    }
  }

  startSimulationLoop() {
    setInterval(() => {
      // Small natural network fluctuation
      const noise = (Math.random() - 0.5) * 0.15;
      this.currentRttMs = Math.max(8, Math.round(this.activeProfile.rttMs * (1 + noise)));
      this.currentJitterMs = Math.max(0.5, parseFloat((this.activeProfile.jitterMs * (1 + noise)).toFixed(1)));
      this.currentPacketLossPct = parseFloat((this.activeProfile.packetLossPct * (1 + noise * 0.5)).toFixed(2));

      this.evaluateAdaptiveBitrate();

      // Accumulate transmitted & saved data
      const dtSec = 1.0;
      const streamedMbThisSec = (this.currentThroughputMbps / 8.0) * dtSec;
      const baselineMbThisSec = (this.pce.naiveBaselineMbps / 8.0) * dtSec;

      this.totalBytesStreamedMb += streamedMbThisSec;
      this.totalBytesSavedMb += Math.max(0, baselineMbThisSec - streamedMbThisSec);

      this.notifyListeners();
    }, 1000);
  }

  /**
   * Evaluates ABR (Adaptive Bitrate) and triggers degradation ladder if needed
   */
  evaluateAdaptiveBitrate() {
    const dial = this.pce.calibrationDial;
    const maxAvailable = this.activeProfile.bandwidthCap;

    // Target bitrate requested by PCE dial
    const requestedBitrate = 1.4 + Math.pow(dial, 1.6) * (24.5 - 1.4);

    // Actual allocated bitrate constrained by current link capacity
    const effectiveBitrate = Math.min(requestedBitrate, maxAvailable * 0.95);
    this.currentThroughputMbps = parseFloat(effectiveBitrate.toFixed(2));

    // Degradation Ladder Decision
    if (effectiveBitrate >= 8.5 && this.currentPacketLossPct < 2.5) {
      // Tier 1: Full 3DGS (All layers active based on dial)
      this.degradationTier = 'tier1_3dgs_full';
      this.activeLayers = [true, true, true, dial > 0.8];
      this.renderer.setSimulatedDegradation('none');
    } else if (effectiveBitrate >= 3.0 && this.currentPacketLossPct < 6.0) {
      // Tier 2: Saliency-Pruned 3DGS (Base + Torso + Face Core)
      this.degradationTier = 'tier2_3dgs_pruned';
      this.activeLayers = [true, true, true, false];
      this.renderer.setSimulatedDegradation('none');
    } else if (effectiveBitrate >= 1.2 && this.currentPacketLossPct < 12.0) {
      // Tier 3: 2.5D Point Cloud fallback
      this.degradationTier = 'tier3_pointcloud';
      this.activeLayers = [true, true, false, false];
      this.renderer.setSimulatedDegradation('pointcloud_25d');
    } else {
      // Tier 4: Audio-only + Freeze-frame avatar fallback
      this.degradationTier = 'tier4_audio_only';
      this.activeLayers = [false, false, false, false];
      this.renderer.setSimulatedDegradation('audio_only');
    }
  }

  getParticipantStatus() {
    switch (this.degradationTier) {
      case 'tier1_3dgs_full':
        return { status: 'optimal', label: '3DGS Ultra', cssClass: 'status-optimal' };
      case 'tier2_3dgs_pruned':
        return { status: 'adapting', label: '3DGS Saliency LOD', cssClass: 'status-adapting' };
      case 'tier3_pointcloud':
        return { status: 'degraded', label: '2.5D Point Cloud', cssClass: 'status-degraded' };
      default:
        return { status: 'degraded', label: 'Audio Fallback', cssClass: 'status-degraded' };
    }
  }

  getNetworkStats() {
    return {
      profileName: this.activeProfile.name,
      activeProfileKey: this.activeProfileKey,
      throughputMbps: this.currentThroughputMbps,
      rttMs: this.currentRttMs,
      jitterMs: this.currentJitterMs,
      packetLossPct: this.currentPacketLossPct,
      degradationTier: this.degradationTier,
      activeLayers: [...this.activeLayers],
      totalBytesStreamedMb: parseFloat(this.totalBytesStreamedMb.toFixed(1)),
      totalBytesSavedMb: parseFloat(this.totalBytesSavedMb.toFixed(1)),
      participantStatus: this.getParticipantStatus()
    };
  }

  onNetworkUpdate(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  notifyListeners() {
    const stats = this.getNetworkStats();
    this.listeners.forEach(fn => fn(stats));
  }
}
