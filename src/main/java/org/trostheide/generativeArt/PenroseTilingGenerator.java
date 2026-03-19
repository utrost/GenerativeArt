package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class PenroseTilingGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "penrose-tiling";
    }

    @Override
    public String getDisplayName() {
        return "Penrose Tiling";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom",
                        Arrays.asList("Custom", "Classic Kite & Dart", "Thick Rhombus", "Fine Detail", "Sparse Stars"),
                        "Select a predefined style"),
                ParameterDefinition.selection("Tile Type", "Kite & Dart",
                        Arrays.asList("Kite & Dart", "Rhombus"),
                        "Type of Penrose tiling"),
                ParameterDefinition.integer("Subdivisions", 5, 1, 8,
                        "Number of recursive subdivisions (higher = finer detail)"),
                ParameterDefinition.integer("Seed", 42, 1, 9999, "Random seed for variations"),
                ParameterDefinition.bool("Show Arcs", false, "Draw matching arcs on tiles"),
                ParameterDefinition.integer("Colors", 2, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            switch ((String) newValue) {
                case "Classic Kite & Dart":
                    currentValues.put("Tile Type", "Kite & Dart");
                    currentValues.put("Subdivisions", 5);
                    currentValues.put("Show Arcs", false);
                    currentValues.put("Colors", 2);
                    return true;
                case "Thick Rhombus":
                    currentValues.put("Tile Type", "Rhombus");
                    currentValues.put("Subdivisions", 5);
                    currentValues.put("Show Arcs", false);
                    currentValues.put("Colors", 2);
                    return true;
                case "Fine Detail":
                    currentValues.put("Tile Type", "Kite & Dart");
                    currentValues.put("Subdivisions", 7);
                    currentValues.put("Show Arcs", true);
                    currentValues.put("Colors", 3);
                    return true;
                case "Sparse Stars":
                    currentValues.put("Tile Type", "Kite & Dart");
                    currentValues.put("Subdivisions", 4);
                    currentValues.put("Show Arcs", false);
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
        String tileType = (String) params.getOrDefault("Tile Type", "Kite & Dart");
        int subdivisions = (int) params.getOrDefault("Subdivisions", 5);
        int seed = (int) params.getOrDefault("Seed", 42);
        boolean showArcs = (boolean) params.getOrDefault("Show Arcs", false);
        int numColors = (int) params.getOrDefault("Colors", 2);

        double width = 1000, height = 1000;
        if (params.containsKey("width")) width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height")) height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);
        final double PHI = (1 + Math.sqrt(5)) / 2;
        double cx = width / 2, cy = height / 2;
        double radius = Math.max(width, height) * 0.75;

        List<double[]> triangles = new ArrayList<>(); // type, Ax, Ay, Bx, By, Cx, Cy

        for (int i = 0; i < 10; i++) {
            double angle1 = (2 * Math.PI * i) / 10;
            double angle2 = (2 * Math.PI * (i + 1)) / 10;
            double px1 = cx + radius * Math.cos(angle1), py1 = cy + radius * Math.sin(angle1);
            double px2 = cx + radius * Math.cos(angle2), py2 = cy + radius * Math.sin(angle2);

            int type = "Rhombus".equals(tileType) ? 1 : 0;
            if (i % 2 == 0) {
                triangles.add(new double[]{type, cx, cy, px1, py1, px2, py2});
            } else {
                triangles.add(new double[]{type, cx, cy, px2, py2, px1, py1});
            }
        }

        for (int s = 0; s < subdivisions; s++) {
            triangles = subdivide(triangles, PHI);
        }

        for (double[] tri : triangles) {
            if (!isVisible(tri, width, height)) continue;
            int layerIndex = ((int) tri[0]) % numColors;

            String pathData = String.format(java.util.Locale.US,
                    "<path d='M %.2f %.2f L %.2f %.2f L %.2f %.2f Z' />",
                    tri[1], tri[2], tri[3], tri[4], tri[5], tri[6]);
            canvas.addRaw(layerIndex, pathData);

            if (showArcs) {
                double arcR = dist(tri[1], tri[2], tri[3], tri[4]) * 0.15;
                int arcLayer = (layerIndex + 1) % numColors;
                String arcPath = String.format(java.util.Locale.US,
                        "<circle cx='%.2f' cy='%.2f' r='%.2f' />", tri[1], tri[2], arcR);
                canvas.addRaw(arcLayer, arcPath);
            }
        }

        return canvas.toSvg();
    }

    private List<double[]> subdivide(List<double[]> triangles, double PHI) {
        List<double[]> result = new ArrayList<>();
        for (double[] tri : triangles) {
            double ax = tri[1], ay = tri[2], bx = tri[3], by = tri[4], cx = tri[5], cy = tri[6];
            if ((int) tri[0] == 0) {
                double px = ax + (bx - ax) / PHI, py = ay + (by - ay) / PHI;
                result.add(new double[]{0, cx, cy, px, py, bx, by});
                result.add(new double[]{1, px, py, cx, cy, ax, ay});
            } else {
                double qx = bx + (ax - bx) / PHI, qy = by + (ay - by) / PHI;
                double rx = bx + (cx - bx) / PHI, ry = by + (cy - by) / PHI;
                result.add(new double[]{1, rx, ry, cx, cy, ax, ay});
                result.add(new double[]{1, qx, qy, rx, ry, bx, by});
                result.add(new double[]{0, rx, ry, qx, qy, ax, ay});
            }
        }
        return result;
    }

    private boolean isVisible(double[] tri, double width, double height) {
        double margin = 50;
        for (int i = 1; i <= 5; i += 2) {
            if (tri[i] >= -margin && tri[i] <= width + margin && tri[i + 1] >= -margin && tri[i + 1] <= height + margin)
                return true;
        }
        return false;
    }

    private double dist(double x1, double y1, double x2, double y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }
}
