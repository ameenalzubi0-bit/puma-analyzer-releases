<p align="center">
  <img src="https://raw.githubusercontent.com/ameenalzubi0-bit/puma-analyzer-releases/main/puma_logo.png" width="160" alt="PUMA Analyzer logo">
</p>

<h1 align="center">PUMA Analyzer</h1>

<p align="center">
  Thin-film thickness and optical-constants estimation from transmission spectra.
</p>

<p align="center">
  <a href="https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/latest">
    <img src="https://img.shields.io/github/v/release/ameenalzubi0-bit/puma-analyzer-releases?label=latest%20release&color=2f6f5e" alt="Latest release">
  </a>
  <img src="https://img.shields.io/badge/platform-Windows-0078D6" alt="Platform: Windows">
</p>

---

## Table of contents

- [What is PUMA Analyzer?](#what-is-puma-analyzer)
- [What the program actually does](#what-the-program-actually-does)
- [How the core engine works](#how-the-core-engine-works)
- [Screenshots](#screenshots)
- [Try it yourself with sample data](#try-it-yourself-with-sample-data)
- [Sample engine run](#sample-engine-run)
- [Download](#download)
- [System requirements](#system-requirements)
- [Version history](#version-history)
- [What's new](#whats-new)
- [FAQ](#faq)
- [About this repository](#about-this-repository)
- [Developer & contact](#developer--contact)

## What is PUMA Analyzer?

**PUMA** estimates the **thickness** and **optical constants (n, k)** of thin
films directly from transmission data, using a physics-based transmittance
model combined with robust nonlinear global optimization. It is built for
researchers and lab technicians working with thin-film optics who need
reliable numbers from a raw transmission spectrum, not just a curve fit.

- **Envelope & Fringe Analysis**: automatic detection of interference
  extrema (`TM`/`Tm` envelopes) and a fit-free cross-check of the film's
  refractive-index dispersion from their positions, following the standard
  Swanepoel formalism.
- **Multi-Start Global Fitting**: a robust, multi-start nonlinear
  optimizer refines thickness and dispersion parameters against the full
  measured spectrum, not just the envelope points.
- **Physics-Guided Auto-Configure**: sensible starting parameters and
  bounds are derived from the data itself, so a new user isn't left
  guessing initial guesses for a nonlinear fit.
- **Classic + Advanced workflows**: from a single-run estimate to
  Monte Carlo / bootstrap / Bayesian uncertainty analysis, batch
  processing, and full report/figure export.

|  | Classic | Advanced Fit |
|---|---|---|
| Engine | Compiled C engine (`puma_seq.exe`, or its parallel build) | Pure Python (`puma_advanced.py`) |
| Search method | Grid search over From/To/Step ranges per parameter | Continuous bounds with nonlinear optimization |
| Dispersion model | Independent `n(λ)`, `k(λ)` per wavelength | Physics-based joint models (Cauchy, Sellmeier, and others) |
| Uncertainty | Not computed | Monte Carlo, bootstrap, and Bayesian MCMC |
| Best for | A fast first estimate on a known material | Physically-constrained fits, uncertainty budgets, sensitivity analysis |

## What the program actually does

A typical PUMA session looks like this:

```mermaid
flowchart LR
    A[Import<br/>T(λ) spectrum] --> B[Auto-Configure<br/>fringe/substrate/bounds]
    B --> C[Run<br/>C fitting engine]
    C --> D[Results<br/>n, k, d, Eg, ...]
    D --> E[Export<br/>PDF / Excel report]
```

1. **Import** a measured transmittance spectrum `T(λ)` (a two-column
   wavelength/transmittance file, or a raw instrument export via the
   spectrometer import tool).
2. **Auto-Configure** inspects the raw curve (interference-fringe
   spacing, substrate index, absorption onset) and proposes a starting
   thickness, refractive-index bounds, and dispersion model, instead of
   leaving the user to guess.
3. **Run** hands that configuration to the compiled C fitting engine
   (`puma_seq.exe`, or its OpenMP-parallel counterpart for larger grids),
   which searches for the film thickness `d` and per-wavelength optical
   constants `n(λ)`, `k(λ)` that best reproduce the measured spectrum.
4. **Results** turns the raw fit into physically meaningful quantities:
   the refractive-index dispersion curve, the absorption coefficient,
   optical band gap (Tauc plot, direct and indirect), Urbach energy,
   dielectric function, and dozens of further derived quantities: each
   shown with a quality indicator (the fit's Quadratic Error) rather than
   a bare number.
5. **Export** produces a report (PDF/Excel) with the figures, the derived
   quantities, an automatic plausibility check, and a tamper-evident
   checksum, ready to go into a lab notebook or a paper's supplementary
   material.

Beyond that single-run path, PUMA also supports: batch-fitting many
spectra at once, comparing runs and projects against each other, an
extensive library of optional analysis tools (multilayer/graded-film
transfer-matrix modeling, ellipsometry, uncertainty budgets, AI-assisted
diagnostics: see the [release notes](#whats-new) for the full list),
and a full audit trail of what was computed and when.

## How the core engine works

The numerical core (`puma_seq.exe`, compiled from `puma_seq.c`) solves
an **inverse problem**: given a measured transmittance spectrum, recover
the film thickness and optical constants that produced it. This is based
on the unconstrained-optimization formulation of the problem developed by
Birgin, Chambouleyron and Martínez, credited directly in the engine's own
source header; it does **not** modify or re-derive that formalism, only
ships it as a production-grade engine.

**The physical model.** For a thin absorbing film (refractive index `n`,
extinction coefficient `k`, thickness `d`) on a transparent substrate
(index `s`), illuminated at normal incidence, the transmittance measured
by a spectrophotometer at wavelength `λ` is:

```math
T(\lambda) \;=\; \frac{A\,x}{B - C\,x\cos\varphi + D\,x^{2}}
```

where the absorbance term and interference phase are

```math
x = e^{-\alpha d}, \qquad \alpha = \frac{4\pi k}{\lambda}, \qquad
\varphi = \frac{4\pi n d}{\lambda}
```

`α` is the absorption coefficient, `x` is the fraction of light surviving
one pass through the film, and `φ` is the phase difference that produces
the characteristic interference fringes in a transmission spectrum. `A`,
`B`, `C`, `D` are closed-form combinations of `n`, `k`, and the substrate
index `s` (see `compt()` in `puma_seq.c` for the exact expressions: they
reduce to the classical Swanepoel/Manifacier weak-absorption formula when
`k → 0`).

**The inverse problem.** Thickness and optical constants are not measured
directly: they are the parameters that make the model above match the
data. The engine minimizes the sum of squared residuals between the
measured and modeled transmittance across every wavelength in the scan:

```math
F(n, k, d) \;=\; \sum_{i} \Big[ T_{\text{obs}}(\lambda_i) - T_{\text{model}}(\lambda_i; n, k, d) \Big]^{2}
```

reported in PUMA as the **Quadratic Error (QE)**: the lower it is, the
better the recovered `n`, `k`, `d` reproduce the actual measurement. Because
this is a genuinely **ill-conditioned, non-convex** inverse problem with
many local (non-global) solutions, a single local minimization is not
reliable: the engine restarts the minimization from many different
starting points and keeps the best result found, which is the multi-start
global optimization strategy described in the engine's own reference
publications. The same building blocks extend to reflectance and to
multilayer/graded stacks (functions `compr()` and `comptr()` in the same
source file) for the app's more advanced analysis tools.

## Screenshots

**Main window**

<img src="https://raw.githubusercontent.com/ameenalzubi0-bit/puma-analyzer-releases/main/docs/screenshot_main_window.png" width="720" alt="PUMA Analyzer main window">

The plots below are unedited output figures pulled directly from two real
PUMA analysis runs on real transmission-spectrum data, exported by the
app itself (not staged demo images).

### Test Run 1

Film thickness 350 nm, average refractive index 2.374, direct band gap
2.832 eV, fit QE = 0.00900.

<img src="https://raw.githubusercontent.com/ameenalzubi0-bit/puma-analyzer-releases/main/docs/test_run_1_observed_vs_fitted.png" width="720" alt="Test Run 1: observed vs fitted transmittance spectrum">

<img src="https://raw.githubusercontent.com/ameenalzubi0-bit/puma-analyzer-releases/main/docs/test_run_1_refractive_index.png" width="720" alt="Test Run 1: refractive index n versus wavelength">

### Test Run 2

Film thickness 100 nm, average refractive index 3.685, direct band gap
2.074 eV, fit QE = 0.00670.

<img src="https://raw.githubusercontent.com/ameenalzubi0-bit/puma-analyzer-releases/main/docs/test_run_2_bandgap_tauc.png" width="720" alt="Test Run 2: direct Tauc plot with extracted band gap">

<img src="https://raw.githubusercontent.com/ameenalzubi0-bit/puma-analyzer-releases/main/docs/test_run_2_residuals.png" width="720" alt="Test Run 2: fit residuals (observed minus calculated transmittance)">

**Workflow walkthrough (Test Run 2, Call 2).** The animation below cycles
through the actual dialogs and output figures from that run's second
call: the Model Setup screens (4-layer stack on a Corning 7059 glass
substrate, thickness/inflexion/n/k search bounds), the Call 2 refinement
dialog (narrows the thickness search to 95-105 nm around Call 1's result
and targets its QE of 0.00670063), and the resulting fitted spectrum,
refractive index, and band gap.

<img src="https://raw.githubusercontent.com/ameenalzubi0-bit/puma-analyzer-releases/main/docs/test_run_2_workflow.gif" width="720" alt="Animated walkthrough of Test Run 2 Call 2: setup dialogs and result plots">

## Try it yourself with sample data

No instrument handy? The exact real dataset used in
[Test Run 2](#test-run-2) above (`sigl0097t-dat.txt`, a real measured
transmittance spectrum) is included in this repository under
[`samples/sigl0097t-dat.txt`](samples/sigl0097t-dat.txt) so you can
reproduce that walkthrough yourself:

1. **Import** the downloaded `sigl0097t-dat.txt` file (`Import Data` on
   the main window).
2. **Setup → Film Stack:** set Total layers to `4`, Substrate layer
   index to `2`, Substrate material to `Glass, Corning 7059`.
3. **Setup → Layer Optical Bounds & Spectra:** Thickness `10` to `200`
   step `10`; Inflexion point `540` to `1530` step `100`; `n` at long
   wavelength `3` to `5` step `1`; `n` at short wavelength `3` to `5`
   step `1`; `k` at max wavelength `0.10` to `0.10` step `0.05`; Data
   type `T`; Wavelength `540` to `1530`; Observations `100`. Click
   **Apply Model**.
4. **Run** (Call 1) and wait for it to finish.
5. Open **Run** again for a refinement pass (Call 2): narrow Thickness
   to `95` to `105` step `1`, fix Inflexion point at `540`, Max
   iterations `10000`, and set Target QE to whatever Call 1 reported
   (`0.00670063` in the reference run above).
6. Open **Results** to see the fitted spectrum, refractive index, and
   band gap, the same figures shown in the [workflow animation](#test-run-2)
   above.

## Sample engine run

The output below is a **real run of the vetted, shipped `puma_seq.exe`**
on a small fixed synthetic spectrum (the project's own golden-regression
test, `tests/test_classic_engine_golden.py`, pins these exact numbers so
a future build can never silently change the physics result). It shows
the engine's actual `.inf` result file: the recovered thickness, the
per-wavelength `n`/`k`, the modeled transmittance, and the final QE.

```text
ESTIMATED THICKNESSES

Thickness of film 1 = 100.00 nm

ESTIMATED INFLEXION POINTS

Inflexion point of the absorption coefficient of film 1 = 300.00 nm

ESTIMATED REFRACTIVE INDICES AND ABSORPTION COEFFICIENTS

Film 1

lambda                     n                          kappa
4.00000000000000000000e+02 1.89670587278002300557e+00 2.58446543674367035237e-01
4.14000000000000000000e+02 1.88640392296498271563e+00 2.06752721164770336681e-01
4.28000000000000000000e+02 1.87610197314994242568e+00 1.55064563243064057474e-01
4.42000000000000000000e+02 1.86580002333490213573e+00 1.03376406547572907701e-01
4.56000000000000000000e+02 1.85549807351986184578e+00 5.16882498520817648680e-02
4.70000000000000000000e+02 1.84519612370482155583e+00 9.31565906184835130812e-08

TRANSMITTANCE WITH THE ESTIMATED THICKNESSES AND OPTICAL PARAMETERS

lambda                     t
4.00000000000000000000e+02 3.93283361815009058216e-01
4.14000000000000000000e+02 4.76450327985420585275e-01
4.28000000000000000000e+02 5.67917074324837178878e-01
4.42000000000000000000e+02 6.66152891386464163226e-01
4.56000000000000000000e+02 7.69395618186766494517e-01
4.70000000000000000000e+02 8.76015682946183593671e-01

QUADRATIC ERROR = 3.188115e-01
```

## Download

Grab the latest Windows build from the
**[Releases](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/latest)**
page. Each release is a single `.zip` containing:

- `PUMA_Analyzer.exe`: the packaged application (no separate Python
  install required).
- The C computation engine (`puma_seq.exe` + source) the app calls into
  for its core fitting routines.
- A `Documents` folder with the user manuals (English and Arabic) and a
  physics/equations reference document.

The app requires a one-time activation code before first use. If you
don't have one, see [Developer & contact](#developer--contact) below.

## System requirements

- **OS:** Windows 10 or later (64-bit). PUMA is a Windows-only packaged
  application; there is no macOS/Linux build.
- **Disk space:** roughly 500 MB free for the unpacked application and
  its bundled runtime.
- **Memory:** 4 GB RAM minimum; 8 GB or more recommended for large batch
  runs, Monte Carlo/bootstrap uncertainty analysis, or the optional
  AI/ML diagnostic tools.
- **Network:** required once at first launch (activation) and briefly at
  every startup (update check); the app otherwise runs fully offline.
- **GPU:** not required: all computation, including the optional AI/ML
  tools, runs on CPU.

## Version history

| Version | Highlight |
|---|---|
| [3.1.5](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.1.5) | Large AI/ML and physics/optics tool library added; license-activation and update-check wiring gap fixed (both are now genuinely active in the shipped exe) |
| [3.1.4](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.1.4) | SCOUT extension tools, run starring/notes, drag-and-drop import, faster parallel Classic search, smaller result exports |
| [3.1.3](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.1.3) | Update-install reliability fixes: broken installs on slow storage, app failing to reopen after updating |
| [3.1.2](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.1.2) | Update dialog reliability fixes; clearer Update Now / Not Now choice and per-version change list |
| [3.1.1](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.1.1) | Update download/zip integrity verification, with detailed logging for diagnosing update failures |
| [3.1.0](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.1.0) | Parallel Classic engine also splits the thickness axis for better CPU use; run-duration timing logged |
| [3.0](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.0) | Initial release of the current V3 GUI generation |

See [Releases](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases)
for the full notes on every version.

## What's new

See each release's notes on the
**[Releases](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases)**
page for the specific changes in that version. Recent highlights:

- A large library of optional AI/ML diagnostic tools and new physics/optics
  analysis tools (Mueller-matrix ellipsometry, graded-film modeling,
  Bayesian MCMC uncertainty, and more): see the
  [3.1.5 release notes](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/tag/v3.1.5)
  for the complete list.
- A numerically stable solver path for strongly-absorbing or optically
  thick films that previously could report an error instead of a result.
- Update checks no longer force-install a package without verifying it
  actually came from this project.

## FAQ

**Why does PUMA need a serial/activation code?**
The activation gate protects the project as a scientific tool developed
and maintained by one person: it is not a subscription or a
commercial-license mechanism, just access control. See
[Download](#download) to request a code.

**Is PUMA open source?**
The release binaries and update manifest in this repository are public,
but the application's source code is maintained in a private repository
(see [About this repository](#about-this-repository)).

**Does PUMA send my measurement data anywhere?**
No. Fitting and analysis run entirely locally on your machine. The only
network calls PUMA makes are the one-time activation check and the
startup update check: neither transmits spectra or project data.

**Why is the engine a compiled C program instead of pure Python?**
`puma_seq.c` is a long-vetted, scientifically-validated numerical core;
recompiling it with a different toolchain has been shown to shift results
at the margins, so the shipped binary is pinned and hash-verified rather
than rebuilt on each machine: see
[How the core engine works](#how-the-core-engine-works).

**What should I check if my fit result looks wrong or the QE is high?**
Try Auto-Configure again with a tighter wavelength range around the
region with clear interference fringes, and check the Envelope Method
cross-check view (see [Screenshots](#screenshots)) against the fitted
result: a large disagreement between the two usually points at the
substrate index or an input-data issue rather than the optimizer.

## About this repository

This repository hosts **release binaries and the update-check manifest
only**: it intentionally contains no source code. PUMA Analyzer's
source is maintained in a private repository; this public repo exists so
the app's built-in update checker can verify the latest version and
download it without requiring any embedded credentials.

## Developer & contact

PUMA Analyzer is developed and maintained by **Amin Al-Zu'bi**.

- LinkedIn: [linkedin.com/in/amiinalzubi](https://www.linkedin.com/in/amiinalzubi)
- Email: [Amiinalzubii@gmail.com](mailto:Amiinalzubii@gmail.com)

Reach out through either channel for an activation code, to report a
bug, or for anything else related to the project.
