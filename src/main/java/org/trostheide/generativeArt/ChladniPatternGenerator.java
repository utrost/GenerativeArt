package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class ChladniPatternGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "chladni-pattern";
    }

    @Override
    public String getDisplayName() {
        return "Chladni Patterns";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom",
                        Arrays.asList("Custom", "Square Plate Mode (3,2)", "Circular Drum", "High Frequency", "Simple Cross"),
                        "Select a predefined style"),
                ParameterDefinition.integer("M", 3, 1, 12, "Horizontal mode number"),
                ParameterDefinition.integer("N", 2, 1, 12, "Vertical mode number"),
                ParameterDefinition.doubleVal("Threshold", 0.05, 0.01, 0.3,
                        "Nodal line thickness (lower = thinner lines)"),
                ParameterDefinition.integer("Resolution", 300, 50, 500,
                        "Grid resolution for contour extraction"),
                ParameterDefinition.integer("Contour Levels", 8, 1, 20,
                        "Number of displacement contour lines"),
                ParameterDefinition.bool("Show Nodal Lines Only", false,
                        "Show only the zero-displacement nodal lines"),
                ParameterDefinition.integer("Colors", 2, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            switch ((String) newValue) {
                case "Square Plate Mode (3,2)":
                    currentValues.put("M", 3);
                    currentValues.put("N", 2);
                    currentValues.put("Threshold", 0.05);
                    currentValues.put("Resolution", 300);
                    currentValues.put("Contour Levels", 8);
                    currentValues.put("Show Nodal Lines Only", false);
                    currentValues.put("Colors", 2);
                    return true;
                case "Circular Drum":
                    currentValues.put("M", 5);
                    currentValues.put("N", 3);
                    currentValues.put("Threshold", 0.04);
                    currentValues.put("Resolution", 300);
                    currentValues.put("Contour Levels", 10);
                    currentValues.put("Show Nodal Lines Only", false);
                    currentValues.put("Colors", 2);
                    return true;
                case "High Frequency":
                    currentValues.put("M", 8);
                    currentValues.put("N", 7);
                    currentValues.put("Threshold", 0.03);
                    currentValues.put("Resolution", 400);
                    currentValues.put("Contour Levels", 5);
                    currentValues.put("Show Nodal Lines Only", true);
                    currentValues.put("Colors", 1);
                    return true;
                case "Simple Cross":
                    currentValues.put("M", 2);
                    currentValues.put("N", 1);
                    currentValues.put("Threshold", 0.06);
                    currentValues.put("Resolution", 250);
                    currentValues.put("Contour Levels", 12);
                    currentValues.put("Show Nodal Lines Only", false);
                    currentValues.put("Colors", 2);
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
        int m = (int) params.getOrDefault("M", 3);
        int n = (int) params.getOrDefault("N", 2);
        int resolution = (int) params.getOrDefault("Resolution", 300);
        int contourLevels = (int) params.getOrDefault("Contour Levels", 8);
        boolean nodalOnly = (boolean) params.getOrDefault("Show Nodal Lines Only", false);
        int numColors = (int) params.getOrDefault("Colors", 2);

        double width = 1000, height = 1000;
        if (params.containsKey("width")) width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height")) height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);

        double cellW = width / resolution;
        double cellH = height / resolution;
        double[][] field = new double[resolution + 1][resolution + 1];

        for (int iy = 0; iy <= resolution; iy++) {
            for (int ix = 0; ix <= resolution; ix++) {
                double x = (double) ix / resolution;
                double y = (double) iy / resolution;
                field[iy][ix] = Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y)
                        - Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y);
            }
        }

        if (nodalOnly) {
            List<double[]> segments = marchingSquares(field, resolution, cellW, cellH, 0);
            for (int i = 0; i + 1 < segments.size(); i += 2) {
                canvas.addLine(0, segments.get(i)[0], segments.get(i)[1],
                        segments.get(i + 1)[0], segments.get(i + 1)[1]);
            }
        } else {
            double maxVal = 2.0;
            for (int c = 0; c < contourLevels; c++) {
                double level = -maxVal + (2 * maxVal * c) / (contourLevels - 1);
                int layerIndex = c % numColors;
                List<double[]> segments = marchingSquares(field, resolution, cellW, cellH, level);
                for (int i = 0; i + 1 < segments.size(); i += 2) {
                    canvas.addLine(layerIndex, segments.get(i)[0], segments.get(i)[1],
                            segments.get(i + 1)[0], segments.get(i + 1)[1]);
                }
            }
        }

        return canvas.toSvg();
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
