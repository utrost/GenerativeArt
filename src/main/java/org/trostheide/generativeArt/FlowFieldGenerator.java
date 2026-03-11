package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.utils.PerlinNoise;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class FlowFieldGenerator implements ArtGenerator {

    private static final DecimalFormat df;
    static {
        df = new DecimalFormat("#.##");
        df.setDecimalFormatSymbols(DecimalFormatSymbols.getInstance(Locale.ENGLISH));
    }

    @Override
    public String getId() {
        return "flow-field";
    }

    @Override
    public String getDisplayName() {
        return "Flow Field (Perlin)";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Fine Mist", "Turbulent Rivers", "Macro Flow"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("Particles", 2000, 100, 10000, "Number of lines to draw"),
                ParameterDefinition.doubleVal("Noise Scale", 0.005, 0.001, 0.05,
                        "Zoom level of the noise (lower = smooth, higher = chaos)"),
                ParameterDefinition.integer("Step Length", 10, 1, 50, "Length of each line segment"),
                ParameterDefinition.integer("Max Steps", 50, 10, 500, "Maximum length of a line"),
                ParameterDefinition.integer("Seed", 12345, 1, 999999, "Random seed"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Fine Mist":
                    currentValues.put("Particles", 8000);
                    currentValues.put("Noise Scale", 0.008);
                    currentValues.put("Step Length", 2);
                    currentValues.put("Max Steps", 200);
                    return true;
                case "Turbulent Rivers":
                    currentValues.put("Particles", 1500);
                    currentValues.put("Noise Scale", 0.02);
                    currentValues.put("Step Length", 15);
                    currentValues.put("Max Steps", 80);
                    return true;
                case "Macro Flow":
                    currentValues.put("Particles", 500);
                    currentValues.put("Noise Scale", 0.001);
                    currentValues.put("Step Length", 25);
                    currentValues.put("Max Steps", 150);
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
        // Parameters
        int numParticles = (int) params.getOrDefault("Particles", 2000);
        double noiseScale = (double) params.getOrDefault("Noise Scale", 0.002);
        int stepLen = (int) params.getOrDefault("Step Length", 5);
        int maxSteps = (int) params.getOrDefault("Max Steps", 50);
        int seed = (int) params.getOrDefault("Seed", 42);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        org.trostheide.generativeArt.core.SvgCanvas canvas = new org.trostheide.generativeArt.core.SvgCanvas(width,
                height, numColors);
        PerlinNoise noise = new PerlinNoise(seed);
        java.util.Random rand = new java.util.Random(seed);

        for (int i = 0; i < numParticles; i++) {
            double x = rand.nextDouble() * width;
            double y = rand.nextDouble() * height;

            // Assign layer based on particle index (random distribution)
            int layerIndex = i % numColors;

            StringBuilder pathData = new StringBuilder();
            pathData.append(String.format(java.util.Locale.US, "M %.1f %.1f", x, y));

            for (int s = 0; s < maxSteps; s++) {
                double angle = noise.noise(x * noiseScale, y * noiseScale) * Math.PI * 4;
                double nextX = x + Math.cos(angle) * stepLen;
                double nextY = y + Math.sin(angle) * stepLen;

                pathData.append(" L ").append(df.format(nextX)).append(" ").append(df.format(nextY));

                x = nextX;
                y = nextY;
            }

            // Append the path to the canvas
            String pathString = String.format("<path d=\"%s\" fill=\"none\" opacity=\"0.5\" />", pathData.toString());
            canvas.addRaw(layerIndex, pathString);
        }

        return canvas.toSvg();
    }
}
