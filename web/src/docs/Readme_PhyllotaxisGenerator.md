# Phyllotaxis (Sunflowers) Generator

## Overview
Based on the arrangement of seeds in a sunflower head, this generator uses the "Golden Angle" (approximately 137.5 degrees) to create mathematically perfect packing spirals.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

### Dot Count
*   **Description**: The total number of seeds (circles) to generate.
*   **Effect**: 
    *   **Low**: A small bud in the center.
    *   **High**: A large, full flower filling the page.

### Spread (c)
*   **Description**: Controls how fast the spiral grows outward (`radius = c * sqrt(n)`).
*   **Effect**: 
    *   **Low**: Dots are packed tightly together.
    *   **High**: Dots are spread further apart.

### Dot Size
*   **Description**: Radius of the individual circles.

### Angle Offset
*   **Description**: Adds a deviation to the perfect Golden Angle.
*   **Effect**:
    *   **0.0**: Perfect packing.
    *   **Small values (e.g., 0.1, 0.5)**: Creates wildly different, swirling spiral arms. Try experimenting with this!

### Colors
*   **Description**: Number of layers.
*   **Effect**: The flower is drawn in concentric rings of alternating colors.
