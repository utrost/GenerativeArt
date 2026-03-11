import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class HarmonographGenerator extends Generator {
    getId() {
        return "harmonograph";
    }

    getDisplayName() {
        return "Harmonograph (Lateral & Rotary)";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Classic Rotary", "Complex Lateral", "Dense Web"], "Select a predefined style"),
            ParameterDefinition.bool("Rotary Mode", true, "Switch between Lateral and Rotary"),
            ParameterDefinition.integer("Steps", 10000, 1000, 100000, "Number of points"),
            ParameterDefinition.doubleVal("Frequency 1", 3.00, 0.1, 20.0, "Freq 1 (or X1)"),
            ParameterDefinition.doubleVal("Frequency 2", 3.01, 0.1, 20.0, "Freq 2 (or X2)"),
            ParameterDefinition.doubleVal("Frequency 3", 2.00, 0.1, 20.0, "Freq 3 (or Y1 - Lateral Only)"),
            ParameterDefinition.doubleVal("Frequency 4", 2.01, 0.1, 20.0, "Freq 4 (or Y2 - Lateral Only)"),
            ParameterDefinition.doubleVal("Amplitude 1", 200.0, 10.0, 500.0, "Amplitude 1"),
            ParameterDefinition.doubleVal("Amplitude 2", 200.0, 10.0, 500.0, "Amplitude 2"),
            ParameterDefinition.doubleVal("Phase 1", 90.0, 0.0, 360.0, "Phase 1 (Degrees)"),
            ParameterDefinition.doubleVal("Phase 2", 0.0, 0.0, 360.0, "Phase 2 (Degrees)"),
            ParameterDefinition.doubleVal("Damping", 0.001, 0.0, 0.01, "Decay Rate"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of Layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Classic Rotary":
                    currentValues["Rotary Mode"] = true;
                    currentValues["Steps"] = 15000;
                    currentValues["Frequency 1"] = 3.0;
                    currentValues["Frequency 2"] = 3.01;
                    currentValues["Frequency 3"] = 2.0;
                    currentValues["Frequency 4"] = 2.01;
                    currentValues["Amplitude 1"] = 200.0;
                    currentValues["Amplitude 2"] = 200.0;
                    currentValues["Phase 1"] = 90.0;
                    currentValues["Phase 2"] = 0.0;
                    currentValues["Damping"] = 0.001;
                    return true;
                case "Complex Lateral":
                    currentValues["Rotary Mode"] = false;
                    currentValues["Steps"] = 20000;
                    currentValues["Frequency 1"] = 3.0;
                    currentValues["Frequency 2"] = 2.0;
                    currentValues["Frequency 3"] = 2.0;
                    currentValues["Frequency 4"] = 3.0;
                    currentValues["Amplitude 1"] = 250.0;
                    currentValues["Amplitude 2"] = 150.0;
                    currentValues["Phase 1"] = 45.0;
                    currentValues["Phase 2"] = 135.0;
                    currentValues["Damping"] = 0.002;
                    return true;
                case "Dense Web":
                    currentValues["Rotary Mode"] = true;
                    currentValues["Steps"] = 30000;
                    currentValues["Frequency 1"] = 4.0;
                    currentValues["Frequency 2"] = 4.05;
                    currentValues["Frequency 3"] = 2.0;
                    currentValues["Frequency 4"] = 2.0;
                    currentValues["Amplitude 1"] = 300.0;
                    currentValues["Amplitude 2"] = 100.0;
                    currentValues["Phase 1"] = 0.0;
                    currentValues["Phase 2"] = 90.0;
                    currentValues["Damping"] = 0.0005;
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
        const rotary = params["Rotary Mode"] !== undefined ? params["Rotary Mode"] : true;
        const steps = params["Steps"] || 10000;
        const f1 = params["Frequency 1"] || 3.00;
        const f2 = params["Frequency 2"] || 3.01;
        const f3 = params["Frequency 3"] || 2.00;
        const f4 = params["Frequency 4"] || 2.01;
        const a1 = params["Amplitude 1"] || 200.0;
        const a2 = params["Amplitude 2"] || 200.0;
        const p1 = (params["Phase 1"] || 90.0) * Math.PI / 180;
        const p2 = (params["Phase 2"] || 0.0) * Math.PI / 180;
        const d = params["Damping"] !== undefined ? params["Damping"] : 0.001;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;
        let prevX = 0;
        let prevY = 0;
        let first = true;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const pathBuilders = Array(numColors).fill("");

        for (let i = 0; i < steps; i++) {
            const t = i * 0.01;
            const decay = Math.exp(-d * t);
            let x, y;

            if (rotary) {
                x = decay * (a1 * Math.cos(f1 * t + p1) + a2 * Math.cos(f2 * t + p2));
                y = decay * (a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2));
            } else {
                x = decay * (a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2));
                y = decay * (a1 * Math.sin(f3 * t) + a2 * Math.sin(f4 * t));
            }

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (!first) {
                const layerIndex = Math.floor(i / 500) % numColors;
                pathBuilders[layerIndex] += `M ${prevX.toFixed(2)} ${prevY.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)} `;
            }

            prevX = x;
            prevY = y;
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
