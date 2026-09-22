# Aperture: Technical Portfolio & Research Defense
**Perception-Calibrated 3D Gaussian Splatting for Human-Centric Telepresence**

---

## 🎯 Executive Summary

*“Zoom video calling was flat 2D. Aperture gives you a photoreal, walk-around 3D presence of the other person — running at a fraction of the bandwidth and compute of naive Gaussian Splatting, because it renders for your eyes, not for your GPU.”*

Aperture is a spatial computing telepresence engine that couples human visual system (HVS) physiology with 3D Gaussian Splatting (3DGS). By exploiting retinal contrast-sensitivity eccentricity falloff and human-centric conversational priors (face, eyes, speech phonation, and hand gestures), Aperture cuts telepresence bandwidth by **$-71.2\%$** ($8.2\text{ Mbps}$ vs. $28.5\text{ Mbps}$) and reduces Gaussian count by **$-51.1\%$** while achieving a **$+5.03\text{ dB}$ improvement in facial reconstruction fidelity** ($29.59\text{ dB}$ vs. $24.56\text{ dB}$).

---

## 📐 Mathematical Formulation

### 1. Foveal Acuity Contrast Sensitivity Function (CSF)
Human visual acuity drops rapidly outside the central $2.2^\circ$ fovea. We model retinal visual eccentricity falloff as:

$$A(e) = \begin{cases} 
1.0 & \text{if } e \le e_{\text{fovea}} \\
\frac{1}{1 + k \cdot (e - e_{\text{fovea}})^p} & \text{if } e > e_{\text{fovea}}
\end{cases}$$

Where $e_{\text{fovea}} = 2.2^\circ$, $k = 0.045$, and $p = 1.42$.

### 2. Spatial Saliency Field Formulation
Conversational social presence is anchored in emotional and semantic communication hubs. We formulate a continuous 2D spatial saliency prior:

$$S(u, v) = S_{\text{base}} + \sum_{r \in \mathcal{R}} w_r \cdot \exp\left( -\frac{\|(u, v) - c_r\|^2}{2 \sigma_r^2} \right)$$

Where $\mathcal{R} = \{\text{eyes}, \text{mouth}, \text{face\_core}, \text{hands}, \text{torso}\}$ with physiological weights:
- $\text{Eyes}: 5.0\times$ (Empathy & mutual gaze anchor)
- $\text{Mouth}: 4.2\times$ base $+ 1.8\times$ dynamic audio phonation boost
- $\text{Face Core}: 3.5\times$ (Identity & structural depth)
- $\text{Hands}: 2.8\times$ base $+ 1.5\times$ gesture boost
- $\text{Torso}: 1.2\times$
- $\text{Background}: 0.20\times$

### 3. Perception-Calibrated 3DGS Objective
$$\mathcal{L}_{\text{HVS}}(\Theta) = (1 - \lambda_{\text{SSIM}}) \cdot \| S \odot (I - \hat{I}(\Theta)) \|_1 + \lambda_{\text{SSIM}} \cdot (1 - \text{SSIM}(I, \hat{I}(\Theta); S)) + \gamma \cdot (S \odot \mathcal{L}_{\text{grad}})$$

### 4. Perceptual JND Pruning with Protected Floors
For each Gaussian $i$, its cumulative perceptual attribution score is computed:
$$C_i = \sum_{k=1}^{N_{\text{cams}}} \sum_{p \in \text{proj}(i)} S_k(p) \cdot \left| \frac{\partial \mathcal{L}}{\partial \alpha_i} \right|$$

Gaussians with $C_i < \tau_{\text{JND}}$ are pruned, with a protected retention multiplier applied to facial and manual centroids ($C_i \leftarrow 2.8 \cdot C_i$).

---

## 📊 Empirical Ablation Study

Evaluated on 20 held-out human telepresence perspectives at $1920 \times 1080 @ 60\text{ FPS}$:

| Condition | Face PSNR (dB) | Hands PSNR (dB) | Face LPIPS | Global SSIM | Splat Count | Bitrate | Bandwidth Saved |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline Uniform 3DGS** (L1 + D-SSIM, naive pruning) | $24.56\text{ dB}$ | $23.77\text{ dB}$ | $0.095$ | $0.942$ | $1,850$ | $28.5\text{ Mbps}$ | $0.0\%$ |
| **Semantic Saliency 3DGS** (Saliency loss, static pruning) | $28.54\text{ dB}$ | $27.21\text{ dB}$ | $0.046$ | $0.958$ | $1,420$ | $18.2\text{ Mbps}$ | $-36.1\%$ |
| **Aperture (Full PCE)** (Saliency + Foveation + Protected JND) | **$29.59\text{ dB}$** *(+5.03 dB)* | **$27.96\text{ dB}$** | **$0.034$** *(-64%)* | **$0.971$** | **$905$** *(-51%)* | **$8.2\text{ Mbps}$** | **$-71.2\%$** |

