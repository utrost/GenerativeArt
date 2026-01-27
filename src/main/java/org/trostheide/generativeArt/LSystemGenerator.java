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
                ParameterDefinition.integer("Iterations", 4, 1, 7, "Number of recursion steps"),
                ParameterDefinition.doubleVal("Angle", 90.0, 0.0, 360.0, "Turn angle in degrees"),
                ParameterDefinition.doubleVal("Line Length", 10.0, 1.0, 100.0, "Length of each segment"),
                ParameterDefinition.string("Axiom", "F", "Initial state (e.g., F)"),
                ParameterDefinition.string("Rules", "F:F+F-F-F+F", "Production rules (e.g., F:F+F-F-F+F)"));
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
        double x = width * 0.2;
        double y = height * 0.8;
        double currentAngle = 0; // facing right

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

        return String.format(java.util.Locale.US,
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %.1f %.1f' width='%.1f' height='%.1f'>\n" +
                        "<defs><clipPath id='pageClip'><rect width='%.1f' height='%.1f'/></clipPath></defs>\n" +
                        "<rect width='%.1f' height='%.1f' fill='white'/>\n" +
                        "<g clip-path='url(#pageClip)'><path d='%s' stroke='black' fill='none' stroke-width='1'/></g>\n</svg>",
                width, height, width, height, width, height, width, height, path.toString());
    }
}
