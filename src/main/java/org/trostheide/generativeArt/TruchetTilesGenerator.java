package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.List;
import java.util.Map;
import java.util.Random;

public class TruchetTilesGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "truchet-tiles";
    }

    @Override
    public String getDisplayName() {
        return "Truchet Tiles";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Classic Curves", "Dense Maze", "Large Blocks"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("Rows", 20, 5, 100, "Number of rows"),
                ParameterDefinition.integer("Columns", 20, 5, 100, "Number of columns"),
                ParameterDefinition.bool("Curved", true, "Use arcs (true) or lines (false)"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Classic Curves":
                    currentValues.put("Rows", 20);
                    currentValues.put("Columns", 20);
                    currentValues.put("Curved", true);
                    currentValues.put("Colors", 1);
                    return true;
                case "Dense Maze":
                    currentValues.put("Rows", 50);
                    currentValues.put("Columns", 50);
                    currentValues.put("Curved", false);
                    currentValues.put("Colors", 2);
                    return true;
                case "Large Blocks":
                    currentValues.put("Rows", 10);
                    currentValues.put("Columns", 10);
                    currentValues.put("Curved", true);
                    currentValues.put("Colors", 4);
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
        int rows = (int) params.getOrDefault("Rows", 20);
        int cols = (int) params.getOrDefault("Columns", 20);
        boolean curved = (boolean) params.getOrDefault("Curved", true);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);
        Random rand = new Random();

        double tileSizeX = width / cols;
        double tileSizeY = height / rows;

        for (int y = 0; y < rows; y++) {
            for (int x = 0; x < cols; x++) {
                double px = x * tileSizeX;
                double py = y * tileSizeY;

                // Random orientation
                int type = rand.nextInt(2); // 0 or 1

                // Checkerboard coloring or random coloring
                int layerIndex = (x + y) % numColors;

                if (curved) {
                    // Quarter circles
                    StringBuilder svg = new StringBuilder();
                    if (type == 0) {
                        // Arcs at Top-Left and Bottom-Right
                        double r = tileSizeX / 2;
                        svg.append(svgArc(px, py, r, 0, 90)); // TL -> 0,0 relative
                        svg.append(svgArc(px + tileSizeX, py + tileSizeY, r, 180, 270)); // BR
                    } else {
                        // Arcs at Top-Right and Bottom-Left
                        double r = tileSizeX / 2;
                        svg.append(svgArc(px + tileSizeX, py, r, 90, 180)); // TR
                        svg.append(svgArc(px, py + tileSizeY, r, 270, 360)); // BL
                    }
                    canvas.addRaw(layerIndex, svg.toString());

                } else {
                    // Diagonal Lines
                    if (type == 0) {
                        // TL to BR
                        canvas.addLine(layerIndex, px, py, px + tileSizeX, py + tileSizeY);
                    } else {
                        // TR to BL
                        canvas.addLine(layerIndex, px + tileSizeX, py, px, py + tileSizeY);
                    }
                }
            }
        }

        return canvas.toSvg();
    }

    // Helper for SVG Path Arc: A rx ry x-axis-rotation large-arc-flag sweep-flag x
    // y
    // Hard to do start/end angles in pure SVG path without trig.
    private String svgArc(double cx, double cy, double r, double startAngle, double endAngle) {
        // Convert angle to radians
        // Note: SVG standard coord system. 0 deg is +X (Right). 90 deg is +Y (Down).

        // However for corners:
        // TL corner (0,0) drawing arc inside tile means quadrant 4 relative to corner?
        // Let's rely on standard Truchet.
        // Circle at 0,0. Arc from (0, r) to (r, 0).

        double startRad = Math.toRadians(startAngle);
        double endRad = Math.toRadians(endAngle);

        double x1 = cx + r * Math.cos(startRad);
        double y1 = cy + r * Math.sin(startRad);

        double x2 = cx + r * Math.cos(endRad);
        double y2 = cy + r * Math.sin(endRad);

        // Move to start, A radius radius 0 0 1 end
        return String.format(java.util.Locale.US,
                "<path d='M %.2f %.2f A %.2f %.2f 0 0 1 %.2f %.2f' fill='none' />\n",
                x1, y1, r, r, x2, y2);
    }
}
