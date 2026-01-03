package org.trostheide.generativeArt.core;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class SvgCanvas {
    private final double width;
    private final double height;
    private final List<StringBuilder> layers;
    private final String[] layerColors = { "black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A" }; // Standard
                                                                                                             // plotter-ish
                                                                                                             // colors

    public SvgCanvas(double width, double height, int numLayers) {
        this.width = width;
        this.height = height;
        this.layers = new ArrayList<>();
        for (int i = 0; i < numLayers; i++) {
            layers.add(new StringBuilder());
        }
    }

    public void addPath(int layerIndex, String pathData) {
        if (layerIndex >= 0 && layerIndex < layers.size()) {
            layers.get(layerIndex).append(pathData).append("\n");
        }
    }

    public void addLine(int layerIndex, double x1, double y1, double x2, double y2) {
        addPath(layerIndex,
                String.format(Locale.US, "<line x1='%.2f' y1='%.2f' x2='%.2f' y2='%.2f' />", x1, y1, x2, y2));
    }

    public void addRaw(int layerIndex, String content) {
        if (layerIndex >= 0 && layerIndex < layers.size()) {
            layers.get(layerIndex).append(content).append("\n");
        }
    }

    public String toSvg() {
        StringBuilder svg = new StringBuilder();

        // Header
        svg.append(String.format(Locale.US,
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %.1f %.1f' width='%.1f' height='%.1f'>\n",
                width, height, width, height));

        // Defs (ClipPath)
        svg.append(String.format(Locale.US,
                "  <defs><clipPath id='pageClip'><rect width='%.1f' height='%.1f'/></clipPath></defs>\n",
                width, height));

        // Background
        svg.append(String.format(Locale.US, "  <rect width='%.1f' height='%.1f' fill='white'/>\n", width, height));

        // Layers
        for (int i = 0; i < layers.size(); i++) {
            String color = layerColors[i % layerColors.length];
            svg.append(String.format(Locale.US,
                    "  <g id='layer_%d' stroke='%s' fill='none' stroke-width='1' clip-path='url(#pageClip)'>\n", i + 1,
                    color));
            svg.append(layers.get(i));
            svg.append("  </g>\n");
        }

        svg.append("</svg>");
        return svg.toString();
    }
}
