# Contour Map Generator

## Overview
Generates topographic-style contour maps from procedurally generated terrain. Using layered Simplex noise (fractal Brownian motion), the generator creates realistic elevation data and extracts iso-height contour lines via the marching squares algorithm. The result resembles geological survey maps with their characteristic concentric elevation rings. Supports major/minor line distinction and path simplification for clean output.

## Parameters

### Preset
*   **Description**: Predefined terrain types.
*   **Options**: Custom, Mountain Range, Rolling Hills, Island Archipelago, Canyon Ridges

### Contour Lines
*   **Description**: Total number of elevation contour lines to draw.
*   **Effect**:
    *   **Low (5-15)**: Sparse contours showing only major elevation changes.
    *   **High (30-60)**: Dense contours revealing fine terrain detail.

### Scale
*   **Description**: Controls the zoom level of the noise field.
*   **Effect**:
    *   **Low (0.5-2.0)**: Broad, sweeping terrain features.
    *   **High (5.0-10.0)**: Tight, detailed terrain with many peaks and valleys.

### Octaves
*   **Description**: Number of noise layers combined (fractal Brownian motion).
*   **Effect**: More octaves add fine detail on top of the broad terrain shape. 1 octave = smooth hills, 6+ octaves = rugged, realistic terrain.

### Persistence
*   **Description**: How much amplitude each successive octave retains.
*   **Effect**:
    *   **Low (0.1-0.3)**: Smooth terrain dominated by large features.
    *   **High (0.6-0.9)**: Rough, jagged terrain with prominent small-scale detail.

### Resolution
*   **Description**: Grid resolution for the marching squares algorithm. Higher values produce smoother contour lines.

### Major Lines
*   **Description**: When enabled, every 5th contour line is drawn with double stroke width.
*   **Effect**: Creates the classic topographic map look with index contours.

### Seed
*   **Description**: Random seed for terrain generation. Different seeds produce entirely different landscapes.

### Colors
*   **Description**: Number of plotter layers. Contour lines cycle through layers.
