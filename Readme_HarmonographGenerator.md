# Harmonograph Generator

## Overview
A Harmonograph simulates a mechanical apparatus that uses pendulums to create complex geometric figures. The motion of the pendulums decays over time, creating spiraling, intricate patterns often referred to as Lissajous figures (though strictly Lissajous figures do not decay).

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

### Steps
*   **Description**: The total number of points/segments to draw.
*   **Effect**: Higher values create longer lines that spiral further inward as the energy decays.

### Frequencies (A, B, C, D)
*   **Description**: These control the oscillation speed of the two virtual pendulums (X-axis and Y-axis).
*   **Effect**: 
    *   **Integer Ratios** (e.g., A=2.0, C=3.0) create stable, repeating knots.
    *   **Near Ratios** (e.g., A=2.0, C=2.01) create "precessing" patterns that slowly rotate and shift, creating beautiful interference moiré patterns.

### Damping
*   **Description**: Simulates friction.
*   **Effect**:
    *   **Low Damping**: The drawing stays large for a long time.
    *   **High Damping**: The drawing spirals in to the center quickly.

### Colors
*   **Description**: Number of layers to split the output into.
*   **Effect**: The spiral is segmented into standard chunks and assigned to different layers, allowing for multi-color plotting.
