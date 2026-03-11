package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;


import java.util.List;
import java.util.Map;

public class StrangeAttractorsGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "strange-attractors";
    }

    @Override
    public String getDisplayName() {
        return "Strange Attractors (Clifford)";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Classic", "Swirling Web", "Dense Oval", "Twin Galaxies"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("Iterations", 10000, 1000, 50000, "Number of points"),
                ParameterDefinition.doubleVal("A", 1.5, -3.0, 3.0, "Chaos Parameter A"),
                ParameterDefinition.doubleVal("B", -1.8, -3.0, 3.0, "Chaos Parameter B"),
                ParameterDefinition.doubleVal("C", 1.6, -3.0, 3.0, "Chaos Parameter C"),
                ParameterDefinition.doubleVal("D", 0.9, -3.0, 3.0, "Chaos Parameter D"),
                ParameterDefinition.doubleVal("Scale", 200.0, 50.0, 500.0, "Zoom level"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Classic":
                    currentValues.put("Iterations", 20000);
                    currentValues.put("A", 1.5);
                    currentValues.put("B", -1.8);
                    currentValues.put("C", 1.6);
                    currentValues.put("D", 0.9);
                    currentValues.put("Scale", 200.0);
                    currentValues.put("Colors", 2);
                    return true;
                case "Swirling Web":
                    currentValues.put("Iterations", 30000);
                    currentValues.put("A", 1.8);
                    currentValues.put("B", 1.9);
                    currentValues.put("C", -1.5);
                    currentValues.put("D", -0.8);
                    currentValues.put("Scale", 200.0);
                    currentValues.put("Colors", 3);
                    return true;
                case "Dense Oval":
                    currentValues.put("Iterations", 25000);
                    currentValues.put("A", -1.4);
                    currentValues.put("B", 1.6);
                    currentValues.put("C", 1.0);
                    currentValues.put("D", 0.7);
                    currentValues.put("Scale", 200.0);
                    currentValues.put("Colors", 1);
                    return true;
                case "Twin Galaxies":
                    currentValues.put("Iterations", 40000);
                    currentValues.put("A", 1.7);
                    currentValues.put("B", 1.7);
                    currentValues.put("C", 0.6);
                    currentValues.put("D", 1.2);
                    currentValues.put("Scale", 200.0);
                    currentValues.put("Colors", 4);
                    return true;
                case "Custom":
                default:
                    return false;
            }
        }
        if (!"Preset".equals(paramName) && !"Custom".equals(currentValues.get("Preset"))) {
            currentValues.put("Preset", "Custom");
            return true;
        }
        return false;
    }

    @Override
    public String generate(Map<String, Object> params) {
        int iterations = (int) params.getOrDefault("Iterations", 10000);
        double a = (double) params.getOrDefault("A", 1.5);
        double b = (double) params.getOrDefault("B", -1.8);
        double c = (double) params.getOrDefault("C", 1.6);
        double d = (double) params.getOrDefault("D", 0.9);
        double scale = (double) params.getOrDefault("Scale", 200.0);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        // Start point
        double x = 0.1;
        double y = 0.1;

        // Skip first few iterations to settle into the attractor
        for (int i = 0; i < 20; i++) {
            double xn = Math.sin(a * y) + c * Math.cos(a * x);
            double yn = Math.sin(b * x) + d * Math.cos(b * y);
            x = xn;
            y = yn;
        }

        double prevX = x * scale;
        double prevY = y * scale;
        boolean first = true;

        double minX = Double.MAX_VALUE;
        double maxX = -Double.MAX_VALUE;
        double minY = Double.MAX_VALUE;
        double maxY = -Double.MAX_VALUE;

        // Collect all lines to add them to the canvas later inside a transform group
        List<String> rawPaths = new java.util.ArrayList<>();
        StringBuilder[] pathBuilders = new StringBuilder[numColors];
        for (int i = 0; i < numColors; i++) {
            pathBuilders[i] = new StringBuilder();
        }

        for (int i = 0; i < iterations; i++) {
            // Clifford Attractor
            double xn = Math.sin(a * y) + c * Math.cos(a * x);
            double yn = Math.sin(b * x) + d * Math.cos(b * y);

            x = xn;
            y = yn;

            double screenX = x * scale;
            double screenY = y * scale;

            if (screenX < minX) minX = screenX;
            if (screenX > maxX) maxX = screenX;
            if (screenY < minY) minY = screenY;
            if (screenY > maxY) maxY = screenY;

            if (!first) {
                // Color path by time/iteration to show the trajectory
                int layerIndex = (i / (iterations / numColors)) % numColors;
                if (layerIndex >= numColors)
                    layerIndex = numColors - 1;

                // Only draw if distance is reasonable (avoid jumping across screen if attractor
                // is disjoint)
                double dist = Math.hypot(screenX - prevX, screenY - prevY);
                if (dist < 100) {
                    pathBuilders[layerIndex].append(String.format(java.util.Locale.US, "M %.2f %.2f L %.2f %.2f ", prevX, prevY, screenX, screenY));
                }
            }

            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        for (int i = 0; i < numColors; i++) {
            if (pathBuilders[i].length() > 0) {
                String layerColor = new String[] { "black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A" }[i % 6];
                rawPaths.add(String.format(java.util.Locale.US, "<path d='%s' stroke='%s' fill='none' stroke-width='1.0' vector-effect='non-scaling-stroke'/>", pathBuilders[i].toString(), layerColor));
            }
        }

        double margin = 50.0;
        double bboxWidth = maxX - minX;
        double bboxHeight = maxY - minY;

        if (bboxWidth <= 0) bboxWidth = 1;
        if (bboxHeight <= 0) bboxHeight = 1;

        double targetScale = Math.min((width - 2 * margin) / bboxWidth, (height - 2 * margin) / bboxHeight);
        double offsetX = (width - bboxWidth * targetScale) / 2.0 - minX * targetScale;
        double offsetY = (height - bboxHeight * targetScale) / 2.0 - minY * targetScale;

        // Instead of typical SvgCanvas usage, we compose it directly to inject the <g> transform wrapper.
        // We'll just build the SVG string directly since we pre-calculated the paths.
        StringBuilder out = new StringBuilder();
        out.append(String.format(java.util.Locale.US, "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %.1f %.1f' width='%.1f' height='%.1f'>\n", width, height, width, height));
        out.append(String.format(java.util.Locale.US, "<defs><clipPath id='pageClip'><rect width='%.1f' height='%.1f'/></clipPath></defs>\n", width, height));
        out.append(String.format(java.util.Locale.US, "<rect width='%.1f' height='%.1f' fill='white'/>\n", width, height));
        out.append("<g clip-path='url(#pageClip)'>\n");
        out.append(String.format(java.util.Locale.US, "  <g transform='translate(%.1f, %.1f) scale(%.4f)'>\n", offsetX, offsetY, targetScale));
        for (String p : rawPaths) {
            out.append("    ").append(p).append("\n");
        }
        out.append("  </g>\n");
        out.append("</g>\n</svg>");

        return out.toString();
    }
}
