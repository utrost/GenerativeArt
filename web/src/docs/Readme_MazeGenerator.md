# Maze Generator

**Maze Generator** creates perfect, solvable mazes using a Recursive Backtracking algorithm. The result is a dense grid of walls with a single unique path between any two points. It also features a solver that can visualize the shortest path.

## Parameters
*   **Preset**: A selection of predefined styles that instantly configure all other parameters to yield specific artistic patterns (e.g., "Classic", "Dense", "Abstract"). Selecting a preset overrides manual adjustments.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **ROWS** | `Integer` | Number of rows in the grid. Higher values create denser mazes. |
| **COLS** | `Integer` | Number of columns in the grid. |
| **Cell Size** | `Double` | The visual size of each cell in pixels. |
| **Wall Width** | `Double` | Thickness of the wall lines. |
| **Seed** | `Integer` | Random seed for reproducible maze generation. |
| **Solve** | `Boolean` | If enabled, overlays the solution path (Red line) from the top-left to the bottom-right corner. |

## Tips
*   **Plotting:** This is excellent for pen plotters as it consists of clean, non-overlapping lines (checking the solution path layer).
*   **Complexity:** Increasing Rows/Cols (`100x100`) creates very complex mazes that look like textures from a distance.
*   **Solution:** The solution path is calculated using Breadth-First Search (BFS), guaranteeing the shortest route.
