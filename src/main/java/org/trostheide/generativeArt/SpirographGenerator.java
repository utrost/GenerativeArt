package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

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

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
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
                ParameterDefinition.selection("Connection", "Alternating",
                        List.of("Alternating", "All Outside", "All Inside", "Random"), "Gear Connection Type"),
                ParameterDefinition.integer("Seed", 1, 0, 1000, "Random Seed for Ratios"));
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

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);
        double centerX = width / 2;
        double centerY = height / 2;

        if (type.equals("Gear Chain")) {
            generateGearChain(canvas, params, centerX, centerY, resolution, revolutions, numColors);
        } else {
            generateClassic(canvas, params, type, centerX, centerY, resolution, revolutions, numColors);
        }

        return canvas.toSvg();
    }

    private void generateClassic(SvgCanvas canvas, Map<String, Object> params, String type,
            double centerX, double centerY, double resolution, double revolutions, int numColors) {
        boolean isHypo = type.contains("Hypo");
        double R = (double) params.getOrDefault("Outer Radius (R)", 300.0);
        double r = (double) params.getOrDefault("Inner Radius (r)", 105.0);
        double d = (double) params.getOrDefault("Pen Offset (d)", 80.0);

        double maxT = revolutions * 2 * Math.PI;
        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        for (double t = 0; t <= maxT; t += resolution) {
            double x, y;
            if (isHypo) {
                x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
                y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
            } else {
                x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
                y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
            }

            double screenX = centerX + x;
            double screenY = centerY + y;

            if (!first) {
                int layerIndex = (int) (t) % numColors;
                canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
            }
            prevX = screenX;
            prevY = screenY;
            first = false;
        }
    }

    private void generateGearChain(SvgCanvas canvas, Map<String, Object> params,
            double centerX, double centerY, double resolution, double revolutions, int numColors) {
        int chainLength = (int) params.getOrDefault("Chain Length", 3);
        double baseRadius = (double) params.getOrDefault("Outer Radius (R)", 300.0); // Use R as base size
        double decay = (double) params.getOrDefault("Size Decay", 0.7);
        String connection = (String) params.getOrDefault("Connection", "Alternating");
        int seed = (int) params.getOrDefault("Seed", 1);

        java.util.Random rng = new java.util.Random(seed);

        // Setup gears
        double[] radii = new double[chainLength];
        double[] speeds = new double[chainLength];
        double[] phases = new double[chainLength]; // Initial angles

        double currentR = baseRadius;
        for (int i = 0; i < chainLength; i++) {
            radii[i] = currentR;
            currentR *= decay;

            // Speed logic: Ratios of small integers
            if (i == 0) {
                speeds[i] = 1.0; // Base gear speed (relative to frame)
                // Actually base gear usually fixed?
                // Let's make base gear rotate slowly or be the carrier.
                // Standard spiro: Carrier rotates at speed 1 (t).
            } else {
                // Determine gear ratio
                int num = rng.nextInt(5) + 1; // 1 to 5
                int den = rng.nextInt(5) + 1; // 1 to 5
                double ratio = (double) num / den;

                // Connection type determines if direction flips relative to parent
                boolean flip = true; // Default to Alternating / All Outside

                if (connection.equals("All Inside")) {
                    flip = false;
                } else if (connection.equals("Random")) {
                    flip = rng.nextBoolean();
                }

                double direction = flip ? -1.0 : 1.0;

                // speeds[i] = speeds[i-1] * (1.0 + ratio) * direction;
                // Using simpler addition for cleaner harmonics in "Spinning Vectors" model
                speeds[i] = speeds[i - 1] + direction * ratio * 5.0;
                // Or just independent speeds?
                // speeds[i] = (rng.nextBoolean() ? 1 : -1) * (rng.nextInt(10) + 1);

                // Let's stick to "Rolling" metaphor loosely:
                // Speed increases as gears get smaller generally?
                speeds[i] = speeds[i - 1] * (1.0 + ratio * direction);
            }
            phases[i] = rng.nextDouble() * 2 * Math.PI;
        }

        double maxT = revolutions * 2 * Math.PI;
        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        for (double t = 0; t <= maxT; t += resolution) {
            double x = 0;
            double y = 0;

            for (int i = 0; i < chainLength; i++) {
                x += radii[i] * Math.cos(speeds[i] * t + phases[i]);
                y += radii[i] * Math.sin(speeds[i] * t + phases[i]);
            }

            double screenX = centerX + x;
            double screenY = centerY + y;

            if (!first) {
                int layerIndex = (int) (t) % numColors;
                canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
            }
            prevX = screenX;
            prevY = screenY;
            first = false;
        }
    }
}
