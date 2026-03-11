package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;


import java.util.List;
import java.util.Map;

public class HarmonographGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "harmonograph";
    }

    @Override
    public String getDisplayName() {
        return "Harmonograph (Lateral & Rotary)";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Classic Rotary", "Complex Lateral", "Dense Web"), 
                    "Select a predefined style"),
                ParameterDefinition.bool("Rotary Mode", true, "Switch between Lateral and Rotary"),
                ParameterDefinition.integer("Steps", 10000, 1000, 100000, "Number of points"),
                ParameterDefinition.doubleVal("Frequency 1", 3.00, 0.1, 20.0, "Freq 1 (or X1)"),
                ParameterDefinition.doubleVal("Frequency 2", 3.01, 0.1, 20.0, "Freq 2 (or X2)"),
                ParameterDefinition.doubleVal("Frequency 3", 2.00, 0.1, 20.0, "Freq 3 (or Y1 - Lateral Only)"),
                ParameterDefinition.doubleVal("Frequency 4", 2.01, 0.1, 20.0, "Freq 4 (or Y2 - Lateral Only)"),
                ParameterDefinition.doubleVal("Amplitude 1", 200.0, 10.0, 500.0, "Amplitude 1"),
                ParameterDefinition.doubleVal("Amplitude 2", 200.0, 10.0, 500.0, "Amplitude 2"),
                ParameterDefinition.doubleVal("Phase 1", 90.0, 0.0, 360.0, "Phase 1 (Degrees)"),
                ParameterDefinition.doubleVal("Phase 2", 0.0, 0.0, 360.0, "Phase 2 (Degrees)"),
                ParameterDefinition.doubleVal("Damping", 0.001, 0.0, 0.01, "Decay Rate"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of Layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Classic Rotary":
                    currentValues.put("Rotary Mode", true);
                    currentValues.put("Steps", 15000);
                    currentValues.put("Frequency 1", 3.0);
                    currentValues.put("Frequency 2", 3.01);
                    currentValues.put("Frequency 3", 2.0);
                    currentValues.put("Frequency 4", 2.01);
                    currentValues.put("Amplitude 1", 200.0);
                    currentValues.put("Amplitude 2", 200.0);
                    currentValues.put("Phase 1", 90.0);
                    currentValues.put("Phase 2", 0.0);
                    currentValues.put("Damping", 0.001);
                    return true;
                case "Complex Lateral":
                    currentValues.put("Rotary Mode", false);
                    currentValues.put("Steps", 20000);
                    currentValues.put("Frequency 1", 3.0);
                    currentValues.put("Frequency 2", 2.0);
                    currentValues.put("Frequency 3", 2.0);
                    currentValues.put("Frequency 4", 3.0);
                    currentValues.put("Amplitude 1", 250.0);
                    currentValues.put("Amplitude 2", 150.0);
                    currentValues.put("Phase 1", 45.0);
                    currentValues.put("Phase 2", 135.0);
                    currentValues.put("Damping", 0.002);
                    return true;
                case "Dense Web":
                    currentValues.put("Rotary Mode", true);
                    currentValues.put("Steps", 30000);
                    currentValues.put("Frequency 1", 4.0);
                    currentValues.put("Frequency 2", 4.05);
                    currentValues.put("Frequency 3", 2.0);
                    currentValues.put("Frequency 4", 2.0);
                    currentValues.put("Amplitude 1", 300.0);
                    currentValues.put("Amplitude 2", 100.0);
                    currentValues.put("Phase 1", 0.0);
                    currentValues.put("Phase 2", 90.0);
                    currentValues.put("Damping", 0.0005);
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
        boolean rotary = (boolean) params.getOrDefault("Rotary Mode", true);
        int steps = (int) params.getOrDefault("Steps", 10000);
        double f1 = (double) params.getOrDefault("Frequency 1", 3.00);
        double f2 = (double) params.getOrDefault("Frequency 2", 3.01);
        double f3 = (double) params.getOrDefault("Frequency 3", 2.00);
        double f4 = (double) params.getOrDefault("Frequency 4", 2.01);
        double a1 = (double) params.getOrDefault("Amplitude 1", 200.0);
        double a2 = (double) params.getOrDefault("Amplitude 2", 200.0);
        double p1 = Math.toRadians((double) params.getOrDefault("Phase 1", 90.0));
        double p2 = Math.toRadians((double) params.getOrDefault("Phase 2", 0.0));
        double d = (double) params.getOrDefault("Damping", 0.001);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        double minX = Double.MAX_VALUE;
        double maxX = -Double.MAX_VALUE;
        double minY = Double.MAX_VALUE;
        double maxY = -Double.MAX_VALUE;

        StringBuilder[] pathBuilders = new StringBuilder[numColors];
        for(int i = 0; i < numColors; i++) {
            pathBuilders[i] = new StringBuilder();
        }

        for (int i = 0; i < steps; i++) {
            double t = i * 0.01; // Time step
            double decay = Math.exp(-d * t);
            double x, y;

            if (rotary) {
                x = decay * (a1 * Math.cos(f1 * t + p1) + a2 * Math.cos(f2 * t + p2));
                y = decay * (a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2));
            } else {
                x = decay * (a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2));
                y = decay * (a1 * Math.sin(f3 * t) + a2 * Math.sin(f4 * t));
            }

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (!first) {
                int layerIndex = (i / 500) % numColors;
                pathBuilders[layerIndex].append(String.format(java.util.Locale.US, "M %.2f %.2f L %.2f %.2f ", prevX, prevY, x, y));
            }

            prevX = x;
            prevY = y;
            first = false;
        }

        java.util.List<String> rawPaths = new java.util.ArrayList<>();
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
