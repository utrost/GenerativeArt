package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.*;

import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Random;

public class ParametricGridGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "parametric_grid";
    }

    @Override
    public String getDisplayName() {
        return "Parametric Grid";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Subtle Disruption", "High Chaos", "Dense Matrix"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("macroSize", 5, 2, 20, "Macro Grid Size (blocks)"),
                ParameterDefinition.integer("microSize", 10, 2, 30, "Micro Grid Size (squares per block)"),
                ParameterDefinition.doubleVal("maxRotation", 45.0, 0.0, 180.0, "Max Chaos Rotation (degrees)"),
                ParameterDefinition.doubleVal("minScale", 0.2, 0.0, 1.0, "Min Scale at bottom"),
                ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Subtle Disruption":
                    currentValues.put("macroSize", 4);
                    currentValues.put("microSize", 8);
                    currentValues.put("maxRotation", 15.0);
                    currentValues.put("minScale", 0.5);
                    currentValues.put("seed", 10);
                    return true;
                case "High Chaos":
                    currentValues.put("macroSize", 6);
                    currentValues.put("microSize", 12);
                    currentValues.put("maxRotation", 90.0);
                    currentValues.put("minScale", 0.1);
                    currentValues.put("seed", 20);
                    return true;
                case "Dense Matrix":
                    currentValues.put("macroSize", 10);
                    currentValues.put("microSize", 20);
                    currentValues.put("maxRotation", 30.0);
                    currentValues.put("minScale", 0.3);
                    currentValues.put("seed", 30);
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
        int macroSize = (int) params.getOrDefault("macroSize", 5);
        int microSize = (int) params.getOrDefault("microSize", 10);
        double maxRotation = (double) params.getOrDefault("maxRotation", 45.0);
        double minScale = (double) params.getOrDefault("minScale", 0.2);
        int seed = (int) params.getOrDefault("seed", 1234);

        double width = 800;
        double height = 800; // Square canvas fits this best

        // Single layer for now, usually black on white
        SvgCanvas canvas = new SvgCanvas(width, height, 1);
        canvas.setStrokeWidth(1.5); // Slightly thicker lines look nice

        Random rand = new Random(seed);

        double macroCellW = width / macroSize;
        double macroCellH = height / macroSize;

        for (int r = 0; r < macroSize; r++) {
            for (int c = 0; c < macroSize; c++) {
                // Macro Position Normalized (0.0 to 1.0)
                // Center of randomness vs Edge?
                // Request: Left to Right -> Chaos increases.
                // Request: Top to Bottom -> Size decreases.

                double macroXFactor = (double) c / (macroSize - 1); // 0 at left, 1 at right
                double macroYFactor = (double) r / (macroSize - 1); // 0 at top, 1 at bottom
                if (macroSize == 1) {
                    macroXFactor = 0;
                    macroYFactor = 0;
                }

                // Local parameters for this block
                double chaosRange = macroXFactor * maxRotation; // degrees
                double scaleBase = 1.0 - (macroYFactor * (1.0 - minScale)); // 1.0 -> minScale

                drawMicroGrid(canvas, r, c, macroCellW, macroCellH, microSize, chaosRange, scaleBase, rand);
            }
        }

        return canvas.toSvg();
    }

    private void drawMicroGrid(SvgCanvas canvas, int macroRow, int macroCol,
            double w, double h, int microSize,
            double chaosRange, double scale, Random rand) {

        double startX = macroCol * w;
        double startY = macroRow * h;

        double cellW = w / microSize;
        double cellH = h / microSize;

        // Gap for aesthetics
        double padding = cellW * 0.1;
        double sqSize = (cellW - padding * 2) * scale;

        for (int r = 0; r < microSize; r++) {
            for (int c = 0; c < microSize; c++) {
                double cx = startX + c * cellW + cellW / 2.0;
                double cy = startY + r * cellH + cellH / 2.0;

                // Rotation
                // Chaos: -range to +range
                double rotDeg = (rand.nextDouble() * 2 - 1) * chaosRange;
                double rotRad = Math.toRadians(rotDeg);

                drawRotatedSquare(canvas, cx, cy, sqSize, rotRad);
            }
        }
    }

    private void drawRotatedSquare(SvgCanvas canvas, double cx, double cy, double size, double angleRad) {
        double half = size / 2.0;

        // Corners relative to center (unrotated)
        double[] x = { -half, half, half, -half };
        double[] y = { -half, -half, half, half };

        double cosA = Math.cos(angleRad);
        double sinA = Math.sin(angleRad);

        double[] rx = new double[4];
        double[] ry = new double[4];

        for (int i = 0; i < 4; i++) {
            rx[i] = cx + (x[i] * cosA - y[i] * sinA);
            ry[i] = cy + (x[i] * sinA + y[i] * cosA);
        }

        // Draw 4 lines
        for (int i = 0; i < 4; i++) {
            int next = (i + 1) % 4;
            canvas.addLine(0, rx[i], ry[i], rx[next], ry[next]);
        }
    }
}
