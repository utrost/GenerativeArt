package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.List;
import java.util.Map;

public class PhyllotaxisGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "phyllotaxis";
    }

    @Override
    public String getDisplayName() {
        return "Phyllotaxis (Sunflowers)";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Sunflower", "Tight Spiral", "Loose Swirl"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("Dot Count", 500, 100, 5000, "Number of seeds/dots"),
                ParameterDefinition.doubleVal("Spread (c)", 6.0, 2.0, 20.0, "Spacing between dots"),
                ParameterDefinition.doubleVal("Dot Size", 2.0, 0.5, 10.0, "Size of each dot"),
                ParameterDefinition.doubleVal("Angle Offset", 0.0, -5.0, 5.0,
                        "Deviation from Golden Angle (creates spirals)"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Sunflower":
                    currentValues.put("Dot Count", 1000);
                    currentValues.put("Spread (c)", 5.0);
                    currentValues.put("Dot Size", 3.0);
                    currentValues.put("Angle Offset", 0.0);
                    currentValues.put("Colors", 2);
                    return true;
                case "Tight Spiral":
                    currentValues.put("Dot Count", 2000);
                    currentValues.put("Spread (c)", 3.0);
                    currentValues.put("Dot Size", 1.5);
                    currentValues.put("Angle Offset", 0.1);
                    currentValues.put("Colors", 3);
                    return true;
                case "Loose Swirl":
                    currentValues.put("Dot Count", 500);
                    currentValues.put("Spread (c)", 10.0);
                    currentValues.put("Dot Size", 4.0);
                    currentValues.put("Angle Offset", -0.5);
                    currentValues.put("Colors", 1);
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
        int count = (int) params.getOrDefault("Dot Count", 500);
        double c = (double) params.getOrDefault("Spread (c)", 6.0);
        double size = (double) params.getOrDefault("Dot Size", 2.0);
        double angleOffset = (double) params.getOrDefault("Angle Offset", 0.0);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);

        double centerX = width / 2;
        double centerY = height / 2;

        // Golden Angle in degrees = 137.50776...
        double goldenAngle = 137.5;

        for (int n = 0; n < count; n++) {
            // Formula: phi = n * 137.5, r = c * sqrt(n)
            double a = n * (goldenAngle + angleOffset);
            double r = c * Math.sqrt(n);

            double x = r * Math.cos(Math.toRadians(a)) + centerX;
            double y = r * Math.sin(Math.toRadians(a)) + centerY;

            // Assign layer based on distance from center (rings) or angle (sectors)
            // Here we use rings for a nice gradient effect
            int layerIndex = (n / 50) % numColors;

            // Draw circle
            // Optimized circle for plotting: small polygon or just circle if plotter driver
            // handles it
            // Using standard SVG circle
            String circle = String.format(java.util.Locale.US,
                    "<circle cx='%.2f' cy='%.2f' r='%.2f' />", x, y, size);

            canvas.addRaw(layerIndex, circle);
        }

        return canvas.toSvg();
    }
}
