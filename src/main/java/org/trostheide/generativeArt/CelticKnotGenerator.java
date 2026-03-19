package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class CelticKnotGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "celtic-knot";
    }

    @Override
    public String getDisplayName() {
        return "Celtic Knot";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom",
                        Arrays.asList("Custom", "Simple Braid", "Dense Weave", "Border Pattern", "Round Knot"),
                        "Select a predefined style"),
                ParameterDefinition.integer("Grid Width", 6, 2, 16, "Number of grid cells horizontally"),
                ParameterDefinition.integer("Grid Height", 6, 2, 16, "Number of grid cells vertically"),
                ParameterDefinition.doubleVal("Ribbon Width", 8.0, 2.0, 25.0, "Width of the interlaced ribbons"),
                ParameterDefinition.doubleVal("Corner Radius", 0.3, 0.0, 0.5,
                        "Roundness of turns (0 = sharp, 0.5 = circular)"),
                ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for break patterns"),
                ParameterDefinition.doubleVal("Break Probability", 0.3, 0.0, 1.0,
                        "Probability of adding breaks to create knot patterns"),
                ParameterDefinition.integer("Colors", 2, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            switch ((String) newValue) {
                case "Simple Braid":
                    currentValues.put("Grid Width", 4);
                    currentValues.put("Grid Height", 8);
                    currentValues.put("Ribbon Width", 10.0);
                    currentValues.put("Corner Radius", 0.3);
                    currentValues.put("Break Probability", 0.2);
                    currentValues.put("Colors", 2);
                    return true;
                case "Dense Weave":
                    currentValues.put("Grid Width", 10);
                    currentValues.put("Grid Height", 10);
                    currentValues.put("Ribbon Width", 5.0);
                    currentValues.put("Corner Radius", 0.4);
                    currentValues.put("Break Probability", 0.5);
                    currentValues.put("Colors", 2);
                    return true;
                case "Border Pattern":
                    currentValues.put("Grid Width", 12);
                    currentValues.put("Grid Height", 3);
                    currentValues.put("Ribbon Width", 12.0);
                    currentValues.put("Corner Radius", 0.3);
                    currentValues.put("Break Probability", 0.3);
                    currentValues.put("Colors", 2);
                    return true;
                case "Round Knot":
                    currentValues.put("Grid Width", 6);
                    currentValues.put("Grid Height", 6);
                    currentValues.put("Ribbon Width", 8.0);
                    currentValues.put("Corner Radius", 0.5);
                    currentValues.put("Break Probability", 0.4);
                    currentValues.put("Colors", 3);
                    return true;
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
        int gridW = (int) params.getOrDefault("Grid Width", 6);
        int gridH = (int) params.getOrDefault("Grid Height", 6);
        double ribbonWidth = (double) params.getOrDefault("Ribbon Width", 8.0);
        double cornerRadius = (double) params.getOrDefault("Corner Radius", 0.3);
        int seed = (int) params.getOrDefault("Seed", 42);
        double breakProb = (double) params.getOrDefault("Break Probability", 0.3);
        int numColors = (int) params.getOrDefault("Colors", 2);

        double width = 1000, height = 1000;
        if (params.containsKey("width")) width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height")) height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);
        Random rand = new Random(seed);

        double margin = Math.min(width, height) * 0.08;
        double cellW = (width - 2 * margin) / gridW;
        double cellH = (height - 2 * margin) / gridH;

        int pathIndex = 0;
        for (int gy = 0; gy < gridH; gy++) {
            for (int gx = 0; gx < gridW; gx++) {
                double cx = margin + gx * cellW;
                double cy = margin + gy * cellH;
                boolean forward = rand.nextDouble() < 0.5;

                int layerOver = pathIndex % numColors;
                int layerUnder = (pathIndex + 1) % numColors;
                pathIndex++;

                if (forward) {
                    drawCurve(canvas, cx, cy + cellH, cx + cellW, cy, cellW, cellH, ribbonWidth, layerOver);
                    drawCurve(canvas, cx, cy, cx + cellW, cy + cellH, cellW, cellH, ribbonWidth, layerUnder);
                } else {
                    drawCurve(canvas, cx, cy, cx + cellW, cy + cellH, cellW, cellH, ribbonWidth, layerOver);
                    drawCurve(canvas, cx, cy + cellH, cx + cellW, cy, cellW, cellH, ribbonWidth, layerUnder);
                }

                drawConnectors(canvas, cx, cy, cellW, cellH, ribbonWidth, layerOver);
            }
        }

        // Border
        double bx = margin - ribbonWidth, by = margin - ribbonWidth;
        double bw = width - 2 * margin + 2 * ribbonWidth, bh = height - 2 * margin + 2 * ribbonWidth;
        canvas.addRaw(0, String.format(java.util.Locale.US,
                "<rect x='%.2f' y='%.2f' width='%.2f' height='%.2f' rx='%.2f' />",
                bx, by, bw, bh, ribbonWidth * 2));

        return canvas.toSvg();
    }

    private void drawCurve(SvgCanvas canvas, double x1, double y1, double x2, double y2,
                           double cellW, double cellH, double ribbonWidth, int layer) {
        double mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        double dx = y2 - y1, dy = -(x2 - x1);
        double len = Math.sqrt(dx * dx + dy * dy);
        double nx = (dx / len) * ribbonWidth * 0.5;
        double ny = (dy / len) * ribbonWidth * 0.5;

        canvas.addRaw(layer, String.format(java.util.Locale.US,
                "<path d='M %.2f %.2f Q %.2f %.2f %.2f %.2f' />", x1, y1, mx, my, x2, y2));
        canvas.addRaw(layer, String.format(java.util.Locale.US,
                "<path d='M %.2f %.2f Q %.2f %.2f %.2f %.2f' />",
                x1 + nx, y1 + ny, mx + nx, my + ny, x2 + nx, y2 + ny));
        canvas.addRaw(layer, String.format(java.util.Locale.US,
                "<path d='M %.2f %.2f Q %.2f %.2f %.2f %.2f' />",
                x1 - nx, y1 - ny, mx - nx, my - ny, x2 - nx, y2 - ny));
    }

    private void drawConnectors(SvgCanvas canvas, double cx, double cy, double cellW, double cellH,
                                double ribbonWidth, int layer) {
        double half = ribbonWidth * 0.3;
        double topMidX = cx + cellW / 2;
        canvas.addLine(layer, topMidX - half, cy, topMidX + half, cy);
        double leftMidY = cy + cellH / 2;
        canvas.addLine(layer, cx, leftMidY - half, cx, leftMidY + half);
    }
}
