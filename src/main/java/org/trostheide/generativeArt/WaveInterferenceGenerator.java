package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class WaveInterferenceGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "wave-interference";
    }

    @Override
    public String getDisplayName() {
        return "Wave Interference";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom",
                        Arrays.asList("Custom", "Two Sources", "Triple Point", "Ripple Pool", "Standing Wave"),
                        "Select a predefined style"),
                ParameterDefinition.integer("Sources", 3, 1, 8, "Number of wave sources"),
                ParameterDefinition.doubleVal("Wavelength", 30.0, 5.0, 100.0, "Distance between wave crests"),
                ParameterDefinition.doubleVal("Amplitude", 1.0, 0.1, 3.0, "Wave strength"),
                ParameterDefinition.integer("Contour Lines", 20, 5, 50, "Number of interference contour lines"),
                ParameterDefinition.doubleVal("Line Spacing", 0.3, 0.05, 1.0, "Spacing between contour levels"),
                ParameterDefinition.integer("Resolution", 200, 50, 400, "Grid resolution for marching squares"),
                ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for source positions"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            switch ((String) newValue) {
                case "Two Sources":
                    currentValues.put("Sources", 2);
                    currentValues.put("Wavelength", 40.0);
                    currentValues.put("Amplitude", 1.0);
                    currentValues.put("Contour Lines", 20);
                    currentValues.put("Line Spacing", 0.3);
                    currentValues.put("Resolution", 200);
                    return true;
                case "Triple Point":
                    currentValues.put("Sources", 3);
                    currentValues.put("Wavelength", 25.0);
                    currentValues.put("Amplitude", 1.0);
                    currentValues.put("Contour Lines", 25);
                    currentValues.put("Line Spacing", 0.25);
                    currentValues.put("Resolution", 250);
                    return true;
                case "Ripple Pool":
                    currentValues.put("Sources", 5);
                    currentValues.put("Wavelength", 20.0);
                    currentValues.put("Amplitude", 0.8);
                    currentValues.put("Contour Lines", 30);
                    currentValues.put("Line Spacing", 0.2);
                    currentValues.put("Resolution", 300);
                    return true;
                case "Standing Wave":
                    currentValues.put("Sources", 2);
                    currentValues.put("Wavelength", 50.0);
                    currentValues.put("Amplitude", 1.5);
                    currentValues.put("Contour Lines", 15);
                    currentValues.put("Line Spacing", 0.4);
                    currentValues.put("Resolution", 200);
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
        int numSources = (int) params.getOrDefault("Sources", 3);
        double wavelength = (double) params.getOrDefault("Wavelength", 30.0);
        double amplitude = (double) params.getOrDefault("Amplitude", 1.0);
        int numContours = (int) params.getOrDefault("Contour Lines", 20);
        double lineSpacing = (double) params.getOrDefault("Line Spacing", 0.3);
        int resolution = (int) params.getOrDefault("Resolution", 200);
        int seed = (int) params.getOrDefault("Seed", 42);
        int numColors = (int) params.getOrDefault("Colors", 1);

        double width = 1000, height = 1000;
        if (params.containsKey("width")) width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height")) height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);
        Random rand = new Random(seed);

        double margin = Math.min(width, height) * 0.2;
        double[][] sources = new double[numSources][2];
        for (int i = 0; i < numSources; i++) {
            sources[i][0] = margin + rand.nextDouble() * (width - 2 * margin);
            sources[i][1] = margin + rand.nextDouble() * (height - 2 * margin);
        }

        double cellW = width / resolution;
        double cellH = height / resolution;
        double[][] field = new double[resolution + 1][resolution + 1];

        for (int iy = 0; iy <= resolution; iy++) {
            for (int ix = 0; ix <= resolution; ix++) {
                double px = ix * cellW;
                double py = iy * cellH;
                double val = 0;
                for (double[] src : sources) {
                    double dist = Math.sqrt((px - src[0]) * (px - src[0]) + (py - src[1]) * (py - src[1]));
                    val += amplitude * Math.sin((2 * Math.PI * dist) / wavelength);
                }
                field[iy][ix] = val;
            }
        }

        for (int c = 0; c < numContours; c++) {
            double level = (c - numContours / 2.0) * lineSpacing;
            int layerIndex = c % numColors;
            List<double[]> segments = marchingSquares(field, resolution, resolution, cellW, cellH, level);
            List<List<double[]>> paths = connectSegments(segments);
            for (List<double[]> path : paths) {
                if (path.size() < 2) continue;
                StringBuilder d = new StringBuilder();
                d.append(String.format(java.util.Locale.US, "M %.2f %.2f", path.get(0)[0], path.get(0)[1]));
                for (int i = 1; i < path.size(); i++) {
                    d.append(String.format(java.util.Locale.US, " L %.2f %.2f", path.get(i)[0], path.get(i)[1]));
                }
                canvas.addRaw(layerIndex, "<path d='" + d + "' />");
            }
        }

        return canvas.toSvg();
    }

    private List<double[]> marchingSquares(double[][] field, int nx, int ny, double cellW, double cellH, double level) {
        List<double[]> segments = new ArrayList<>();
        for (int iy = 0; iy < ny; iy++) {
            for (int ix = 0; ix < nx; ix++) {
                double v0 = field[iy][ix], v1 = field[iy][ix + 1];
                double v2 = field[iy + 1][ix + 1], v3 = field[iy + 1][ix];
                int caseIdx = (v0 >= level ? 1 : 0) | (v1 >= level ? 2 : 0) | (v2 >= level ? 4 : 0) | (v3 >= level ? 8 : 0);
                if (caseIdx == 0 || caseIdx == 15) continue;

                double x0 = ix * cellW, y0 = iy * cellH, x1 = (ix + 1) * cellW, y1 = (iy + 1) * cellH;
                double[] top = {interp(v0, v1, x0, x1, level), y0};
                double[] right = {x1, interp(v1, v2, y0, y1, level)};
                double[] bottom = {interp(v3, v2, x0, x1, level), y1};
                double[] left = {x0, interp(v0, v3, y0, y1, level)};

                switch (caseIdx) {
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
        // Segments are pairs: [0,1] is first segment, [2,3] is second, etc.
        return segments;
    }

    private double interp(double va, double vb, double a, double b, double level) {
        double t = (level - va) / (vb - va);
        return a + t * (b - a);
    }

    private List<List<double[]>> connectSegments(List<double[]> pts) {
        List<List<double[]>> paths = new ArrayList<>();
        // Points come in pairs
        for (int i = 0; i + 1 < pts.size(); i += 2) {
            List<double[]> path = new ArrayList<>();
            path.add(pts.get(i));
            path.add(pts.get(i + 1));
            paths.add(path);
        }
        return paths;
    }
}
