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
            ParameterDefinition.selection("waveform", "Square", ["Square", "Triangle", "Sawtooth"], "Waveform type"),
            ParameterDefinition.integer("lineCount", 20, 1, 100, "Number of lines"),
            ParameterDefinition.doubleVal("amplitude", 50.0, 1.0, 200.0, "Wave amplitude"),
            ParameterDefinition.doubleVal("frequency", 2.0, 0.1, 20.0, "Cycles per width"),
            ParameterDefinition.doubleVal("verticalSpacing", 20.0, 5.0, 100.0, "Vertical spacing")
        ];
    }

    generate(params) {
        const waveform = params["waveform"] || "Square";
        const lineCount = params["lineCount"] || 20;
        const amplitude = params["amplitude"] || 50.0;
        const frequency = params["frequency"] || 2.0;
        const verticalSpacing = params["verticalSpacing"] || 20.0;

        const width = 800;
        const height = Math.max(600, (lineCount + 2) * verticalSpacing);

        const canvas = new SvgCanvas(width, height, 1);
        canvas.setStrokeWidth(1.5);

        const startY = 50.0;

        for (let i = 0; i < lineCount; i++) {
            const terms = i + 1;
            const yBase = startY + i * verticalSpacing;

            let path = "";
            const steps = 1000;
            let first = true;

            for (let s = 0; s <= steps; s++) {
                const x = (s / steps) * width;
                const theta = (s / steps) * 2 * Math.PI * frequency;

                const val = this.calculateFourierSum(waveform, terms, theta);
                const y = yBase + val * amplitude;

                if (first) {
                    path += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
                    first = false;
                } else {
                    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
                }
            }

            canvas.addRaw(0, `<path d='${path}' fill='none' stroke='var(--accent-color)' stroke-width='1.5' />`);
        }

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
