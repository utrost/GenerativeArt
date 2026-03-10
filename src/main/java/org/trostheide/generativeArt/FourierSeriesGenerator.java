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

        double targetWidth = params.containsKey("width") ? ((Number) params.get("width")).doubleValue() : 1000;
        double targetHeight = params.containsKey("height") ? ((Number) params.get("height")).doubleValue() : 1000;

        double genWidth = 800;
        double startY = 50.0;

        double minX = Double.MAX_VALUE, maxX = -Double.MAX_VALUE;
        double minY = Double.MAX_VALUE, maxY = -Double.MAX_VALUE;

        java.util.List<String> paths = new java.util.ArrayList<>();

        for (int i = 0; i < lineCount; i++) {
            int terms = i + 1;
            double yBase = startY + i * verticalSpacing;
            StringBuilder path = new StringBuilder();
            int steps = 1000;
            boolean first = true;

            for (int s = 0; s <= steps; s++) {
                double x = (double) s / steps * genWidth;
                double theta = (double) s / steps * 2 * Math.PI * frequency;

                double val = calculateFourierSum(waveform, terms, theta);
                double y = yBase + val * amplitude;

                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;

                if (first) {
                    path.append(String.format(Locale.US, "M %.2f %.2f", x, y));
                    first = false;
                } else {
                    path.append(String.format(Locale.US, " L %.2f %.2f", x, y));
                }
            }

            paths.add(String.format("<path d='%s' vector-effect='non-scaling-stroke' />", path.toString()));
        }

        double margin = 50.0;
        double bboxWidth = maxX - minX;
        double bboxHeight = maxY - minY;
        if (bboxWidth <= 0) bboxWidth = 1;
        if (bboxHeight <= 0) bboxHeight = 1;

        double scale = Math.min((targetWidth - 2 * margin) / bboxWidth, (targetHeight - 2 * margin) / bboxHeight);
        double offsetX = (targetWidth - bboxWidth * scale) / 2.0 - minX * scale;
        double offsetY = (targetHeight - bboxHeight * scale) / 2.0 - minY * scale;

        SvgCanvas canvas = new SvgCanvas(targetWidth, targetHeight, 1);
        canvas.setStrokeWidth(1.5);
        canvas.addRaw(0, String.format(Locale.US, "<g transform='translate(%.1f, %.1f) scale(%.4f)'>", offsetX, offsetY, scale));
        for (String p : paths) {
            canvas.addRaw(0, p);
        }
        canvas.addRaw(0, "</g>");

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
