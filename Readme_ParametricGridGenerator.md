# Parametric Grid Generator

The **Parametric Grid** generator creates a "Grid of Grids" where simple visual properties change mathematically across the canvas. It is inspired by the structured chaos often found on plotter art (e.g., Grid of squares that gets more chaotic from left to right).

## How it works
- **Micro vs Macro**: The generator creates a large grid of blocks (Macro), and inside each block is a smaller grid of squares (Micro).
- **X-Axis = Chaos**: As you move from Left to Right, the rotation of the squares becomes more random.
- **Y-Axis = Size**: As you move from Top to Bottom, the squares shrink in size.

## Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Macro Grid Size** | Integer | 5 | The number of large blocks (e.g., 5x5). |
| **Micro Grid Size** | Integer | 10 | The number of small squares inside each block (e.g., 10x10). |
| **Max Rotation** | Double | 45.0 | The maximum amount of random rotation (in degrees) applied at the far right of the grid. |
| **Min Scale** | Double | 0.2 | The size of the squares at the bottom of the grid (0.2 = 20% size). |
| **Seed** | Integer | 1234 | Random seed for the rotation chaos. |

## Usage Tips
- **Study of Entropy**: Set `Macro Grid Size` to 1. Then you just see the chaos/scale effect uniformly. But the real power is setting Macro to 5 or more to see the transitions.
- **Subtle Shifts**: Try a low `Max Rotation` (e.g. 15 degrees) for a "shimmering" effect rather than total chaos.
- **Plotting**: This generates thousands of small lines. Be prepared for a long plot time!
