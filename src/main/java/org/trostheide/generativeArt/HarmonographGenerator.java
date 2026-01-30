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
        return "Harmonograph (Lateral & Rotary)";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
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

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);

        double centerX = width / 2;
        double centerY = height / 2;

        // Scale is handled by Amplitudes now, but we check bounds
        // No explicit scaling needed if Amplitudes are in pixels.

        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        for (int i = 0; i < steps; i++) {
            double t = i * 0.01; // Time step
            double decay = Math.exp(-d * t);

            double x, y;

            if (rotary) {
                // Rotary: Two rotating vectors
                // Vector 1: Length A1, Freq f1, Phase p1
                // Vector 2: Length A2, Freq f2, Phase p2
                // We sum them.
                // x = A1 * cos(f1*t + p1) + A2 * cos(f2*t + p2)
                // y = A1 * sin(f1*t + p1) + A2 * sin(f2*t + p2)
                // Actually counter-rotating often produces good results.
                // Let's assume user enters positive/negative freqs for direction??
                // Typical UI slider for freq is positive.
                // To get the "flowery" patterns, usually they rotate in opposite directions or
                // different speeds.
                // Let's stick to the parameters. If user wants opposite, they can't set
                // negative freq with current params
                // unless I change min to negative.
                // Current min is 0.1.
                // I should probably allow negative frequencies for Rotary!
                // Or I can add a "Opposed" checkbox?
                // Let's just implement the formula as is. To get interesting rotary, f1 and f2
                // often need to be close or ratio.

                x = decay * (a1 * Math.cos(f1 * t + p1) + a2 * Math.cos(f2 * t + p2));
                y = decay * (a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2));
            } else {
                // Lateral: Independent X and Y oscillations
                // X = A1*sin(f1*t + p1) + A2*sin(f2*t + p2)
                // Y = A1*sin(f3*t) + A2*sin(f4*t)
                // Wait, lateral usually has 2 pendulums for X and 2 for Y? Or 1 for X, 1 for Y?
                // The previous implementation had 2 sine waves for X and 2 for Y. (f1/f2 for X,
                // f3/f4 for Y).
                // I'll keep that but reuse A1/A2.
                // X depends on f1, f2. Y depends on f3, f4.
                // Amplitudes: A1 for the first component pair, A2 for the second?

                x = decay * (a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2));
                y = decay * (a1 * Math.sin(f3 * t) + a2 * Math.sin(f4 * t)); // Phases for Y simplified to 0? Or reuse
                                                                             // p1/p2?
                // Reusing p1/p2 for X. Y phases 0 for now to avoid too many params.
            }

            double screenX = centerX + x;
            double screenY = centerY + y;

            if (!first) {
                // Color layering
                int layerIndex = (i / 500) % numColors;
                canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
            }

            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        return canvas.toSvg();
    }
}
