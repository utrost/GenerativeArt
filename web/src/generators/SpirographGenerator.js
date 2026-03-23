import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class SpirographGenerator extends Generator {
    getId() {
        return "spirograph";
    }

    getDisplayName() {
        return "Spirograph";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Hypotrochoid Classic", "Star Pattern", "Epitrochoid Loops", "Complex Web"], "Select a predefined style"),
            ParameterDefinition.selection("Type", "Hypotrochoid (Inside)", ["Hypotrochoid (Inside)", "Epitrochoid (Outside)", "Gear Chain"], "Curve Type"),
            ParameterDefinition.doubleVal("Outer Radius (R)", 300.0, 10.0, 500.0, "Fixed Circle Radius"),
            ParameterDefinition.doubleVal("Inner Radius (r)", 105.0, 1.0, 500.0, "Rolling Circle Radius"),
            ParameterDefinition.doubleVal("Pen Offset (d)", 80.0, 0.0, 500.0, "Dist from Inner Center"),
            ParameterDefinition.doubleVal("Revolutions", 50.0, 1.0, 500.0, "Inner Rotations"),
            ParameterDefinition.doubleVal("Resolution", 0.05, 0.001, 1.0, "Step Size"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of Layers"),
            // Gear Chain specific parameters
            ParameterDefinition.integer("Chain Length", 3, 2, 20, "Number of Gears (Chain Mode)"),
            ParameterDefinition.doubleVal("Size Decay", 0.7, 0.1, 1.2, "Size Multiplier per Gear"),
            ParameterDefinition.selection("Gear Configuration", "Exponential Decay", ["Exponential Decay", "Big-Big-Small", "Big-Small-Big"], "Arrangement of Gears"),
            ParameterDefinition.selection("Connection", "Alternating", ["Alternating", "All Outside", "All Inside", "Random"], "Gear Connection Type"),
            ParameterDefinition.integer("Seed", 1, 0, 1000, "Random Seed for Ratios")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Hypotrochoid Classic":
                    currentValues["Type"] = "Hypotrochoid (Inside)";
                    currentValues["Outer Radius (R)"] = 300.0;
                    currentValues["Inner Radius (r)"] = 105.0;
                    currentValues["Pen Offset (d)"] = 80.0;
                    currentValues["Revolutions"] = 50.0;
                    return true;
                case "Star Pattern":
                    currentValues["Type"] = "Hypotrochoid (Inside)";
                    currentValues["Outer Radius (R)"] = 300.0;
                    currentValues["Inner Radius (r)"] = 85.0;
                    currentValues["Pen Offset (d)"] = 120.0;
                    currentValues["Revolutions"] = 17.0;
                    return true;
                case "Epitrochoid Loops":
                    currentValues["Type"] = "Epitrochoid (Outside)";
                    currentValues["Outer Radius (R)"] = 200.0;
                    currentValues["Inner Radius (r)"] = 55.0;
                    currentValues["Pen Offset (d)"] = 90.0;
                    currentValues["Revolutions"] = 11.0;
                    return true;
                case "Complex Web":
                    currentValues["Type"] = "Hypotrochoid (Inside)";
                    currentValues["Outer Radius (R)"] = 350.0;
                    currentValues["Inner Radius (r)"] = 160.0;
                    currentValues["Pen Offset (d)"] = 140.0;
                    currentValues["Revolutions"] = 32.0;
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
        const type = params["Type"] || "Hypotrochoid (Inside)";
        const revolutions = params["Revolutions"] || 50.0;
        const resolution = params["Resolution"] || 0.05;
        const numColors = params["Colors"] || 1;

        const width = 1000;
        const height = 1000;

        if (type === "Gear Chain") {
            return this.generateGearChain(params, resolution, revolutions, numColors, width, height);
        } else {
            return this.generateClassic(params, type, resolution, revolutions, numColors, width, height);
        }
    }

    buildFinalSvg(pathBuilders, numColors, width, height, minX, maxX, minY, maxY) {
        const layerColors = ["black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A"];
        const margin = 50.0;
        let bboxWidth = maxX - minX;
        let bboxHeight = maxY - minY;

        if (bboxWidth <= 0) bboxWidth = 1;
        if (bboxHeight <= 0) bboxHeight = 1;

        const targetScale = Math.min((width - 2 * margin) / bboxWidth, (height - 2 * margin) / bboxHeight);
        const offsetX = (width - bboxWidth * targetScale) / 2.0 - minX * targetScale;
        const offsetY = (height - bboxHeight * targetScale) / 2.0 - minY * targetScale;

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

    generateClassic(params, type, resolution, revolutions, numColors, width, height) {
        const isHypo = type.includes("Hypo");
        const R = params["Outer Radius (R)"] || 300.0;
        const r = params["Inner Radius (r)"] || 105.0;
        const d = params["Pen Offset (d)"] || 80.0;

        const maxT = revolutions * 2 * Math.PI;
        let prevX = 0;
        let prevY = 0;
        let first = true;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const pathBuilders = Array(numColors).fill("");

        for (let t = 0; t <= maxT; t += resolution) {
            let x, y;
            if (isHypo) {
                x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
                y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
            } else {
                x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
                y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
            }

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (!first) {
                const layerIndex = Math.floor(t) % numColors;
                pathBuilders[layerIndex] += `M ${prevX.toFixed(2)} ${prevY.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)} `;
            }

            prevX = x;
            prevY = y;
            first = false;
        }

        return this.buildFinalSvg(pathBuilders, numColors, width, height, minX, maxX, minY, maxY);
    }

    generateGearChain(params, resolution, revolutions, numColors, width, height) {
        const chainLength = params["Chain Length"] || 3;
        const baseRadius = params["Outer Radius (R)"] || 300.0;
        const decay = params["Size Decay"] || 0.7;
        const connection = params["Connection"] || "Alternating";
        const seed = params["Seed"] || 1;

        const rng = new SeededRandom(seed);

        const radii = new Array(chainLength);
        const speeds = new Array(chainLength);
        const phases = new Array(chainLength);

        const gearConfig = params["Gear Configuration"] || "Exponential Decay";

        let currentR = baseRadius;
        for (let i = 0; i < chainLength; i++) {
            if (gearConfig === "Big-Big-Small") {
                const pos = i % 3;
                if (pos === 0) radii[i] = baseRadius;
                else if (pos === 1) radii[i] = baseRadius * 0.9;
                else radii[i] = baseRadius * 0.1;
            } else if (gearConfig === "Big-Small-Big") {
                const pos = i % 3;
                if (pos === 0) radii[i] = baseRadius;
                else if (pos === 1) radii[i] = baseRadius * 0.2;
                else radii[i] = baseRadius * 0.8;
            } else {
                radii[i] = currentR;
                currentR *= decay;
            }

            if (i === 0) {
                speeds[i] = 1.0;
            } else {
                const num = rng.nextInt(5) + 1;
                const den = rng.nextInt(5) + 1;
                const ratio = num / den;

                let flip = true;

                if (connection === "All Inside") {
                    flip = false;
                } else if (connection === "Random") {
                    flip = rng.nextInt(2) === 0;
                }

                const direction = flip ? -1.0 : 1.0;
                speeds[i] = speeds[i - 1] * (1.0 + ratio * direction);
            }
            phases[i] = rng.nextDouble() * 2 * Math.PI;
        }

        const maxT = revolutions * 2 * Math.PI;
        let prevX = 0;
        let prevY = 0;
        let first = true;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const pathBuilders = Array(numColors).fill("");

        for (let t = 0; t <= maxT; t += resolution) {
            let x = 0;
            let y = 0;

            for (let i = 0; i < chainLength; i++) {
                x += radii[i] * Math.cos(speeds[i] * t + phases[i]);
                y += radii[i] * Math.sin(speeds[i] * t + phases[i]);
            }

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (!first) {
                const layerIndex = Math.floor(t) % numColors;
                pathBuilders[layerIndex] += `M ${prevX.toFixed(2)} ${prevY.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)} `;
            }
            prevX = x;
            prevY = y;
            first = false;
        }

        return this.buildFinalSvg(pathBuilders, numColors, width, height, minX, maxX, minY, maxY);
    }
}
