import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class ReactionDiffusionGenerator extends Generator {
    constructor() {
        super();
        this.width = 200;
        this.height = 200;
        this.scale = 2;
        this.iterations = 2000;
        this.da = 1.0;
        this.db = 0.5;
        this.f = 0.055;
        this.k = 0.062;
    }

    getId() {
        return "reaction-diffusion";
    }

    getDisplayName() {
        return "Reaction Diffusion (Gray-Scott)";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection("Preset", "Custom", ["Custom", "Coral Growth", "Mitosis", "Mazes", "Moving Spots"], "Select a predefined style"),
            ParameterDefinition.doubleVal("Feed Rate", 0.055, 0.01, 0.1, "Feed rate (f)"),
            ParameterDefinition.doubleVal("Kill Rate", 0.062, 0.01, 0.1, "Kill rate (k)"),
            ParameterDefinition.integer("Iterations", 2000, 1000, 20000, "Simulation steps; higher values are slower and best triggered with Generate"),
            ParameterDefinition.doubleVal("Threshold", 0.25, 0.1, 0.9, "Start iso-contour threshold"),
            ParameterDefinition.integer("Scale", 2, 1, 5, "Output scale"),
            ParameterDefinition.integer("Colors", 1, 1, 6, "Number of layers (contours)")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Coral Growth":
                    currentValues["Feed Rate"] = 0.0545;
                    currentValues["Kill Rate"] = 0.062;
                    currentValues["Iterations"] = 10000;
                    currentValues["Threshold"] = 0.3;
                    currentValues["Scale"] = 2;
                    currentValues["Colors"] = 2;
                    return true;
                case "Mitosis":
                    currentValues["Feed Rate"] = 0.0367;
                    currentValues["Kill Rate"] = 0.0649;
                    currentValues["Iterations"] = 8000;
                    currentValues["Threshold"] = 0.25;
                    currentValues["Scale"] = 2;
                    currentValues["Colors"] = 1;
                    return true;
                case "Mazes":
                    currentValues["Feed Rate"] = 0.029;
                    currentValues["Kill Rate"] = 0.057;
                    currentValues["Iterations"] = 10000;
                    currentValues["Threshold"] = 0.2;
                    currentValues["Scale"] = 2;
                    currentValues["Colors"] = 1;
                    return true;
                case "Moving Spots":
                    currentValues["Feed Rate"] = 0.014;
                    currentValues["Kill Rate"] = 0.054;
                    currentValues["Iterations"] = 12000;
                    currentValues["Threshold"] = 0.4;
                    currentValues["Scale"] = 3;
                    currentValues["Colors"] = 3;
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
        // Read Params
        this.f = params["Feed Rate"] || 0.055;
        this.k = params["Kill Rate"] || 0.062;
        this.iterations = params["Iterations"] || 8000;
        const startThreshold = params["Threshold"] || 0.25;
        this.scale = params["Scale"] || 2;
        const numColors = params["Colors"] || 1;

        const totalW = this.width * this.scale;
        const totalH = this.height * this.scale;

        // Run Simulation
        const sim = new Simulation(this.width, this.height, this.da, this.db, this.f, this.k);
        sim.run(this.iterations);

        const canvas = new SvgCanvas(totalW, totalH, numColors);

        // Generate contours
        for (let i = 0; i < numColors; i++) {
            let threshold = startThreshold + (i * 0.05);
            if (threshold >= 1.0) threshold = 0.99;

            const paths = MarchingSquares.vectorize(sim.b, this.width, this.height, threshold);

            // Group transform logic
            const groupContent = `<g transform='scale(${this.scale})'>\n` +
                `<path d='${paths}' fill='none' stroke-width='1.5' stroke-linecap='round' />\n` +
                `</g>`;

            canvas.addRaw(i, groupContent);
        }

        return canvas.toSvg();
    }
}

class Simulation {
    constructor(w, h, da, db, f, k) {
        this.w = w;
        this.h = h;
        this.da = da;
        this.db = db;
        this.f = f;
        this.k = k;

        const size = w * h;
        this.a = new Float64Array(size);
        this.b = new Float64Array(size);
        this.nextA = new Float64Array(size);
        this.nextB = new Float64Array(size);

        // Init
        for (let i = 0; i < size; i++) {
            this.a[i] = 1.0;
            this.b[i] = 0.0;
        }

        // Seed
        const seedRadius = 15;
        const centerX = Math.floor(w / 2);
        const centerY = Math.floor(h / 2);
        for (let i = centerX - seedRadius; i < centerX + seedRadius; i++) {
            for (let j = centerY - seedRadius; j < centerY + seedRadius; j++) {
                this.b[i + j * w] = 1.0;
            }
        }
    }

