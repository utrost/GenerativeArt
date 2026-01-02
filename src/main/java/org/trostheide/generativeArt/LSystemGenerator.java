package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;

import java.util.List;
import java.util.Map;

public class LSystemGenerator implements ArtGenerator {

    private int iterations = 4;
    private String axiom = "F";
    private String rulesStr = "F:F+F-F-F+F"; // Simple format: Char:Replacement;Char:Replacement
    private double angleDegrees = 90.0;
    private double lineLength = 10.0;
    private double initialX = 200;
    private double initialY = 600;

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
        if (params.containsKey("Iterations"))
            this.iterations = ((Number) params.get("Iterations")).intValue();
        if (params.containsKey("Angle"))
            this.angleDegrees = ((Number) params.get("Angle")).doubleValue();
        if (params.containsKey("Line Length"))
            this.lineLength = ((Number) params.get("Line Length")).doubleValue();
        if (params.containsKey("Axiom"))
            this.axiom = (String) params.get("Axiom");
        if (params.containsKey("Rules"))
            this.rulesStr = (String) params.get("Rules");

        Map<Character, String> rules = parseRules(rulesStr);
        String lSystemString = generateLSystemString(axiom, rules, iterations);
        return interpretLSystem(lSystemString);
    }

    private Map<Character, String> parseRules(String rulesStr) {
        // Basic parsing: split by semicolon, then by colon
        // Example: F:F+F-F-F+F;X:X+Y
        try {
            return java.util.Arrays.stream(rulesStr.split(";"))
                    .map(s -> s.split(":", 2))
                    .filter(parts -> parts.length == 2)
                    .collect(java.util.stream.Collectors.toMap(
                            parts -> parts[0].charAt(0),
                            parts -> parts[1]));
        } catch (Exception e) {
            return Map.of('F', "F+F-F-F+F"); // Fallback
        }
    }

    private String generateLSystemString(String current, Map<Character, String> rules, int steps) {
        for (int i = 0; i < steps; i++) {
            StringBuilder next = new StringBuilder();
            for (char c : current.toCharArray()) {
                next.append(rules.getOrDefault(c, String.valueOf(c)));
            }
            current = next.toString();
        }
        return current;
    }

    private String interpretLSystem(String lSystemString) {
        StringBuilder pathBuilder = new StringBuilder();
        // Start roughly center-ish but this depends heavily on the fractal
        // For MVP we'll use a fixed start or maybe dynamic bounds calculation (complex)
        // Sticking to original logic for now
        pathBuilder.append(String.format("M %.2f %.2f ", initialX, initialY));

        double currentX = initialX;
        double currentY = initialY;
        double currentAngle = 0;

        // Auto-centering logic allows for better SVG handling
        // But for now, let's just stick to the SVG path generation
        // A real robust system would calculate bounds first.
        // Let's implement min/max tracking to set viewBox properly.

        // Pass 1: Trace to find bounds
        // (Skipping for brevity, will rely on static 1000x1000 for now like original)

        for (char command : lSystemString.toCharArray()) {
            switch (command) {
                case 'F':
                    double newX = currentX + lineLength * Math.cos(Math.toRadians(currentAngle));
                    double newY = currentY + lineLength * Math.sin(Math.toRadians(currentAngle));
                    pathBuilder.append(String.format("L %.2f %.2f ", newX, newY));
                    currentX = newX;
                    currentY = newY;
                    break;
                case '+':
                    currentAngle += angleDegrees;
                    break;
                case '-':
                    currentAngle -= angleDegrees;
                    break;
                // Add push/pop support '[' and ']' for branching plants later
            }
        }

        return String.format(
                "<svg width=\"1000\" height=\"1000\" viewBox=\"0 0 1000 1000\" xmlns=\"http://www.w3.org/2000/svg\" style=\"background: white\">\n"
                        +
                        "    <path d=\"%s\" stroke=\"black\" fill=\"none\" stroke-width=\"1\"/>\n" +
                        "</svg>",
                pathBuilder.toString());
    }
}
