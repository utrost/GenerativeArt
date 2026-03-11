import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
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
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Dense Coil", "Sparse Wire", "Long Thread"], "Select a predefined style"),
            ParameterDefinition.integer("Lines", 6000, 500, 20000, "Density of the ribbon"),
            ParameterDefinition.doubleVal("Length (Max T)", 25.0, 5.0, 100.0, "Length of the ribbon"),
            ParameterDefinition.doubleVal("Scale", 2.0, 0.5, 5.0, "Zoom level"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Dense Coil":
                    currentValues["Lines"] = 12000;
                    currentValues["Length (Max T)"] = 50.0;
                    currentValues["Scale"] = 3.0;
                    return true;
                case "Sparse Wire":
                    currentValues["Lines"] = 2000;
                    currentValues["Length (Max T)"] = 15.0;
                    currentValues["Scale"] = 1.5;
                    return true;
                case "Long Thread":
                    currentValues["Lines"] = 8000;
                    currentValues["Length (Max T)"] = 80.0;
                    currentValues["Scale"] = 2.5;
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
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const pathBuilders = Array(numColors).fill("");

        for (let i = 0; i < numLines; i++) {
            const t = (i / numLines) * maxT;

            const p1_3d = this.calculatePathA(t);
            const p2_3d = this.calculatePathB(t);

            const p1 = this.project(p1_3d);
            const p2 = this.project(p2_3d);

            if (p1.x < minX) minX = p1.x;
            if (p1.x > maxX) maxX = p1.x;
            if (p1.y < minY) minY = p1.y;
            if (p1.y > maxY) maxY = p1.y;

            if (p2.x < minX) minX = p2.x;
            if (p2.x > maxX) maxX = p2.x;
            if (p2.y < minY) minY = p2.y;
            if (p2.y > maxY) maxY = p2.y;

            const layerIndex = i % numColors;
            pathBuilders[layerIndex] += `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
        }

        const margin = 50.0;
        let bboxWidth = maxX - minX;
        let bboxHeight = maxY - minY;

        if (bboxWidth <= 0) bboxWidth = 1;
        if (bboxHeight <= 0) bboxHeight = 1;

        const targetScale = Math.min((width - 2 * margin) / bboxWidth, (height - 2 * margin) / bboxHeight);
        const offsetX = (width - bboxWidth * targetScale) / 2.0 - minX * targetScale;
        const offsetY = (height - bboxHeight * targetScale) / 2.0 - minY * targetScale;

        const layerColors = ["black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A"];

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
