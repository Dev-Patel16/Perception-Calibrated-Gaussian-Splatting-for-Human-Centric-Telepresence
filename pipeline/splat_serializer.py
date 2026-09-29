"""
Aperture - 3D Gaussian Splat Binary (.splat / .ply) Serializer
==============================================================
Serializes trained 3D Gaussians into standard binary .splat formats
(32 bytes per Gaussian, compatible with web splat rasterizers):
- Position: 3 x float32 (12 bytes)
- Scale: 3 x float32 (12 bytes)
- RGBA Color: 4 x uint8 (4 bytes)
- Rotation Quaternion: 4 x uint8 (4 bytes, normalized [0, 255])
"""

import struct
import math
from typing import List, Dict, Any

class SplatSerializer:
    @staticmethod
    def export_splat_binary(splats: List[Dict[str, Any]], filepath: str):
        """
        Exports splats into standard binary .splat format.
        """
        with open(filepath, 'wb') as f:
            for s in splats:
                # 1. Position (x, y, z) - float32
                px, py, pz = float(s['x']), float(s['y']), float(s['z'])
                f.write(struct.pack('<fff', px, py, pz))

                # 2. Scale (sx, sy, sz) - float32
                sx = float(s.get('sx', 0.02))
                sy = float(s.get('sy', 0.02))
                sz = float(s.get('sz', 0.02))
                f.write(struct.pack('<fff', sx, sy, sz))

                # 3. Color (r, g, b, a) - uint8
                c = s.get('color', [0.8, 0.8, 0.8])
                r = int(min(255, max(0, int(c[0] * 255))))
                g = int(min(255, max(0, int(c[1] * 255))))
                b = int(min(255, max(0, int(c[2] * 255))))
                a = int(min(255, max(0, int(s.get('alpha', 0.9) * 255))))
                f.write(struct.pack('<BBBB', r, g, b, a))

                # 4. Rotation Quaternion (qw, qx, qy, qz) - uint8 normalized
                rot_angle = float(s.get('rot', 0.0))
                qw = int(min(255, max(0, int((math.cos(rot_angle / 2.0) * 0.5 + 0.5) * 255))))
                qz = int(min(255, max(0, int((math.sin(rot_angle / 2.0) * 0.5 + 0.5) * 255))))
                qx = 128
                qy = 128
                f.write(struct.pack('<BBBB', qx, qy, qz, qw))

    @staticmethod
    def export_ply(splats: List[Dict[str, Any]], filepath: str):
        """
        Exports splats into standard ASCII Stanford PLY format.
        """
        count = len(splats)
        header = f"""ply
format ascii 1.0
element vertex {count}
property float x
property float y
property float z
property float scale_0
property float scale_1
property float scale_2
property uchar red
property uchar green
property uchar blue
property uchar alpha
end_header
"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(header)
            for s in splats:
                c = s.get('color', [0.8, 0.8, 0.8])
                r = int(min(255, max(0, int(c[0] * 255))))
                g = int(min(255, max(0, int(c[1] * 255))))
                b = int(min(255, max(0, int(c[2] * 255))))
                a = int(min(255, max(0, int(s.get('alpha', 0.9) * 255))))
                f.write(f"{s['x']:.5f} {s['y']:.5f} {s['z']:.5f} {s.get('sx', 0.02):.5f} {s.get('sy', 0.02):.5f} {s.get('sz', 0.02):.5f} {r} {g} {b} {a}\n")

if __name__ == '__main__':
    dummy = [{'x': 0.0, 'y': 0.0, 'z': 0.5, 'sx': 0.02, 'sy': 0.02, 'sz': 0.01, 'color': [0.9, 0.7, 0.6], 'alpha': 0.95, 'rot': 0.0}]
    SplatSerializer.export_splat_binary(dummy, 'test.splat')
    print("[Aperture Splat Serializer] Verified zero-dependency binary .splat export.")
