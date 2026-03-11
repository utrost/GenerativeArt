# Magnetic Field Generator

The **Magnetic Field** generator creates smooth, flowing lines that simulate the invisible forces between magnetic poles. The lines start from the edges of the canvas and curve towards the attractors (poles) in the center.

## How it works
- **Physics Simulation**: The generator places invisible "Magnetic Poles" with strong attractive forces on the canvas.
- **Particle Tracing**: It then releases thousands of virtual particles from the edges of the screen.
- **Trajectory**: These particles follow the magnetic field lines (streamlines), creating a visualization of the force field.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Line Count** | Integer | 500 | The total number of lines to draw. More lines = denser field. |
| **Line Width** | Double | 1.0 | The thickness of the lines. |
| **Color Count** | Integer | 3 | The number of alternating colors used (e.g. Black/Red/Blue). |
| **Pole Count** | Integer | 2 | The number of attractive poles hidden in the center. |
| **Step Size** | Double | 5.0 | Integration step size. Smaller = smoother curves but slower. |
| **Seed** | Integer | 1234 | Random seed for pole placement and starting positions. |

## Usage Tips
- **High Density**: Try increasing `Line Count` to 1000 or 1500 for a rich, textured look similar to iron filings.
- **Multi-Color**: Use 2 or 3 colors to verify the "alternating flow" effect which adds depth.
- **Flow**: Notice how the lines never cross (in theory); they flow parallel to each other until they merge into the singularity at the pole.
