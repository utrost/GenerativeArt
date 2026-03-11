import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';
import { createNoise2D } from 'simplex-noise';

export class FlowFieldGenerator extends Generator {
    constructor() {
        super();
        this.df = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
    }

    getId() {
        return "flow-field";
    }

    getDisplayName() {
        return "Flow Field (Perlin)";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Fine Mist", "Turbulent Rivers", "Macro Flow"], "Select a predefined style"),
            ParameterDefinition.integer("Particles", 2000, 100, 10000, "Number of lines to draw"),
            ParameterDefinition.doubleVal("Noise Scale", 0.005, 0.001, 0.05, "Zoom level of the noise"),
            ParameterDefinition.integer("Step Length", 10, 1, 50, "Length of each line segment"),
            ParameterDefinition.integer("Max Steps", 50, 10, 500, "Maximum length of a line"),
            ParameterDefinition.integer("Seed", 12345, 1, 999999, "Random seed"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Fine Mist":
                    currentValues["Particles"] = 8000;
                    currentValues["Noise Scale"] = 0.008;
                    currentValues["Step Length"] = 2;
                    currentValues["Max Steps"] = 200;
                    return true;
                case "Turbulent Rivers":
                    currentValues["Particles"] = 1500;
                    currentValues["Noise Scale"] = 0.02;
                    currentValues["Step Length"] = 15;
                    currentValues["Max Steps"] = 80;
                    return true;
                case "Macro Flow":
                    currentValues["Particles"] = 500;
                    currentValues["Noise Scale"] = 0.001;
                    currentValues["Step Length"] = 25;
                    currentValues["Max Steps"] = 150;
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
        // Parameters
        const numParticles = params["Particles"] || 2000;
        const noiseScale = params["Noise Scale"] || 0.002; // Java default 0.002 vs definition 0.005? Java code had inconsistencies, sticking to params.
        const stepLen = params["Step Length"] || 5;
        const maxSteps = params["Max Steps"] || 50;
        const seed = params["Seed"] || 42;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);
        const prng = new SeededRandom(seed);

        // Setup Noise
        // simplex-noise 4.x: createNoise2D(randomFunc)
        const noise2D = createNoise2D(() => prng.nextDouble());

        // Java: rand for particles
        const rand = new SeededRandom(seed);

        for (let i = 0; i < numParticles; i++) {
            let x = rand.nextDouble() * width;
            let y = rand.nextDouble() * height;

            const layerIndex = i % numColors;

            let pathData = `M ${x.toFixed(1)} ${y.toFixed(1)}`;

            for (let s = 0; s < maxSteps; s++) {
                // Java version: noise returns 0..1
                // Simplex returns -1..1. Normalize it.
                const rawNoise = noise2D(x * noiseScale, y * noiseScale); // -1 to 1
                const normalizedNoise = (rawNoise + 1) / 2; // 0 to 1
                const angle = normalizedNoise * Math.PI * 4;

                const nextX = x + Math.cos(angle) * stepLen;
                const nextY = y + Math.sin(angle) * stepLen;

                pathData += ` L ${nextX.toFixed(2)} ${nextY.toFixed(2)}`;

                x = nextX;
                y = nextY;
            }

            // Append path (using basic string, but SvgCanvas expects specific handling)
            // SvgCanvas.java: addRaw(layerIndex, "<path ... />")
            // SvgCanvas.js: addRaw(layerIndex, content) -> pushes content.
            const pathString = `<path d="${pathData}" fill="none" opacity="0.5" />`;
            canvas.addRaw(layerIndex, pathString);
        }

        return canvas.toSvg();
    }
}