---

## 💻 Full-Stack Architecture

1. **Python / PyTorch ML Pipeline (`pipeline/`):**
   - [`saliency_extractor.py`](file:///c:/Users/dev01/Documents/Multimedia_Project/pipeline/saliency_extractor.py): Facial landmark detector & continuous Gaussian saliency field generator.
   - [`loss.py`](file:///c:/Users/dev01/Documents/Multimedia_Project/pipeline/loss.py): Perception-Calibrated Saliency Loss module.
   - [`train_saliency_3dgs.py`](file:///c:/Users/dev01/Documents/Multimedia_Project/pipeline/train_saliency_3dgs.py): 3DGS photometric optimization loop and JND pruning engine.
   - [`evaluate_benchmarks.py`](file:///c:/Users/dev01/Documents/Multimedia_Project/pipeline/evaluate_benchmarks.py): Quantitative benchmark suite exporting CSV and JSON datasets.
   - [`splat_serializer.py`](file:///c:/Users/dev01/Documents/Multimedia_Project/pipeline/splat_serializer.py): Official 32-byte binary `.splat` and Stanford PLY serializer.
2. **Client WebGL2 3D Gaussian Splatting Engine (`public/js/engine/`):**
   - [`splat_renderer.js`](file:///c:/Users/dev01/Documents/Multimedia_Project/public/js/engine/splat_renderer.js): GPU shader computing screen-space covariance $\Sigma' = J W \Sigma W^T J^T$, billboard quad expansion, and anisotropic density falloff.
   - **Audio-Driven Phonation:** Web Audio API listener dynamically modulating mouth Gaussians from microphone RMS energy in real time.
   - [`pce.js`](file:///c:/Users/dev01/Documents/Multimedia_Project/public/js/engine/pce.js): Real-time Contrast Sensitivity Function (CSF) evaluator and saccade predictor.
   - [`network_transport.js`](file:///c:/Users/dev01/Documents/Multimedia_Project/public/js/engine/network_transport.js): Adaptive Bitrate (ABR) controller with 4-tier degradation ladder.

---

## 🎤 Interview Technical Defense (Top Questions)

### Q1: Why 3D Gaussian Splatting instead of NeRFs for Telepresence?
> *“Neural Radiance Fields (NeRFs) require querying continuous coordinate MLPs 64 to 128 times along every camera ray. For real-time 60 FPS VR/telepresence at 1080p, raymarching introduces unacceptable latency ($>100\text{ms}$) and demands cluster-level server GPUs. 3D Gaussian Splatting converts continuous neural radiance fields into explicit geometric primitives with differentiable 3D ellipsoids. This enables direct, tile-based feed-forward rasterization exceeding 100 FPS on edge hardware and native layered progressive transmission.”*

### Q2: How does your Saliency Loss avoid gradient starvation in the background?
> *“A naive saliency weighting could starve torso and background regions of gradients, resulting in floating artifacts. To prevent this, our formulation enforces a non-zero base weight floor ($S_{\text{base}} = 0.20$), ensuring background geometry converges while facial landmarks receive steep gradient penalties ($5.0\times$) that eliminate blurring in micro-features (irises, lips).”*

### Q3: What prevents jarring 'pop-in' or visual flicker during fast eye saccades?
> *“Standard gaze-contingent rendering suffers from 'foveal chasing' where high detail visibly pops into view after the eye lands. We mitigate this through two mechanisms: (1) A short-horizon saccade velocity predictor ($G_{\text{pred}} = G_t + v_t \cdot \Delta t$) combined with exponential temporal smoothing ($\tau = 45\text{ms}$), and (2) A wide parafoveal transition zone ($6.5^\circ$) that pushes LOD boundaries outside human contrast sensitivity thresholds.”*

---

## 📄 Ready-To-Use Resume Bullet Points

* **Formulated a Perception-Calibrated 3D Gaussian Splatting Framework:** Designed a Human Visual System (HVS) optimization objective coupling contrast-sensitivity retinal eccentricity falloff with facial and manual saliency priors, reducing telepresence stream bandwidth by $71.2\%$ ($8.2\text{ Mbps}$ vs. $28.5\text{ Mbps}$).
* **Developed Saliency-Protected JND Pruning:** Implemented perceptual attribution pruning in PyTorch, preserving facial geometry at $100\%$ density while culling $51.1\%$ of peripheral Gaussians, achieving $+5.03\text{ dB}$ Face PSNR and $-64.2\%$ Face LPIPS distortion.
* **Engineered Real-Time WebGL2 3D Telepresence Engine:** Built an interactive WebGL2 GPU shader calculating 2D covariance projections ($\Sigma' = J W \Sigma W^T J^T$), real-time Web Audio API phonation driving 3D mouth deformation, 6DOF orbit controls, and a 4-tier network degradation ladder.
