# Truchet Tiles Generator

## Overview
Generates tessellations using Truchet Tiles. The image is formed by a grid of square tiles, where each tile typically contains a pattern that connects to its neighbors regardless of orientation (e.g., quarter-circles at corners). Randomly rotating these tiles creates continuous, complex, maze-like paths.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

### Rows / Columns
*   **Description**: The grid resolution.
*   **Effect**:
    *   **High (e.g., 50x50)**: Fine, intricate maze textures.
    *   **Low (e.g., 5x5)**: Bold, large geometric shapes.

### Curved
*   **Description**: Toggle between style types.
*   **True (checked)**: Uses quarter-circles (arcs). Creates spaghetti-like, meandering loops.
*   **False (unchecked)**: Uses diagonal lines. Creates diamond-like or zigzag patterns.

### Colors
*   **Description**: Number of layers.
*   **Effect**: 
    *   **1**: Standard monochrome maze.
    *   **2+**: Calculates a checkerboard pattern `(x + y) % colors`. This separates adjacent tiles into different layers (colors), which creates a nice woven effect if different pens are used.
