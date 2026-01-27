package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.*;

import java.util.List;
import java.util.Map;
import java.util.Locale;

public class FourierSeriesGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "fourier_series";
    }

    @Override
    public String getDisplayName() {
        return "Fourier Series";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("waveform", "Square", List.of("Square", "Triangle", "Sawtooth"),
                        "Waveform type"),
                ParameterDefinition.integer("lineCount", 20, 1, 100, "Number of lines (approximation steps)"),
                ParameterDefinition.doubleVal("amplitude", 50.0, 1.0, 200.0, "Wave amplitude"),
                ParameterDefinition.doubleVal("frequency", 2.0, 0.1, 20.0, "Cycles per width"),
                ParameterDefinition.doubleVal("verticalSpacing", 20.0, 5.0, 100.0, "Vertical spacing between lines"));
    }

    @Override
    public String generate(Map<String, Object> params) {
        String waveform = (String) params.getOrDefault("waveform", "Square");
        int lineCount = (int) params.getOrDefault("lineCount", 20);
        double amplitude = (double) params.getOrDefault("amplitude", 50.0);
        double frequency = (double) params.getOrDefault("frequency", 2.0);
        double verticalSpacing = (double) params.getOrDefault("verticalSpacing", 20.0);

        double width = 800;
        double height = Math.max(600, (lineCount + 2) * verticalSpacing);

        SvgCanvas canvas = new SvgCanvas(width, height, 1);
        canvas.setStrokeWidth(1.5);

        // Center vertically somewhat if height allows, or just start from top padding
        double startY = 50.0;

        for (int i = 0; i < lineCount; i++) {
            // i represents the index of the line (0 to lineCount-1).
            // The number of terms we use is i + 1.
            int terms = i + 1;

            double yBase = startY + i * verticalSpacing;

            StringBuilder path = new StringBuilder();

            // Resolution of the curve
            int steps = 1000;
            boolean first = true;

            for (int s = 0; s <= steps; s++) {
                double x = (double) s / steps * width;

                // Normalized angle: 0 to 2*PI * frequency across the width
                double theta = (double) s / steps * 2 * Math.PI * frequency;

                double val = calculateFourierSum(waveform, terms, theta);

                double y = yBase + val * amplitude;

                if (first) {
                    path.append(String.format(Locale.US, "M %.2f %.2f", x, y));
                    first = false;
                } else {
                    path.append(String.format(Locale.US, " L %.2f %.2f", x, y));
                }
            }

            // Fix: Wrap in proper path tag
            String pathTag = String.format("<path d='%s' />", path.toString());
            canvas.addPath(0, pathTag);
        }

        return canvas.toSvg();
    }

    private double calculateFourierSum(String type, int terms, double theta) {
        double sum = 0;

        // Normalize input string case
        String lowerType = type.toLowerCase();

        if (lowerType.contains("square")) {
            // Square wave: sum_{k=1,3,5...} sin(kx)/k
            // We want first 'terms' non-zero terms.
            // 1st term: k=1. 2nd term: k=3. j-th term: k = 2*j - 1
            for (int j = 1; j <= terms; j++) {
                int k = 2 * j - 1;
                sum += Math.sin(k * theta) / k;
            }
            // Scale factor to make peak approx 1? 4/PI approx 1.27.
            // Standard Fourier series for square wave of amplitude 1 is (4/pi) * ...
            // I'll leave the physics scaling to be implicit or explicit?
            // Let's normalize slightly so amplitude param feels correct.
            // Max value of simple sin is 1. Max of square series is ~0.78 * 1.27 = 1.
            // We'll just return the raw sum, it's aesthetically pleasing.
        } else if (lowerType.contains("triangle")) {
            // Triangle wave: sum_{k=1,3,5...} (-1)^((k-1)/2) * sin(kx) / k^2
            // 8/pi^2 scaling.
            for (int j = 1; j <= terms; j++) {
                int k = 2 * j - 1;
                double sign = ((j - 1) % 2 == 0) ? 1.0 : -1.0;
                sum += sign * Math.sin(k * theta) / (k * k);
            }
        } else if (lowerType.contains("sawtooth")) {
            // Sawtooth: sum_{k=1,2,3...} (-1)^(k+1) * sin(kx) / k
            // 2/pi scaling.
            for (int k = 1; k <= terms; k++) {
                double sign = ((k + 1) % 2 == 0) ? 1.0 : -1.0; // (-1)^(k+1) means k=1 -> +1, k=2 -> -1
                // Actually (-1)^(k+1) corresponds to standard sawtooth rising.
                // Let's just do -sin(kx)/k for simplicity or matching standard
                sum += sign * Math.sin(k * theta) / k;
            }
        } else {
            // Default to simple sine if unknown
            sum = Math.sin(theta);
        }

        return sum;
    }
}
