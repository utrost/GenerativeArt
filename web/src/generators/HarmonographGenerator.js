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
        const centerX = width / 2;
        const centerY = height / 2;

        const canvas = new SvgCanvas(width, height, numColors);

        let prevX = 0;
        let prevY = 0;
        let first = true;

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

            const screenX = centerX + x;
            const screenY = centerY + y;

            if (!first) {
                const layerIndex = Math.floor(i / 500) % numColors;
                canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
            }

            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        return canvas.toSvg();
    }
}
