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
            ParameterDefinition.selection("Preset", "Custom", 
                ["Custom", "Koch Snowflake", "Quadratic Koch", "Sierpinski", "Dragon Curve", "Plant/Bush", "Fern", "Hilbert Curve", "Penrose Tiling"], 
                "Select a predefined L-System"),
            ParameterDefinition.integer("Iterations", 4, 1, 12, "Number of recursion steps"),
            ParameterDefinition.doubleVal("Angle", 90.0, 0.0, 360.0, "Turn angle in degrees"),
            ParameterDefinition.doubleVal("Line Length", 10.0, 1.0, 100.0, "Length of each segment"),
            ParameterDefinition.string("Axiom", "F", "Initial state"),
            ParameterDefinition.string("Rules", "F:F+F-F-F+F", "Production rules")
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === "Preset" && typeof newValue === "string") {
            const preset = newValue;
            switch (preset) {
                case "Koch Snowflake":
                    currentValues["Axiom"] = "F++F++F";
                    currentValues["Rules"] = "F:F-F++F-F";
                    currentValues["Angle"] = 60.0;
                    currentValues["Iterations"] = 4;
                    return true;
                case "Quadratic Koch":
                    currentValues["Axiom"] = "F";
                    currentValues["Rules"] = "F:F+F-F-F+F";
                    currentValues["Angle"] = 90.0;
                    currentValues["Iterations"] = 4;
                    return true;
                case "Sierpinski":
                    currentValues["Axiom"] = "F-G-G";
                    currentValues["Rules"] = "F:F-G+F+G-F;G:GG";
                    currentValues["Angle"] = 120.0;
                    currentValues["Iterations"] = 6;
                    return true;
                case "Dragon Curve":
                    currentValues["Axiom"] = "FX";
                    currentValues["Rules"] = "X:X+YF+;Y:-FX-Y";
                    currentValues["Angle"] = 90.0;
                    currentValues["Iterations"] = 12;
                    return true;
                case "Plant/Bush":
                    currentValues["Axiom"] = "F";
                    currentValues["Rules"] = "F:FF+[+F-F-F]-[-F+F+F]";
                    currentValues["Angle"] = 22.0;
                    currentValues["Iterations"] = 5;
                    return true;
                case "Fern":
                    currentValues["Axiom"] = "X";
                    currentValues["Rules"] = "X:F+[[X]-X]-F[-FX]+X;F:FF";
                    currentValues["Angle"] = 25.0;
                    currentValues["Iterations"] = 5;
                    return true;
                case "Hilbert Curve":
                    currentValues["Axiom"] = "X";
                    currentValues["Rules"] = "X:-YF+XFX+FY-;Y:+XF-YFY-FX+";
                    currentValues["Angle"] = 90.0;
                    currentValues["Iterations"] = 5;
                    return true;
                case "Penrose Tiling": // Approximated with basic LSystem capabilities
                    currentValues["Axiom"] = "[X]++[X]++[X]++[X]++[X]";
                    currentValues["Rules"] = "W:YF++ZF----XF[-YF----WF]++;X:+YF--ZF[---WF--XF]+;Y:-WF++XF[+++YF++ZF]-;Z:--YF++++WF[+ZF++++XF]--XF;F:";
                    currentValues["Angle"] = 36.0;
                    currentValues["Iterations"] = 5;
                    return true;
                case "Custom":
                default:
                    return false; // Do nothing for custom, let user edit
            }
        }
        
        // Switch to custom if another field is manually changed while a preset is active
        if (paramName !== "Preset" && currentValues["Preset"] !== "Custom") {
            currentValues["Preset"] = "Custom";
            return true;
        }
        
        return false;
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
        let x = 0;
        let y = 0;
        let currentAngle = 0; // facing right (0 deg in SVG coord system is right)

        let minX = 0, maxX = 0;
        let minY = 0, maxY = 0;

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
                
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
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

        const margin = 50.0;
        let bboxWidth = maxX - minX;
        let bboxHeight = maxY - minY;

        if (bboxWidth === 0) bboxWidth = 1;
        if (bboxHeight === 0) bboxHeight = 1;

        const scale = Math.min((width - 2 * margin) / bboxWidth, (height - 2 * margin) / bboxHeight);
        const offsetX = (width - bboxWidth * scale) / 2.0 - minX * scale;
        const offsetY = (height - bboxHeight * scale) / 2.0 - minY * scale;

        // Simple SVG return
        return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' width='${width}' height='${height}'>
            <rect width='${width}' height='${height}' fill='white'/>
            <g transform='translate(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}) scale(${scale.toFixed(4)})'>
                <path d='${pathData}' stroke='black' fill='none' stroke-width='1' vector-effect='non-scaling-stroke'/>
            </g>
        </svg>`;
    }
}
