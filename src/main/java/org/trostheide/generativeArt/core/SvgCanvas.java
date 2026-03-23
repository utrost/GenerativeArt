package org.trostheide.generativeArt.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SvgCanvas {
    private final double width;
    private final double height;
    private final List<List<String>> layers;
    private final String[] layerColors = { "black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A" };
    private double strokeWidth = 1.0;

    private static final Pattern LINE_PATTERN = Pattern.compile(
            "x1='([\\d.-]+)'\\s*y1='([\\d.-]+)'\\s*x2='([\\d.-]+)'\\s*y2='([\\d.-]+)'");
    private static final Pattern PATH_D_PATTERN = Pattern.compile("d='([^']*)'");
    private static final Pattern COORD_PATTERN = Pattern.compile("([\\d.-]+)[,\\s]+([\\d.-]+)");

    public SvgCanvas(double width, double height, int numLayers) {
        this.width = width;
        this.height = height;
        this.layers = new ArrayList<>();
        for (int i = 0; i < numLayers; i++) {
            layers.add(new ArrayList<>());
        }
    }

    public void setStrokeWidth(double strokeWidth) {
        this.strokeWidth = strokeWidth;
    }

    public void addPath(int layerIndex, String pathData) {
        if (layerIndex >= 0 && layerIndex < layers.size()) {
            layers.get(layerIndex).add(pathData);
        }
    }

    public void addLine(int layerIndex, double x1, double y1, double x2, double y2) {
        addPath(layerIndex,
                String.format(Locale.US, "<line x1='%.2f' y1='%.2f' x2='%.2f' y2='%.2f' />", x1, y1, x2, y2));
    }

    public void addRaw(int layerIndex, String content) {
        if (layerIndex >= 0 && layerIndex < layers.size()) {
            layers.get(layerIndex).add(content);
        }
    }

    public String toSvg() {
        StringBuilder svg = new StringBuilder();

        svg.append(String.format(Locale.US,
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %.1f %.1f' width='%.1f' height='%.1f'>\n",
                width, height, width, height));

        svg.append(String.format(Locale.US,
                "  <defs><clipPath id='pageClip'><rect width='%.1f' height='%.1f'/></clipPath></defs>\n",
                width, height));

        svg.append(String.format(Locale.US, "  <rect width='%.1f' height='%.1f' fill='white'/>\n", width, height));

        for (int i = 0; i < layers.size(); i++) {
            String color = layerColors[i % layerColors.length];
            svg.append(String.format(Locale.US,
                    "  <g id='layer_%d' stroke='%s' fill='none' stroke-width='%.2f' clip-path='url(#pageClip)'>\n",
                    i + 1, color, strokeWidth));
            List<String> optimized = optimizeLayer(layers.get(i));
            for (String element : optimized) {
                svg.append(element).append("\n");
            }
            svg.append("  </g>\n");
        }

        svg.append("</svg>");
        return svg.toString();
    }

    // --- Path optimization for pen plotters ---

    private static double distSq(double x1, double y1, double x2, double y2) {
        double dx = x1 - x2;
        double dy = y1 - y2;
        return dx * dx + dy * dy;
    }

    /** Extract [startX, startY, endX, endY] from a line or path element, or null if unparseable. */
    static double[] getEndpoints(String element) {
        Matcher lineMatcher = LINE_PATTERN.matcher(element);
        if (lineMatcher.find()) {
            return new double[] {
                    Double.parseDouble(lineMatcher.group(1)),
                    Double.parseDouble(lineMatcher.group(2)),
                    Double.parseDouble(lineMatcher.group(3)),
                    Double.parseDouble(lineMatcher.group(4))
            };
        }

        Matcher pathMatcher = PATH_D_PATTERN.matcher(element);
        if (pathMatcher.find()) {
            String d = pathMatcher.group(1);
            Matcher coordMatcher = COORD_PATTERN.matcher(d);
            double startX = 0, startY = 0, endX = 0, endY = 0;
            boolean found = false;
            while (coordMatcher.find()) {
                double x = Double.parseDouble(coordMatcher.group(1));
                double y = Double.parseDouble(coordMatcher.group(2));
                if (!found) {
                    startX = x;
                    startY = y;
                    found = true;
                }
                endX = x;
                endY = y;
            }
            if (found) {
                return new double[] { startX, startY, endX, endY };
            }
        }

        return null;
    }

    /** Reverse a line element by swapping x1,y1 with x2,y2 preserving formatting. */
    static String reverseLine(String element) {
        Matcher m = LINE_PATTERN.matcher(element);
        if (!m.find())
            return element;
        StringBuilder sb = new StringBuilder();
        sb.append(element, 0, m.start(1));
        sb.append(m.group(3));
        sb.append(element, m.end(1), m.start(2));
        sb.append(m.group(4));
        sb.append(element, m.end(2), m.start(3));
        sb.append(m.group(1));
        sb.append(element, m.end(3), m.start(4));
        sb.append(m.group(2));
        sb.append(element, m.end(4), element.length());
        return sb.toString();
    }

    /** Reverse a path element by reversing its coordinate sequence. */
    static String reversePath(String element) {
        Matcher dm = PATH_D_PATTERN.matcher(element);
        if (!dm.find())
            return element;

        String d = dm.group(1);
        Matcher cm = COORD_PATTERN.matcher(d);
        List<String[]> coords = new ArrayList<>();
        while (cm.find()) {
            coords.add(new String[] { cm.group(1), cm.group(2) });
        }

        if (coords.size() < 2)
            return element;

        Collections.reverse(coords);
        StringBuilder newD = new StringBuilder();
        newD.append("M ").append(coords.get(0)[0]).append(",").append(coords.get(0)[1]);
        for (int i = 1; i < coords.size(); i++) {
            newD.append(" L ").append(coords.get(i)[0]).append(",").append(coords.get(i)[1]);
        }

        return element.substring(0, dm.start(1)) + newD + element.substring(dm.end(1));
    }

    /** Reverse an SVG element (line or path). */
    static String reverseElement(String element) {
        String trimmed = element.trim();
        if (trimmed.startsWith("<line")) {
            return reverseLine(element);
        } else if (trimmed.startsWith("<path")) {
            return reversePath(element);
        }
        return element;
    }

    /** Reorder elements using nearest-neighbor to minimize pen travel distance. */
    static List<String> optimizeLayer(List<String> elements) {
        if (elements.size() <= 1)
            return new ArrayList<>(elements);

        int n = elements.size();
        double[][] starts = new double[n][2];
        double[][] ends = new double[n][2];
        boolean[] parseable = new boolean[n];
        List<Integer> parseableIndices = new ArrayList<>();
        List<Integer> rawIndices = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            double[] coords = getEndpoints(elements.get(i));
            if (coords != null) {
                starts[i] = new double[] { coords[0], coords[1] };
                ends[i] = new double[] { coords[2], coords[3] };
                parseable[i] = true;
                parseableIndices.add(i);
            } else {
                rawIndices.add(i);
            }
        }

        if (parseableIndices.isEmpty())
            return new ArrayList<>(elements);

        List<String> result = new ArrayList<>(n);
        boolean[] used = new boolean[n];
        double curX = 0, curY = 0;

        for (int step = 0; step < parseableIndices.size(); step++) {
            double bestDist = Double.MAX_VALUE;
            int bestIdx = -1;
            boolean bestReverse = false;

            for (int idx : parseableIndices) {
                if (used[idx])
                    continue;

                double dStart = distSq(curX, curY, starts[idx][0], starts[idx][1]);
                double dEnd = distSq(curX, curY, ends[idx][0], ends[idx][1]);

                if (dStart < bestDist) {
                    bestDist = dStart;
                    bestIdx = idx;
                    bestReverse = false;
                }
                if (dEnd < bestDist) {
                    bestDist = dEnd;
                    bestIdx = idx;
                    bestReverse = true;
                }
            }

            used[bestIdx] = true;

            if (bestReverse) {
                result.add(reverseElement(elements.get(bestIdx)));
                curX = starts[bestIdx][0];
                curY = starts[bestIdx][1];
            } else {
                result.add(elements.get(bestIdx));
                curX = ends[bestIdx][0];
                curY = ends[bestIdx][1];
            }
        }

        for (int idx : rawIndices) {
            result.add(elements.get(idx));
        }

        return result;
    }
}
