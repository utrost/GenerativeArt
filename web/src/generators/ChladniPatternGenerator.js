import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class ChladniPatternGenerator extends Generator {
    getId() {
        return "chladni-pattern";
    }

    getDisplayName() {
        return "Chladni Patterns";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Square Plate Mode (3,2)", "Circular Drum", "High Frequency", "Simple Cross"], "Select a predefined style"),
            ParameterDefinition.integer("M", 3, 1, 12, "Horizontal mode number"),
            ParameterDefinition.integer("N", 2, 1, 12, "Vertical mode number"),
            ParameterDefinition.doubleVal("Threshold", 0.05, 0.01, 0.3, "Nodal line thickness (lower = thinner lines)"),
            ParameterDefinition.integer("Resolution", 300, 50, 500, "Grid resolution for contour extraction"),
            ParameterDefinition.integer("Contour Levels", 8, 1, 20, "Number of displacement contour lines"),
            ParameterDefinition.bool("Show Nodal Lines Only", false, "Show only the zero-displacement nodal lines"),
            ParameterDefinition.integer("Colors", 2, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            switch (newValue) {
                case "Square Plate Mode (3,2)":
                    currentValues["M"] = 3;
                    currentValues["N"] = 2;
                    currentValues["Threshold"] = 0.05;
                    currentValues["Resolution"] = 300;
                    currentValues["Contour Levels"] = 8;
                    currentValues["Show Nodal Lines Only"] = false;
                    currentValues["Colors"] = 2;
                    return true;
                case "Circular Drum":
                    currentValues["M"] = 5;
                    currentValues["N"] = 3;
                    currentValues["Threshold"] = 0.04;
                    currentValues["Resolution"] = 300;
                    currentValues["Contour Levels"] = 10;
                    currentValues["Show Nodal Lines Only"] = false;
                    currentValues["Colors"] = 2;
                    return true;
                case "High Frequency":
                    currentValues["M"] = 8;
                    currentValues["N"] = 7;
                    currentValues["Threshold"] = 0.03;
                    currentValues["Resolution"] = 400;
                    currentValues["Contour Levels"] = 5;
                    currentValues["Show Nodal Lines Only"] = true;
                    currentValues["Colors"] = 1;
                    return true;
                case "Simple Cross":
                    currentValues["M"] = 2;
                    currentValues["N"] = 1;
                    currentValues["Threshold"] = 0.06;
                    currentValues["Resolution"] = 250;
                    currentValues["Contour Levels"] = 12;
                    currentValues["Show Nodal Lines Only"] = false;
                    currentValues["Colors"] = 2;
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
        const m = params["M"] || 3;
        const n = params["N"] || 2;
        const threshold = params["Threshold"] || 0.05;
        const resolution = params["Resolution"] || 300;
        const contourLevels = params["Contour Levels"] || 8;
        const nodalOnly = params["Show Nodal Lines Only"] || false;
        const numColors = params["Colors"] || 2;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);

        // Build Chladni field: cos(m*pi*x)*cos(n*pi*y) - cos(n*pi*x)*cos(m*pi*y)
        const cellW = width / resolution;
        const cellH = height / resolution;
        const field = [];

        for (let iy = 0; iy <= resolution; iy++) {
            field[iy] = [];
            for (let ix = 0; ix <= resolution; ix++) {
                const x = ix / resolution;
                const y = iy / resolution;
                const val = Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y)
                          - Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y);
                field[iy][ix] = val;
            }
        }

        if (nodalOnly) {
            // Draw only nodal lines (where field ≈ 0)
            const segments = this.marchingSquares(field, resolution, resolution, cellW, cellH, 0);
            const paths = this.connectSegments(segments);
            for (const path of paths) {
                if (path.length < 2) continue;
                let d = `M ${path[0].x.toFixed(2)} ${path[0].y.toFixed(2)}`;
                for (let i = 1; i < path.length; i++) {
                    d += ` L ${path[i].x.toFixed(2)} ${path[i].y.toFixed(2)}`;
                }
                canvas.addRaw(0, `<path d='${d}' />`);
            }
        } else {
            // Draw multiple contour levels
            const maxVal = 2.0;
            for (let c = 0; c < contourLevels; c++) {
                const level = -maxVal + (2 * maxVal * c) / (contourLevels - 1);
                const layerIndex = c % numColors;
                const segments = this.marchingSquares(field, resolution, resolution, cellW, cellH, level);
                const paths = this.connectSegments(segments);
                for (const path of paths) {
                    if (path.length < 2) continue;
                    let d = `M ${path[0].x.toFixed(2)} ${path[0].y.toFixed(2)}`;
                    for (let i = 1; i < path.length; i++) {
                        d += ` L ${path[i].x.toFixed(2)} ${path[i].y.toFixed(2)}`;
                    }
                    canvas.addRaw(layerIndex, `<path d='${d}' />`);
                }
            }
        }

        return canvas.toSvg();
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
