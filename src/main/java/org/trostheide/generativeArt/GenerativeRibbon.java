package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;

import java.io.FileWriter;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class GenerativeRibbon implements ArtGenerator {

    // Default Configuration
    private static final int NUM_LINES = 6000;
    private static final double MAX_T = 25.0;
    private static final double SCALE = 2.0;

    // Instance variables for calculations
    private double currentScale = SCALE;
    private double centerX = 500;
    private double centerY = 500;

    private static final DecimalFormat df;
    static {
        df = new DecimalFormat("#.##");
        df.setDecimalFormatSymbols(DecimalFormatSymbols.getInstance(Locale.ENGLISH));
    }

    @Override
    public String getId() {
        return "generative-ribbon";
    }

    @Override
    public String getDisplayName() {
        return "Generative Ribbon";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Dense Coil", "Sparse Wire", "Long Thread"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("Lines", NUM_LINES, 500, 20000, "Density of the ribbon"),
                ParameterDefinition.doubleVal("Length (Max T)", MAX_T, 5.0, 100.0, "Length of the ribbon"),
                ParameterDefinition.doubleVal("Scale", SCALE, 0.5, 5.0, "Zoom level"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Dense Coil":
                    currentValues.put("Lines", 12000);
                    currentValues.put("Length (Max T)", 50.0);
                    currentValues.put("Scale", 3.0);
                    return true;
                case "Sparse Wire":
                    currentValues.put("Lines", 2000);
                    currentValues.put("Length (Max T)", 15.0);
                    currentValues.put("Scale", 1.5);
                    return true;
                case "Long Thread":
                    currentValues.put("Lines", 8000);
                    currentValues.put("Length (Max T)", 80.0);
                    currentValues.put("Scale", 2.5);
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
        // Read Params
        int numLines = (int) params.getOrDefault("Lines", NUM_LINES);
        double maxT = (double) params.getOrDefault("Length (Max T)", MAX_T);
        this.currentScale = (double) params.getOrDefault("Scale", SCALE);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Dimensions
        double width = 1000;
        double height = 1000;
        if (params.containsKey("width"))
            width = ((Number) params.get("width")).doubleValue();
        if (params.containsKey("height"))
            height = ((Number) params.get("height")).doubleValue();

        this.centerX = width / 2;
        this.centerY = height / 2;

        return generateSVG(numLines, maxT, width, height, numColors);
    }

    private String generateSVG(int numLines, double maxT, double width, double height, int numColors) {
        double minX = Double.MAX_VALUE, maxX = -Double.MAX_VALUE;
        double minY = Double.MAX_VALUE, maxY = -Double.MAX_VALUE;

        StringBuilder[] pathBuilders = new StringBuilder[numColors];
        for (int i = 0; i < numColors; i++) pathBuilders[i] = new StringBuilder();

        for (int i = 0; i < numLines; i++) {
            double t = (double) i / numLines * maxT;

            Point3D p1_3d = calculatePathA(t);
            Point3D p2_3d = calculatePathB(t);

            Point2D p1 = project(p1_3d);
            Point2D p2 = project(p2_3d);

            if (p1.x() < minX) minX = p1.x();
            if (p1.x() > maxX) maxX = p1.x();
            if (p1.y() < minY) minY = p1.y();
            if (p1.y() > maxY) maxY = p1.y();

            if (p2.x() < minX) minX = p2.x();
            if (p2.x() > maxX) maxX = p2.x();
            if (p2.y() < minY) minY = p2.y();
            if (p2.y() > maxY) maxY = p2.y();

            int layerIndex = i % numColors;
            pathBuilders[layerIndex].append(String.format(java.util.Locale.US, "M %.2f %.2f L %.2f %.2f ", p1.x(), p1.y(), p2.x(), p2.y()));
        }

        java.util.List<String> rawPaths = new java.util.ArrayList<>();
        for (int i = 0; i < numColors; i++) {
            if (pathBuilders[i].length() > 0) {
                String layerColor = new String[] { "black", "#E31A1C", "#1F78B4", "#33A02C", "#FF7F00", "#6A3D9A" }[i % 6];
                rawPaths.add(String.format(java.util.Locale.US, "<path d='%s' stroke='%s' fill='none' stroke-width='1.0' vector-effect='non-scaling-stroke'/>", pathBuilders[i].toString(), layerColor));
            }
        }

        double margin = 50.0;
        double bboxWidth = maxX - minX;
        double bboxHeight = maxY - minY;

        if (bboxWidth <= 0) bboxWidth = 1;
        if (bboxHeight <= 0) bboxHeight = 1;

        double targetScale = Math.min((width - 2 * margin) / bboxWidth, (height - 2 * margin) / bboxHeight);
        double offsetX = (width - bboxWidth * targetScale) / 2.0 - minX * targetScale;
        double offsetY = (height - bboxHeight * targetScale) / 2.0 - minY * targetScale;

        StringBuilder out = new StringBuilder();
        out.append(String.format(java.util.Locale.US, "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %.1f %.1f' width='%.1f' height='%.1f'>\n", width, height, width, height));
        out.append(String.format(java.util.Locale.US, "<defs><clipPath id='pageClip'><rect width='%.1f' height='%.1f'/></clipPath></defs>\n", width, height));
        out.append(String.format(java.util.Locale.US, "<rect width='%.1f' height='%.1f' fill='white'/>\n", width, height));
        out.append("<g clip-path='url(#pageClip)'>\n");
        out.append(String.format(java.util.Locale.US, "  <g transform='translate(%.1f, %.1f) scale(%.4f)'>\n", offsetX, offsetY, targetScale));
        for (String p : rawPaths) {
            out.append("    ").append(p).append("\n");
        }
        out.append("  </g>\n");
        out.append("</g>\n</svg>");

        return out.toString();
    }

    // --- Math Helpers ---

    private Point3D calculatePathA(double t) {
        double baseX = Math.sin(t * 0.7) * 200;
        double baseY = Math.cos(t * 0.9) * 250;
        double baseZ = Math.sin(t * 0.5) * 200;

        double offsetX = Math.cos(t * 3.1 + 0.5) * 60;
        double offsetY = Math.sin(t * 3.3) * 60;
        double offsetZ = Math.cos(t * 3.7 + 1.0) * 60;

        return new Point3D(
                (baseX + offsetX) * currentScale,
                (baseY + offsetY) * currentScale,
                (baseZ + offsetZ) * currentScale);
    }

    private Point3D calculatePathB(double t) {
        double baseX = Math.sin(t * 0.7) * 200;
        double baseY = Math.cos(t * 0.9) * 250;
        double baseZ = Math.sin(t * 0.5) * 200;

        double offsetX = Math.cos(t * 3.1 + Math.PI) * 70;
        double offsetY = Math.sin(t * 3.3 + Math.PI) * 70;
        double offsetZ = Math.cos(t * 3.7 + Math.PI + 1.0) * 70;

        return new Point3D(
                (baseX + offsetX) * currentScale,
                (baseY + offsetY) * currentScale,
                (baseZ + offsetZ) * currentScale);
    }

    private Point2D project(Point3D p) {
        double perspective = 1000.0 / (1000.0 - p.z());
        double x2d = p.x() * perspective + centerX;
        double y2d = p.y() * perspective + centerY;
        return new Point2D(x2d, y2d);
    }

    // Records
    record Point3D(double x, double y, double z) {
    }

    record Point2D(double x, double y) {
    }

    public static void main(String[] args) {
        GenerativeRibbon generator = new GenerativeRibbon();
        String svg = generator.generate(Map.of());
        try (FileWriter fileWriter = new FileWriter("ribbon.svg")) {
            fileWriter.write(svg);
            System.out.println("Generated ribbon.svg");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
