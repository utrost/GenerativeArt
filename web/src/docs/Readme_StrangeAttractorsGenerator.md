# Strange Attractors (Clifford) Generator

## Overview
Visualizes chaos theory using the Clifford Attractor equations. The point coordinates are iteratively updated based on trigonometric functions of the previous coordinates, creating complex, often 3D-looking, folded structures.

## Parameters

### Iterations
*   **Description**: Number of points/lines to draw.
*   **Effect**: Higher values create denser, more detailed shapes.

### A, B, C, D
*   **Description**: The four constants that define the shape of the attractor.
*   **Effect**: Even small changes can completely transform the shape from a loop to a cloud to a complex knot.
    *   *Try*: A=1.5, B=-1.8, C=1.6, D=0.9 (Classic)
    *   *Try*: A=-1.4, B=1.6, C=1.0, D=0.7

### Scale
*   **Description**: Zoom level.
*   **Effect**: Adjust this to fit the shape within the page boundaries.

### Colors
*   **Description**: Number of layers.
*   **Effect**: The path is colored by time (gradient along the trajectory), allowing you to see how the system evolves.
