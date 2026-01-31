import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class SpirographGenerator extends Generator {
    getId() {
        return "spirograph";
    }

    getDisplayName() {
        return "Spirograph";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Type", "Hypotrochoid (Inside)", ["Hypotrochoid (Inside)", "Epitrochoid (Outside)"], "Curve Type"),
            ParameterDefinition.doubleVal("Outer Radius (R)", 300.0, 10.0, 500.0, "Fixed Circle Radius"),
            ParameterDefinition.doubleVal("Inner Radius (r)", 105.0, 1.0, 500.0, "Rolling Circle Radius"),
            ParameterDefinition.doubleVal("Pen Offset (d)", 80.0, 0.0, 500.0, "Dist from Inner Center"),
            ParameterDefinition.doubleVal("Revolutions", 50.0, 1.0, 500.0, "Inner Rotations"),
            ParameterDefinition.doubleVal("Resolution", 0.05, 0.001, 1.0, "Step Size"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of Layers")
        ];
    }

    generate(params) {
        const type = params["Type"] || "Hypotrochoid (Inside)";
        const isHypo = type.includes("Hypo");

        const R = params["Outer Radius (R)"] || 300.0;
        const r = params["Inner Radius (r)"] || 105.0;
        const d = params["Pen Offset (d)"] || 80.0;
        const revolutions = params["Revolutions"] || 50.0;
        const resolution = params["Resolution"] || 0.05;
        const numColors = params["Colors"] || 1;

        const width = 1000;
        const height = 1000;
        const canvas = new SvgCanvas(width, height, numColors);
        const centerX = width / 2;
        const centerY = height / 2;

        const maxT = revolutions * 2 * Math.PI;

        let prevX = 0;
        let prevY = 0;
        let first = true;

        for (let t = 0; t <= maxT; t += resolution) {
            let x, y;
            if (isHypo) {
                // x = (R - r) * cos(t) + d * cos(((R - r) / r) * t)
                // y = (R - r) * sin(t) - d * sin(((R - r) / r) * t)
                x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
                y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
            } else {
                // x = (R + r) * cos(t) - d * cos(((R + r) / r) * t)
                // y = (R + r) * sin(t) - d * sin(((R + r) / r) * t)
                x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
                y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
            }

            const screenX = centerX + x;
            const screenY = centerY + y;

            if (!first) {
                // Cycle colors? JS % works same as Java for positive ints.
                // t is double.
                const layerIndex = Math.floor(t) % numColors;
                canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
            }

            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        return canvas.toSvg();
    }
}
