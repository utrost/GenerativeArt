# Wave Interference Generator

## Overview
Simulates the interference patterns created when multiple circular wave sources overlap. Inspired by ripples on a pond or light diffraction experiments, the generator computes the superposition of sinusoidal waves and extracts contour lines using the marching squares algorithm. The result is intricate moiré-like interference fringes.

## Parameters

### Preset
*   **Description**: Predefined configurations for common interference setups.
*   **Options**: Custom, Two Sources, Triple Point, Ripple Pool, Standing Wave

### Sources
*   **Description**: Number of wave-emitting point sources.
*   **Effect**:
    *   **2**: Classic Young's double-slit style interference bands.
    *   **3-5**: Complex multi-source patterns with rich detail.
    *   **6+**: Dense, chaotic-looking but deterministic patterns.

### Wavelength
*   **Description**: Distance between successive wave crests in pixels.
*   **Effect**: Smaller wavelengths create tighter, more densely packed interference fringes. Larger wavelengths create broader, sweeping curves.

### Amplitude
*   **Description**: Strength of each wave source.
*   **Effect**: Higher amplitude increases contrast between constructive and destructive interference zones.

### Contour Lines
*   **Description**: Number of iso-amplitude contour lines to extract.
*   **Effect**: More lines reveal finer detail in the wave field.

### Line Spacing
*   **Description**: The amplitude difference between successive contour levels.

### Resolution
*   **Description**: Grid resolution for the marching squares algorithm. Higher values produce smoother curves at the cost of rendering speed.

### Seed
*   **Description**: Random seed controlling the placement of wave sources.

### Colors
*   **Description**: Number of plotter layers. Contour lines are distributed across layers cyclically.
