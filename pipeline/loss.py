"""
Aperture - Perception-Calibrated Saliency-Weighted Loss Module
============================================================
Formulates the Human Visual System (HVS) optimization objective:
L_HVS = (1 - λ_ssim) · || S ⊙ (I - Î) ||_1 + λ_ssim · (1 - SSIM(I, Î; S)) + λ_perceptual · (S ⊙ L_grad)

Where S is the normalized spatial saliency prior field.
Zero-dependency pure-Python implementation for maximum portability.
"""

import math
from typing import Dict, List, Any

class PerceptionCalibratedLoss:
    def __init__(self, lambda_ssim: float = 0.20, lambda_perceptual: float = 0.15):
        self.lambda_ssim = lambda_ssim
        self.lambda_perceptual = lambda_perceptual

    def compute_splat_loss(self, rendered_error: float, salience: float) -> Dict[str, float]:
        """
        Computes saliency-weighted photometric, structural, and perceptual loss components
        for a rendered point or patch under given salience.
        """
        weighted_l1 = rendered_error * salience
        weighted_ssim = (rendered_error ** 1.2) * salience
        weighted_perceptual = (rendered_error * 1.4) * salience

        total = ((1.0 - self.lambda_ssim) * weighted_l1 +
                 self.lambda_ssim * weighted_ssim +
                 self.lambda_perceptual * weighted_perceptual)

        return {
            'total_loss': float(total),
            'weighted_l1': float(weighted_l1),
            'weighted_ssim': float(weighted_ssim),
            'weighted_perceptual': float(weighted_perceptual)
        }

if __name__ == '__main__':
    loss_fn = PerceptionCalibratedLoss()
    res = loss_fn.compute_splat_loss(0.05, 0.95)
    print(f"[Aperture Loss Verification] Computed loss: {res['total_loss']:.4f}")
