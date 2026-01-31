import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class CirclePackingGenerator extends Generator {
    getId() {
        return "circle-packing";
    }

    getDisplayName() {
        return "Circle Packing";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("Attempts", 2000, 100, 10000, "Number of circles to attempt"),
            ParameterDefinition.doubleVal("Min Radius", 2.0, 1.0, 50.0, "Minimum circle size"),
            ParameterDefinition.doubleVal("Max Radius", 50.0, 10.0, 200.0, "Maximum circle size"),
            ParameterDefinition.doubleVal("Padding", 2.0, 0.0, 20.0, "Space between circles"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    generate(params) {
        const attempts = params["Attempts"] || 2000;
        const minR = params["Min Radius"] || 2.0;
        const maxR = params["Max Radius"] || 50.0;
        const padding = params["Padding"] !== undefined ? params["Padding"] : 2.0;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);
        const circles = []; // {x, y, r}
        const rand = new SeededRandom(123); // Fixed seed for now, or add param

        for (let i = 0; i < attempts; i++) {
            const x = rand.nextDouble() * width;
            const y = rand.nextDouble() * height;

            // Check validity
            let valid = true;
            for (const c of circles) {
                if (this.dist(x, y, c.x, c.y) < c.r + minR + padding) {
                    valid = false;
                    break;
                }
            }
            if (!valid) continue;

            // Grow
            let r = maxR;
            for (const c of circles) {
                const d = this.dist(x, y, c.x, c.y);
                r = Math.min(r, d - c.r - padding);
            }

            // Walls
            r = Math.min(r, x - padding);
            r = Math.min(r, width - x - padding);
            r = Math.min(r, y - padding);
            r = Math.min(r, height - y - padding);

            if (r >= minR) {
                circles.push({ x, y, r });

                // Layer logic
                const norm = (r - minR) / (maxR - minR);
                let layerIndex = Math.floor(norm * numColors);
                if (layerIndex >= numColors) layerIndex = numColors - 1;

                // SvgCanvas expects raw svg content
                const circleSvg = `<circle cx='${x.toFixed(2)}' cy='${y.toFixed(2)}' r='${r.toFixed(2)}' />`;
                canvas.addRaw(layerIndex, circleSvg);
            }
        }

        return canvas.toSvg();
    }

    dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
}
