export class SvgCanvas {
    constructor(width, height, numLayers) {
        this.width = width;
        this.height = height;
        this.layers = [];
        for (let i = 0; i < numLayers; i++) {
            this.layers.push([]);
        }
        // Standard plotter colors matching Java version
        this.layerColors = ["black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A"];
        this.strokeWidth = 1.0;
    }

    setStrokeWidth(width) {
        this.strokeWidth = width;
    }

    addPath(layerIndex, pathData) {
        if (layerIndex >= 0 && layerIndex < this.layers.length) {
            this.layers[layerIndex].push(pathData);
        }
    }

    addLine(layerIndex, x1, y1, x2, y2) {
        this.addPath(layerIndex, `<line x1='${x1.toFixed(2)}' y1='${y1.toFixed(2)}' x2='${x2.toFixed(2)}' y2='${y2.toFixed(2)}' />`);
    }

    addRaw(layerIndex, content) {
        this.addPath(layerIndex, content);
    }

    toSvg() {
        let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${this.width.toFixed(1)} ${this.height.toFixed(1)}' width='${this.width.toFixed(1)}' height='${this.height.toFixed(1)}'>\n`;
        svg += `  <defs><clipPath id='pageClip'><rect width='${this.width.toFixed(1)}' height='${this.height.toFixed(1)}'/></clipPath></defs>\n`;
        svg += `  <rect width='${this.width.toFixed(1)}' height='${this.height.toFixed(1)}' fill='white'/>\n`;

        for (let i = 0; i < this.layers.length; i++) {
            const color = this.layerColors[i % this.layerColors.length];
            svg += `  <g id='layer_${i + 1}' stroke='${color}' fill='none' stroke-width='${this.strokeWidth.toFixed(2)}' clip-path='url(#pageClip)'>\n`;
            svg += this.layers[i].join('\n');
            svg += `\n  </g>\n`;
        }
        svg += `</svg>`;
        return svg;
    }
}
