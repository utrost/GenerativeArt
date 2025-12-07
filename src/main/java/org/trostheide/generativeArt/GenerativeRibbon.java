package org.trostheide.generativeArt;

import java.io.FileWriter;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class GenerativeRibbon {

    // Canvas dimensions
    private static final int WIDTH = 1000;
    private static final int HEIGHT = 1000;
    private static final int CENTER_X = WIDTH / 2;
    private static final int CENTER_Y = HEIGHT / 2;

    // Configuration for the visual style
    // The higher the number, the denser and darker the ribbon becomes.
    private static final int NUM_LINES = 6000;
    // How long the mathematical path runs. Higher means more loops.
    private static final double MAX_T = 25.0;
    // Global scaling factor to fit the math onto the canvas size
    private static final double SCALE = 2.0;

    // Ensure SVG uses dots for decimals, regardless of locale
    private static final DecimalFormat df;
    static {
        df = new DecimalFormat("#.##");
        df.setDecimalFormatSymbols(DecimalFormatSymbols.getInstance(Locale.ENGLISH));
    }

    public static void main(String[] args) {
        StringBuilder svgContent = new StringBuilder();

        // 1. SVG Header
        svgContent.append(String.format("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\" viewBox=\"0 0 %d %d\" style=\"background-color:white\">\n", WIDTH, HEIGHT, WIDTH, HEIGHT));

        // Optional: Add a group with a slight rotation to match the reference image's diagonal feel
        svgContent.append(String.format("<g transform=\"rotate(-20, %d, %d)\">", CENTER_X, CENTER_Y));

        // 2. The main generation loop
        for (int i = 0; i < NUM_LINES; i++) {
            // Normalize i to a range of 0.0 to 1.0
            double progress = (double) i / NUM_LINES;
            // Map progress to our time variable t
            double t = progress * MAX_T;

            // Calculate the two points in 3D space
            Point3D p1_3d = calculatePathA(t);
            Point3D p2_3d = calculatePathB(t);

            // Project 3D points to 2D screen coordinates
            Point2D p1_2d = project(p1_3d);
            Point2D p2_2d = project(p2_3d);

            // Append the SVG line element
            // Using very thin lines (stroke-width="0.5") creates better Moiré patterns
            svgContent.append(String.format("  <line x1=\"%s\" y1=\"%s\" x2=\"%s\" y2=\"%s\" stroke=\"black\" stroke-width=\"0.5\" opacity=\"0.8\" />\n",
                    df.format(p1_2d.x), df.format(p1_2d.y),
                    df.format(p2_2d.x), df.format(p2_2d.y)));
        }

        // 3. SVG Footer
        svgContent.append("</g>\n");
        svgContent.append("</svg>");

        // 4. Write to file
        try (FileWriter fileWriter = new FileWriter("ribbon.svg")) {
            fileWriter.write(svgContent.toString());
            System.out.println("Successfully generated 'ribbon.svg'");
        } catch (IOException e) {
            System.err.println("Error writing SVG file: " + e.getMessage());
        }
    }

    /**
     * Defines the path for one edge of the ribbon.
     * These are parametric equations combining sines and cosines at different frequencies.
     */
    private static Point3D calculatePathA(double t) {
        // Base movement (larger, slower loops)
        double baseX = Math.sin(t * 0.7) * 200;
        double baseY = Math.cos(t * 0.9) * 250;
        double baseZ = Math.sin(t * 0.5) * 200;

        // Offset movement (faster twisting creates the ribbon width)
        double offsetX = Math.cos(t * 3.1 + 0.5) * 60;
        double offsetY = Math.sin(t * 3.3) * 60;
        double offsetZ = Math.cos(t * 3.7 + 1.0) * 60;

        return new Point3D(
                (baseX + offsetX) * SCALE,
                (baseY + offsetY) * SCALE,
                (baseZ + offsetZ) * SCALE
        );
    }

    /**
     * Defines the path for the opposite edge of the ribbon.
     * It is structurally similar to Path A but with slightly different phases or signs
     * to ensure it stays separate but related.
     */
    private static Point3D calculatePathB(double t) {
        // Base movement (similar to A)
        double baseX = Math.sin(t * 0.7) * 200;
        double baseY = Math.cos(t * 0.9) * 250;
        double baseZ = Math.sin(t * 0.5) * 200;

        // Offset movement (note the different phases and signs to create the "opposite" edge)
        // By subtracting the offsets or changing phases, we create the ribbon width.
        double offsetX = Math.cos(t * 3.1 + Math.PI) * 70; // Shifts phase by 180 degrees
        double offsetY = Math.sin(t * 3.3 + Math.PI) * 70;
        double offsetZ = Math.cos(t * 3.7 + Math.PI + 1.0) * 70;

        return new Point3D(
                (baseX + offsetX) * SCALE,
                (baseY + offsetY) * SCALE,
                (baseZ + offsetZ) * SCALE
        );
    }

    /**
     * Projects a 3D point onto a 2D plane using a simple weak-perspective projection.
     * Z depth influences X and Y position slightly to give a 3D feel.
     */
    private static Point2D project(Point3D p) {
        // Simple perspective foreshortening factor.
        // Points further away (negative Z) get smaller/closer to center.
        double perspective = 1000.0 / (1000.0 - p.z);

        double x2d = p.x * perspective + CENTER_X;
        double y2d = p.y * perspective + CENTER_Y;

        return new Point2D(x2d, y2d);
    }

    // Helper classes for storing coordinates
    record Point3D(double x, double y, double z) {}
    record Point2D(double x, double y) {}
}
