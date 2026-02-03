import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class PipeNetworkGenerator extends Generator {
    constructor() {
        super();
        this.TILES = [];
        this.initTiles();
    }

    getId() {
        return "pipe-network";
    }

    getDisplayName() {
        return "Pipe Network";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("Rows", 10, 5, 50, "Grid Rows"),
            ParameterDefinition.integer("Cols", 10, 5, 50, "Grid Columns"),
            ParameterDefinition.doubleVal("Pipe Width", 15.0, 1.0, 30.0, "Width of pipes"),
            ParameterDefinition.integer("Seed", 1234, 0, 100000, "Random Seed")
        ];
    }

    // Tile definition: name, edges [N, E, S, W], svgType
    // Edges: 0=Empty, 1=Pipe
    initTiles() {
        // Simple set for now: Empty, Straight Horizontal, Straight Vertical, Cross, Elbows, T-Junctions
        // N, E, S, W
        this.TILES.push({ name: "Empty", edges: [0, 0, 0, 0], type: "empty" });
        this.TILES.push({ name: "H-Line", edges: [0, 1, 0, 1], type: "line_h" });
        this.TILES.push({ name: "V-Line", edges: [1, 0, 1, 0], type: "line_v" });
        this.TILES.push({ name: "Cross", edges: [1, 1, 1, 1], type: "cross" });

        // Elbows
        this.TILES.push({ name: "NE-Elbow", edges: [1, 1, 0, 0], type: "ell_ne" });
        this.TILES.push({ name: "ES-Elbow", edges: [0, 1, 1, 0], type: "ell_es" });
        this.TILES.push({ name: "SW-Elbow", edges: [0, 0, 1, 1], type: "ell_sw" });
        this.TILES.push({ name: "WN-Elbow", edges: [1, 0, 0, 1], type: "ell_wn" });

        // T-Junctions
        this.TILES.push({ name: "T-North", edges: [1, 1, 0, 1], type: "tee_n" });
        this.TILES.push({ name: "T-East", edges: [1, 1, 1, 0], type: "tee_e" });
        this.TILES.push({ name: "T-South", edges: [0, 1, 1, 1], type: "tee_s" });
        this.TILES.push({ name: "T-West", edges: [1, 0, 1, 1], type: "tee_w" });

        // Terminals (Caps)
        this.TILES.push({ name: "Cap-N", edges: [1, 0, 0, 0], type: "cap_n" });
        this.TILES.push({ name: "Cap-E", edges: [0, 1, 0, 0], type: "cap_e" });
        this.TILES.push({ name: "Cap-S", edges: [0, 0, 1, 0], type: "cap_s" });
        this.TILES.push({ name: "Cap-W", edges: [0, 0, 0, 1], type: "cap_w" });
    }

    generate(params) {
        const rows = params["Rows"] || 10;
        const cols = params["Cols"] || 10;
        const pipeWidth = params["Pipe Width"] || 15.0;
        const seed = params["Seed"] || 1234;

        const width = params["width"] || 800;
        const height = params["height"] || 800;

        const canvas = new SvgCanvas(width, height, 1);
        const rand = new SeededRandom(seed); // Java version uses backtracking with random choice

        // Very simplified WFC-like generation using backtracking
        // Initialize grid with all possibilities

        // State: grid[r][c] = index of tile in TILES, or -1 if unassigned
        // But for backtracking, we just need to fill one by one?
        // Let's try a simple scanline backtracking solver. It's fast enough for 10x10 or 20x20.

        const solution = this.solve(rows, cols, rand);

        if (solution) {
            this.render(canvas, solution, rows, cols, pipeWidth, width, height);
        } else {
            console.error("No solution found for pipe network");
        }

        return canvas.toSvg();
    }

    solve(rows, cols, rand) {
        const grid = Array(rows).fill(null).map(() => Array(cols).fill(-1));

        if (this.backtrack(grid, 0, 0, rows, cols, rand)) {
            return grid;
        }
        return null;
    }

    backtrack(grid, r, c, rows, cols, rand) {
        if (r === rows) return true; // Done

        const nextC = (c + 1) % cols;
        const nextR = (c + 1) === cols ? r + 1 : r;

        // Shuffle tiles to get random result
        const indices = Array.from({ length: this.TILES.length }, (_, i) => i);
        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = rand.nextInt(i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        for (const idx of indices) {
            const tile = this.TILES[idx];
            if (this.isValid(grid, r, c, rows, cols, tile)) {
                grid[r][c] = idx;
                if (this.backtrack(grid, nextR, nextC, rows, cols, rand)) {
                    return true;
                }
                grid[r][c] = -1;
            }
        }
        return false;
    }

    isValid(grid, r, c, rows, cols, tile) {
        // Check North
        if (r > 0) {
            const northIdx = grid[r - 1][c];
            const northTile = this.TILES[northIdx];
            // North tile's South edge (2) must match current tile's North edge (0)
            if (northTile.edges[2] !== tile.edges[0]) return false;
        } else {
            // Boundary condition: No pipes connecting outside (edge must be 0)
            if (tile.edges[0] !== 0) return false;
        }

        // Check West
        if (c > 0) {
            const westIdx = grid[r][c - 1];
            const westTile = this.TILES[westIdx];
            // West tile's East edge (1) must match current tile's West edge (3)
            if (westTile.edges[1] !== tile.edges[3]) return false;
        } else {
            // Boundary condition
            if (tile.edges[3] !== 0) return false;
        }

        // Check South Boundary (only if at last row)
        if (r === rows - 1) {
            if (tile.edges[2] !== 0) return false;
        }

        // Check East Boundary (only if at last col)
        if (c === cols - 1) {
            if (tile.edges[1] !== 0) return false;
        }

        return true;
    }

    render(canvas, grid, rows, cols, pipeWidth, width, height) {
        const cellW = width / cols;
        const cellH = height / rows;
        const tileSize = Math.min(cellW, cellH);
        const flangeDist = tileSize / 2 - 5;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = grid[r][c];
                const tile = this.TILES[idx];
                const cx = c * cellW + cellW / 2;
                const cy = r * cellH + cellH / 2;
                const radius = tileSize / 2;

                // Draw Pipe Geometry
                switch (tile.type) {
                    case "line_v":
                        this.drawDoubleLine(canvas, cx, cy - radius, cx, cy + radius, pipeWidth);
                        break;
                    case "line_h":
                        this.drawDoubleLine(canvas, cx - radius, cy, cx + radius, cy, pipeWidth);
                        break;
                    case "cross":
                        // Horizontal (Under)
                        this.drawDoubleLine(canvas, cx - radius, cy, cx + radius, cy, pipeWidth);
                        // Vertical (Over) - interrupted
                        const gap = pipeWidth * 0.7;
                        this.drawDoubleLine(canvas, cx, cy - radius, cx, cy - gap, pipeWidth);
                        this.drawDoubleLine(canvas, cx, cy + gap, cx, cy + radius, pipeWidth);
                        break;
                    case "ell_ne":
                        this.drawDoubleArc(canvas, cx + radius, cy - radius, radius, pipeWidth, Math.PI, Math.PI / 2);
                        break;
                    case "ell_es":
                        this.drawDoubleArc(canvas, cx + radius, cy + radius, radius, pipeWidth, Math.PI * 1.5, Math.PI);
                        break;
                    case "ell_sw":
                        this.drawDoubleArc(canvas, cx - radius, cy + radius, radius, pipeWidth, 0, Math.PI * 1.5);
                        break;
                    case "ell_wn":
                        this.drawDoubleArc(canvas, cx - radius, cy - radius, radius, pipeWidth, Math.PI / 2, 0);
                        break;

                    // T-Junctions
                    case "tee_n": // N, E, W
                        this.drawDoubleLine(canvas, cx - radius, cy, cx + radius, cy, pipeWidth); // H
                        this.drawDoubleLine(canvas, cx, cy, cx, cy - radius, pipeWidth); // V
                        break;
                    case "tee_e":
                        this.drawDoubleLine(canvas, cx, cy - radius, cx, cy + radius, pipeWidth); // V
                        this.drawDoubleLine(canvas, cx, cy, cx + radius, cy, pipeWidth); // H
                        break;
                    case "tee_s":
                        this.drawDoubleLine(canvas, cx - radius, cy, cx + radius, cy, pipeWidth); // H
                        this.drawDoubleLine(canvas, cx, cy, cx, cy + radius, pipeWidth); // V
                        break;
                    case "tee_w":
                        this.drawDoubleLine(canvas, cx, cy - radius, cx, cy + radius, pipeWidth); // V
                        this.drawDoubleLine(canvas, cx, cy, cx - radius, cy, pipeWidth); // H
                        break;

                    // Caps
                    case "cap_n":
                        this.drawDoubleLine(canvas, cx, cy, cx, cy - radius, pipeWidth);
                        this.drawFlange(canvas, cx, cy, "horizontal", pipeWidth);
                        break;
                    case "cap_e":
                        this.drawDoubleLine(canvas, cx, cy, cx + radius, cy, pipeWidth);
                        this.drawFlange(canvas, cx, cy, "vertical", pipeWidth);
                        break;
                    case "cap_s":
                        this.drawDoubleLine(canvas, cx, cy, cx, cy + radius, pipeWidth);
                        this.drawFlange(canvas, cx, cy, "horizontal", pipeWidth);
                        break;
                    case "cap_w":
                        this.drawDoubleLine(canvas, cx, cy, cx - radius, cy, pipeWidth);
                        this.drawFlange(canvas, cx, cy, "vertical", pipeWidth);
                        break;
                }

                // Draw Flanges
                if (tile.edges[0] === 1 && !tile.type.startsWith("cap"))
                    this.drawFlange(canvas, cx, cy - flangeDist, "horizontal", pipeWidth);
                if (tile.edges[1] === 1 && !tile.type.startsWith("cap"))
                    this.drawFlange(canvas, cx + flangeDist, cy, "vertical", pipeWidth);
                if (tile.edges[2] === 1 && !tile.type.startsWith("cap"))
                    this.drawFlange(canvas, cx, cy + flangeDist, "horizontal", pipeWidth);
                if (tile.edges[3] === 1 && !tile.type.startsWith("cap"))
                    this.drawFlange(canvas, cx - flangeDist, cy, "vertical", pipeWidth);
            }
        }
    }

    drawDoubleLine(canvas, x1, y1, x2, y2, width) {
        const offset = width / 2.0;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const dx = -Math.sin(angle) * offset;
        const dy = Math.cos(angle) * offset;

        // Line 1
        canvas.addLine(0, x1 + dx, y1 + dy, x2 + dx, y2 + dy);
        // Line 2
        canvas.addLine(0, x1 - dx, y1 - dy, x2 - dx, y2 - dy);
    }

    drawDoubleArc(canvas, cx, cy, radius, width, startAngle, endAngle) {
        const r1 = radius - width / 2;
        const r2 = radius + width / 2;

        this.renderArc(canvas, cx, cy, r1, startAngle, endAngle);
        this.renderArc(canvas, cx, cy, r2, startAngle, endAngle);
    }

    renderArc(canvas, cx, cy, r, startAngle, endAngle) {
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        let diff = endAngle - startAngle;
        while (diff <= -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;

        const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
        const sweep = diff > 0 ? 1 : 0;

        // Use black stroke and thin width for double lines to match Java look (0 in SvgCanvas uses layer color)
        const path = `<path d='M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}' fill='none' stroke-width='1.5' />`;
        canvas.addRaw(0, path);
    }

    drawFlange(canvas, cx, cy, orientation, width) {
        const len = width + 6;
        if (orientation === "horizontal") {
            canvas.addLine(0, cx - len / 2, cy, cx + len / 2, cy);
            canvas.addLine(0, cx - len / 2, cy - 2, cx + len / 2, cy - 2);
        } else {
            canvas.addLine(0, cx, cy - len / 2, cx, cy + len / 2);
            canvas.addLine(0, cx - 2, cy - len / 2, cx - 2, cy + len / 2);
        }
    }
}
