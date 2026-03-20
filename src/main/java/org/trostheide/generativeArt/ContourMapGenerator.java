package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class ContourMapGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "contour-map";
    }

    @Override
    public String getDisplayName() {
        return "Contour Map";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom",
                        Arrays.asList("Custom", "Mountain Range", "Rolling Hills", "Island Archipelago", "Canyon Ridges"),
                        "Select a predefined style"),
                ParameterDefinition.integer("Contour Lines", 25, 5, 60, "Number of elevation contour lines"),
                ParameterDefinition.doubleVal("Scale", 3.0, 0.5, 10.0,
                        "Noise scale (higher = more zoomed in features)"),
                ParameterDefinition.integer("Octaves", 4, 1, 8, "Noise octaves for terrain complexity"),
                ParameterDefinition.doubleVal("Persistence", 0.5, 0.1, 0.9, "How much each octave contributes"),
                ParameterDefinition.integer("Resolution", 250, 50, 400, "Grid resolution for contour extraction"),
                ParameterDefinition.bool("Major Lines", true, "Draw thicker lines every 5th contour"),
                ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for terrain generation"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            switch ((String) newValue) {
                case "Mountain Range":
                    currentValues.put("Contour Lines", 30);
                    currentValues.put("Scale", 3.0);
                    currentValues.put("Octaves", 5);
                    currentValues.put("Persistence", 0.5);
                    currentValues.put("Resolution", 300);
                    currentValues.put("Major Lines", true);
                    currentValues.put("Colors", 1);
                    return true;
                case "Rolling Hills":
                    currentValues.put("Contour Lines", 15);
                    currentValues.put("Scale", 2.0);
                    currentValues.put("Octaves", 3);
                    currentValues.put("Persistence", 0.6);
                    currentValues.put("Resolution", 250);
                    currentValues.put("Major Lines", true);
                    currentValues.put("Colors", 1);
                    return true;
                case "Island Archipelago":
                    currentValues.put("Contour Lines", 20);
                    currentValues.put("Scale", 4.0);
                    currentValues.put("Octaves", 4);
                    currentValues.put("Persistence", 0.45);
                    currentValues.put("Resolution", 300);
                    currentValues.put("Major Lines", true);
                    currentValues.put("Colors", 2);
                    return true;
                case "Canyon Ridges":
                    currentValues.put("Contour Lines", 40);
                    currentValues.put("Scale", 5.0);
                    currentValues.put("Octaves", 6);
                    currentValues.put("Persistence", 0.55);
                    currentValues.put("Resolution", 350);
                    currentValues.put("Major Lines", true);
                    currentValues.put("Colors", 1);
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
        int numContours = (int) params.getOrDefault("Contour Lines", 25);
        double scale = (double) params.getOrDefault("Scale", 3.0);
        int octaves = (int) params.getOrDefault("Octaves", 4);
        double persistence = (double) params.getOrDefault("Persistence", 0.5);
        int resolution = (int) params.getOrDefault("Resolution", 250);
        boolean majorLines = (boolean) params.getOrDefault("Major Lines", true);
        int seed = (int) params.getOrDefault("Seed", 42);
        int numColors = (int) params.getOrDefault("Colors", 1);

        double width = 1000, height = 1000;
        if (params.containsKey("width")) width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height")) height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);

        // Simple value noise using random grid
        Random rand = new Random(seed);
        int noiseGridSize = 64;
        double[][] noiseGrid = new double[noiseGridSize + 1][noiseGridSize + 1];
        for (int y = 0; y <= noiseGridSize; y++) {
            for (int x = 0; x <= noiseGridSize; x++) {
                noiseGrid[y][x] = rand.nextDouble() * 2 - 1;
            }
        }

        double cellW = width / resolution;
        double cellH = height / resolution;
        double[][] field = new double[resolution + 1][resolution + 1];
        double minVal = Double.MAX_VALUE, maxVal = -Double.MAX_VALUE;

        for (int iy = 0; iy <= resolution; iy++) {
            for (int ix = 0; ix <= resolution; ix++) {
                double nx = ((double) ix / resolution) * scale;
                double ny = ((double) iy / resolution) * scale;

                double val = 0, amp = 1, freq = 1, maxAmp = 0;
                for (int o = 0; o < octaves; o++) {
                    val += amp * sampleNoise(noiseGrid, noiseGridSize, nx * freq, ny * freq);
                    maxAmp += amp;
                    amp *= persistence;
                    freq *= 2;
                }
                val /= maxAmp;
                field[iy][ix] = val;
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }
        }

        double defaultStrokeWidth = 1.0;

        for (int c = 0; c < numContours; c++) {
            double t = (double) c / (numContours - 1);
            double level = minVal + t * (maxVal - minVal);
            boolean isMajor = majorLines && (c % 5 == 0);
            int layerIndex = c % numColors;

            List<double[]> segments = marchingSquares(field, resolution, cellW, cellH, level);
            String sw = isMajor
                    ? String.format(java.util.Locale.US, "stroke-width='%.2f'", defaultStrokeWidth * 2.0)
                    : String.format(java.util.Locale.US, "stroke-width='%.2f'", defaultStrokeWidth * 0.7);

            for (int i = 0; i + 1 < segments.size(); i += 2) {
                canvas.addRaw(layerIndex, String.format(java.util.Locale.US,
                        "<line x1='%.2f' y1='%.2f' x2='%.2f' y2='%.2f' %s />",
                        segments.get(i)[0], segments.get(i)[1],
                        segments.get(i + 1)[0], segments.get(i + 1)[1], sw));
            }
        }

        return canvas.toSvg();
    }

    private double sampleNoise(double[][] grid, int size, double x, double y) {
        // Wrap coordinates
        double wx = ((x % size) + size) % size;
        double wy = ((y % size) + size) % size;
        int ix = (int) wx, iy = (int) wy;
        double fx = wx - ix, fy = wy - iy;
        // Smoothstep
        fx = fx * fx * (3 - 2 * fx);
        fy = fy * fy * (3 - 2 * fy);

        int ix1 = (ix + 1) % size, iy1 = (iy + 1) % size;
        double v00 = grid[iy][ix], v10 = grid[iy][ix1];
        double v01 = grid[iy1][ix], v11 = grid[iy1][ix1];

        double top = v00 + fx * (v10 - v00);
        double bot = v01 + fx * (v11 - v01);
        return top + fy * (bot - top);
    }

    private List<double[]> marchingSquares(double[][] field, int res, double cellW, double cellH, double level) {
        List<double[]> segments = new ArrayList<>();
        for (int iy = 0; iy < res; iy++) {
            for (int ix = 0; ix < res; ix++) {
                double v0 = field[iy][ix], v1 = field[iy][ix + 1];
                double v2 = field[iy + 1][ix + 1], v3 = field[iy + 1][ix];
                int ci = (v0 >= level ? 1 : 0) | (v1 >= level ? 2 : 0) | (v2 >= level ? 4 : 0) | (v3 >= level ? 8 : 0);
                if (ci == 0 || ci == 15) continue;

                double x0 = ix * cellW, y0 = iy * cellH, x1 = (ix + 1) * cellW, y1 = (iy + 1) * cellH;
                double[] top = {interp(v0, v1, x0, x1, level), y0};
                double[] right = {x1, interp(v1, v2, y0, y1, level)};
                double[] bottom = {interp(v3, v2, x0, x1, level), y1};
                double[] left = {x0, interp(v0, v3, y0, y1, level)};

                switch (ci) {
                    case 1: segments.add(top); segments.add(left); break;
                    case 2: segments.add(top); segments.add(right); break;
                    case 3: segments.add(left); segments.add(right); break;
                    case 4: segments.add(right); segments.add(bottom); break;
                    case 5: segments.add(top); segments.add(right); segments.add(left); segments.add(bottom); break;
                    case 6: segments.add(top); segments.add(bottom); break;
                    case 7: segments.add(left); segments.add(bottom); break;
                    case 8: segments.add(left); segments.add(bottom); break;
                    case 9: segments.add(top); segments.add(bottom); break;
                    case 10: segments.add(top); segments.add(left); segments.add(right); segments.add(bottom); break;
                    case 11: segments.add(right); segments.add(bottom); break;
                    case 12: segments.add(left); segments.add(right); break;
                    case 13: segments.add(top); segments.add(right); break;
                    case 14: segments.add(top); segments.add(left); break;
                }
            }
        }
        return segments;
    }

    private double interp(double va, double vb, double a, double b, double level) {
        double t = (level - va) / (vb - va);
        return a + t * (b - a);
    }
}
