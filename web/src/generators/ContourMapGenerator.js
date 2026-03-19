import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

export class ContourMapGenerator extends Generator {
    getId() {
        return "contour-map";
    }

    getDisplayName() {
        return "Contour Map";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Mountain Range", "Rolling Hills", "Island Archipelago", "Canyon Ridges"], "Select a predefined style"),
            ParameterDefinition.integer("Contour Lines", 25, 5, 60, "Number of elevation contour lines"),
            ParameterDefinition.doubleVal("Scale", 3.0, 0.5, 10.0, "Noise scale (higher = more zoomed in features)"),
            ParameterDefinition.integer("Octaves", 4, 1, 8, "Noise octaves for terrain complexity"),
            ParameterDefinition.doubleVal("Persistence", 0.5, 0.1, 0.9, "How much each octave contributes"),
            ParameterDefinition.integer("Resolution", 250, 50, 400, "Grid resolution for contour extraction"),
            ParameterDefinition.bool("Major Lines", true, "Draw thicker lines every 5th contour"),
            ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for terrain generation"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            switch (newValue) {
                case "Mountain Range":
                    currentValues["Contour Lines"] = 30;
                    currentValues["Scale"] = 3.0;
                    currentValues["Octaves"] = 5;
                    currentValues["Persistence"] = 0.5;
                    currentValues["Resolution"] = 300;
                    currentValues["Major Lines"] = true;
                    currentValues["Colors"] = 1;
                    return true;
                case "Rolling Hills":
                    currentValues["Contour Lines"] = 15;
                    currentValues["Scale"] = 2.0;
                    currentValues["Octaves"] = 3;
                    currentValues["Persistence"] = 0.6;
                    currentValues["Resolution"] = 250;
                    currentValues["Major Lines"] = true;
                    currentValues["Colors"] = 1;
                    return true;
                case "Island Archipelago":
                    currentValues["Contour Lines"] = 20;
                    currentValues["Scale"] = 4.0;
                    currentValues["Octaves"] = 4;
                    currentValues["Persistence"] = 0.45;
                    currentValues["Resolution"] = 300;
                    currentValues["Major Lines"] = true;
                    currentValues["Colors"] = 2;
                    return true;
                case "Canyon Ridges":
                    currentValues["Contour Lines"] = 40;
                    currentValues["Scale"] = 5.0;
                    currentValues["Octaves"] = 6;
                    currentValues["Persistence"] = 0.55;
                    currentValues["Resolution"] = 350;
                    currentValues["Major Lines"] = true;
                    currentValues["Colors"] = 1;
                    return true;
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
        const numContours = params["Contour Lines"] || 25;
        const scale = params["Scale"] || 3.0;
        const octaves = params["Octaves"] || 4;
        const persistence = params["Persistence"] || 0.5;
        const resolution = params["Resolution"] || 250;
        const majorLines = params["Major Lines"] !== undefined ? params["Major Lines"] : true;
        const seed = params["Seed"] || 42;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);

        // Create noise function
        const prng = alea(seed);
        const noise2D = createNoise2D(prng);

        // Build terrain height field using fractal noise
        const cellW = width / resolution;
        const cellH = height / resolution;
        const field = [];
        let minVal = Infinity;
        let maxVal = -Infinity;

        for (let iy = 0; iy <= resolution; iy++) {
            field[iy] = [];
            for (let ix = 0; ix <= resolution; ix++) {
                const nx = (ix / resolution) * scale;
                const ny = (iy / resolution) * scale;

                let val = 0;
                let amp = 1;
                let freq = 1;
                let maxAmp = 0;

                for (let o = 0; o < octaves; o++) {
                    val += amp * noise2D(nx * freq, ny * freq);
                    maxAmp += amp;
                    amp *= persistence;
                    freq *= 2;
                }

                val /= maxAmp; // Normalize to [-1, 1]
                field[iy][ix] = val;

                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }
        }

        // Extract contour lines
        const defaultStrokeWidth = canvas.strokeWidth;

        for (let c = 0; c < numContours; c++) {
            const t = c / (numContours - 1);
            const level = minVal + t * (maxVal - minVal);
            const isMajor = majorLines && (c % 5 === 0);
            const layerIndex = c % numColors;

            if (isMajor) {
                canvas.setStrokeWidth(defaultStrokeWidth * 2.0);
            } else {
                canvas.setStrokeWidth(defaultStrokeWidth * 0.7);
            }

            const segments = this.marchingSquares(field, resolution, resolution, cellW, cellH, level);
            const paths = this.connectSegments(segments);

            for (const path of paths) {
                if (path.length < 2) continue;
                // Simplify path with Douglas-Peucker
                const simplified = this.simplifyPath(path, cellW * 0.3);
                let d = `M ${simplified[0].x.toFixed(2)} ${simplified[0].y.toFixed(2)}`;
                for (let i = 1; i < simplified.length; i++) {
                    d += ` L ${simplified[i].x.toFixed(2)} ${simplified[i].y.toFixed(2)}`;
                }

                // Use raw SVG with specific stroke-width for major/minor distinction
                if (isMajor) {
                    canvas.addRaw(layerIndex, `<path d='${d}' stroke-width='${(defaultStrokeWidth * 2.0).toFixed(2)}' />`);
                } else {
                    canvas.addRaw(layerIndex, `<path d='${d}' stroke-width='${(defaultStrokeWidth * 0.7).toFixed(2)}' />`);
                }
            }
        }

