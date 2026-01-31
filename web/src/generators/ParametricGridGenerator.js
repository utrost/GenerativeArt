import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class ParametricGridGenerator extends Generator {
    getId() {
        return "parametric_grid";
    }

    getDisplayName() {
        return "Parametric Grid";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("macroSize", 5, 2, 20, "Macro Grid Size (blocks)"),
            ParameterDefinition.integer("microSize", 10, 2, 30, "Micro Grid Size (squares per block)"),
            ParameterDefinition.doubleVal("maxRotation", 45.0, 0.0, 180.0, "Max Chaos Rotation (degrees)"),
            ParameterDefinition.doubleVal("minScale", 0.2, 0.0, 1.0, "Min Scale at bottom"),
            ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed")
        ];
    }

    generate(params) {
        const macroSize = params["macroSize"] || 5;
        const microSize = params["microSize"] || 10;
        const maxRotation = params["maxRotation"] !== undefined ? params["maxRotation"] : 45.0;
        const minScale = params["minScale"] !== undefined ? params["minScale"] : 0.2;
        const seed = params["seed"] || 1234;

        const width = params["width"] || 800;
        const height = params["height"] || 800;

        const canvas = new SvgCanvas(width, height, 1);
        const rand = new SeededRandom(seed);

        const macroCellW = width / macroSize;
        const macroCellH = height / macroSize;

        for (let r = 0; r < macroSize; r++) {
            for (let c = 0; c < macroSize; c++) {
                let macroXFactor = c / (macroSize - 1);
                let macroYFactor = r / (macroSize - 1);
                if (macroSize === 1) {
                    macroXFactor = 0;
                    macroYFactor = 0;
                }

                const chaosRange = macroXFactor * maxRotation;
                const scaleBase = 1.0 - (macroYFactor * (1.0 - minScale));

                this.drawMicroGrid(canvas, r, c, macroCellW, macroCellH, microSize, chaosRange, scaleBase, rand);
            }
        }

        return canvas.toSvg();
    }

    drawMicroGrid(canvas, macroRow, macroCol, w, h, microSize, chaosRange, scale, rand) {
        const startX = macroCol * w;
        const startY = macroRow * h;

        const cellW = w / microSize;
        const cellH = h / microSize;
        const padding = cellW * 0.1;
        const sqSize = (cellW - padding * 2) * scale;

        for (let r = 0; r < microSize; r++) {
            for (let c = 0; c < microSize; c++) {
                const cx = startX + c * cellW + cellW / 2.0;
                const cy = startY + r * cellH + cellH / 2.0;

                const rotDeg = (rand.nextDouble() * 2 - 1) * chaosRange;
                const rotRad = rotDeg * Math.PI / 180;

                this.drawRotatedSquare(canvas, cx, cy, sqSize, rotRad);
            }
        }
    }

    drawRotatedSquare(canvas, cx, cy, size, angleRad) {
        const half = size / 2.0;
        const x = [-half, half, half, -half];
        const y = [-half, -half, half, half];

        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);

        const rx = [];
        const ry = [];

        for (let i = 0; i < 4; i++) {
            rx[i] = cx + (x[i] * cosA - y[i] * sinA);
            ry[i] = cy + (x[i] * sinA + y[i] * cosA);
        }

        for (let i = 0; i < 4; i++) {
            const next = (i + 1) % 4;
            canvas.addLine(0, rx[i], ry[i], rx[next], ry[next]);
        }
    }
}
