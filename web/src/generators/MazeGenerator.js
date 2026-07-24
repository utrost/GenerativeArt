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
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Standard Grid", "Dense Labyrinth", "Large Blocks", "Solved Puzzle"], "Select a predefined style"),
            ParameterDefinition.integer("rows", 20, 5, 100, "Rows"),
            ParameterDefinition.integer("cols", 20, 5, 100, "Columns"),
            ParameterDefinition.doubleVal("cellSize", 20.0, 5.0, 100.0, "Cell Size"),
            ParameterDefinition.doubleVal("wallWidth", 2.0, 0.5, 10.0, "Wall Width"),
            ParameterDefinition.selection("entrySide", "Top", ["Top", "Right", "Bottom", "Left"], "Side containing the single maze entry opening"),
            ParameterDefinition.doubleVal("entryPosition", 0.0, 0.0, 100.0, "Entry position along its side, as percent from left/top"),
            ParameterDefinition.selection("exitSide", "Bottom", ["Top", "Right", "Bottom", "Left"], "Side containing the single maze exit opening"),
            ParameterDefinition.doubleVal("exitPosition", 100.0, 0.0, 100.0, "Exit position along its side, as percent from left/top"),
            ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed"),
            ParameterDefinition.bool("solve", false, "Show Solution")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Standard Grid":
                    currentValues["rows"] = 20;
                    currentValues["cols"] = 20;
                    currentValues["cellSize"] = 20.0;
                    currentValues["wallWidth"] = 2.0;
                    currentValues["entrySide"] = "Top";
                    currentValues["entryPosition"] = 0.0;
                    currentValues["exitSide"] = "Bottom";
                    currentValues["exitPosition"] = 100.0;
                    currentValues["seed"] = 1234;
                    currentValues["solve"] = false;
                    return true;
                case "Dense Labyrinth":
                    currentValues["rows"] = 50;
                    currentValues["cols"] = 50;
                    currentValues["cellSize"] = 10.0;
                    currentValues["wallWidth"] = 1.0;
                    currentValues["entrySide"] = "Left";
                    currentValues["entryPosition"] = 0.0;
                    currentValues["exitSide"] = "Right";
                    currentValues["exitPosition"] = 100.0;
                    currentValues["seed"] = 9999;
                    currentValues["solve"] = false;
                    return true;
                case "Large Blocks":
                    currentValues["rows"] = 10;
                    currentValues["cols"] = 10;
                    currentValues["cellSize"] = 50.0;
                    currentValues["wallWidth"] = 4.0;
                    currentValues["entrySide"] = "Top";
                    currentValues["entryPosition"] = 0.0;
                    currentValues["exitSide"] = "Bottom";
                    currentValues["exitPosition"] = 100.0;
                    currentValues["seed"] = 42;
                    currentValues["solve"] = false;
                    return true;
                case "Solved Puzzle":
                    currentValues["rows"] = 30;
                    currentValues["cols"] = 30;
                    currentValues["cellSize"] = 15.0;
                    currentValues["wallWidth"] = 1.5;
                    currentValues["entrySide"] = "Top";
                    currentValues["entryPosition"] = 0.0;
                    currentValues["exitSide"] = "Bottom";
                    currentValues["exitPosition"] = 100.0;
                    currentValues["seed"] = 777;
                    currentValues["solve"] = true;
                    return true;
                case "Custom":
                default:
                    return false;
            }
        }
        if (paramName !== "Preset" && currentValues["Preset"] !== "Custom") {
            currentValues["Preset"] = "Custom";
            return true;
        }
        return false;
    }

    generate(params) {
        const rows = params["rows"] || 20;
        const cols = params["cols"] || 20;
        const cellSize = params["cellSize"] || 20.0;
        const wallWidth = params["wallWidth"] || 2.0;
        const entrySide = params["entrySide"] || "Top";
        const entryPosition = params["entryPosition"] ?? 0.0;
        const exitSide = params["exitSide"] || "Bottom";
        const exitPosition = params["exitPosition"] ?? 100.0;
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
        const entry = this.boundaryOpening(entrySide, entryPosition, rows, cols);
        let exit = this.boundaryOpening(exitSide, exitPosition, rows, cols);
        if (this.sameOpening(entry, exit)) {
            exit = this.boundaryOpening(this.oppositeSide(entry.side), 100 - entryPosition, rows, cols);
        }

        // Draw Walls (Layer 0)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellSize;
                const y = r * cellSize;
                const cell = grid[r][c];

                if (r === 0 && cell.walls[0] && !this.isOpening(entry, r, c, 0) && !this.isOpening(exit, r, c, 0))
                    canvas.addLine(0, x, y, x + cellSize, y); // N
                if (c === 0 && cell.walls[3] && !this.isOpening(entry, r, c, 3) && !this.isOpening(exit, r, c, 3))
                    canvas.addLine(0, x, y, x, y + cellSize); // W
                if (cell.walls[2] && !this.isOpening(entry, r, c, 2) && !this.isOpening(exit, r, c, 2))
                    canvas.addLine(0, x, y + cellSize, x + cellSize, y + cellSize); // S
                if (cell.walls[1] && !this.isOpening(entry, r, c, 1) && !this.isOpening(exit, r, c, 1))
                    canvas.addLine(0, x + cellSize, y, x + cellSize, y + cellSize); // E
            }
        }

        // Solve if requested (Layer 1)
        if (solve) {
            const path = this.solveMaze(grid, rows, cols, entry.cell, exit.cell);
            if (path && path.length > 0) {
                const startPoint = this.outsideOpeningPoint(entry, cellSize);
                const endPoint = this.outsideOpeningPoint(exit, cellSize);
                let pathData = `M ${startPoint.x} ${startPoint.y}`;
                for (let i = 0; i < path.length; i++) {
                    pathData += ` L ${path[i].c * cellSize + cellSize / 2} ${path[i].r * cellSize + cellSize / 2}`;
                }
                pathData += ` L ${endPoint.x} ${endPoint.y}`;
                canvas.addRaw(1, `<path d="${pathData}" stroke="red" stroke-width="${cellSize * 0.3}" fill="none" stroke-linejoin="round" stroke-linecap="round" />`);
            }
        }

        return canvas.toSvg();
    }

    boundaryOpening(side, positionPercent, rows, cols) {
        const normalizedSide = ["Top", "Right", "Bottom", "Left"].includes(side) ? side : "Top";
        const pct = Math.min(100, Math.max(0, Number(positionPercent) || 0)) / 100;
        if (normalizedSide === "Top") {
            return { side: normalizedSide, wall: 0, cell: { r: 0, c: Math.round(pct * (cols - 1)) } };
        }
        if (normalizedSide === "Right") {
            return { side: normalizedSide, wall: 1, cell: { r: Math.round(pct * (rows - 1)), c: cols - 1 } };
        }
        if (normalizedSide === "Bottom") {
            return { side: normalizedSide, wall: 2, cell: { r: rows - 1, c: Math.round(pct * (cols - 1)) } };
        }
        return { side: normalizedSide, wall: 3, cell: { r: Math.round(pct * (rows - 1)), c: 0 } };
    }

    isOpening(opening, r, c, wall) {
        return opening && opening.wall === wall && opening.cell.r === r && opening.cell.c === c;
    }

    sameOpening(a, b) {
        return a && b && a.wall === b.wall && a.cell.r === b.cell.r && a.cell.c === b.cell.c;
    }

    oppositeSide(side) {
        if (side === "Top") return "Bottom";
        if (side === "Right") return "Left";
        if (side === "Bottom") return "Top";
        return "Right";
    }

    outsideOpeningPoint(opening, cellSize) {
        const x = opening.cell.c * cellSize + cellSize / 2;
        const y = opening.cell.r * cellSize + cellSize / 2;
        if (opening.side === "Top") return { x, y: -cellSize / 2 };
        if (opening.side === "Right") return { x: x + cellSize, y };
        if (opening.side === "Bottom") return { x, y: y + cellSize };
        return { x: -cellSize / 2, y };
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

    solveMaze(grid, rows, cols, startCell = { r: 0, c: 0 }, targetCell = { r: rows - 1, c: cols - 1 }) {
        // Reset visited for solver
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                grid[r][c].visited = false;

        const queue = [];
        const startPath = [grid[startCell.r][startCell.c]];
        queue.push(startPath);
        grid[startCell.r][startCell.c].visited = true;

        const target = grid[targetCell.r][targetCell.c];

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
