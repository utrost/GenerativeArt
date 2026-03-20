# Chladni Patterns Generator

## Overview
Simulates the beautiful geometric patterns formed by vibrating plates, first demonstrated by Ernst Chladni in the 18th century. When a metal plate is vibrated at specific frequencies, sand collects along the nodal lines (points of zero displacement), creating stunning symmetric figures. The generator uses the Chladni equation: `cos(m*pi*x)*cos(n*pi*y) - cos(n*pi*x)*cos(m*pi*y)` and extracts contour lines via marching squares.

## Parameters

### Preset
*   **Description**: Predefined vibration modes.
*   **Options**: Custom, Square Plate Mode (3,2), Circular Drum, High Frequency, Simple Cross

### M / N
*   **Description**: The horizontal and vertical mode numbers of the vibration.
*   **Effect**:
    *   **Low M, N (1-3)**: Simple, bold patterns with few nodal lines.
    *   **High M, N (6-12)**: Complex, intricate patterns with many crossing lines.
    *   **M = N**: Produces diagonal symmetry.
    *   **M ≠ N**: Produces more varied, asymmetric figures.

### Threshold
*   **Description**: Controls the thickness of nodal lines when in "nodal only" mode.

### Resolution
*   **Description**: Grid resolution for contour extraction. Higher values produce smoother curves.

### Contour Levels
*   **Description**: Number of displacement contour lines to draw.
*   **Effect**: More levels reveal the full 3D displacement shape of the vibrating plate.

### Show Nodal Lines Only
*   **Description**: When enabled, draws only the zero-displacement nodal lines (where sand would accumulate).
*   **Effect**: Produces the classic Chladni figure — clean, symmetric line patterns.

### Colors
*   **Description**: Number of plotter layers. Alternating contour levels are assigned to different layers.
