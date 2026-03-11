# Pipe Network Generator

The **Pipe Network** generator creates intricate, weaving pipe structures that look like a complex plumbing system or a maze. It uses the **Wave Function Collapse (WFC)** algorithm to ensure that every pipe segment connects perfectly to its neighbors, with no dead ends or broken connections.

## How it works
1.  **Tiles**: The generator uses a set of pipe tiles: Straights, Corners, and Crossings.
2.  **Wave Function Collapse**: The algorithm starts with a grid of possibilities and iteratively "collapses" cells to specific tiles. It enforces connectivity rules so that if a tile has a pipe opening on the right, its neighbor must have a pipe opening on the left.
3.  **Rendering**: The result is rendered with "flanges" at the connections and gaps at crossings to simulate 3D depth (pipes passing over/under each other).

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Rows** | Integer | 10 | The number of rows in the grid. |
| **Cols** | Integer | 10 | The number of columns in the grid. Higher resolution creates more complex mazes. |
| **Pipe Width** | Double | 15.0 | The visual thickness of the pipes. |
| **Seed** | Integer | 1234 | Random seed. Change this to generate a completely new network layout. |

## Usage Tips
- **High Complexity**: Try increasing `Rows` and `Cols` to 20x20 or 30x30 for a massive, detailed network.
- **Failures**: Because WFC is a constraint solver, it can sometimes paint itself into a corner (literally). If you see a gap in the output or the generation takes too long, simply try a different Seed.
- **Plotting**: This generator produces clean, closed paths suitable for plotting. The "flanges" add a nice mechanical detail that looks great with fine-point pens.
