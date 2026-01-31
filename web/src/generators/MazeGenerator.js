import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

class Cell {
    constructor(r, c) {
        this.r = r;
        this.c = c;
        this.walls = [true, true, true, true]; // N, E, S, W
        this.visited = false;
    }
}

export class MazeGenerator extends Generator {
    getId() {
        return "maze-generator";
    }

    getDisplayName() {
        return "Maze Generator";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("rows", 20, 5, 100, "Rows"),
            ParameterDefinition.integer("cols", 20, 5, 100, "Columns"),
            ParameterDefinition.doubleVal("cellSize", 20.0, 5.0, 100.0, "Cell Size"),
            ParameterDefinition.doubleVal("wallWidth", 2.0, 0.5, 10.0, "Wall Width"),
            ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed"),
            ParameterDefinition.bool("solve", false, "Show Solution")
        ];
    }

    generate(params) {
        const rows = params["rows"] || 20;
        const cols = params["cols"] || 20;
        const cellSize = params["cellSize"] || 20.0;
        const wallWidth = params["wallWidth"] || 2.0;
        const seed = params["seed"] || 1234;
        const solve = params["solve"] || false;

        const rand = new SeededRandom(seed);
        const grid = Array(rows).fill(null).map((_, r) =>
            Array(cols).fill(null).map((_, c) => new Cell(r, c))
        );

        // Generate Maze using Recursive Backtracking
        const stack = [];
        let current = grid[0][0];
        current.visited = true;
        stack.push(current);

        while (stack.length > 0) {
            current = stack[stack.length - 1]; // peek
            const neighbors = this.getUnvisitedNeighbors(current, grid, rows, cols);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(rand.nextDouble() * neighbors.length)];
                this.removeWalls(current, next);
                next.visited = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }

        const width = cols * cellSize;
        const height = rows * cellSize;
        const canvas = new SvgCanvas(width, height, 2);
        canvas.setStrokeWidth(wallWidth);

        // Draw Walls (Layer 0)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellSize;
                const y = r * cellSize;
                const cell = grid[r][c];

                if (r === 0 && cell.walls[0])
                    canvas.addLine(0, x, y, x + cellSize, y); // N
                if (c === 0 && cell.walls[3])
                    canvas.addLine(0, x, y, x, y + cellSize); // W
                if (cell.walls[2])
                    canvas.addLine(0, x, y + cellSize, x + cellSize, y + cellSize); // S
                if (cell.walls[1])
                    canvas.addLine(0, x + cellSize, y, x + cellSize, y + cellSize); // E
            }
        }

        // Solve if requested (Layer 1)
        if (solve) {
            const path = this.solveMaze(grid, rows, cols);
            if (path && path.length > 0) {
                let pathData = `M ${path[0].c * cellSize + cellSize / 2} ${path[0].r * cellSize + cellSize / 2}`;
                for (let i = 1; i < path.length; i++) {
                    pathData += ` L ${path[i].c * cellSize + cellSize / 2} ${path[i].r * cellSize + cellSize / 2}`;
                }
                canvas.addRaw(1, `<path d="${pathData}" stroke="red" stroke-width="${cellSize * 0.3}" fill="none" stroke-linejoin="round" stroke-linecap="round" />`);
            }
        }

        return canvas.toSvg();
    }

    getUnvisitedNeighbors(c, grid, rows, cols) {
        const neighbors = [];
        if (c.r > 0 && !grid[c.r - 1][c.c].visited) neighbors.push(grid[c.r - 1][c.c]); // N
        if (c.c < cols - 1 && !grid[c.r][c.c + 1].visited) neighbors.push(grid[c.r][c.c + 1]); // E
        if (c.r < rows - 1 && !grid[c.r + 1][c.c].visited) neighbors.push(grid[c.r + 1][c.c]); // S
        if (c.c > 0 && !grid[c.r][c.c - 1].visited) neighbors.push(grid[c.r][c.c - 1]); // W
        return neighbors;
    }

    removeWalls(a, b) {
        const dr = a.r - b.r;
        const dc = a.c - b.c;

        if (dr === 1) { // a is below b (b is North)
            a.walls[0] = false;
            b.walls[2] = false;
        } else if (dr === -1) { // a is above b (b is South)
            a.walls[2] = false;
            b.walls[0] = false;
        } else if (dc === 1) { // a is right (b is West)
            a.walls[3] = false;
            b.walls[1] = false;
        } else if (dc === -1) { // a is left (b is East)
            a.walls[1] = false;
            b.walls[3] = false;
        }
    }

    solveMaze(grid, rows, cols) {
        // Reset visited for solver
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                grid[r][c].visited = false;

        const queue = [];
        const startPath = [grid[0][0]];
        queue.push(startPath);
        grid[0][0].visited = true;

        const target = grid[rows - 1][cols - 1];

        while (queue.length > 0) {
            const path = queue.shift(); // shift is standard JS array method for queue pop
            const current = path[path.length - 1];

            if (current === target) return path;

            // Check neighbors respecting walls
            const tryNeighbor = (next) => {
                if (!next.visited) {
                    const newPath = [...path, next];
                    next.visited = true;
                    queue.push(newPath);
                }
            };

            // N
            if (current.r > 0 && !current.walls[0]) tryNeighbor(grid[current.r - 1][current.c]);
            // E
            if (current.c < cols - 1 && !current.walls[1]) tryNeighbor(grid[current.r][current.c + 1]);
            // S
            if (current.r < rows - 1 && !current.walls[2]) tryNeighbor(grid[current.r + 1][current.c]);
            // W
            if (current.c > 0 && !current.walls[3]) tryNeighbor(grid[current.r][current.c - 1]);
        }
        return null;
    }
}
