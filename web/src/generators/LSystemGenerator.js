import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';

export class LSystemGenerator extends Generator {
    getId() {
        return "l-system";
    }

    getDisplayName() {
        return "L-System Fractal";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("Iterations", 4, 1, 7, "Number of recursion steps"),
            ParameterDefinition.doubleVal("Angle", 90.0, 0.0, 360.0, "Turn angle in degrees"),
            ParameterDefinition.doubleVal("Line Length", 10.0, 1.0, 100.0, "Length of each segment"),
            ParameterDefinition.string("Axiom", "F", "Initial state"),
            ParameterDefinition.string("Rules", "F:F+F-F-F+F", "Production rules")
        ];
    }

    generate(params) {
        const iterations = params["Iterations"] || 4;
        const angle = params["Angle"] || 90.0;
        const length = params["Line Length"] || 10.0;
        const axiom = params["Axiom"] || "F";
        const rulesStr = params["Rules"] || "F:F+F-F-F+F";

        const width = params["width"] || 1000;
        const height = params["height"] || 1000;

        // Parse Rules
        const rules = {};
        rulesStr.split(';').forEach(part => {
            const [k, v] = part.split(':');
            if (k && v) rules[k] = v;
        });

        // Expand
        let current = axiom;
        for (let i = 0; i < iterations; i++) {
            let next = "";
            for (const char of current) {
                next += rules[char] || char;
            }
            current = next;
        }

        // Draw
        let x = width * 0.2;
        let y = height * 0.8;
        let currentAngle = 0; // facing right (0 deg in SVG coord system is right)

        // In Java implementation, 0 angle was implied right?
        // Java: x + cos(rad) * len.

        // Using basic path building manually instead of SvgCanvas because LSystem returns a single path usually
        // But to be consistent let's follow the standard return type.
        // The Java code returns a full Svg string directly, skipping SvgCanvas.

        let pathData = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        const stack = [];

        for (const char of current) {
            if (char === 'F' || char === 'G') {
                const rad = currentAngle * Math.PI / 180;
                const x2 = x + Math.cos(rad) * length;
                const y2 = y + Math.sin(rad) * length;
                pathData += ` L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
                x = x2;
                y = y2;
            } else if (char === '+') {
                currentAngle += angle;
            } else if (char === '-') {
                currentAngle -= angle;
            } else if (char === '[') {
                stack.push({ x, y, currentAngle });
            } else if (char === ']') {
                if (stack.length > 0) {
                    const state = stack.pop();
                    x = state.x;
                    y = state.y;
                    currentAngle = state.currentAngle;
                    pathData += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
                }
            }
        }

        // Simple SVG return
        return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' width='${width}' height='${height}'>
            <rect width='${width}' height='${height}' fill='white'/>
            <path d='${pathData}' stroke='black' fill='none' stroke-width='1'/>
        </svg>`;
    }
}
