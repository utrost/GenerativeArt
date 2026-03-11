# Twisted Moiré Generator

The **Twisted Moiré** generator creates complex interference patterns by superimposing two layers of twisted grids. By distorting a regular grid of lines with a spiral "twirl" effect and overlaying a second, slightly rotated or offset layer, distinct Moiré patterns emerge.

## How it works
1.  **Base Grid**: A set of vertical parallel lines is generated covering the canvas.
2.  **Twist Deformation**: Each point on these lines is rotated around a central point. The amount of rotation depends on the distance from the center—points closer to the center are rotated more (or less, depending on the math), creating a spiral effect.
3.  **Interference Layer**: A second layer is drawn with the same twisted lines but rotated by a specified angle (`Layer 2 Rotation`). The intersection of these two mismatched grids creates the Moiré illusion.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Line Count** | Integer | 80 | The density of the grid. Higher values create finer patterns and more intense Moiré effects. |
| **Twist Strength** | Double | 5.0 | The intensity of the spiral distortion. Negative values twist in the opposite direction. |
| **Center X** | Double | 0.5 | The horizontal center of the twist (0.0 = left, 1.0 = right). |
| **Center Y** | Double | 0.5 | The vertical center of the twist (0.0 = top, 1.0 = bottom). |
| **Layer 2 Rotation** | Double | 2.0 | The angle (in degrees) to rotate the second layer relative to the first. Small angles (< 5°) often produce the best interference patterns. |

## Usage Tips
- **Start Simple**: Keep `Twist Strength` low (~5) and `Layer 2 Rotation` small (~2 degrees) to see the classic "shimmering" effect.
- **High Density**: Increase `Line Count` to 200+ for very fine, detailed patterns that look great on high-precision plotters.
- **Off-Center**: Move `Center X` and `Center Y` to create asymmetrical compositions.
