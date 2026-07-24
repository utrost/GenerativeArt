# Maze Generator

**Maze Generator** creates perfect, solvable mazes using a Recursive Backtracking algorithm. The result is a dense grid of walls with a single unique path between any two points. The outer border is closed except for exactly one entry opening and exactly one exit opening. It also features a solver that can visualize the shortest path between those openings.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **ROWS** | `Integer` | Number of rows in the grid. Higher values create denser mazes. |
| **COLS** | `Integer` | Number of columns in the grid. |
| **Cell Size** | `Double` | The visual size of each cell in pixels. |
| **Wall Width** | `Double` | Thickness of the wall lines. |
| **entrySide / entryPosition** | `Selection / Double` | Side and percent position for the single entry opening. |
| **exitSide / exitPosition** | `Selection / Double` | Side and percent position for the single exit opening. |
| **Seed** | `Integer` | Random seed for reproducible maze generation. |
| **Solve** | `Boolean` | If enabled, overlays the solution path (Red line) from the entry to the exit. |

## Tips
*   **Plotting:** This is excellent for pen plotters as it consists of clean, non-overlapping lines (checking the solution path layer).
*   **Complexity:** Increasing Rows/Cols (`100x100`) creates very complex mazes that look like textures from a distance.
*   **Solution:** The solution path is calculated using Breadth-First Search (BFS), guaranteeing the shortest route.
*   **Entrances:** If entry and exit are set to the same boundary cell, the generator automatically moves the exit to the opposite side so there are still two openings.
