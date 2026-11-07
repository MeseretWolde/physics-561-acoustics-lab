# PHYS 561 Acoustics Lab

Single-page React/Vite app for the PHYS 561 Helmholtz resonator and ESC pipe-resonance experiments.

## Included

- Helmholtz data table with automatic period and scaled-period-squared calculations
- Least-squares fit, R-squared, fitted cavity volume, effective neck length, end correction, and alpha
- Garrett Fig. 8.17-style chart with PNG export and CSV export
- ESC open-open and open-closed no-correction predictions for the assigned pipe lengths
- Percent error and empirical end-correction extraction
- Comparison with the unflanged 0.6a reference
- Audio-file FFT analyzer with dominant-peak detection
- Clearly labeled synthetic pipe-spectrum mode for teaching/simulation
- Dark mode and responsive layout

## Run locally

1. Install Node.js (current LTS).
2. Download/clone this repository.
3. In the project folder run:

```bash
npm install
npm run dev
```

Then open the local URL Vite prints in the terminal.

## Academic-use note

Synthetic spectra and frequencies are explicitly labeled **SIMULATED** in the app. They should not be reported as physical measurements unless the instructor explicitly permits a simulation in place of the experiment.

## Helmholtz data note

The default six-point dataset currently produces a fitted effective neck length shorter than the entered 12 cm physical neck length, giving a negative end correction. The app intentionally displays that result rather than forcing a positive correction; check the measurements, geometry, and model assumptions before reporting it.
