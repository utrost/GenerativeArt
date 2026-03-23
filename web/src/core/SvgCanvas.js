const LINE_RE = /x1='([\d.-]+)'\s*y1='([\d.-]+)'\s*x2='([\d.-]+)'\s*y2='([\d.-]+)'/;
const PATH_D_RE = /d='([^']*)'/;
const COORD_RE = /([\d.-]+)[,\s]+([\d.-]+)/g;

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
            const optimized = optimizeLayer(this.layers[i]);
            svg += optimized.join('\n');
            svg += `\n  </g>\n`;
        }
        svg += `</svg>`;
        return svg;
    }
}

// --- Path optimization for pen plotters ---

function distSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

/** Extract [startX, startY, endX, endY] from a line or path element, or null if unparseable. */
function getEndpoints(element) {
    const lineMatch = element.match(LINE_RE);
    if (lineMatch) {
        return [
            parseFloat(lineMatch[1]), parseFloat(lineMatch[2]),
            parseFloat(lineMatch[3]), parseFloat(lineMatch[4])
        ];
    }

    const pathMatch = element.match(PATH_D_RE);
    if (pathMatch) {
        const d = pathMatch[1];
        const re = new RegExp(COORD_RE.source, 'g');
        let m;
        let startX, startY, endX, endY;
        let found = false;
        while ((m = re.exec(d)) !== null) {
            const x = parseFloat(m[1]);
            const y = parseFloat(m[2]);
            if (!found) {
                startX = x;
                startY = y;
                found = true;
            }
            endX = x;
            endY = y;
        }
        if (found) {
            return [startX, startY, endX, endY];
        }
    }

    return null;
}

/** Reverse a <line> element by swapping x1,y1 with x2,y2. */
function reverseLine(element) {
    const m = element.match(LINE_RE);
    if (!m) return element;
    return element.substring(0, m.index)
        + element.substring(m.index, m.index + m[0].length)
            .replace(LINE_RE, `x1='${m[3]}' y1='${m[4]}' x2='${m[1]}' y2='${m[2]}'`)
        + element.substring(m.index + m[0].length);
}

/** Reverse a <path> element by reversing its coordinate sequence. */
function reversePath(element) {
    const dm = element.match(PATH_D_RE);
    if (!dm) return element;

    const d = dm[1];
    const re = new RegExp(COORD_RE.source, 'g');
    const coords = [];
    let m;
    while ((m = re.exec(d)) !== null) {
        coords.push([m[1], m[2]]);
    }

    if (coords.length < 2) return element;

    coords.reverse();
    let newD = `M ${coords[0][0]},${coords[0][1]}`;
    for (let i = 1; i < coords.length; i++) {
        newD += ` L ${coords[i][0]},${coords[i][1]}`;
    }

    const dStart = dm.index + dm[0].indexOf(dm[1]);
    const dEnd = dStart + dm[1].length;
    return element.substring(0, dStart) + newD + element.substring(dEnd);
}

/** Reverse an SVG element (line or path). */
function reverseElement(element) {
    const trimmed = element.trim();
    if (trimmed.startsWith('<line')) return reverseLine(element);
    if (trimmed.startsWith('<path')) return reversePath(element);
    return element;
}

/** Reorder elements using nearest-neighbor to minimize pen travel distance. */
function optimizeLayer(elements) {
    if (elements.length <= 1) return [...elements];

    const n = elements.length;
    const starts = new Array(n);
    const ends = new Array(n);
    const parseable = new Array(n).fill(false);
    const parseableIndices = [];
    const rawIndices = [];

    for (let i = 0; i < n; i++) {
        const coords = getEndpoints(elements[i]);
        if (coords) {
            starts[i] = [coords[0], coords[1]];
            ends[i] = [coords[2], coords[3]];
            parseable[i] = true;
            parseableIndices.push(i);
        } else {
            rawIndices.push(i);
        }
    }

    if (parseableIndices.length === 0) return [...elements];

    const result = [];
    const used = new Array(n).fill(false);
    let curX = 0, curY = 0;

    for (let step = 0; step < parseableIndices.length; step++) {
        let bestDist = Infinity;
        let bestIdx = -1;
        let bestReverse = false;

        for (const idx of parseableIndices) {
            if (used[idx]) continue;

            const dStart = distSq(curX, curY, starts[idx][0], starts[idx][1]);
            const dEnd = distSq(curX, curY, ends[idx][0], ends[idx][1]);

            if (dStart < bestDist) {
                bestDist = dStart;
                bestIdx = idx;
                bestReverse = false;
            }
            if (dEnd < bestDist) {
                bestDist = dEnd;
                bestIdx = idx;
                bestReverse = true;
            }
        }

        used[bestIdx] = true;

        if (bestReverse) {
            result.push(reverseElement(elements[bestIdx]));
            curX = starts[bestIdx][0];
            curY = starts[bestIdx][1];
        } else {
            result.push(elements[bestIdx]);
            curX = ends[bestIdx][0];
            curY = ends[bestIdx][1];
        }
    }

    for (const idx of rawIndices) {
        result.push(elements[idx]);
    }

    return result;
}
