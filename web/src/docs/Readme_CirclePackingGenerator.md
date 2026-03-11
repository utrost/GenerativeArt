# Circle Packing Generator

## Overview
Fills the canvas with circles that do not overlap. The algorithm places circles randomly and grows them until they touch another circle or the edge of the paper.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

### Attempts
*   **Description**: The number of times the algorithm attempts to place a new circle.
*   **Effect**: 
    *   **High (e.g., 5000)**: Very dense packing with tiny circles filling the gaps.
    *   **Low (e.g., 500)**: Loosely packed, potentially with empty spaces.

### Min Radius / Max Radius
*   **Description**: The size limits for the circles.
*   **Effect**: Controls the scale of the bubbles. Large `Max Radius` allows for big dominant circles. Small `Min Radius` allows filling tiny gaps.

### Padding
*   **Description**: The empty space required between circles.
*   **Effect**:
    *   **0**: Circles touch exactly.
    *   **> 0**: Creates a gap, giving a cellular or bubbly look.

### Colors
*   **Description**: Number of layers.
*   **Effect**: Circles are sorted by size into layers. For example, with 2 colors, huge circles might be red and tiny filler circles might be blue.
