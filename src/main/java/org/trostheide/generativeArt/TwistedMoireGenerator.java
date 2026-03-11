package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;

public class TwistedMoireGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "twisted_moire";
    }

    @Override
    public String getDisplayName() {
        return "Twisted Moiré";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Subtle Shift", "Vortex", "Offset Swirl", "Dense Interference"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("lineCount", 80, 10, 500, "Number of vertical lines"),
                ParameterDefinition.doubleVal("twistStrength", 5.0, -20.0, 20.0, "Strength of the spiral twist"),
                ParameterDefinition.doubleVal("centerX", 0.5, 0.0, 1.0, "Center X of the twist (0-1)"),
                ParameterDefinition.doubleVal("centerY", 0.5, 0.0, 1.0, "Center Y of the twist (0-1)"),
                ParameterDefinition.doubleVal("layer2Rotation", 2.0, -180.0, 180.0,
                        "Rotation offset for the second layer (degrees)"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Subtle Shift":
                    currentValues.put("lineCount", 100);
                    currentValues.put("twistStrength", 2.0);
                    currentValues.put("centerX", 0.5);
                    currentValues.put("centerY", 0.5);
                    currentValues.put("layer2Rotation", 1.5);
                    return true;
                case "Vortex":
                    currentValues.put("lineCount", 150);
                    currentValues.put("twistStrength", 15.0);
                    currentValues.put("centerX", 0.5);
                    currentValues.put("centerY", 0.5);
                    currentValues.put("layer2Rotation", 5.0);
                    return true;
                case "Offset Swirl":
                    currentValues.put("lineCount", 80);
                    currentValues.put("twistStrength", 8.0);
                    currentValues.put("centerX", 0.3);
                    currentValues.put("centerY", 0.7);
                    currentValues.put("layer2Rotation", -3.0);
                    return true;
                case "Dense Interference":
                    currentValues.put("lineCount", 200);
                    currentValues.put("twistStrength", 4.0);
                    currentValues.put("centerX", 0.5);
                    currentValues.put("centerY", 0.5);
                    currentValues.put("layer2Rotation", 0.5);
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
        // Parse parameters
        int lineCount = (int) params.getOrDefault("lineCount", 80);
        double twistStrength = (double) params.getOrDefault("twistStrength", 5.0);
        double centerXRel = (double) params.getOrDefault("centerX", 0.5);
        double centerYRel = (double) params.getOrDefault("centerY", 0.5);
        double layer2Rotation = (double) params.getOrDefault("layer2Rotation", 2.0);

        // Canvas dimensions (standard A3-ish size for plotting usually, but let's stick
        // to what SvgCanvas typically expects or relative)
        // ArtGenerator doesn't seem to pass canvas size in calculate, usually the
        // SVGCanvas handles it.
        // But we need to generate coordinates. Let's assume a normalized 0-100 or 0-800
        // space and let SvgCanvas handle scale.
        // Actually, looking at SvgCanvas and other generators would be safer, but let's
        // assume a standard 800x600 for generation
        // and let the viewer scale it. Or better, standard plotter size is often
        // defined in Main or passed?
        // Let's use 800x600 as a working base.
        double width = 800;
        double height = 600;

        SvgCanvas canvas = new SvgCanvas(width, height, 2);

        double cx = width * centerXRel;
        double cy = height * centerYRel;
        double maxDist = Math.max(width, height) * 0.8; // Radius of effect

        // Layer 1: Base Grid Twist
        generateTwistedGrid(canvas, 0, width, height, lineCount, twistStrength, cx, cy, maxDist, 0);

        // Layer 2: Rotated Grid Twist (to create Moiré)
        // We can achieve "layer 2 rotation" by actually rotating the points around the
        // center
        // OR by rotating the initial grid lines. Let's rotate the grid lines for a true
        // moire effect.
        generateTwistedGrid(canvas, 1, width, height, lineCount, twistStrength, cx, cy, maxDist,
                Math.toRadians(layer2Rotation));

        return canvas.toSvg();
    }

    private void generateTwistedGrid(SvgCanvas canvas, int layerIndex, double width, double height, int lineCount,
            double twistStrength, double cx, double cy, double maxDist, double baseRotation) {

        double step = width / (double) lineCount;
        int pointsPerLine = 200; // Resolution along the line

        for (int i = 0; i <= lineCount; i++) {
            double xBase = i * step;
            StringBuilder pathData = new StringBuilder();
            boolean firstPoint = true;

            for (int j = 0; j <= pointsPerLine; j++) {
                double yBase = (height * j) / pointsPerLine;

                // 1. Center coordinates
                double dx = xBase - cx;
                double dy = yBase - cy;

                // 2. Apply base rotation (if any, for the whole layer)
                double rotX = dx * Math.cos(baseRotation) - dy * Math.sin(baseRotation);
                double rotY = dx * Math.sin(baseRotation) + dy * Math.cos(baseRotation);

                // 3. To Polar
                double distance = Math.sqrt(rotX * rotX + rotY * rotY);
                double angle = Math.atan2(rotY, rotX);

                // 4. Apply Twist
                // The angle offset depends on distance.
                // Near center -> more twist (or less, depending on formula).
                // "Twirl" effect usually adds angle based on (maxDist - dist).

                double twistFactor = Math.max(0, (maxDist - distance) / maxDist);
                // Non-linear twist looks better often:
                twistFactor = Math.pow(twistFactor, 2);

                double targetAngle = angle + twistStrength * twistFactor;

                // 5. Back to Cartesian
                double finalX = cx + Math.cos(targetAngle) * distance;
                double finalY = cy + Math.sin(targetAngle) * distance;

                if (firstPoint) {
                    pathData.append(String.format(Locale.US, "M %.2f %.2f", finalX, finalY));
                    firstPoint = false;
                } else {
                    pathData.append(String.format(Locale.US, " L %.2f %.2f", finalX, finalY));
                }
            }
            canvas.addPath(layerIndex, String.format(Locale.US, "<path d='%s' />", pathData.toString()));
        }
    }
}
