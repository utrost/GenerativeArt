import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class CelticKnotGenerator extends Generator {
    getId() {
        return "celtic-knot";
    }

    getDisplayName() {
        return "Celtic Knot";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Dense Weave", ["Custom", "Simple Braid", "Dense Weave", "Border Pattern", "Round Knot"], "Select a predefined style"),
            ParameterDefinition.integer("Grid Width", 10, 2, 16, "Number of grid cells horizontally"),
            ParameterDefinition.integer("Grid Height", 10, 2, 16, "Number of grid cells vertically"),
            ParameterDefinition.doubleVal("Ribbon Width", 5.0, 2.0, 25.0, "Width of the interlaced ribbons"),
            ParameterDefinition.doubleVal("Corner Radius", 0.4, 0.0, 0.5, "Roundness of turns (0 = sharp, 0.5 = circular)"),
            ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for break patterns"),
            ParameterDefinition.doubleVal("Break Probability", 0.5, 0.0, 1.0, "Probability of adding breaks to create knot patterns"),
            ParameterDefinition.integer("Colors", 2, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            switch (newValue) {
                case "Simple Braid":
                    currentValues["Grid Width"] = 4;
                    currentValues["Grid Height"] = 8;
                    currentValues["Ribbon Width"] = 10.0;
                    currentValues["Corner Radius"] = 0.3;
                    currentValues["Break Probability"] = 0.2;
                    currentValues["Colors"] = 2;
                    return true;
                case "Dense Weave":
                    currentValues["Grid Width"] = 10;
                    currentValues["Grid Height"] = 10;
                    currentValues["Ribbon Width"] = 5.0;
                    currentValues["Corner Radius"] = 0.4;
                    currentValues["Break Probability"] = 0.5;
                    currentValues["Colors"] = 2;
                    return true;
                case "Border Pattern":
                    currentValues["Grid Width"] = 12;
                    currentValues["Grid Height"] = 3;
                    currentValues["Ribbon Width"] = 12.0;
                    currentValues["Corner Radius"] = 0.3;
                    currentValues["Break Probability"] = 0.3;
                    currentValues["Colors"] = 2;
                    return true;
                case "Round Knot":
                    currentValues["Grid Width"] = 6;
                    currentValues["Grid Height"] = 6;
                    currentValues["Ribbon Width"] = 8.0;
                    currentValues["Corner Radius"] = 0.5;
                    currentValues["Break Probability"] = 0.4;
                    currentValues["Colors"] = 3;
                    return true;
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
        const gridW = params["Grid Width"] || 6;
        const gridH = params["Grid Height"] || 6;
        const ribbonWidth = params["Ribbon Width"] || 8.0;
        const cornerRadius = params["Corner Radius"] || 0.3;
        const seed = params["Seed"] || 42;
        const breakProb = params["Break Probability"] || 0.3;
        const numColors = params["Colors"] || 2;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);
        const rand = new SeededRandom(seed);

        const margin = Math.min(width, height) * 0.08;
        const cellW = (width - 2 * margin) / gridW;
        const cellH = (height - 2 * margin) / gridH;

        // Build crossing grid
        // Each cell diagonal has a crossing direction: / or \
        const crossings = [];
        for (let y = 0; y < gridH; y++) {
            crossings[y] = [];
            for (let x = 0; x < gridW; x++) {
                crossings[y][x] = {
                    type: rand.nextDouble() < 0.5 ? 'forward' : 'backward', // / or \
                    broken: rand.nextDouble() < breakProb
                };
            }
        }

        // Draw the weave pattern
        // For each cell, draw two curved paths crossing over each other
        let pathIndex = 0;
        for (let gy = 0; gy < gridH; gy++) {
            for (let gx = 0; gx < gridW; gx++) {
                const cx = margin + gx * cellW;
                const cy = margin + gy * cellH;
                const crossing = crossings[gy][gx];

                const layerOver = pathIndex % numColors;
                const layerUnder = (pathIndex + 1) % numColors;
                pathIndex++;

                if (crossing.type === 'forward') {
                    // / crossing: bottom-left to top-right goes OVER
                    this.drawCurve(canvas, cx, cy + cellH, cx + cellW, cy, cellW, cellH, cornerRadius, ribbonWidth, layerOver, true);
                    // top-left to bottom-right goes UNDER
                    this.drawCurve(canvas, cx, cy, cx + cellW, cy + cellH, cellW, cellH, cornerRadius, ribbonWidth, layerUnder, false);
                } else {
                    // \ crossing: top-left to bottom-right goes OVER
                    this.drawCurve(canvas, cx, cy, cx + cellW, cy + cellH, cellW, cellH, cornerRadius, ribbonWidth, layerOver, true);
                    // bottom-left to top-right goes UNDER
                    this.drawCurve(canvas, cx, cy + cellH, cx + cellW, cy, cellW, cellH, cornerRadius, ribbonWidth, layerUnder, false);
                }

                // Draw cell border connections
                this.drawConnectors(canvas, cx, cy, cellW, cellH, ribbonWidth, layerOver);
            }
        }

        // Draw border frame
        const borderLayer = 0;
        const bx = margin - ribbonWidth;
        const by = margin - ribbonWidth;
        const bw = width - 2 * margin + 2 * ribbonWidth;
        const bh = height - 2 * margin + 2 * ribbonWidth;
        canvas.addRaw(borderLayer, `<rect x='${bx.toFixed(2)}' y='${by.toFixed(2)}' width='${bw.toFixed(2)}' height='${bh.toFixed(2)}' rx='${(ribbonWidth * 2).toFixed(2)}' />`);

        return canvas.toSvg();
    }

    drawCurve(canvas, x1, y1, x2, y2, cellW, cellH, cornerRadius, ribbonWidth, layer, isOver) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        // Draw as a bezier curve
        const cr = cornerRadius * Math.min(cellW, cellH);
        const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        canvas.addRaw(layer, `<path d='${d}' />`);

        // Draw parallel lines for ribbon effect
        const dx = y2 - y1;
        const dy = -(x2 - x1);
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = (dx / len) * ribbonWidth * 0.5;
        const ny = (dy / len) * ribbonWidth * 0.5;

        const d1 = `M ${(x1 + nx).toFixed(2)} ${(y1 + ny).toFixed(2)} Q ${(mx + nx).toFixed(2)} ${(my + ny).toFixed(2)} ${(x2 + nx).toFixed(2)} ${(y2 + ny).toFixed(2)}`;
        const d2 = `M ${(x1 - nx).toFixed(2)} ${(y1 - ny).toFixed(2)} Q ${(mx - nx).toFixed(2)} ${(my - ny).toFixed(2)} ${(x2 - nx).toFixed(2)} ${(y2 - ny).toFixed(2)}`;

        canvas.addRaw(layer, `<path d='${d1}' />`);
        canvas.addRaw(layer, `<path d='${d2}' />`);
    }

    drawConnectors(canvas, cx, cy, cellW, cellH, ribbonWidth, layer) {
        // Small tick marks at cell midpoints to show weave connections
        const half = ribbonWidth * 0.3;

        // Top edge midpoint
        const topMidX = cx + cellW / 2;
        canvas.addLine(layer, topMidX - half, cy, topMidX + half, cy);

        // Left edge midpoint
        const leftMidY = cy + cellH / 2;
        canvas.addLine(layer, cx, leftMidY - half, cx, leftMidY + half);
    }
}
