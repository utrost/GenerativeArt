package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.List;
import java.util.Map;

public class HarmonographGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "harmonograph";
    }

    @Override
    public String getDisplayName() {
        return "Harmonograph (Pendulums)";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("Steps", 5000, 1000, 20000, "Number of points to draw"),
                ParameterDefinition.doubleVal("Frequency A", 2.0, 0.1, 10.0, "Frequency of Pendulum 1 X"),
                ParameterDefinition.doubleVal("Frequency B", 2.01, 0.1, 10.0, "Frequency of Pendulum 1 Y"),
                ParameterDefinition.doubleVal("Frequency C", 3.0, 0.1, 10.0, "Frequency of Pendulum 2 X"),
                ParameterDefinition.doubleVal("Frequency D", 3.01, 0.1, 10.0, "Frequency of Pendulum 2 Y"),
                ParameterDefinition.doubleVal("Damping", 0.002, 0.0, 0.01, "Friction/Decay rate"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public String generate(Map<String, Object> params) {
        int steps = (int) params.getOrDefault("Steps", 5000);
        double f1 = (double) params.getOrDefault("Frequency A", 2.0);
        double f2 = (double) params.getOrDefault("Frequency B", 2.01);
        double f3 = (double) params.getOrDefault("Frequency C", 3.0);
        double f4 = (double) params.getOrDefault("Frequency D", 3.01);
        double d = (double) params.getOrDefault("Damping", 0.002);
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
        double scale = Math.min(width, height) * 0.4; // Leave some margin

        // Initial phase offsets (could be parameters too)
        double p1 = Math.PI / 2;
        double p2 = 0;
        double p3 = Math.PI / 3;
        double p4 = Math.PI / 5;

        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        for (int i = 0; i < steps; i++) {
            double t = (double) i * 0.05;
            double decay = Math.exp(-d * t);

            // Harmonograph equations: x = A*sin(at+p) + B*sin(bt+p), y = C*sin(ct+p) +
            // D*sin(dt+p)
            // Simplifying to 1 pendulum pair per axis for this implementation
            double x = decay * (Math.sin(t * f1 + p1) + Math.sin(t * f2 + p2));
            double y = decay * (Math.sin(t * f3 + p3) + Math.sin(t * f4 + p4));

            // Map to screen coordinates
            double screenX = centerX + x * scale * 0.5; // *0.5 because max amplitude is ~2
            double screenY = centerY + y * scale * 0.5;

            if (!first) {
                // Distribute segments across layers for multi-color effect
                // Using larger chunks for smoother color transitions
                int layerIndex = (i / 100) % numColors;
                canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
            }

            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        return canvas.toSvg();
    }
}
