# L-System Fractal

**L-System (Lindenmayer System)** is a way of generating self-similar fractals using a simple set of text-replacement rules. It interprets a string of characters as instructions for a "turtle" that draws lines on the screen.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **Iterations** | `Integer` | The depth of recursion. <br>⚠️ **Warning:** Complexity grows exponentially. Values above 6 may be very slow or crash the browser. Start small (3-4). |
| **Angle** | `Double` | The angle (in degrees) that the turtle turns for `+` and `-`. |
| **Line Length** | `Double` | The length of each segment. |
| **Axiom** | `String` | The starting characters (e.g., `F`). |
| **Rules** | `String` | The replacement rules. Format: `Char:Replacement`. Separate multiple rules with `;`. <br>Example: `F:F+F-F-F+F` |

## Common Presets (Try These!)

### Koch Snowflake
*   **Axiom:** `F`
*   **Rules:** `F:F+F-F-F+F`
*   **Angle:** `90`

### Sierpinski Triangle
*   **Axiom:** `F-G-G`
*   **Rules:** `F:F-G+F+G-F;G:GG` (Note: Requires multiple rules support)
*   **Angle:** `120`

### Dragon Curve
*   **Axiom:** `FX`
*   **Rules:** `X:X+YF+;Y:-FX-Y`
*   **Angle:** `90`
