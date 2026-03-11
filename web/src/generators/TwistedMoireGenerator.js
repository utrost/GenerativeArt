import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class TwistedMoireGenerator extends Generator {
    getId() {
        return "twisted_moire";
    }

    getDisplayName() {
        return "Twisted Moiré";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Subtle Shift", "Vortex", "Offset Swirl", "Dense Interference"], "Select a predefined style"),
            ParameterDefinition.integer("lineCount", 80, 10, 500, "Number of vertical lines"),
            ParameterDefinition.doubleVal("twistStrength", 5.0, -20.0, 20.0, "Strength of the spiral twist"),
            ParameterDefinition.doubleVal("centerX", 0.5, 0.0, 1.0, "Center X of the twist (0-1)"),
            ParameterDefinition.doubleVal("centerY", 0.5, 0.0, 1.0, "Center Y of the twist (0-1)"),
            ParameterDefinition.doubleVal("layer2Rotation", 2.0, -180.0, 180.0, "Rotation offset for the second layer (degrees)")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Subtle Shift":
                    currentValues["lineCount"] = 100;
                    currentValues["twistStrength"] = 2.0;
                    currentValues["centerX"] = 0.5;
                    currentValues["centerY"] = 0.5;
                    currentValues["layer2Rotation"] = 1.5;
                    return true;
                case "Vortex":
                    currentValues["lineCount"] = 150;
                    currentValues["twistStrength"] = 15.0;
                    currentValues["centerX"] = 0.5;
                    currentValues["centerY"] = 0.5;
                    currentValues["layer2Rotation"] = 5.0;
                    return true;
                case "Offset Swirl":
                    currentValues["lineCount"] = 80;
                    currentValues["twistStrength"] = 8.0;
                    currentValues["centerX"] = 0.3;
                    currentValues["centerY"] = 0.7;
                    currentValues["layer2Rotation"] = -3.0;
                    return true;
                case "Dense Interference":
                    currentValues["lineCount"] = 200;
                    currentValues["twistStrength"] = 4.0;
                    currentValues["centerX"] = 0.5;
                    currentValues["centerY"] = 0.5;
                    currentValues["layer2Rotation"] = 0.5;
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
        const lineCount = params["lineCount"] || 80;
        const twistStrength = params["twistStrength"] !== undefined ? params["twistStrength"] : 5.0;
        const centerXRel = params["centerX"] !== undefined ? params["centerX"] : 0.5;
        const centerYRel = params["centerY"] !== undefined ? params["centerY"] : 0.5;
        const layer2Rotation = params["layer2Rotation"] !== undefined ? params["layer2Rotation"] : 2.0;

        const width = params["width"] || 800; // Defaulting to something reasonable if not set
        const height = params["height"] || 600;

        // Force 2 layers for Moire effect
        const canvas = new SvgCanvas(width, height, 2);

        const cx = width * centerXRel;
        const cy = height * centerYRel;
        const maxDist = Math.max(width, height) * 0.8;

        // Layer 0: Base Grid
        this.generateTwistedGrid(canvas, 0, width, height, lineCount, twistStrength, cx, cy, maxDist, 0);

        // Layer 1: Rotated Grid
        this.generateTwistedGrid(canvas, 1, width, height, lineCount, twistStrength, cx, cy, maxDist, layer2Rotation * Math.PI / 180);

        return canvas.toSvg();
    }

    generateTwistedGrid(canvas, layerIndex, width, height, lineCount, twistStrength, cx, cy, maxDist, baseRotation) {
        const step = width / lineCount;
        const pointsPerLine = 200;

        for (let i = 0; i <= lineCount; i++) {
            const xBase = i * step;
            let pathData = "";
            let firstPoint = true;

            for (let j = 0; j <= pointsPerLine; j++) {
                const yBase = (height * j) / pointsPerLine;

                const dx = xBase - cx;
                const dy = yBase - cy;

                // Rotate
                const rotX = dx * Math.cos(baseRotation) - dy * Math.sin(baseRotation);
                const rotY = dx * Math.sin(baseRotation) + dy * Math.cos(baseRotation);

                const distance = Math.sqrt(rotX * rotX + rotY * rotY);
                const angle = Math.atan2(rotY, rotX);

                let twistFactor = Math.max(0, (maxDist - distance) / maxDist);
                twistFactor = Math.pow(twistFactor, 2);

                const targetAngle = angle + twistStrength * twistFactor;

                const finalX = cx + Math.cos(targetAngle) * distance;
                const finalY = cy + Math.sin(targetAngle) * distance;

                if (firstPoint) {
                    pathData += `M ${finalX.toFixed(2)} ${finalY.toFixed(2)}`;
                    firstPoint = false;
                } else {
                    pathData += ` L ${finalX.toFixed(2)} ${finalY.toFixed(2)}`;
                }
            }
            canvas.addPath(layerIndex, `<path d='${pathData}' fill='none' />`);
        }
    }
}
