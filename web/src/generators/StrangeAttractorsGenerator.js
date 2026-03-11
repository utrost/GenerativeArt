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
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Classic", "Swirling Web", "Dense Oval", "Twin Galaxies"], "Select a predefined style"),
            ParameterDefinition.integer("Iterations", 10000, 1000, 50000, "Number of points"),
            ParameterDefinition.doubleVal("A", 1.5, -3.0, 3.0, "Chaos Parameter A"),
            ParameterDefinition.doubleVal("B", -1.8, -3.0, 3.0, "Chaos Parameter B"),
            ParameterDefinition.doubleVal("C", 1.6, -3.0, 3.0, "Chaos Parameter C"),
            ParameterDefinition.doubleVal("D", 0.9, -3.0, 3.0, "Chaos Parameter D"),
            ParameterDefinition.doubleVal("Scale", 200.0, 50.0, 500.0, "Zoom level"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Classic":
                    currentValues["Iterations"] = 20000;
                    currentValues["A"] = 1.5;
                    currentValues["B"] = -1.8;
                    currentValues["C"] = 1.6;
                    currentValues["D"] = 0.9;
                    currentValues["Scale"] = 200.0;
                    currentValues["Colors"] = 2;
                    return true;
                case "Swirling Web":
                    currentValues["Iterations"] = 30000;
                    currentValues["A"] = 1.8;
                    currentValues["B"] = 1.9;
                    currentValues["C"] = -1.5;
                    currentValues["D"] = -0.8;
                    currentValues["Scale"] = 200.0;
                    currentValues["Colors"] = 3;
                    return true;
                case "Dense Oval":
                    currentValues["Iterations"] = 25000;
                    currentValues["A"] = -1.4;
                    currentValues["B"] = 1.6;
                    currentValues["C"] = 1.0;
                    currentValues["D"] = 0.7;
                    currentValues["Scale"] = 200.0;
                    currentValues["Colors"] = 1;
                    return true;
                case "Twin Galaxies":
                    currentValues["Iterations"] = 40000;
                    currentValues["A"] = 1.7;
                    currentValues["B"] = 1.7;
                    currentValues["C"] = 0.6;
                    currentValues["D"] = 1.2;
                    currentValues["Scale"] = 200.0;
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
        const iterations = params["Iterations"] || 10000;
        const a = params["A"] !== undefined ? params["A"] : 1.5;
        const b = params["B"] !== undefined ? params["B"] : -1.8;
        const c = params["C"] !== undefined ? params["C"] : 1.6;
        const d = params["D"] !== undefined ? params["D"] : 0.9;
        const scale = params["Scale"] || 200.0;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        let x = 0.1;
        let y = 0.1;

        // Skip first 20 to settle
        for (let i = 0; i < 20; i++) {
            const xn = Math.sin(a * y) + c * Math.cos(a * x);
            const yn = Math.sin(b * x) + d * Math.cos(b * y);
            x = xn;
            y = yn;
        }

        let prevX = x * scale;
        let prevY = y * scale;
        let first = true;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const iterPerColor = Math.floor(iterations / numColors) || 1;
        const pathBuilders = Array(numColors).fill("");

        for (let i = 0; i < iterations; i++) {
            const xn = Math.sin(a * y) + c * Math.cos(a * x);
            const yn = Math.sin(b * x) + d * Math.cos(b * y);
            x = xn;
            y = yn;

            const screenX = x * scale;
            const screenY = y * scale;

            if (screenX < minX) minX = screenX;
            if (screenX > maxX) maxX = screenX;
            if (screenY < minY) minY = screenY;
            if (screenY > maxY) maxY = screenY;

            if (!first) {
                let layerIndex = Math.floor(i / iterPerColor) % numColors;
                if (layerIndex >= numColors) layerIndex = numColors - 1;

                const dist = Math.hypot(screenX - prevX, screenY - prevY);
                if (dist < 100) {
                    pathBuilders[layerIndex] += `M ${prevX.toFixed(2)} ${prevY.toFixed(2)} L ${screenX.toFixed(2)} ${screenY.toFixed(2)} `;
                }
            }
            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        const margin = 50.0;
        let bboxWidth = maxX - minX;
        let bboxHeight = maxY - minY;

        if (bboxWidth <= 0) bboxWidth = 1;
        if (bboxHeight <= 0) bboxHeight = 1;

        const targetScale = Math.min((width - 2 * margin) / bboxWidth, (height - 2 * margin) / bboxHeight);
        const offsetX = (width - bboxWidth * targetScale) / 2.0 - minX * targetScale;
        const offsetY = (height - bboxHeight * targetScale) / 2.0 - minY * targetScale;

        const layerColors = ["black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A"];

        let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' width='${width}' height='${height}'>\n`;
        svg += `<defs><clipPath id='pageClip'><rect width='${width}' height='${height}'/></clipPath></defs>\n`;
        svg += `<rect width='${width}' height='${height}' fill='white'/>\n`;
        svg += `<g clip-path='url(#pageClip)'>\n`;
        svg += `  <g transform='translate(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}) scale(${targetScale.toFixed(4)})'>\n`;
        
        for (let i = 0; i < numColors; i++) {
            if (pathBuilders[i].length > 0) {
                const color = layerColors[i % layerColors.length];
                svg += `    <path d='${pathBuilders[i]}' stroke='${color}' fill='none' stroke-width='1.0' vector-effect='non-scaling-stroke'/>\n`;
            }
        }
        
        svg += `  </g>\n`;
        svg += `</g>\n</svg>`;

        return svg;
    }
}
