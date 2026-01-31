import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class MagneticFieldGenerator extends Generator {
    getId() {
        return "magnetic_field";
    }

    getDisplayName() {
        return "Magnetic Field";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("lineCount", 500, 50, 2000, "Number of field lines"),
            ParameterDefinition.doubleVal("lineWidth", 1.0, 0.1, 10.0, "Line Width"),
            ParameterDefinition.integer("colorCount", 3, 1, 6, "Number of Colors"),
            ParameterDefinition.integer("poleCount", 2, 1, 10, "Number of Magnetic Poles"),
            ParameterDefinition.doubleVal("stepSize", 5.0, 1.0, 20.0, "Integration Step Size"),
            ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed")
        ];
    }

    generate(params) {
        const lineCount = params["lineCount"] || 500;
        const lineWidth = params["lineWidth"] || 1.0;
        const colorCount = params["colorCount"] || 3;
        const poleCount = params["poleCount"] || 2;
        const stepSize = params["stepSize"] || 5.0;
        const seed = params["seed"] || 1234;

        const width = params["width"] || 800;
        const height = params["height"] || 600;

        const canvas = new SvgCanvas(width, height, colorCount);
        // stroke width handling if supported by SvgCanvas or apply globally

        const rand = new SeededRandom(seed);

        const poles = [];
        const margin = 200;
        for (let i = 0; i < poleCount; i++) {
            const x = margin + rand.nextDouble() * (width - 2 * margin);
            const y = margin + rand.nextDouble() * (height - 2 * margin);
            const charge = -1000.0 - rand.nextDouble() * 2000.0;
            poles.push({ x, y, charge });
        }

        const startPoints = [];
        const perimeter = 2 * (width + height);
        for (let i = 0; i < lineCount; i++) {
            const d = rand.nextDouble() * perimeter;
            if (d < width) {
                startPoints.push({ x: d, y: 0 });
            } else if (d < width + height) {
                startPoints.push({ x: width, y: d - width });
            } else if (d < 2 * width + height) {
                startPoints.push({ x: 2 * width + height - d, y: height });
            } else {
                startPoints.push({ x: 0, y: perimeter - d });
            }
        }

        for (let i = 0; i < lineCount; i++) {
            const start = startPoints[i];
            const layerIndex = i % colorCount;
            this.traceLine(canvas, layerIndex, start, poles, width, height, stepSize);
        }

        return canvas.toSvg();
    }

    traceLine(canvas, layer, start, poles, width, height, stepSize) {
        let pathData = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
        let x = start.x;
        let y = start.y;
        const maxSteps = 1000;

        for (let step = 0; step < maxSteps; step++) {
            let vx = 0;
            let vy = 0;
            let minDist = Number.MAX_VALUE;

            for (const pole of poles) {
                const dx = pole.x - x;
                const dy = pole.y - y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                if (dist < minDist) minDist = dist;

                const strength = 5000.0 / (distSq + 100);
                vx += (dx / dist) * strength;
                vy += (dy / dist) * strength;
            }

            if (minDist < 10.0) break;

            const vMag = Math.sqrt(vx * vx + vy * vy);
            if (vMag === 0) break;

            x += (vx / vMag) * stepSize;
            y += (vy / vMag) * stepSize;

            if (x < 0 || x > width || y < 0 || y > height) {
                // optional boundary check
            }

            pathData += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
        }

        canvas.addRaw(layer, `<path d='${pathData}' fill='none' stroke-width='1' />`);
    }
}
