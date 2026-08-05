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

## What is PUMA Analyzer?

**PUMA** estimates the **thickness** and **optical constants (n, k)** of thin
films directly from transmission data, using the **Swanepoel envelope
method** combined with robust nonlinear global optimization. It is built
for researchers and lab technicians working with thin-film optics who
need reliable numbers from a raw transmission spectrum, not just a curve
fit.

- **Envelope & Fringe Analysis** — automatic detection of interference
  extrema (`TM`/`Tm` envelopes) and the film's refractive-index dispersion
  from their positions, following the standard Swanepoel formalism.
- **Multi-Start Global Fitting** — a robust, multi-start nonlinear
  optimizer refines thickness and dispersion parameters against the full
  measured spectrum, not just the envelope points.
- **Physics-Guided Auto-Configure** — sensible starting parameters and
  bounds are derived from the data itself, so a new user isn't left
  guessing initial guesses for a nonlinear fit.
- **Classic + Advanced workflows** — from a single-run estimate to
  Monte Carlo / bootstrap uncertainty analysis, batch processing, and
  full report/figure export.

## Download

Grab the latest Windows build from the
**[Releases](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases/latest)**
page. Each release is a single `.zip` containing:

- `PUMA_Analyzer.exe` — the packaged application (no separate Python
  install required).
- The C computation engine (`puma_seq.exe` + source) the app calls into
  for its core fitting routines.
- User manuals (English and Arabic) and a physics/equations reference
  document.

The app requires a one-time activation code before first use. If you
don't have one, contact the developer.

## What's new

See each release's notes on the
**[Releases](https://github.com/ameenalzubi0-bit/puma-analyzer-releases/releases)**
page for the specific changes in that version. Recent highlights:

- Optional **Extension tools** (TMM stack solving, parameter sweeps,
  deposition/etch monitoring simulation, a materials library, spectrum
  import, and a Data Factory recipe pipeline) — experimental, opt-in
  from Preferences, clearly labeled as such wherever they appear.
- A numerically stable solver path for strongly-absorbing or optically
  thick films that previously could report an error instead of a result.
- Update checks no longer force-install a package without verifying it
  actually came from this project.

## About this repository

This repository hosts **release binaries and the update-check manifest
only** — it intentionally contains no source code. PUMA Analyzer's
source is maintained in a private repository; this public repo exists so
the app's built-in update checker can verify the latest version and
download it without requiring any embedded credentials.

## Developer

PUMA Analyzer is developed and maintained by **Amin Al-Zu'bi**.
