import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class WaveInterferenceGenerator extends Generator {
    getId() {
        return "wave-interference";
    }

    getDisplayName() {
        return "Wave Interference";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Two Sources", "Triple Point", "Ripple Pool", "Standing Wave"], "Select a predefined style"),
            ParameterDefinition.integer("Sources", 3, 1, 8, "Number of wave sources"),
            ParameterDefinition.doubleVal("Wavelength", 30.0, 5.0, 100.0, "Distance between wave crests"),
            ParameterDefinition.doubleVal("Amplitude", 1.0, 0.1, 3.0, "Wave strength"),
            ParameterDefinition.integer("Contour Lines", 20, 5, 50, "Number of interference contour lines"),
            ParameterDefinition.doubleVal("Line Spacing", 0.3, 0.05, 1.0, "Spacing between contour levels"),
            ParameterDefinition.integer("Resolution", 200, 50, 400, "Grid resolution for marching squares"),
            ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for source positions"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            switch (newValue) {
                case "Two Sources":
                    currentValues["Sources"] = 2;
                    currentValues["Wavelength"] = 40.0;
                    currentValues["Amplitude"] = 1.0;
                    currentValues["Contour Lines"] = 20;
                    currentValues["Line Spacing"] = 0.3;
                    currentValues["Resolution"] = 200;
                    return true;
                case "Triple Point":
                    currentValues["Sources"] = 3;
                    currentValues["Wavelength"] = 25.0;
                    currentValues["Amplitude"] = 1.0;
                    currentValues["Contour Lines"] = 25;
                    currentValues["Line Spacing"] = 0.25;
                    currentValues["Resolution"] = 250;
                    return true;
                case "Ripple Pool":
                    currentValues["Sources"] = 5;
                    currentValues["Wavelength"] = 20.0;
                    currentValues["Amplitude"] = 0.8;
                    currentValues["Contour Lines"] = 30;
                    currentValues["Line Spacing"] = 0.2;
                    currentValues["Resolution"] = 300;
                    return true;
                case "Standing Wave":
                    currentValues["Sources"] = 2;
                    currentValues["Wavelength"] = 50.0;
                    currentValues["Amplitude"] = 1.5;
                    currentValues["Contour Lines"] = 15;
                    currentValues["Line Spacing"] = 0.4;
                    currentValues["Resolution"] = 200;
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
        const numSources = params["Sources"] || 3;
        const wavelength = params["Wavelength"] || 30.0;
        const amplitude = params["Amplitude"] || 1.0;
        const numContours = params["Contour Lines"] || 20;
        const lineSpacing = params["Line Spacing"] || 0.3;
        const resolution = params["Resolution"] || 200;
        const seed = params["Seed"] || 42;
        const numColors = params["Colors"] || 1;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);
        const rand = new SeededRandom(seed);

        // Generate wave source positions
        const sources = [];
        const margin = Math.min(width, height) * 0.2;
        for (let i = 0; i < numSources; i++) {
            sources.push({
                x: margin + rand.nextDouble() * (width - 2 * margin),
                y: margin + rand.nextDouble() * (height - 2 * margin)
            });
        }

        // Build scalar field
        const cellW = width / resolution;
        const cellH = height / resolution;
        const field = [];

        for (let iy = 0; iy <= resolution; iy++) {
            field[iy] = [];
            for (let ix = 0; ix <= resolution; ix++) {
                const px = ix * cellW;
                const py = iy * cellH;
                let val = 0;
                for (const src of sources) {
                    const dist = Math.sqrt((px - src.x) ** 2 + (py - src.y) ** 2);
                    val += amplitude * Math.sin((2 * Math.PI * dist) / wavelength);
                }
                field[iy][ix] = val;
            }
        }

        // Extract contour lines using marching squares
        for (let c = 0; c < numContours; c++) {
            const level = (c - numContours / 2) * lineSpacing;
            const layerIndex = c % numColors;
            const segments = this.marchingSquares(field, resolution, resolution, cellW, cellH, level);

            // Connect segments into paths
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

                const interpX = (va, vb, xa, xb) => {
                    const t = (level - va) / (vb - va);
                    return xa + t * (xb - xa);
                };

                // Edge midpoints via interpolation
                const top = { x: interpX(v0, v1, x0, x1), y: y0 };
                const right = { x: x1, y: interpX(v1, v2, y0, y1) };
                const bottom = { x: interpX(v3, v2, x0, x1), y: y1 };
                const left = { x: x0, y: interpX(v0, v3, y0, y1) };

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
                        path.push(seg.b);
                        used[j] = true;
                        changed = true;
                    } else if (near(last, seg.b)) {
                        path.push(seg.a);
                        used[j] = true;
                        changed = true;
                    } else if (near(first, seg.a)) {
                        path.unshift(seg.b);
                        used[j] = true;
                        changed = true;
                    } else if (near(first, seg.b)) {
                        path.unshift(seg.a);
                        used[j] = true;
                        changed = true;
                    }
                }
            }

            paths.push(path);
        }

        return paths;
    }
}