    run(steps) {
        const center = -1.0;
        const adj = 0.2;
        const diag = 0.05;
        const DT = 1.0;

        for (let t = 0; t < steps; t++) {
            for (let x = 1; x < this.w - 1; x++) {
                for (let y = 1; y < this.h - 1; y++) {
                    const i = x + y * this.w;
                    const u = this.a[i];
                    const v = this.b[i];

                    const lu = (this.a[i - 1] * adj) + (this.a[i + 1] * adj) + (this.a[i - this.w] * adj) + (this.a[i + this.w] * adj) +
                        (this.a[i - this.w - 1] * diag) + (this.a[i - this.w + 1] * diag) + (this.a[i + this.w - 1] * diag) + (this.a[i + this.w + 1] * diag) +
                        (u * center);

                    const lv = (this.b[i - 1] * adj) + (this.b[i + 1] * adj) + (this.b[i - this.w] * adj) + (this.b[i + this.w] * adj) +
                        (this.b[i - this.w - 1] * diag) + (this.b[i - this.w + 1] * diag) + (this.b[i + this.w - 1] * diag) + (this.b[i + this.w + 1] * diag) +
                        (v * center);

                    const reaction = u * v * v;

                    let nextValA = u + (this.da * lu - reaction + this.f * (1 - u)) * DT;
                    let nextValB = v + (this.db * lv + reaction - (this.k + this.f) * v) * DT;

                    // Clamp
                    if (nextValA < 0) nextValA = 0;
                    else if (nextValA > 1) nextValA = 1;

                    if (nextValB < 0) nextValB = 0;
                    else if (nextValB > 1) nextValB = 1;

                    this.nextA[i] = nextValA;
                    this.nextB[i] = nextValB;
                }
            }

            // Swap
            let temp = this.a;
            this.a = this.nextA;
            this.nextA = temp;

            temp = this.b;
            this.b = this.nextB;
            this.nextB = temp;
        }
    }
}

class MarchingSquares {
    static vectorize(data, w, h, threshold) {
        let path = "";

        for (let y = 0; y < h - 1; y++) {
            for (let x = 0; x < w - 1; x++) {
                const i = x + y * w;
                let state = 0;

                if (data[i] > threshold) state |= 8;
                if (data[i + 1] > threshold) state |= 4;
                if (data[i + w + 1] > threshold) state |= 2;
                if (data[i + w] > threshold) state |= 1;

                if (state === 0 || state === 15) continue;

                const topX = x + 0.5, topY = y;
                const rightX = x + 1, rightY = y + 0.5;
                const botX = x + 0.5, botY = y + 1;
                const leftX = x, leftY = y + 0.5;

                switch (state) {
                    case 1: path += this.line(leftX, leftY, botX, botY); break;
                    case 2: path += this.line(botX, botY, rightX, rightY); break;
                    case 3: path += this.line(leftX, leftY, rightX, rightY); break;
                    case 4: path += this.line(topX, topY, rightX, rightY); break;
                    case 5:
                        path += this.line(leftX, leftY, topX, topY);
                        path += this.line(botX, botY, rightX, rightY);
                        break;
                    case 6: path += this.line(topX, topY, botX, botY); break;
                    case 7: path += this.line(leftX, leftY, topX, topY); break;
                    case 8: path += this.line(leftX, leftY, topX, topY); break;
                    case 9: path += this.line(topX, topY, botX, botY); break;
                    case 10:
                        path += this.line(topX, topY, rightX, rightY);
                        path += this.line(botX, botY, leftX, leftY);
                        break;
                    case 11: path += this.line(topX, topY, rightX, rightY); break;
                    case 12: path += this.line(leftX, leftY, rightX, rightY); break;
                    case 13: path += this.line(botX, botY, rightX, rightY); break;
                    case 14: path += this.line(leftX, leftY, botX, botY); break;
                }
            }
        }
        return path;
    }

    static line(x1, y1, x2, y2) {
        return `M ${x1} ${y1} L ${x2} ${y2} `;
    }
}
