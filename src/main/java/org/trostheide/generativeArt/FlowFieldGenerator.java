package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.utils.PerlinNoise;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

public class FlowFieldGenerator implements ArtGenerator {

    private int width = 1000;
    private int height = 1000;
    private int numParticles = 2000;
    private double noiseScale = 0.005;
    private int stepSize = 10;
    private int maxSteps = 100;
    private long seed = 12345;

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

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("Particles", 2000, 100, 10000, "Number of lines to draw"),
                ParameterDefinition.doubleVal("Noise Scale", 0.005, 0.001, 0.05,
                        "Zoom level of the noise (lower = smooth, higher = chaos)"),
                ParameterDefinition.integer("Step Length", 10, 1, 50, "Length of each line segment"),
                ParameterDefinition.integer("Max Steps", 50, 10, 500, "Maximum length of a line"),
                ParameterDefinition.integer("Seed", 12345, 1, 999999, "Random seed"));
    }

    @Override
    public String generate(Map<String, Object> params) {
        // Params
        if (params.containsKey("Particles"))
            this.numParticles = ((Number) params.get("Particles")).intValue();
        if (params.containsKey("Noise Scale"))
            this.noiseScale = ((Number) params.get("Noise Scale")).doubleValue();
        if (params.containsKey("Step Length"))
            this.stepSize = ((Number) params.get("Step Length")).intValue();
        if (params.containsKey("Max Steps"))
            this.maxSteps = ((Number) params.get("Max Steps")).intValue();
        if (params.containsKey("Seed"))
            this.seed = ((Number) params.get("Seed")).longValue();

        PerlinNoise noise = new PerlinNoise(seed);
        Random rand = new Random(seed);
        StringBuilder svg = new StringBuilder();

        svg.append(String.format(
                "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\" viewBox=\"0 0 %d %d\" style=\"background-color:white\">\n",
                width, height, width, height));

        for (int i = 0; i < numParticles; i++) {
            // Start at random position
            double x = rand.nextDouble() * width;
            double y = rand.nextDouble() * height;

            svg.append("<path d=\"M ").append(df.format(x)).append(" ").append(df.format(y));

            for (int step = 0; step < maxSteps; step++) {
                // Get noise value at current pos
                double angle = noise.noise(x * noiseScale, y * noiseScale) * Math.PI * 4; // Map 0..1 to 0..4PI (2
                                                                                          // rotations)

                double nextX = x + Math.cos(angle) * stepSize;
                double nextY = y + Math.sin(angle) * stepSize;

                // Stop if out of bounds
                if (nextX < 0 || nextX > width || nextY < 0 || nextY > height) {
                    break;
                }

                svg.append(" L ").append(df.format(nextX)).append(" ").append(df.format(nextY));

                x = nextX;
                y = nextY;
            }
            svg.append("\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\" opacity=\"0.5\" />\n");
        }

        svg.append("</svg>");
        return svg.toString();
    }
}
