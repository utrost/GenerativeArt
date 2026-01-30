package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.SvgCanvas;

import java.util.List;
import java.util.Map;

public class SpirographGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "spirograph";
    }

    @Override
    public String getDisplayName() {
        return "Spirograph (Hypo/Epitrochoid)";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Type", "Hypotrochoid (Inside)",
                        List.of("Hypotrochoid (Inside)", "Epitrochoid (Outside)"), "Curve Type"),
                ParameterDefinition.doubleVal("Outer Radius (R)", 300.0, 10.0, 500.0, "Fixed Circle Radius"),
                ParameterDefinition.doubleVal("Inner Radius (r)", 105.0, 1.0, 500.0, "Rolling Circle Radius"),
                ParameterDefinition.doubleVal("Pen Offset (d)", 80.0, 0.0, 500.0, "Dist from Inner Center"),
                ParameterDefinition.doubleVal("Revolutions", 50.0, 1.0, 500.0, "Number of Inner Rotations"),
                ParameterDefinition.doubleVal("Resolution", 0.05, 0.001, 1.0, "Step Size (t)"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of Layers"));
    }

    @Override
    public String generate(Map<String, Object> params) {
        String type = (String) params.getOrDefault("Type", "Hypotrochoid (Inside)");
        boolean isHypo = type.contains("Hypo");

        double R = (double) params.getOrDefault("Outer Radius (R)", 300.0);
        double r = (double) params.getOrDefault("Inner Radius (r)", 105.0);
        double d = (double) params.getOrDefault("Pen Offset (d)", 80.0);
        double revolutions = (double) params.getOrDefault("Revolutions", 50.0);
        double resolution = (double) params.getOrDefault("Resolution", 0.05);
        int numColors = (int) params.getOrDefault("Colors", 1);

        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        SvgCanvas canvas = new SvgCanvas(width, height, numColors);
        double centerX = width / 2;
        double centerY = height / 2;

        double maxT = revolutions * 2 * Math.PI;

        double prevX = 0;
        double prevY = 0;
        boolean first = true;

        for (double t = 0; t <= maxT; t += resolution) {
            double x, y;
            if (isHypo) {
                // Hypotrochoid
                // x = (R - r) * cos(t) + d * cos(((R - r) / r) * t)
                // y = (R - r) * sin(t) - d * sin(((R - r) / r) * t)
                x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
                y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
            } else {
                // Epitrochoid
                // x = (R + r) * cos(t) - d * cos(((R + r) / r) * t)
                // y = (R + r) * sin(t) - d * sin(((R + r) / r) * t)
                x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
                y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
            }

            double screenX = centerX + x;
            double screenY = centerY + y;

            if (!first) {
                int layerIndex = (int) (t / (Math.PI / 2)) % numColors; // Cycle colors every 90 deg rotation? No, maybe
                                                                        // slower.
                // Let's cycle based on total progress? Or segments.
                // t is radians.
                layerIndex = (int) (t) % numColors;

                canvas.addLine(layerIndex, prevX, prevY, screenX, screenY);
            }

            prevX = screenX;
            prevY = screenY;
            first = false;
        }

        return canvas.toSvg();
    }
}
