import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class StrangeAttractorsGenerator extends Generator {
    getId() {
        return "strange-attractors";
    }

    getDisplayName() {
        return "Strange Attractors (Clifford)";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("Iterations", 10000, 1000, 50000, "Number of points"),
            ParameterDefinition.doubleVal("A", 1.5, -3.0, 3.0, "Chaos Parameter A"),
            ParameterDefinition.doubleVal("B", -1.8, -3.0, 3.0, "Chaos Parameter B"),
            ParameterDefinition.doubleVal("C", 1.6, -3.0, 3.0, "Chaos Parameter C"),
            ParameterDefinition.doubleVal("D", 0.9, -3.0, 3.0, "Chaos Parameter D"),
            ParameterDefinition.doubleVal("Scale", 200.0, 50.0, 500.0, "Zoom level"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    generate(params) {
        const iterations = params["Iterations"] || 10000;
        const a = params["A"] !== undefined ? params["A"] : 1.5;
        const b = params["B"] !== undefined ? params["B"] : -1.8;
        const c = params["C"] !== undefined ? params["C"] : 1.6;
        const d = params["D"] !== undefined ? params["D"] : 0.9;
        const scale = params["Scale"] || 200.0;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;
        const centerX = width / 2;
        const centerY = height / 2;

        const canvas = new SvgCanvas(width, height, numColors);

        let x = 0.1;
        let y = 0.1;

        // Skip first 20 to settle
        for (let i = 0; i < 20; i++) {
            const xn = Math.sin(a * y) + c * Math.cos(a * x);
            const yn = Math.sin(b * x) + d * Math.cos(b * y);
            x = xn;
            y = yn;
        }

        let prevX = x * scale + centerX;
        let prevY = y * scale + centerY;
        let first = true;

        const iterPerColor = Math.floor(iterations / numColors) || 1;

        for (let i = 0; i < iterations; i++) {
            const xn = Math.sin(a * y) + c * Math.cos(a * x);
            const yn = Math.sin(b * x) + d * Math.cos(b * y);
            x = xn;
            y = yn;

            const screenX = x * scale + centerX;
            const screenY = y * scale + centerY;

            if (!first) {
                let layerIndex = Math.floor(i / iterPerColor) % numColors;
                if (layerIndex >= numColors) layerIndex = numColors - 1;

                const dist = Math.hypot(screenX - prevX, screenY - prevY);
                if (dist < 100) {
                    canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
                }
            }
            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        return canvas.toSvg();
    }
}
