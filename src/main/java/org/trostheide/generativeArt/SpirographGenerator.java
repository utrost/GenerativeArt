package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;


import java.util.List;
import java.util.Map;

public class SpirographGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "spirograph";
    }

    @Override
    public String getDisplayName() {
        return "Spirograph (Hypo/Epitrochoid)";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Hypotrochoid Classic", "Star Pattern", "Epitrochoid Loops", "Complex Web"), 
                    "Select a predefined style"),
                ParameterDefinition.selection("Type", "Hypotrochoid (Inside)",
                        List.of("Hypotrochoid (Inside)", "Epitrochoid (Outside)", "Gear Chain"), "Curve Type"),
                ParameterDefinition.doubleVal("Outer Radius (R)", 300.0, 10.0, 500.0,
                        "Fixed Circle Radius (Base for Chain)"),
                ParameterDefinition.doubleVal("Inner Radius (r)", 105.0, 1.0, 500.0, "Rolling Circle Radius"),
                ParameterDefinition.doubleVal("Pen Offset (d)", 80.0, 0.0, 500.0, "Dist from Inner Center"),
                ParameterDefinition.doubleVal("Revolutions", 50.0, 1.0, 500.0, "Number of Inner Rotations"),
                ParameterDefinition.doubleVal("Resolution", 0.05, 0.001, 1.0, "Step Size (t)"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of Layers"),
                // Gear Chain specific parameters
                ParameterDefinition.integer("Chain Length", 3, 2, 20, "Number of Gears (Chain Mode)"),
                ParameterDefinition.doubleVal("Size Decay", 0.7, 0.1, 1.2, "Size Multiplier per Gear"),
                ParameterDefinition.selection("Gear Configuration", "Exponential Decay",
                        List.of("Exponential Decay", "Big-Big-Small", "Big-Small-Big"), "Arrangement of Gears"),
                ParameterDefinition.selection("Connection", "Alternating",
                        List.of("Alternating", "All Outside", "All Inside", "Random"), "Gear Connection Type"),
                ParameterDefinition.integer("Seed", 1, 0, 1000, "Random Seed for Ratios"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Hypotrochoid Classic":
                    currentValues.put("Type", "Hypotrochoid (Inside)");
                    currentValues.put("Outer Radius (R)", 300.0);
                    currentValues.put("Inner Radius (r)", 105.0);
                    currentValues.put("Pen Offset (d)", 80.0);
                    currentValues.put("Revolutions", 50.0);
                    return true;
                case "Star Pattern":
                    currentValues.put("Type", "Hypotrochoid (Inside)");
                    currentValues.put("Outer Radius (R)", 300.0);
                    currentValues.put("Inner Radius (r)", 85.0);
                    currentValues.put("Pen Offset (d)", 120.0);
                    currentValues.put("Revolutions", 17.0);
                    return true;
                case "Epitrochoid Loops":
                    currentValues.put("Type", "Epitrochoid (Outside)");
                    currentValues.put("Outer Radius (R)", 200.0);
                    currentValues.put("Inner Radius (r)", 55.0);
                    currentValues.put("Pen Offset (d)", 90.0);
                    currentValues.put("Revolutions", 11.0);
                    return true;
                case "Complex Web":
                    currentValues.put("Type", "Hypotrochoid (Inside)");
                    currentValues.put("Outer Radius (R)", 350.0);
                    currentValues.put("Inner Radius (r)", 160.0);
                    currentValues.put("Pen Offset (d)", 140.0);
                    currentValues.put("Revolutions", 32.0);
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
        String type = (String) params.getOrDefault("Type", "Hypotrochoid (Inside)");

        double resolution = (double) params.getOrDefault("Resolution", 0.05);
        int numColors = (int) params.getOrDefault("Colors", 1);
        double revolutions = (double) params.getOrDefault("Revolutions", 50.0);

        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        if (type.equals("Gear Chain")) {
            return generateGearChain(params, resolution, revolutions, numColors, width, height);
        } else {
            return generateClassic(params, type, resolution, revolutions, numColors, width, height);
        }
    }

    private String buildFinalSvg(StringBuilder[] pathBuilders, int numColors, double width, double height, double minX, double maxX, double minY, double maxY) {
        java.util.List<String> rawPaths = new java.util.ArrayList<>();
        for (int i = 0; i < numColors; i++) {
            if (pathBuilders[i] != null && pathBuilders[i].length() > 0) {
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

    private String generateClassic(Map<String, Object> params, String type,
            double resolution, double revolutions, int numColors, double width, double height) {
        boolean isHypo = type.contains("Hypo");
        double R = (double) params.getOrDefault("Outer Radius (R)", 300.0);
        double r = (double) params.getOrDefault("Inner Radius (r)", 105.0);
        double d = (double) params.getOrDefault("Pen Offset (d)", 80.0);

        double maxT = revolutions * 2 * Math.PI;
        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        double minX = Double.MAX_VALUE, maxX = -Double.MAX_VALUE;
        double minY = Double.MAX_VALUE, maxY = -Double.MAX_VALUE;

        StringBuilder[] pathBuilders = new StringBuilder[numColors];
        for (int i = 0; i < numColors; i++) pathBuilders[i] = new StringBuilder();

        for (double t = 0; t <= maxT; t += resolution) {
            double x, y;
            if (isHypo) {
                x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
                y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
            } else {
                x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
                y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
            }

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (!first) {
                int layerIndex = (int) (t) % numColors;
                pathBuilders[layerIndex].append(String.format(java.util.Locale.US, "M %.2f %.2f L %.2f %.2f ", prevX, prevY, x, y));
            }
            prevX = x;
            prevY = y;
            first = false;
        }

        return buildFinalSvg(pathBuilders, numColors, width, height, minX, maxX, minY, maxY);
    }

    private String generateGearChain(Map<String, Object> params, double resolution, double revolutions, int numColors, double width, double height) {
        int chainLength = (int) params.getOrDefault("Chain Length", 3);
        double baseRadius = (double) params.getOrDefault("Outer Radius (R)", 300.0); // Use R as base size
        double decay = (double) params.getOrDefault("Size Decay", 0.7);
        String connection = (String) params.getOrDefault("Connection", "Alternating");
        int seed = (int) params.getOrDefault("Seed", 1);

        java.util.Random rng = new java.util.Random(seed);

        double[] radii = new double[chainLength];
        double[] speeds = new double[chainLength];
        double[] phases = new double[chainLength];

        String gearConfig = (String) params.getOrDefault("Gear Configuration", "Exponential Decay");

        double currentR = baseRadius;
        for (int i = 0; i < chainLength; i++) {
            if (gearConfig.equals("Big-Big-Small")) {
                int pos = i % 3;
                if (pos == 0) radii[i] = baseRadius;
                else if (pos == 1) radii[i] = baseRadius * 0.9;
                else radii[i] = baseRadius * 0.1;
            } else if (gearConfig.equals("Big-Small-Big")) {
                int pos = i % 3;
                if (pos == 0) radii[i] = baseRadius;
                else if (pos == 1) radii[i] = baseRadius * 0.2;
                else radii[i] = baseRadius * 0.8;
            } else {
                radii[i] = currentR;
                currentR *= decay;
            }

            if (i == 0) {
                speeds[i] = 1.0;
            } else {
                int num = rng.nextInt(5) + 1;
                int den = rng.nextInt(5) + 1;
                double ratio = (double) num / den;

                boolean flip = true;

                if (connection.equals("All Inside")) {
                    flip = false;
                } else if (connection.equals("Random")) {
                    flip = rng.nextBoolean();
                }

                double direction = flip ? -1.0 : 1.0;
                speeds[i] = speeds[i - 1] * (1.0 + ratio * direction);
            }
            phases[i] = rng.nextDouble() * 2 * Math.PI;
        }

        double maxT = revolutions * 2 * Math.PI;
        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        double minX = Double.MAX_VALUE, maxX = -Double.MAX_VALUE;
        double minY = Double.MAX_VALUE, maxY = -Double.MAX_VALUE;

        StringBuilder[] pathBuilders = new StringBuilder[numColors];
        for (int i = 0; i < numColors; i++) pathBuilders[i] = new StringBuilder();

        for (double t = 0; t <= maxT; t += resolution) {
            double x = 0;
            double y = 0;

            for (int i = 0; i < chainLength; i++) {
                x += radii[i] * Math.cos(speeds[i] * t + phases[i]);
                y += radii[i] * Math.sin(speeds[i] * t + phases[i]);
            }

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (!first) {
                int layerIndex = (int) (t) % numColors;
                pathBuilders[layerIndex].append(String.format(java.util.Locale.US, "M %.2f %.2f L %.2f %.2f ", prevX, prevY, x, y));
            }
            prevX = x;
            prevY = y;
            first = false;
        }

        return buildFinalSvg(pathBuilders, numColors, width, height, minX, maxX, minY, maxY);
    }
}
