package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Stack;

public class LSystemGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "l-system";
    }

    @Override
    public String getDisplayName() {
        return "L-System Fractal";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Koch Snowflake", "Quadratic Koch", "Sierpinski", "Dragon Curve", "Plant/Bush", "Fern", "Hilbert Curve", "Penrose Tiling"), 
                    "Select a predefined L-System"),
                ParameterDefinition.integer("Iterations", 4, 1, 12, "Number of recursion steps"),
                ParameterDefinition.doubleVal("Angle", 90.0, 0.0, 360.0, "Turn angle in degrees"),
                ParameterDefinition.doubleVal("Line Length", 10.0, 1.0, 100.0, "Length of each segment"),
                ParameterDefinition.string("Axiom", "F", "Initial state (e.g., F)"),
                ParameterDefinition.string("Rules", "F:F+F-F-F+F", "Production rules (e.g., F:F+F-F-F+F)"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Koch Snowflake":
                    currentValues.put("Axiom", "F++F++F");
                    currentValues.put("Rules", "F:F-F++F-F");
                    currentValues.put("Angle", 60.0);
                    currentValues.put("Iterations", 4);
                    return true;
                case "Quadratic Koch":
                    currentValues.put("Axiom", "F");
                    currentValues.put("Rules", "F:F+F-F-F+F");
                    currentValues.put("Angle", 90.0);
                    currentValues.put("Iterations", 4);
                    return true;
                case "Sierpinski":
                    currentValues.put("Axiom", "F-G-G");
                    currentValues.put("Rules", "F:F-G+F+G-F;G:GG");
                    currentValues.put("Angle", 120.0);
                    currentValues.put("Iterations", 6);
                    return true;
                case "Dragon Curve":
                    currentValues.put("Axiom", "FX");
                    currentValues.put("Rules", "X:X+YF+;Y:-FX-Y");
                    currentValues.put("Angle", 90.0);
                    currentValues.put("Iterations", 12);
                    return true;
                case "Plant/Bush":
                    currentValues.put("Axiom", "F");
                    currentValues.put("Rules", "F:FF+[+F-F-F]-[-F+F+F]");
                    currentValues.put("Angle", 22.0);
                    currentValues.put("Iterations", 5);
                    return true;
                case "Fern":
                    currentValues.put("Axiom", "X");
                    currentValues.put("Rules", "X:F+[[X]-X]-F[-FX]+X;F:FF");
                    currentValues.put("Angle", 25.0);
                    currentValues.put("Iterations", 5);
                    return true;
                case "Hilbert Curve":
                    currentValues.put("Axiom", "X");
                    currentValues.put("Rules", "X:-YF+XFX+FY-;Y:+XF-YFY-FX+");
                    currentValues.put("Angle", 90.0);
                    currentValues.put("Iterations", 5);
                    return true;
                case "Penrose Tiling": // Approximated with basic LSystem capabilities
                    currentValues.put("Axiom", "[X]++[X]++[X]++[X]++[X]");
                    currentValues.put("Rules", "W:YF++ZF----XF[-YF----WF]++;X:+YF--ZF[---WF--XF]+;Y:-WF++XF[+++YF++ZF]-;Z:--YF++++WF[+ZF++++XF]--XF;F:");
                    currentValues.put("Angle", 36.0);
                    currentValues.put("Iterations", 5);
                    return true;
                case "Custom":
                default:
                    return false; // Do nothing for custom, let user edit
            }
        }
        
        // If they edit a field manually while a preset is active, we could optionally switch back to "Custom"
        if (!"Preset".equals(paramName) && !"Custom".equals(currentValues.get("Preset"))) {
            currentValues.put("Preset", "Custom");
            return true;
        }
        
        return false;
    }

    @Override
    public String generate(Map<String, Object> params) {
        // Params
        int iterations = (int) params.getOrDefault("Iterations", 4);
        double angle = (double) params.getOrDefault("Angle", 90.0);
        double length = (double) params.getOrDefault("Line Length", 10.0);
        String axiom = (String) params.getOrDefault("Axiom", "F");
        String rulesStr = (String) params.getOrDefault("Rules", "F:F+F-F-F+F");

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        // Parse Rules
        Map<Character, String> rules = new HashMap<>();
        for (String part : rulesStr.split(";")) {
            String[] kv = part.split(":");
            if (kv.length == 2)
                rules.put(kv[0].charAt(0), kv[1]);
        }

        // Expand
        String current = axiom;
        for (int i = 0; i < iterations; i++) {
            StringBuilder sb = new StringBuilder();
            for (char c : current.toCharArray()) {
                sb.append(rules.getOrDefault(c, String.valueOf(c)));
            }
            current = sb.toString();
        }

        // Draw
        double x = 0;
        double y = 0;
        double currentAngle = 0; // facing right

        double minX = 0, maxX = 0;
        double minY = 0, maxY = 0;

        StringBuilder path = new StringBuilder();
        path.append(String.format(java.util.Locale.US, "M %.1f %.1f", x, y));

        Stack<double[]> stack = new Stack<>();

        for (char c : current.toCharArray()) {
            if (c == 'F' || c == 'G') {
                double x2 = x + Math.cos(Math.toRadians(currentAngle)) * length;
                double y2 = y + Math.sin(Math.toRadians(currentAngle)) * length;
                path.append(String.format(java.util.Locale.US, " L %.1f %.1f", x2, y2));
                x = x2;
                y = y2;
                
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            } else if (c == '+') {
                currentAngle += angle;
            } else if (c == '-') {
                currentAngle -= angle;
            } else if (c == '[') {
                stack.push(new double[] { x, y, currentAngle });
            } else if (c == ']') {
                if (!stack.isEmpty()) {
                    double[] state = stack.pop();
                    x = state[0];
                    y = state[1];
                    currentAngle = state[2];
                    path.append(String.format(java.util.Locale.US, " M %.1f %.1f", x, y));
                }
            }
        }

        double margin = 50.0;
        double bboxWidth = maxX - minX;
        double bboxHeight = maxY - minY;
        
        // Prevent division by zero
        if (bboxWidth == 0) bboxWidth = 1;
        if (bboxHeight == 0) bboxHeight = 1;

        double scale = Math.min((width - 2 * margin) / bboxWidth, (height - 2 * margin) / bboxHeight);
        double offsetX = (width - bboxWidth * scale) / 2.0 - minX * scale;
        double offsetY = (height - bboxHeight * scale) / 2.0 - minY * scale;

        return String.format(java.util.Locale.US,
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %.1f %.1f' width='%.1f' height='%.1f'>\n" +
                        "<defs><clipPath id='pageClip'><rect width='%.1f' height='%.1f'/></clipPath></defs>\n" +
                        "<rect width='%.1f' height='%.1f' fill='white'/>\n" +
                        "<g clip-path='url(#pageClip)'>\n" +
                        "  <g transform='translate(%.1f, %.1f) scale(%.4f)'>\n" +
                        "    <path d='%s' stroke='black' fill='none' stroke-width='1' vector-effect='non-scaling-stroke'/>\n" +
                        "  </g>\n" +
                        "</g>\n</svg>",
                width, height, width, height, width, height, width, height, offsetX, offsetY, scale, path.toString());
    }
}
