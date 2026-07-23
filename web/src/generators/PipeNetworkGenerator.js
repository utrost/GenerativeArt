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
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Dense Industrial", "Large Conduits", "Complex Maze"], "Select a predefined style"),
            ParameterDefinition.integer("Rows", 10, 5, 50, "Grid Rows"),
            ParameterDefinition.integer("Cols", 10, 5, 50, "Grid Columns"),
            ParameterDefinition.doubleVal("Pipe Width", 15.0, 1.0, 30.0, "Width of pipes"),
            ParameterDefinition.integer("Seed", 1234, 0, 100000, "Random Seed")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Dense Industrial":
                    currentValues["Rows"] = 20;
                    currentValues["Cols"] = 20;
                    currentValues["Pipe Width"] = 10.0;
                    currentValues["Seed"] = 101;
                    return true;
                case "Large Conduits":
                    currentValues["Rows"] = 5;
                    currentValues["Cols"] = 5;
                    currentValues["Pipe Width"] = 30.0;
                    currentValues["Seed"] = 404;
                    return true;
                case "Complex Maze":
                    currentValues["Rows"] = 30;
                    currentValues["Cols"] = 30;
                    currentValues["Pipe Width"] = 5.0;
                    currentValues["Seed"] = 999;
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

    // Tile definitions used by the Wave Function Collapse pipe grammar:
    // NO Empty tile, NO Caps, NO T-Junctions → forces dense connected network
    // Edges: [N, E, S, W] — 0=Empty, 1=Pipe
    initTiles() {
        // Straights
        this.TILES.push({ name: "V-Line",          edges: [1, 0, 1, 0], type: "line_v" });
        this.TILES.push({ name: "H-Line",          edges: [0, 1, 0, 1], type: "line_h" });

        // Corners
        this.TILES.push({ name: "Corner-NE",       edges: [1, 1, 0, 0], type: "ell_ne" });
        this.TILES.push({ name: "Corner-ES",       edges: [0, 1, 1, 0], type: "ell_es" });
        this.TILES.push({ name: "Corner-SW",       edges: [0, 0, 1, 1], type: "ell_sw" });
        this.TILES.push({ name: "Corner-WN",       edges: [1, 0, 0, 1], type: "ell_wn" });

        // Crossings — two visual variants, same connectivity
        this.TILES.push({ name: "Cross-Vert-Over", edges: [1, 1, 1, 1], type: "cross_vert_over" });
        this.TILES.push({ name: "Cross-Horiz-Over",edges: [1, 1, 1, 1], type: "cross_horiz_over" });
    }

    // --- Direction helpers ---
    static DIRS = [
        { name: "N", index: 0, dr: -1, dc:  0, opposite: 2 },
        { name: "E", index: 1, dr:  0, dc:  1, opposite: 3 },
        { name: "S", index: 2, dr:  1, dc:  0, opposite: 0 },
        { name: "W", index: 3, dr:  0, dc: -1, opposite: 1 },
    ];

    generate(params) {
        const rows = params["Rows"] || 10;
        const cols = params["Cols"] || 10;
        const pipeWidth = params["Pipe Width"] || 15.0;
        const seed = params["Seed"] || 1234;

        const width = params["width"] || 800;
        const height = params["height"] || 800;

        const canvas = new SvgCanvas(width, height, 1);
        const rand = new SeededRandom(seed);

        // WFC with constraint propagation + backtracking
        const wave = this.initWave(rows, cols);
        this.applyBoundaryConstraints(wave, rows, cols);
        this.solve(wave, rows, cols, rand);
        this.render(canvas, wave, rows, cols, pipeWidth, width, height);

        return canvas.toSvg();
    }

    // --- WFC Core ---

    // Initialize wave: each cell contains a Set of valid tile indices
    initWave(rows, cols) {
        const wave = [];
        for (let r = 0; r < rows; r++) {
            wave[r] = [];
            for (let c = 0; c < cols; c++) {
                wave[r][c] = new Set(this.TILES.map((_, i) => i));
            }
        }
        return wave;
    }

    // Remove tiles that connect outside the grid boundary
    applyBoundaryConstraints(wave, rows, cols) {
        const stack = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const before = wave[r][c].size;
                for (const idx of [...wave[r][c]]) {
                    const tile = this.TILES[idx];
                    let ok = true;
                    if (r === 0        && tile.edges[0] === 1) ok = false; // N boundary
                    if (r === rows - 1 && tile.edges[2] === 1) ok = false; // S boundary
                    if (c === 0        && tile.edges[3] === 1) ok = false; // W boundary
                    if (c === cols - 1 && tile.edges[1] === 1) ok = false; // E boundary
                    if (!ok) wave[r][c].delete(idx);
                }
                if (wave[r][c].size < before) {
                    stack.push([r, c]);
                }
            }
        }

        this.propagateStack(wave, rows, cols, stack);
    }

    // Arc consistency propagation
    propagateStack(wave, rows, cols, stack) {
        while (stack.length > 0) {
            const [cr, cc] = stack.pop();
            const currentTiles = wave[cr][cc];

            for (const dir of PipeNetworkGenerator.DIRS) {
                const nr = cr + dir.dr;
                const nc = cc + dir.dc;
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

                const neighborSet = wave[nr][nc];
                let changed = false;

                for (const nIdx of [...neighborSet]) {
                    const neighborTile = this.TILES[nIdx];
                    // Check if ANY current tile can connect to this neighbor tile
                    let compatible = false;
                    for (const cIdx of currentTiles) {
                        const currentTile = this.TILES[cIdx];
                        if (currentTile.edges[dir.index] === neighborTile.edges[dir.opposite]) {
                            compatible = true;
                            break;
                        }
                    }
                    if (!compatible) {
                        neighborSet.delete(nIdx);
                        changed = true;
                    }
                }

                if (neighborSet.size === 0) return false; // Contradiction
                if (changed) stack.push([nr, nc]);
            }
        }
        return true;
    }

    // Find uncollapsed cell with minimum entropy (fewest options)
    findMinEntropy(wave, rows, cols, rand) {
        let minSize = Infinity;
        const candidates = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const size = wave[r][c].size;
                if (size > 1) {
                    if (size < minSize) {
                        minSize = size;
                        candidates.length = 0;
                        candidates.push([r, c]);
                    } else if (size === minSize) {
                        candidates.push([r, c]);
                    }
                }
            }
        }

        if (candidates.length === 0) return null; // Fully collapsed
        return candidates[rand.nextInt(candidates.length)];
    }

    // Deep clone wave state for backtracking
    cloneWave(wave, rows, cols) {
        const copy = [];
        for (let r = 0; r < rows; r++) {
            copy[r] = [];
            for (let c = 0; c < cols; c++) {
                copy[r][c] = new Set(wave[r][c]);
            }
        }
        return copy;
    }

    restoreWave(wave, backup, rows, cols) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                wave[r][c] = backup[r][c];
            }
        }
    }

    // Recursive backtracking solver with constraint propagation
    solve(wave, rows, cols, rand) {
        const cell = this.findMinEntropy(wave, rows, cols, rand);
        if (cell === null) return true; // All collapsed

        const [r, c] = cell;
        const options = [...wave[r][c]];

        // Shuffle for randomness
        for (let i = options.length - 1; i > 0; i--) {
            const j = rand.nextInt(i + 1);
            [options[i], options[j]] = [options[j], options[i]];
        }

        for (const tileIdx of options) {
            const backup = this.cloneWave(wave, rows, cols);

            // Collapse
            wave[r][c] = new Set([tileIdx]);

            // Propagate
            if (this.propagateStack(wave, rows, cols, [[r, c]])) {
                if (this.solve(wave, rows, cols, rand)) {
                    return true;
                }
            }

            // Backtrack
            this.restoreWave(wave, backup, rows, cols);
        }

        return false;
    }

    // --- Rendering ---

    render(canvas, wave, rows, cols, pipeWidth, width, height) {
        // Use square cells, centered in the canvas.
        const tileSize = Math.min(width / cols, height / rows);
        const gridW = cols * tileSize;
        const gridH = rows * tileSize;
        const offsetX = (width - gridW) / 2;
        const offsetY = (height - gridH) / 2;
        const flangeDist = tileSize / 2 - 5;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tileSet = wave[r][c];
                if (tileSet.size === 0) continue;

                const idx = [...tileSet][0];
                const tile = this.TILES[idx];
                const cx = offsetX + c * tileSize + tileSize / 2;
                const cy = offsetY + r * tileSize + tileSize / 2;
                const radius = tileSize / 2;

                switch (tile.type) {
                    case "line_v":
                        this.drawDoubleLine(canvas, cx, cy - radius, cx, cy + radius, pipeWidth);
                        break;
                    case "line_h":
                        this.drawDoubleLine(canvas, cx - radius, cy, cx + radius, cy, pipeWidth);
                        break;
                    case "cross_vert_over": {
                        // Horizontal full (under)
                        this.drawDoubleLine(canvas, cx - radius, cy, cx + radius, cy, pipeWidth);
                        // Vertical interrupted (over)
                        const gap = pipeWidth * 0.7;
                        this.drawDoubleLine(canvas, cx, cy - radius, cx, cy - gap, pipeWidth);
                        this.drawDoubleLine(canvas, cx, cy + gap, cx, cy + radius, pipeWidth);
                        break;
                    }
                    case "cross_horiz_over": {
                        // Vertical interrupted (under)
                        const gap2 = pipeWidth * 0.7;
                        this.drawDoubleLine(canvas, cx, cy - radius, cx, cy - gap2, pipeWidth);
                        this.drawDoubleLine(canvas, cx, cy + gap2, cx, cy + radius, pipeWidth);
                        // Horizontal full (over)
                        this.drawDoubleLine(canvas, cx - radius, cy, cx + radius, cy, pipeWidth);
                        break;
                    }
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
                }

                // Draw Flanges at connection points
                if (tile.edges[0] === 1)
                    this.drawFlange(canvas, cx, cy - flangeDist, "horizontal", pipeWidth);
                if (tile.edges[1] === 1)
                    this.drawFlange(canvas, cx + flangeDist, cy, "vertical", pipeWidth);
                if (tile.edges[2] === 1)
                    this.drawFlange(canvas, cx, cy + flangeDist, "horizontal", pipeWidth);
                if (tile.edges[3] === 1)
                    this.drawFlange(canvas, cx - flangeDist, cy, "vertical", pipeWidth);
            }
        }
    }

    drawDoubleLine(canvas, x1, y1, x2, y2, width) {
        const offset = width / 2.0;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const dx = -Math.sin(angle) * offset;
        const dy = Math.cos(angle) * offset;

        canvas.addLine(0, x1 + dx, y1 + dy, x2 + dx, y2 + dy);
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

        // SVG arc: always quarter-circle (90°), sweep=0 gives the desired plotter path.
        const path = `<path d='M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)}' fill='none' stroke-width='1.5' />`;
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
