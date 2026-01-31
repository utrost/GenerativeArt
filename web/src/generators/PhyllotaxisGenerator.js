import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class PhyllotaxisGenerator extends Generator {
    getId() {
        return "phyllotaxis";
    }

    getDisplayName() {
        return "Phyllotaxis (Sunflowers)";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("Dot Count", 500, 100, 5000, "Number of seeds/dots"),
            ParameterDefinition.doubleVal("Spread (c)", 6.0, 2.0, 20.0, "Spacing between dots"),
            ParameterDefinition.doubleVal("Dot Size", 2.0, 0.5, 10.0, "Size of each dot"),
            ParameterDefinition.doubleVal("Angle Offset", 0.0, 0.0, 360.0, "Deviation from Golden Angle"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    generate(params) {
        const count = params["Dot Count"] || 500;
        const c = params["Spread (c)"] || 6.0;
        const size = params["Dot Size"] || 2.0;
        const angleOffset = params["Angle Offset"] || 0.0;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;
        const centerX = width / 2;
        const centerY = height / 2;

        const canvas = new SvgCanvas(width, height, numColors);
        const goldenAngle = 137.5;

        for (let n = 0; n < count; n++) {
            const a = n * (goldenAngle + angleOffset);
            const rad = a * Math.PI / 180;
            const r = c * Math.sqrt(n);

            const x = r * Math.cos(rad) + centerX;
            const y = r * Math.sin(rad) + centerY;

            const layerIndex = Math.floor(n / 50) % numColors;

            const circle = `<circle cx='${x.toFixed(2)}' cy='${y.toFixed(2)}' r='${size.toFixed(2)}' />`;
            canvas.addRaw(layerIndex, circle);
        }

        return canvas.toSvg();
    }
}
