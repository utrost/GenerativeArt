package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class CirclePackingGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "circle-packing";
    }

    @Override
    public String getDisplayName() {
        return "Circle Packing";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Dense Bubbles", "Large Boulders", "Sparse Grid"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("Attempts", 2000, 100, 10000, "Number of circles to attempt"),
                ParameterDefinition.doubleVal("Min Radius", 2.0, 1.0, 50.0, "Minimum circle size"),
                ParameterDefinition.doubleVal("Max Radius", 50.0, 10.0, 200.0, "Maximum circle size"),
                ParameterDefinition.doubleVal("Padding", 2.0, 0.0, 20.0, "Space between circles"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Dense Bubbles":
                    currentValues.put("Attempts", 8000);
                    currentValues.put("Min Radius", 1.0);
                    currentValues.put("Max Radius", 20.0);
                    currentValues.put("Padding", 0.5);
                    return true;
                case "Large Boulders":
                    currentValues.put("Attempts", 1000);
                    currentValues.put("Min Radius", 10.0);
                    currentValues.put("Max Radius", 150.0);
                    currentValues.put("Padding", 5.0);
                    return true;
                case "Sparse Grid":
                    currentValues.put("Attempts", 500);
                    currentValues.put("Min Radius", 5.0);
                    currentValues.put("Max Radius", 80.0);
                    currentValues.put("Padding", 20.0);
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
        int attempts = (int) params.getOrDefault("Attempts", 2000);
        double minR = (double) params.getOrDefault("Min Radius", 2.0);
        double maxR = (double) params.getOrDefault("Max Radius", 50.0);
        double padding = (double) params.getOrDefault("Padding", 2.0);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);
        List<Circle> circles = new ArrayList<>();
        Random rand = new Random();

        for (int i = 0; i < attempts; i++) {
            double x = rand.nextDouble() * width;
            double y = rand.nextDouble() * height;

            // Check if valid start point (not inside existing circle)
            boolean valid = true;
            for (Circle c : circles) {
                if (dist(x, y, c.x, c.y) < c.r + minR + padding) {
                    valid = false;
                    break;
                }
            }
            if (!valid)
                continue;

            // Grow circle
            double r = maxR;
            // Check nearest neighbor
            for (Circle c : circles) {
                double d = dist(x, y, c.x, c.y);
                r = Math.min(r, d - c.r - padding);
            }
            // Check walls
            r = Math.min(r, x - padding); // Left
            r = Math.min(r, width - x - padding); // Right
            r = Math.min(r, y - padding); // Top
            r = Math.min(r, height - y - padding); // Bottom

            if (r >= minR) {
                circles.add(new Circle(x, y, r));

                // Assign layer based on size (large circles on different layer than small ones)
                // Normalize r between minR and maxR -> 0..1
                double norm = (r - minR) / (maxR - minR);
                // Invert so big circles are layer 0 (or vice versa)
                int layerIndex = (int) (norm * numColors);
                if (layerIndex >= numColors)
                    layerIndex = numColors - 1;

                String circleSvg = String.format(java.util.Locale.US,
                        "<circle cx='%.2f' cy='%.2f' r='%.2f' />", x, y, r);
                canvas.addRaw(layerIndex, circleSvg);
            }
        }

        return canvas.toSvg();
    }

    private double dist(double x1, double y1, double x2, double y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    private static class Circle {
        double x, y, r;

        Circle(double x, double y, double r) {
            this.x = x;
            this.y = y;
            this.r = r;
        }
    }
}
