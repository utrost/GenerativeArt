package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

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

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("Iterations", 10000, 1000, 50000, "Number of points"),
                ParameterDefinition.doubleVal("A", 1.5, -3.0, 3.0, "Chaos Parameter A"),
                ParameterDefinition.doubleVal("B", -1.8, -3.0, 3.0, "Chaos Parameter B"),
                ParameterDefinition.doubleVal("C", 1.6, -3.0, 3.0, "Chaos Parameter C"),
                ParameterDefinition.doubleVal("D", 0.9, -3.0, 3.0, "Chaos Parameter D"),
                ParameterDefinition.doubleVal("Scale", 200.0, 50.0, 500.0, "Zoom level"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
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

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);

        double centerX = width / 2;
        double centerY = height / 2;

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

        double prevX = x * scale + centerX;
        double prevY = y * scale + centerY;
        boolean first = true;

        for (int i = 0; i < iterations; i++) {
            // Clifford Attractor
            double xn = Math.sin(a * y) + c * Math.cos(a * x);
            double yn = Math.sin(b * x) + d * Math.cos(b * y);

            x = xn;
            y = yn;

            double screenX = x * scale + centerX;
            double screenY = y * scale + centerY;

            if (!first) {
                // Color path by time/iteration to show the trajectory
                int layerIndex = (i / (iterations / numColors)) % numColors;
                if (layerIndex >= numColors)
                    layerIndex = numColors - 1;

                // Only draw if distance is reasonable (avoid jumping across screen if attractor
                // is disjoint)
                double dist = Math.hypot(screenX - prevX, screenY - prevY);
                if (dist < 100) {
                    canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
                }
            }

            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        return canvas.toSvg();
    }
}
