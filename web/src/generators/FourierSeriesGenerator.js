import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class FourierSeriesGenerator extends Generator {
    getId() {
        return "fourier-series";
    }

    getDisplayName() {
        return "Fourier Series";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Square Wave Form", "Triangle Mesh", "Sawtooth Density"], "Select a predefined style"),
            ParameterDefinition.selection("waveform", "Square", ["Square", "Triangle", "Sawtooth"], "Waveform type"),
            ParameterDefinition.integer("lineCount", 20, 1, 100, "Number of lines"),
            ParameterDefinition.doubleVal("amplitude", 50.0, 1.0, 200.0, "Wave amplitude"),
            ParameterDefinition.doubleVal("frequency", 2.0, 0.1, 20.0, "Cycles per width"),
            ParameterDefinition.doubleVal("verticalSpacing", 20.0, 5.0, 100.0, "Vertical spacing")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Square Wave Form":
                    currentValues["waveform"] = "Square";
                    currentValues["lineCount"] = 20;
                    currentValues["amplitude"] = 50.0;
                    currentValues["frequency"] = 2.0;
                    currentValues["verticalSpacing"] = 20.0;
                    return true;
                case "Triangle Mesh":
                    currentValues["waveform"] = "Triangle";
                    currentValues["lineCount"] = 40;
                    currentValues["amplitude"] = 80.0;
                    currentValues["frequency"] = 1.5;
                    currentValues["verticalSpacing"] = 10.0;
                    return true;
                case "Sawtooth Density":
                    currentValues["waveform"] = "Sawtooth";
                    currentValues["lineCount"] = 60;
                    currentValues["amplitude"] = 30.0;
                    currentValues["frequency"] = 3.0;
                    currentValues["verticalSpacing"] = 15.0;
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
        const waveform = params["waveform"] || "Square";
        const lineCount = params["lineCount"] || 20;
        const amplitude = params["amplitude"] || 50.0;
        const frequency = params["frequency"] || 2.0;
        const verticalSpacing = params["verticalSpacing"] || 20.0;

        const targetWidth = params["width"] || 1000;
        const targetHeight = params["height"] || 1000;

        const genWidth = 800;
        const startY = 50.0;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const paths = [];

        for (let i = 0; i < lineCount; i++) {
            const terms = i + 1;
            const yBase = startY + i * verticalSpacing;

            let path = "";
            const steps = 1000;
            let first = true;

            for (let s = 0; s <= steps; s++) {
                const x = (s / steps) * genWidth;
                const theta = (s / steps) * 2 * Math.PI * frequency;

                const val = this.calculateFourierSum(waveform, terms, theta);
                const y = yBase + val * amplitude;

                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;

                if (first) {
                    path += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
                    first = false;
                } else {
                    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
                }
            }

            paths.push(`<path d='${path}' fill='none' stroke='var(--accent-color)' stroke-width='1.5' vector-effect='non-scaling-stroke' />`);
        }

        const margin = 50.0;
        let bboxWidth = maxX - minX;
        let bboxHeight = maxY - minY;

        if (bboxWidth <= 0) bboxWidth = 1;
        if (bboxHeight <= 0) bboxHeight = 1;

        const scale = Math.min((targetWidth - 2 * margin) / bboxWidth, (targetHeight - 2 * margin) / bboxHeight);
        const offsetX = (targetWidth - bboxWidth * scale) / 2.0 - minX * scale;
        const offsetY = (targetHeight - bboxHeight * scale) / 2.0 - minY * scale;

        const canvas = new SvgCanvas(targetWidth, targetHeight, 1);
        canvas.setStrokeWidth(1.5);
        canvas.addRaw(0, `<g transform='translate(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}) scale(${scale.toFixed(4)})'>`);
        for (const p of paths) {
            canvas.addRaw(0, p);
        }
        canvas.addRaw(0, "</g>");

        return canvas.toSvg();
    }

    calculateFourierSum(type, terms, theta) {
        let sum = 0;
        const lowerType = type.toLowerCase();

        if (lowerType.includes("square")) {
            // Square wave: sum_{k=1,3,5...} sin(kx)/k
            for (let j = 1; j <= terms; j++) {
                const k = 2 * j - 1;
                sum += Math.sin(k * theta) / k;
            }
        } else if (lowerType.includes("triangle")) {
            // Triangle wave: sum_{k=1,3,5...} (-1)^((k-1)/2) * sin(kx) / k^2
            for (let j = 1; j <= terms; j++) {
                const k = 2 * j - 1;
                const sign = ((j - 1) % 2 === 0) ? 1.0 : -1.0;
                sum += sign * Math.sin(k * theta) / (k * k);
            }
        } else if (lowerType.includes("sawtooth")) {
            // Sawtooth: sum_{k=1,2,3...} (-1)^(k+1) * sin(kx) / k
            for (let k = 1; k <= terms; k++) {
                const sign = ((k + 1) % 2 === 0) ? 1.0 : -1.0;
                sum += sign * Math.sin(k * theta) / k;
            }
        } else {
            sum = Math.sin(theta);
        }

        return sum;
    }
}
