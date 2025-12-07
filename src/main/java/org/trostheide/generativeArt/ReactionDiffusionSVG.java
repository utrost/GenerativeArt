package org.trostheide.generativeArt;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Generates Gray-Scott Reaction-Diffusion patterns and exports them as vector SVG.
 * * FIXES from previous version:
 * 1. Lowered isocontour threshold to 0.25 (was 0.5) to capture lower concentrations.
 * 2. Added Min/Max logging to console for debugging pattern health.
 * 3. Adjusted Feed/Kill ranges slightly for stability.
 */
public class ReactionDiffusionSVG {

    // --- Configuration ---
    private static final int WIDTH = 200;
    private static final int HEIGHT = 200;
    private static final int SCALE = 2;
    private static final int ITERATIONS = 8000; // Increased iterations for better growth

    // Diffusion Rates
    private static final double DA = 1.0;
    private static final double DB = 0.5;
    private static final double DT = 1.0;

    // Visual Threshold: 
    // Values of B usually range 0.0 -> 0.4. 
    // 0.2 - 0.3 is the sweet spot for the "skin" of the pattern.
    private static final double ISO_THRESHOLD = 0.25;

    public static void main(String[] args) {
        StringBuilder svgContent = new StringBuilder();
        int gridGap = 10;
        int totalSize = (WIDTH * SCALE + gridGap) * 3;

        // SVG Header
        svgContent.append(String.format("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 %d %d\" width=\"%d\" height=\"%d\" style=\"background-color:white\">",
                totalSize, totalSize, totalSize, totalSize));

        int count = 0;
        for (int y = 0; y < 3; y++) {
            for (int x = 0; x < 3; x++) {
                // Tuned parameters for distinct textures
                double f, k;

                if (count == 8) {
                    // "Red" chaos square
                    f = 0.025; k = 0.060;
                } else {
                    // Gradients from spots to stripes
                    // f: 0.030 -> 0.060
                    // k: 0.061 -> 0.063
                    f = 0.030 + (x * 0.012);
                    k = 0.061 + (y * 0.001);
                }

                System.out.printf("Cell %d/9 [f=%.4f, k=%.4f]... ", count + 1, f, k);

                Simulation sim = new Simulation(WIDTH, HEIGHT, DA, DB, f, k);
                sim.run(ITERATIONS);

                // DIAGNOSTIC: Check if simulation is alive
                double maxB = 0;
                for(double val : sim.b) if(val > maxB) maxB = val;
                System.out.printf("Max Concentration: %.3f ", maxB);

                if (maxB < ISO_THRESHOLD) {
                    System.out.println("-> WARNING: Pattern too faint for threshold!");
                } else {
                    System.out.println("-> OK.");
                }

                // Vectorize
                String paths = MarchingSquares.vectorize(sim.b, WIDTH, HEIGHT, ISO_THRESHOLD);

                String color = (count == 8) ? "#D00" : "#000";
                int transX = x * (WIDTH * SCALE + gridGap);
                int transY = y * (HEIGHT * SCALE + gridGap);

                svgContent.append(String.format("<g transform=\"translate(%d, %d) scale(%d)\">", transX, transY, SCALE));
                svgContent.append(String.format("<path d=\"%s\" fill=\"none\" stroke=\"%s\" stroke-width=\"1.5\" stroke-linecap=\"round\" />", paths, color));
                svgContent.append("</g>");

                count++;
            }
        }

        svgContent.append("</svg>");

        try {
            Path file = Path.of("output_patterns_fixed.svg");
            Files.writeString(file, svgContent.toString());
            System.out.println("Saved to " + file.toAbsolutePath());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // --- Simulation ---
    static class Simulation {
        int w, h;
        double f, k, da, db;
        double[] a, b, nextA, nextB;

        public Simulation(int w, int h, double da, double db, double f, double k) {
            this.w = w; this.h = h;
            this.da = da; this.db = db;
            this.f = f; this.k = k;

            int size = w * h;
            a = new double[size];
            b = new double[size];
            nextA = new double[size];
            nextB = new double[size];

            // Init
            for (int i = 0; i < size; i++) { a[i] = 1.0; b[i] = 0.0; }

            // Seed: Increased size to ensure survival
            int seedRadius = 15;
            for (int i = w / 2 - seedRadius; i < w / 2 + seedRadius; i++) {
                for (int j = h / 2 - seedRadius; j < h / 2 + seedRadius; j++) {
                    b[i + j * w] = 1.0;
                }
            }
        }

        public void run(int steps) {
            double center = -1.0;
            double adj = 0.2;
            double diag = 0.05;

            for (int t = 0; t < steps; t++) {
                // Skip borders to avoid bounds checks
                for (int x = 1; x < w - 1; x++) {
                    for (int y = 1; y < h - 1; y++) {
                        int i = x + y * w;

                        double u = a[i];
                        double v = b[i];

                        // Laplacian
                        double lu =
                                (a[i-1]*adj) + (a[i+1]*adj) + (a[i-w]*adj) + (a[i+w]*adj) +
                                        (a[i-w-1]*diag) + (a[i-w+1]*diag) + (a[i+w-1]*diag) + (a[i+w+1]*diag) +
                                        (u * center);

                        double lv =
                                (b[i-1]*adj) + (b[i+1]*adj) + (b[i-w]*adj) + (b[i+w]*adj) +
                                        (b[i-w-1]*diag) + (b[i-w+1]*diag) + (b[i+w-1]*diag) + (b[i+w+1]*diag) +
                                        (v * center);

                        double reaction = u * v * v;

                        // Euler integration
                        nextA[i] = u + (da * lu - reaction + f * (1 - u)) * DT;
                        nextB[i] = v + (db * lv + reaction - (k + f) * v) * DT;

                        // Fast clamping
                        if (nextA[i] < 0) nextA[i] = 0; else if (nextA[i] > 1) nextA[i] = 1;
                        if (nextB[i] < 0) nextB[i] = 0; else if (nextB[i] > 1) nextB[i] = 1;
                    }
                }
                // Swap
                double[] temp = a; a = nextA; nextA = temp;
                temp = b; b = nextB; nextB = temp;
            }
        }
    }

    // --- Marching Squares ---
    static class MarchingSquares {
        public static String vectorize(double[] data, int w, int h, double threshold) {
            StringBuilder path = new StringBuilder();

            for (int y = 0; y < h - 1; y++) {
                for (int x = 0; x < w - 1; x++) {
                    int i = x + y * w;

                    // Determine corner states
                    int state = 0;
                    if (data[i] > threshold) state |= 8;
                    if (data[i+1] > threshold) state |= 4;
                    if (data[i+w+1] > threshold) state |= 2;
                    if (data[i+w] > threshold) state |= 1;

                    if (state == 0 || state == 15) continue;

                    // Coordinates (centered on cell + 0.5 offsets)
                    double mx = x + 0.5;
                    double my = y + 0.5;
                    // Edges
                    double topX = x + 0.5, topY = y;
                    double rightX = x + 1, rightY = y + 0.5;
                    double botX = x + 0.5, botY = y + 1;
                    double leftX = x, leftY = y + 0.5;

                    switch (state) {
                        case 1:  path.append(line(leftX, leftY, botX, botY)); break;
                        case 2:  path.append(line(botX, botY, rightX, rightY)); break;
                        case 3:  path.append(line(leftX, leftY, rightX, rightY)); break;
                        case 4:  path.append(line(topX, topY, rightX, rightY)); break;
                        case 5:  path.append(line(leftX, leftY, topX, topY));
                            path.append(line(botX, botY, rightX, rightY)); break;
                        case 6:  path.append(line(topX, topY, botX, botY)); break;
                        case 7:  path.append(line(leftX, leftY, topX, topY)); break;
                        case 8:  path.append(line(leftX, leftY, topX, topY)); break;
                        case 9:  path.append(line(topX, topY, botX, botY)); break;
                        case 10: path.append(line(topX, topY, rightX, rightY));
                            path.append(line(botX, botY, leftX, leftY)); break;
                        case 11: path.append(line(topX, topY, rightX, rightY)); break;
                        case 12: path.append(line(leftX, leftY, rightX, rightY)); break;
                        case 13: path.append(line(botX, botY, rightX, rightY)); break;
                        case 14: path.append(line(leftX, leftY, botX, botY)); break;
                    }
                }
            }
            return path.toString();
        }

        private static String line(double x1, double y1, double x2, double y2) {
            // Append with space for clear separation
            return "M " + ((float)x1) + " " + ((float)y1) + " L " + ((float)x2) + " " + ((float)y2) + " ";
        }
    }
}