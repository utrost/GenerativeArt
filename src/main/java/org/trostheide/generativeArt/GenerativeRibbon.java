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

    // Canvas dimensions (Instance variables now)
    private int width = 1000;
    private int height = 1000;
    private int centerX = width / 2;
    private int centerY = height / 2;

    // Configuration for the visual style
    private int numLines = 6000;
    private double maxT = 25.0;
    private double scale = 2.0;

    // Ensure SVG uses dots for decimals
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

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("Lines", 6000, 500, 20000, "Density of the ribbon"),
                ParameterDefinition.doubleVal("Length (Max T)", 25.0, 5.0, 100.0, "Length of the ribbon"),
                ParameterDefinition.doubleVal("Scale", 2.0, 0.5, 5.0, "Zoom level")
        // We could add width/height here if we wanted
        );
    }

    @Override
    public String generate(Map<String, Object> params) {
        // Update state from params
        if (params.containsKey("Lines"))
            this.numLines = ((Number) params.get("Lines")).intValue();
        if (params.containsKey("Length (Max T)"))
            this.maxT = ((Number) params.get("Length (Max T)")).doubleValue();
        if (params.containsKey("Scale"))
            this.scale = ((Number) params.get("Scale")).doubleValue();

        // Recalculate centers if width/height changed (not exposed yet but good
        // practice)
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        StringBuilder svgContent = new StringBuilder();

        // 1. SVG Header
        svgContent.append(String.format(
                "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\" viewBox=\"0 0 %d %d\" style=\"background-color:white\">\n",
                width, height, width, height));

        // Optional: Add a group with a slight rotation
        svgContent.append(String.format("<g transform=\"rotate(-20, %d, %d)\">", centerX, centerY));

        // 2. The main generation loop
        for (int i = 0; i < numLines; i++) {
            double progress = (double) i / numLines;
            double t = progress * maxT;

            Point3D p1_3d = calculatePathA(t);
            Point3D p2_3d = calculatePathB(t);

            Point2D p1_2d = project(p1_3d);
            Point2D p2_2d = project(p2_3d);

            svgContent.append(String.format(
                    "  <line x1=\"%s\" y1=\"%s\" x2=\"%s\" y2=\"%s\" stroke=\"black\" stroke-width=\"0.5\" opacity=\"0.8\" />\n",
                    df.format(p1_2d.x), df.format(p1_2d.y),
                    df.format(p2_2d.x), df.format(p2_2d.y)));
        }

        // 3. SVG Footer
        svgContent.append("</g>\n");
        svgContent.append("</svg>");

        return svgContent.toString();
    }

    public static void main(String[] args) {
        // CLI Wrapper just uses default instance
        GenerativeRibbon generator = new GenerativeRibbon();
        String svg = generator.generate(Map.of()); // Empty map uses defaults

        try (FileWriter fileWriter = new FileWriter("ribbon.svg")) {
            fileWriter.write(svg);
            System.out.println("Successfully generated 'ribbon.svg'");
        } catch (IOException e) {
            System.err.println("Error writing SVG file: " + e.getMessage());
        }
    }

    // --- Instance Methods for Math (accessing instance scale) ---

    private Point3D calculatePathA(double t) {
        double baseX = Math.sin(t * 0.7) * 200;
        double baseY = Math.cos(t * 0.9) * 250;
        double baseZ = Math.sin(t * 0.5) * 200;

        double offsetX = Math.cos(t * 3.1 + 0.5) * 60;
        double offsetY = Math.sin(t * 3.3) * 60;
        double offsetZ = Math.cos(t * 3.7 + 1.0) * 60;

        return new Point3D(
                (baseX + offsetX) * scale,
                (baseY + offsetY) * scale,
                (baseZ + offsetZ) * scale);
    }

    private Point3D calculatePathB(double t) {
        double baseX = Math.sin(t * 0.7) * 200;
        double baseY = Math.cos(t * 0.9) * 250;
        double baseZ = Math.sin(t * 0.5) * 200;

        double offsetX = Math.cos(t * 3.1 + Math.PI) * 70;
        double offsetY = Math.sin(t * 3.3 + Math.PI) * 70;
        double offsetZ = Math.cos(t * 3.7 + Math.PI + 1.0) * 70;

        return new Point3D(
                (baseX + offsetX) * scale,
                (baseY + offsetY) * scale,
                (baseZ + offsetZ) * scale);
    }

    private Point2D project(Point3D p) {
        double perspective = 1000.0 / (1000.0 - p.z());
        double x2d = p.x() * perspective + centerX;
        double y2d = p.y() * perspective + centerY;
        return new Point2D(x2d, y2d);
    }

    // Using records is fine (Java 17)
    record Point3D(double x, double y, double z) {
    }

    record Point2D(double x, double y) {
    }
}
