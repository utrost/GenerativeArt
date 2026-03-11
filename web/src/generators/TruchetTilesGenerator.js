import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class TruchetTilesGenerator extends Generator {
    getId() {
        return "truchet-tiles";
    }

    getDisplayName() {
        return "Truchet Tiles";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Classic Curves", "Dense Maze", "Large Blocks"], "Select a predefined style"),
            ParameterDefinition.integer("Rows", 20, 5, 100, "Number of rows"),
            ParameterDefinition.integer("Columns", 20, 5, 100, "Number of columns"),
            ParameterDefinition.bool("Curved", true, "Use arcs (true) or lines (false)"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Classic Curves":
                    currentValues["Rows"] = 20;
                    currentValues["Columns"] = 20;
                    currentValues["Curved"] = true;
                    currentValues["Colors"] = 1;
                    return true;
                case "Dense Maze":
                    currentValues["Rows"] = 50;
                    currentValues["Columns"] = 50;
                    currentValues["Curved"] = false;
                    currentValues["Colors"] = 2;
                    return true;
                case "Large Blocks":
                    currentValues["Rows"] = 10;
                    currentValues["Columns"] = 10;
                    currentValues["Curved"] = true;
                    currentValues["Colors"] = 4;
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
        const rows = params["Rows"] || 20;
        const cols = params["Columns"] || 20;
        const curved = params["Curved"] !== undefined ? params["Curved"] : true;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);
        const rand = new SeededRandom(12345);

        const tileSizeX = width / cols;
        const tileSizeY = height / rows;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = x * tileSizeX;
                const py = y * tileSizeY;

                // Random orientation
                const type = rand.nextInt(2); // 0 or 1

                const layerIndex = (x + y) % numColors;

                if (curved) {
                    let svg = "";
                    const r = tileSizeX / 2;
                    if (type === 0) {
                        // Top-Left and Bottom-Right
                        svg += this.svgArc(px, py, r, 0, 90);
                        svg += this.svgArc(px + tileSizeX, py + tileSizeY, r, 180, 270);
                    } else {
                        // Top-Right and Bottom-Left
                        svg += this.svgArc(px + tileSizeX, py, r, 90, 180);
                        svg += this.svgArc(px, py + tileSizeY, r, 270, 360);
                    }
                    canvas.addRaw(layerIndex, svg);
                } else {
                    if (type === 0) {
                        canvas.addLine(layerIndex, px, py, px + tileSizeX, py + tileSizeY);
                    } else {
                        canvas.addLine(layerIndex, px + tileSizeX, py, px, py + tileSizeY);
                    }
                }
            }
        }

        return canvas.toSvg();
    }

    svgArc(cx, cy, r, startAngle, endAngle) {
        const startRad = startAngle * Math.PI / 180;
        const endRad = endAngle * Math.PI / 180;

        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);

        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        // sweep-flag 1 for clockwise (assuming SVG coord system where Y is down, angles increase clockwise? 
        // No, in standard math 0 is Right, 90 is UP. In SVG 0 is Right, 90 is DOWN.
        // So positive angle increase is clockwise in SVG.
        // My angles 0->90 is Right to Down. Correct.
        return `<path d='M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}' fill='none' />`;
    }
}