        canvas.setStrokeWidth(defaultStrokeWidth);
        return canvas.toSvg();
    }

    simplifyPath(path, tolerance) {
        if (path.length <= 2) return path;

        let maxDist = 0;
        let maxIndex = 0;

        const first = path[0];
        const last = path[path.length - 1];

        for (let i = 1; i < path.length - 1; i++) {
            const d = this.pointLineDistance(path[i], first, last);
            if (d > maxDist) {
                maxDist = d;
                maxIndex = i;
            }
        }

        if (maxDist > tolerance) {
            const left = this.simplifyPath(path.slice(0, maxIndex + 1), tolerance);
            const right = this.simplifyPath(path.slice(maxIndex), tolerance);
            return left.slice(0, -1).concat(right);
        }

        return [first, last];
    }

    pointLineDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);

        const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;
        return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
    }

    marchingSquares(field, nx, ny, cellW, cellH, level) {
        const segments = [];

        for (let iy = 0; iy < ny; iy++) {
            for (let ix = 0; ix < nx; ix++) {
                const v0 = field[iy][ix];
                const v1 = field[iy][ix + 1];
                const v2 = field[iy + 1][ix + 1];
                const v3 = field[iy + 1][ix];

                const b0 = v0 >= level ? 1 : 0;
                const b1 = v1 >= level ? 1 : 0;
                const b2 = v2 >= level ? 1 : 0;
                const b3 = v3 >= level ? 1 : 0;

                const caseIndex = b0 | (b1 << 1) | (b2 << 2) | (b3 << 3);
                if (caseIndex === 0 || caseIndex === 15) continue;

                const x0 = ix * cellW;
                const y0 = iy * cellH;
                const x1 = (ix + 1) * cellW;
                const y1 = (iy + 1) * cellH;

                const interp = (va, vb, a, b) => {
                    const t = (level - va) / (vb - va);
                    return a + t * (b - a);
                };

                const top = { x: interp(v0, v1, x0, x1), y: y0 };
                const right = { x: x1, y: interp(v1, v2, y0, y1) };
                const bottom = { x: interp(v3, v2, x0, x1), y: y1 };
                const left = { x: x0, y: interp(v0, v3, y0, y1) };

                const addSeg = (a, b) => segments.push({ a, b });

                switch (caseIndex) {
                    case 1: addSeg(top, left); break;
                    case 2: addSeg(top, right); break;
                    case 3: addSeg(left, right); break;
                    case 4: addSeg(right, bottom); break;
                    case 5: addSeg(top, right); addSeg(left, bottom); break;
                    case 6: addSeg(top, bottom); break;
                    case 7: addSeg(left, bottom); break;
                    case 8: addSeg(left, bottom); break;
                    case 9: addSeg(top, bottom); break;
                    case 10: addSeg(top, left); addSeg(right, bottom); break;
                    case 11: addSeg(right, bottom); break;
                    case 12: addSeg(left, right); break;
                    case 13: addSeg(top, right); break;
                    case 14: addSeg(top, left); break;
                }
            }
        }

        return segments;
    }

    connectSegments(segments) {
        if (segments.length === 0) return [];

        const paths = [];
        const used = new Array(segments.length).fill(false);
        const EPS = 0.5;

        const near = (p1, p2) => Math.abs(p1.x - p2.x) < EPS && Math.abs(p1.y - p2.y) < EPS;

        for (let i = 0; i < segments.length; i++) {
            if (used[i]) continue;
            used[i] = true;

            const path = [segments[i].a, segments[i].b];
            let changed = true;

            while (changed) {
                changed = false;
                for (let j = 0; j < segments.length; j++) {
                    if (used[j]) continue;
                    const seg = segments[j];
                    const last = path[path.length - 1];
                    const first = path[0];

                    if (near(last, seg.a)) {
                        path.push(seg.b); used[j] = true; changed = true;
                    } else if (near(last, seg.b)) {
                        path.push(seg.a); used[j] = true; changed = true;
                    } else if (near(first, seg.a)) {
                        path.unshift(seg.b); used[j] = true; changed = true;
                    } else if (near(first, seg.b)) {
                        path.unshift(seg.a); used[j] = true; changed = true;
                    }
                }
            }

            paths.push(path);
        }

        return paths;
    }
}
