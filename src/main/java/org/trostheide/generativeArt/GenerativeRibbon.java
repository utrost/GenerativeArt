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

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("Lines", NUM_LINES, 500, 20000, "Density of the ribbon"),
                ParameterDefinition.doubleVal("Length (Max T)", MAX_T, 5.0, 100.0, "Length of the ribbon"),
                ParameterDefinition.doubleVal("Scale", SCALE, 0.5, 5.0, "Zoom level"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of plotter layers"));
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
        org.trostheide.generativeArt.core.SvgCanvas canvas = new org.trostheide.generativeArt.core.SvgCanvas(width,
                height, numColors);

        for (int i = 0; i < numLines; i++) {
            double t = (double) i / numLines * maxT;

            Point3D p1_3d = calculatePathA(t);
            Point3D p2_3d = calculatePathB(t);

            Point2D p1 = project(p1_3d);
            Point2D p2 = project(p2_3d);

            // Distribute across layers
            int layerIndex = i % numColors;
            canvas.addLine(layerIndex, p1.x(), p1.y(), p2.x(), p2.y());
        }

        return canvas.toSvg();
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
