/**
 * Verification Test Suite for Aperture Core Modules (ESM)
 */

async function runVerification() {
  console.log('--- [Aperture Automated Verification Suite] ---');

  // Dynamic import of ES modules
  const pceModule = await import('./public/js/engine/pce.js');
  const avatarModule = await import('./public/js/models/avatars.js');

  const pce = new pceModule.PerceptualCalibrationEngine();
  console.log('✔ Perceptual Calibration Engine (PCE) initialized');

  // 1. Validate CSF Acuity formula
  const foveaAcuity = pce.computeCSF(1.5); // <= 2.2 deg
  const parafoveaAcuity = pce.computeCSF(5.0);
  const peripheryAcuity = pce.computeCSF(25.0);

  console.log(`  - Foveal Acuity (1.5°): ${foveaAcuity} (Expected: 1.0)`);
  console.log(`  - Parafoveal Acuity (5.0°): ${parafoveaAcuity.toFixed(3)} (Expected: < 1.0)`);
  console.log(`  - Peripheral Acuity (25.0°): ${peripheryAcuity.toFixed(3)} (Expected: < 0.3)`);

  if (foveaAcuity !== 1.0 || parafoveaAcuity >= 1.0 || peripheryAcuity >= parafoveaAcuity) {
    throw new Error('CSF curve formula verification failed!');
  }
  console.log('✔ CSF eccentricity falloff mathematically validated');

  // 2. Validate Saliency Priors & Speech Phonation Boost
  const baseSplat = { x: 0, y: 0, z: 0.3, region: 'mouth' };
  const evalNormal = pce.evaluateSplat(baseSplat, { x: 0.5, y: 0.5 });

  pce.setSpeaking(true);
  const evalSpeaking = pce.evaluateSplat(baseSplat, { x: 0.5, y: 0.5 });

  console.log(`  - Mouth Saliency (Quiet): ${evalNormal.saliencyWeight.toFixed(2)}`);
  console.log(`  - Mouth Saliency (Speaking): ${evalSpeaking.saliencyWeight.toFixed(2)}`);

  if (evalSpeaking.saliencyWeight <= evalNormal.saliencyWeight) {
    throw new Error('Phonation saliency boost failed!');
  }
  console.log('✔ Dynamic speech phonation boost verified');

  // 3. Validate Avatar Volumetric Splat Generation
  const registry = new avatarModule.AvatarModelRegistry();
  const elena = registry.getAvatar('elena');
  const splats = elena.generator();

  console.log(`✔ Generated Avatar: ${elena.name} with ${splats.length} volumetric 3D Gaussians`);

  const regions = {};
  splats.forEach(s => { regions[s.region] = (regions[s.region] || 0) + 1; });
  console.log('  - Anatomical regions distribution:', regions);

  if (!regions.eyes || !regions.mouth || !regions.faceCore || !regions.hands || !regions.torso) {
    throw new Error('Missing anatomical regions in generated avatar!');
  }
  console.log('✔ All anatomical regions (eyes, mouth, faceCore, hands, torso) present');

  // 4. Validate Calibration Dial Telemetry
  pce.setCalibrationDial(0.75);
  const tele75 = pce.getTelemetry();
  console.log(`  - Telemetry at 0.75 Dial: Bitrate ${tele75.bitrateMbps} Mbps, QoE ${tele75.qoeScore}, Saved ${tele75.bandwidthSavedPercent}%`);

  pce.setCalibrationDial(0.20);
  const tele20 = pce.getTelemetry();
  console.log(`  - Telemetry at 0.20 Dial: Bitrate ${tele20.bitrateMbps} Mbps, QoE ${tele20.qoeScore}, Saved ${tele20.bandwidthSavedPercent}%`);

  if (tele20.bitrateMbps >= tele75.bitrateMbps || tele20.bandwidthSavedPercent <= tele75.bandwidthSavedPercent) {
    throw new Error('Calibration dial bitrate adaptation failed!');
  }
  console.log('✔ Quality ↔ Data Dial dynamically scales bitrate and bandwidth savings');

  console.log('\n>>> ALL CORE VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
}

runVerification().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
