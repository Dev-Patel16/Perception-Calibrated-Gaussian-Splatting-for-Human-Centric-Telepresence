"""
Aperture - Human Visual System (HVS) Saliency Field Extractor
============================================================
Extracts 2D facial, ocular, and manual landmarks from multi-view image frames,
generating normalized continuous spatial saliency fields S(u, v) ∈ [0, 1].

Mathematical Model:
S(u, v) = S_base + ∑_r w_r · exp(- || [u,v] - c_r ||^2 / (2 · σ_r^2) )
where r ∈ {eyes, mouth, face_core, hands} and w_r are physiological priors.
"""

import math
import json
from typing import Dict, List, Tuple, Optional

class SaliencyFieldExtractor:
    def __init__(self,
                 base_weight: float = 0.20,
                 weights: Optional[Dict[str, float]] = None,
                 sigmas: Optional[Dict[str, float]] = None):
        """
        Initialize Saliency Field Extractor with human conversational priors.
        """
        self.base_weight = base_weight
        self.weights = weights or {
            'eyes': 5.0,
            'mouth': 4.2,
            'face_core': 3.5,
            'hands': 2.8,
            'torso': 1.2
        }
        self.sigmas = sigmas or {
            'eyes': 0.035,       # tightly localized foveal anchor
            'mouth': 0.050,      # phonation envelope
            'face_core': 0.120,   # facial structural boundary
            'hands': 0.080,      # manual gesture bounding radius
            'torso': 0.220       # broad peripheral torso
        }

    def generate_synthetic_landmarks(self, image_shape: Tuple[int, int], head_pose: Tuple[float, float] = (0.0, 0.0)) -> Dict[str, List[Tuple[float, float]]]:
        """
        Generates physiologically calibrated landmark coordinates for synthetic test frames.
        head_pose: (yaw, pitch) in radians.
        """
        H, W = image_shape
        cx = W * (0.5 + 0.15 * math.sin(head_pose[0]))
        cy = H * (0.4 + 0.10 * math.sin(head_pose[1]))

        # Scale based on head size
        scale = H * 0.18

        landmarks = {
            'eyes': [
                (cx - 0.28 * scale, cy - 0.20 * scale),  # Left eye
                (cx + 0.28 * scale, cy - 0.20 * scale),  # Right eye
            ],
            'mouth': [
                (cx, cy + 0.35 * scale),                  # Upper lip center
                (cx - 0.15 * scale, cy + 0.40 * scale),  # Left lip corner
                (cx + 0.15 * scale, cy + 0.40 * scale),  # Right lip corner
                (cx, cy + 0.46 * scale)                   # Lower lip center
            ],
            'face_core': [
                (cx, cy),                                 # Nose bridge
                (cx, cy + 0.15 * scale),                  # Nose tip
                (cx - 0.35 * scale, cy + 0.05 * scale),  # Left cheek
                (cx + 0.35 * scale, cy + 0.05 * scale),  # Right cheek
                (cx, cy + 0.65 * scale)                   # Chin
            ],
            'hands': [
                (cx + 0.75 * scale, cy + 0.95 * scale),  # Right gesturing palm
                (cx - 0.70 * scale, cy + 1.25 * scale)   # Left relaxed wrist
            ],
            'torso': [
                (cx, cy + 1.2 * scale),
                (cx - 0.6 * scale, cy + 0.9 * scale),
                (cx + 0.6 * scale, cy + 0.9 * scale)
            ]
        }
        return landmarks

    def evaluate_point_salience(self, u: float, v: float, image_shape: Tuple[int, int], landmarks: Dict[str, List[Tuple[float, float]]], is_speaking: bool = False) -> float:
        """
        Evaluates the saliency field at an arbitrary 2D screen point (u, v).
        """
        H, W = image_shape
        diag = math.hypot(H, W)
        salience = self.base_weight

        for region, pts in landmarks.items():
            w = self.weights[region]
            if is_speaking and region in ('mouth', 'face_core'):
                w += 1.8

            sigma_px = self.sigmas[region] * diag
            two_sigma_sq = 2.0 * (sigma_px ** 2)

            for (px, py) in pts:
                dist_sq = (u - px)**2 + (v - py)**2
                kernel = math.exp(-dist_sq / two_sigma_sq)
                salience += (w / 5.0) * kernel

        return min(1.0, max(0.1, salience / 3.5))

if __name__ == '__main__':
    extractor = SaliencyFieldExtractor()
    H, W = 720, 1280
    landmarks = extractor.generate_synthetic_landmarks((H, W))
    center_salience = extractor.evaluate_point_salience(W / 2, H * 0.4, (H, W), landmarks, is_speaking=True)
    periph_salience = extractor.evaluate_point_salience(50, 50, (H, W), landmarks, is_speaking=True)
    print(f"[Aperture Saliency Field Extractor] Tested point evaluations:")
    print(f"  - Face Center Salience: {center_salience:.3f} (Expected high)")
    print(f"  - Peripheral Salience:  {periph_salience:.3f} (Expected base)")
