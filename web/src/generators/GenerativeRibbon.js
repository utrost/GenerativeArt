import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class GenerativeRibbon extends Generator {
    constructor() {
        super();
        this.NUM_LINES = 6000;
        this.MAX_T = 25.0;
        this.SCALE = 2.0;
        this.currentScale = this.SCALE;
        this.centerX = 500;
        this.centerY = 500;
    }

    getId() {
        return "generative-ribbon";
    }

    getDisplayName() {
        return "Generative Ribbon";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("Lines", 6000, 500, 20000, "Density of the ribbon"),
            ParameterDefinition.doubleVal("Length (Max T)", 25.0, 5.0, 100.0, "Length of the ribbon"),
            ParameterDefinition.doubleVal("Scale", 2.0, 0.5, 5.0, "Zoom level"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    generate(params) {
        const numLines = params["Lines"] || this.NUM_LINES;
        const maxT = params["Length (Max T)"] || this.MAX_T;
        // Default to scale from params or default
        this.currentScale = params["Scale"] !== undefined ? params["Scale"] : this.SCALE;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        this.centerX = width / 2;
        this.centerY = height / 2;

        return this.generateSVG(numLines, maxT, width, height, numColors);
    }

    generateSVG(numLines, maxT, width, height, numColors) {
        const canvas = new SvgCanvas(width, height, numColors);

        for (let i = 0; i < numLines; i++) {
            const t = (i / numLines) * maxT;

            const p1_3d = this.calculatePathA(t);
            const p2_3d = this.calculatePathB(t);

            const p1 = this.project(p1_3d);
            const p2 = this.project(p2_3d);

            const layerIndex = i % numColors;
            canvas.addLine(layerIndex, p1.x, p1.y, p2.x, p2.y);
        }

        return canvas.toSvg();
    }

    calculatePathA(t) {
        const baseX = Math.sin(t * 0.7) * 200;
        const baseY = Math.cos(t * 0.9) * 250;
        const baseZ = Math.sin(t * 0.5) * 200;

        const offsetX = Math.cos(t * 3.1 + 0.5) * 60;
        const offsetY = Math.sin(t * 3.3) * 60;
        const offsetZ = Math.cos(t * 3.7 + 1.0) * 60;

        return {
            x: (baseX + offsetX) * this.currentScale,
            y: (baseY + offsetY) * this.currentScale,
            z: (baseZ + offsetZ) * this.currentScale
        };
    }

    calculatePathB(t) {
        const baseX = Math.sin(t * 0.7) * 200;
        const baseY = Math.cos(t * 0.9) * 250;
        const baseZ = Math.sin(t * 0.5) * 200;

        const offsetX = Math.cos(t * 3.1 + Math.PI) * 70;
        const offsetY = Math.sin(t * 3.3 + Math.PI) * 70;
        const offsetZ = Math.cos(t * 3.7 + Math.PI + 1.0) * 70;

        return {
            x: (baseX + offsetX) * this.currentScale,
            y: (baseY + offsetY) * this.currentScale,
            z: (baseZ + offsetZ) * this.currentScale
        };
    }

    project(p) {
        const perspective = 1000.0 / (1000.0 - p.z);
        const x2d = p.x * perspective + this.centerX;
        const y2d = p.y * perspective + this.centerY;
        return { x: x2d, y: y2d };
    }
}
