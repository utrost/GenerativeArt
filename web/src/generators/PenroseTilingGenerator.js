import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class PenroseTilingGenerator extends Generator {
    getId() {
        return "penrose-tiling";
    }

    getDisplayName() {
        return "Penrose Tiling";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Classic Kite & Dart", "Thick Rhombus", "Fine Detail", "Sparse Stars"], "Select a predefined style"),
            ParameterDefinition.selection("Tile Type", "Kite & Dart", ["Kite & Dart", "Rhombus"], "Type of Penrose tiling"),
            ParameterDefinition.integer("Subdivisions", 5, 1, 8, "Number of recursive subdivisions (higher = finer detail)"),
            ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for variations"),
            ParameterDefinition.bool("Show Arcs", false, "Draw matching arcs on tiles"),
            ParameterDefinition.integer("Colors", 2, 1, 6, "Number of plotter layers")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            switch (newValue) {
                case "Classic Kite & Dart":
                    currentValues["Tile Type"] = "Kite & Dart";
                    currentValues["Subdivisions"] = 5;
                    currentValues["Show Arcs"] = false;
                    currentValues["Colors"] = 2;
                    return true;
                case "Thick Rhombus":
                    currentValues["Tile Type"] = "Rhombus";
                    currentValues["Subdivisions"] = 5;
                    currentValues["Show Arcs"] = false;
                    currentValues["Colors"] = 2;
                    return true;
                case "Fine Detail":
                    currentValues["Tile Type"] = "Kite & Dart";
                    currentValues["Subdivisions"] = 7;
                    currentValues["Show Arcs"] = true;
                    currentValues["Colors"] = 3;
                    return true;
                case "Sparse Stars":
                    currentValues["Tile Type"] = "Kite & Dart";
                    currentValues["Subdivisions"] = 4;
                    currentValues["Show Arcs"] = false;
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
        const tileType = params["Tile Type"] || "Kite & Dart";
        const subdivisions = params["Subdivisions"] || 5;
        const seed = params["Seed"] || 42;
        const showArcs = params["Show Arcs"] || false;
        const numColors = params["Colors"] || 2;

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        const canvas = new SvgCanvas(width, height, numColors);
        const rand = new SeededRandom(seed);

        const PHI = (1 + Math.sqrt(5)) / 2;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.max(width, height) * 0.75;

        let triangles = [];

        if (tileType === "Kite & Dart") {
            // Start with a wheel of thin triangles around center
            for (let i = 0; i < 10; i++) {
                const angle1 = (2 * Math.PI * i) / 10;
                const angle2 = (2 * Math.PI * (i + 1)) / 10;
                const p1 = { x: cx, y: cy };
                const p2 = { x: cx + radius * Math.cos(angle1), y: cy + radius * Math.sin(angle1) };
                const p3 = { x: cx + radius * Math.cos(angle2), y: cy + radius * Math.sin(angle2) };

                if (i % 2 === 0) {
                    triangles.push({ type: 0, A: p1, B: p2, C: p3 }); // thin
                } else {
                    triangles.push({ type: 0, A: p1, B: p3, C: p2 }); // thin (reflected)
                }
            }
        } else {
            // Rhombus: start with thick triangles
            for (let i = 0; i < 10; i++) {
                const angle1 = (2 * Math.PI * i) / 10;
                const angle2 = (2 * Math.PI * (i + 1)) / 10;
                const p1 = { x: cx, y: cy };
                const p2 = { x: cx + radius * Math.cos(angle1), y: cy + radius * Math.sin(angle1) };
                const p3 = { x: cx + radius * Math.cos(angle2), y: cy + radius * Math.sin(angle2) };

                if (i % 2 === 0) {
                    triangles.push({ type: 1, A: p1, B: p2, C: p3 }); // thick
                } else {
                    triangles.push({ type: 1, A: p1, B: p3, C: p2 }); // thick (reflected)
                }
            }
        }

        // Subdivide
        for (let s = 0; s < subdivisions; s++) {
            triangles = this.subdivide(triangles, PHI);
        }

        // Draw triangles
        for (const tri of triangles) {
            // Only draw if triangle is at least partially visible
            if (!this.isVisible(tri, width, height)) continue;

            const layerIndex = tri.type % numColors;

            const pathData = `<path d='M ${tri.A.x.toFixed(2)} ${tri.A.y.toFixed(2)} L ${tri.B.x.toFixed(2)} ${tri.B.y.toFixed(2)} L ${tri.C.x.toFixed(2)} ${tri.C.y.toFixed(2)} Z' />`;
            canvas.addRaw(layerIndex, pathData);

            if (showArcs) {
                // Draw small arc at vertex A
                const arcR = this.dist(tri.A, tri.B) * 0.15;
                const arcLayer = (layerIndex + 1) % numColors;
                const arcPath = `<circle cx='${tri.A.x.toFixed(2)}' cy='${tri.A.y.toFixed(2)}' r='${arcR.toFixed(2)}' />`;
                canvas.addRaw(arcLayer, arcPath);
            }
        }

        return canvas.toSvg();
    }

    subdivide(triangles, PHI) {
        const result = [];

        for (const tri of triangles) {
            const { A, B, C } = tri;

            if (tri.type === 0) {
                // Thin triangle (type 0) - Robinson triangle decomposition
                const P = this.lerp(A, B, 1 / PHI);
                result.push({ type: 0, A: C, B: P, C: B });
                result.push({ type: 1, A: P, B: C, C: A });
            } else {
                // Thick triangle (type 1)
                const Q = this.lerp(B, A, 1 / PHI);
                const R = this.lerp(B, C, 1 / PHI);
                result.push({ type: 1, A: R, B: C, C: A });
                result.push({ type: 1, A: Q, B: R, C: B });
                result.push({ type: 0, A: R, B: Q, C: A });
            }
        }

        return result;
    }

    lerp(p1, p2, t) {
        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        };
    }

    dist(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    isVisible(tri, width, height) {
        const margin = 50;
        const pts = [tri.A, tri.B, tri.C];
        for (const p of pts) {
            if (p.x >= -margin && p.x <= width + margin && p.y >= -margin && p.y <= height + margin) {
                return true;
            }
        }
        return false;
    }
}
