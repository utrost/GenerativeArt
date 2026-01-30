package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.*;

public class MazeGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "maze_generator";
    }

    @Override
    public String getDisplayName() {
        return "Maze Generator";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("rows", 20, 5, 100, "Rows"),
                ParameterDefinition.integer("cols", 20, 5, 100, "Columns"),
                ParameterDefinition.doubleVal("cellSize", 20.0, 5.0, 100.0, "Cell Size"),
                ParameterDefinition.doubleVal("wallWidth", 2.0, 0.5, 10.0, "Wall Width"),
                ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed"),
                ParameterDefinition.bool("solve", false, "Show Solution"));
    }

    private static class Cell {
        int r, c;
        boolean[] walls = { true, true, true, true }; // N, E, S, W
        boolean visited = false;

        Cell(int r, int c) {
            this.r = r;
            this.c = c;
        }
    }

    @Override
    public String generate(Map<String, Object> params) {
        int rows = (int) params.getOrDefault("rows", 20);
        int cols = (int) params.getOrDefault("cols", 20);
        double cellSize = (double) params.getOrDefault("cellSize", 20.0);
        double wallWidth = (double) params.getOrDefault("wallWidth", 2.0);
        int seed = (int) params.getOrDefault("seed", 1234);
        boolean solve = (boolean) params.getOrDefault("solve", false);

        Random rand = new Random(seed);
        Cell[][] grid = new Cell[rows][cols];

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                grid[r][c] = new Cell(r, c);
            }
        }

        // Generate Maze using Recursive Backtracking
        Stack<Cell> stack = new Stack<>();
        Cell current = grid[0][0];
        current.visited = true;
        stack.push(current);

        while (!stack.isEmpty()) {
            current = stack.peek();
            List<Cell> neighbors = getUnvisitedNeighbors(current, grid, rows, cols);

            if (!neighbors.isEmpty()) {
                Cell next = neighbors.get(rand.nextInt(neighbors.size()));
                removeWalls(current, next);
                next.visited = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }

        // Prepare SVG with 2 layers: 0=Walls(Black), 1=Solution(Red)
        double width = cols * cellSize;
        double height = rows * cellSize;
        SvgCanvas canvas = new SvgCanvas(width, height, 2);
        canvas.setStrokeWidth(wallWidth);

        // Draw Walls (Layer 0)
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                double x = c * cellSize;
                double y = r * cellSize;

                Cell cell = grid[r][c];

                // Draw N if r==0.
                if (r == 0 && cell.walls[0]) {
                    canvas.addLine(0, x, y, x + cellSize, y);
                }
                // Draw W if c==0.
                if (c == 0 && cell.walls[3]) {
                    canvas.addLine(0, x, y, x, y + cellSize);
                }
                // Draw S if wall exists.
                if (cell.walls[2]) {
                    canvas.addLine(0, x, y + cellSize, x + cellSize, y + cellSize);
                }
                // Draw E if wall exists.
                if (cell.walls[1]) {
                    canvas.addLine(0, x + cellSize, y, x + cellSize, y + cellSize);
                }
            }
        }

        // Solve if requested (Layer 1)
        if (solve) {
            List<Cell> path = solveMaze(grid, rows, cols);
            if (path != null && !path.isEmpty()) {
                StringBuilder pathData = new StringBuilder();
                pathData.append("M ").append(path.get(0).c * cellSize + cellSize / 2).append(" ")
                        .append(path.get(0).r * cellSize + cellSize / 2);
                for (int i = 1; i < path.size(); i++) {
                    pathData.append(" L ").append(path.get(i).c * cellSize + cellSize / 2).append(" ")
                            .append(path.get(i).r * cellSize + cellSize / 2);
                }

                // Add path to Layer 1
                canvas.addRaw(1, "<path d=\"" + pathData.toString() + "\" stroke=\"red\" stroke-width=\""
                        + (cellSize * 0.3) + "\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" />");
            }
        }

        return canvas.toSvg();
    }

    private List<Cell> getUnvisitedNeighbors(Cell c, Cell[][] grid, int rows, int cols) {
        List<Cell> neighbors = new ArrayList<>();
        // N
        if (c.r > 0 && !grid[c.r - 1][c.c].visited)
            neighbors.add(grid[c.r - 1][c.c]);
        // E
        if (c.c < cols - 1 && !grid[c.r][c.c + 1].visited)
            neighbors.add(grid[c.r][c.c + 1]);
        // S
        if (c.r < rows - 1 && !grid[c.r + 1][c.c].visited)
            neighbors.add(grid[c.r + 1][c.c]);
        // W
        if (c.c > 0 && !grid[c.r][c.c - 1].visited)
            neighbors.add(grid[c.r][c.c - 1]);
        return neighbors;
    }

    private void removeWalls(Cell a, Cell b) {
        int dr = a.r - b.r;
        int dc = a.c - b.c;

        if (dr == 1) { // a is below b (b is North of a)
            a.walls[0] = false;
            b.walls[2] = false;
        } else if (dr == -1) { // a is above b (b is South of a)
            a.walls[2] = false;
            b.walls[0] = false;
        } else if (dc == 1) { // a is right of b (b is West of a)
            a.walls[3] = false;
            b.walls[1] = false;
        } else if (dc == -1) { // a is left of b (b is East of a)
            a.walls[1] = false;
            b.walls[3] = false;
        }
    }

    // BFS for shortest path (since it's a tree, DFS is also unique path, but BFS is
    // standard for shortest)
    // Actually for a spanning tree, the unique path is the only path.
    private List<Cell> solveMaze(Cell[][] grid, int rows, int cols) {
        // Reset visited for solver
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                grid[r][c].visited = false;

        Queue<List<Cell>> queue = new LinkedList<>();
        List<Cell> startPath = new ArrayList<>();
        startPath.add(grid[0][0]);
        queue.add(startPath);
        grid[0][0].visited = true;

        Cell target = grid[rows - 1][cols - 1];

        while (!queue.isEmpty()) {
            List<Cell> path = queue.poll();
            Cell current = path.get(path.size() - 1);

            if (current == target)
                return path;

            // Check accessible neighbors
            // N
            if (current.r > 0 && !current.walls[0] && !grid[current.r - 1][current.c].visited) {
                List<Cell> newPath = new ArrayList<>(path);
                Cell next = grid[current.r - 1][current.c];
                next.visited = true;
                newPath.add(next);
                queue.add(newPath);
            }
            // E
            if (current.c < cols - 1 && !current.walls[1] && !grid[current.r][current.c + 1].visited) {
                List<Cell> newPath = new ArrayList<>(path);
                Cell next = grid[current.r][current.c + 1];
                next.visited = true;
                newPath.add(next);
                queue.add(newPath);
            }
            // S
            if (current.r < rows - 1 && !current.walls[2] && !grid[current.r + 1][current.c].visited) {
                List<Cell> newPath = new ArrayList<>(path);
                Cell next = grid[current.r + 1][current.c];
                next.visited = true;
                newPath.add(next);
                queue.add(newPath);
            }
            // W
            if (current.c > 0 && !current.walls[3] && !grid[current.r][current.c - 1].visited) {
                List<Cell> newPath = new ArrayList<>(path);
                Cell next = grid[current.r][current.c - 1];
                next.visited = true;
                newPath.add(next);
                queue.add(newPath);
            }
        }
        return null; // Should not happen in a perfect maze
    }
}
