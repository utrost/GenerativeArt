package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;

import java.util.List;
import java.util.Map;

public class ReactionDiffusionGenerator implements ArtGenerator {

    private int width = 200;
    private int height = 200;
    private int scale = 2;
    private int iterations = 8000;
    private double da = 1.0;
    private double db = 0.5;
    private double f = 0.055;
    private double k = 0.062;
    private double isoThreshold = 0.25;

    @Override
    public String getId() {
        return "reaction-diffusion";
    }

    @Override
    public String getDisplayName() {
        return "Reaction Diffusion (Gray-Scott)";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.doubleVal("Feed Rate", 0.055, 0.01, 0.1, "Feed rate (f)"),
                ParameterDefinition.doubleVal("Kill Rate", 0.062, 0.01, 0.1, "Kill rate (k)"),
                ParameterDefinition.integer("Iterations", 8000, 1000, 20000, "Simulation steps"),
                ParameterDefinition.doubleVal("Threshold", 0.25, 0.1, 0.9, "Iso-contour threshold"),
                ParameterDefinition.integer("Scale", 2, 1, 5, "Output scale"));
    }

    @Override
    public String generate(Map<String, Object> params) {

        int totalW = width * scale;
        int totalH = height * scale;

        Simulation sim = new Simulation(width, height, da, db, f, k);
        sim.run(iterations);
        String paths = MarchingSquares.vectorize(sim.b, width, height, isoThreshold);

        return String.format(
                "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 %d %d\" width=\"%d\" height=\"%d\" style=\"background-color:white\">\n"
                        +
                        "  <defs><clipPath id='pageClip'><rect width='%d' height='%d'/></clipPath></defs>\n" +
                        "  <g transform=\"scale(%d)\" clip-path=\"url(#pageClip)\">\n" +
                        "    <path d=\"%s\" fill=\"none\" stroke=\"black\" stroke-width=\"1.5\" stroke-linecap=\"round\" />\n"
                        +
                        "  </g>\n" +
                        "</svg>",
                totalW, totalH, totalW, totalH, totalW, totalH, scale, paths);
    }

    // --- Simulation ---
    private static class Simulation {
        int w, h;
        double f, k, da, db;
        double[] a, b, nextA, nextB;
        private static final double DT = 1.0;

        public Simulation(int w, int h, double da, double db, double f, double k) {
            this.w = w;
            this.h = h;
            this.da = da;
            this.db = db;
            this.f = f;
            this.k = k;

            int size = w * h;
            a = new double[size];
            b = new double[size];
            nextA = new double[size];
            nextB = new double[size];

            // Init
            for (int i = 0; i < size; i++) {
                a[i] = 1.0;
                b[i] = 0.0;
            }

            // Seed
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
                for (int x = 1; x < w - 1; x++) {
                    for (int y = 1; y < h - 1; y++) {
                        int i = x + y * w;
                        double u = a[i];
                        double v = b[i];

                        double lu = (a[i - 1] * adj) + (a[i + 1] * adj) + (a[i - w] * adj) + (a[i + w] * adj) +
                                (a[i - w - 1] * diag) + (a[i - w + 1] * diag) + (a[i + w - 1] * diag)
                                + (a[i + w + 1] * diag) +
                                (u * center);
                        double lv = (b[i - 1] * adj) + (b[i + 1] * adj) + (b[i - w] * adj) + (b[i + w] * adj) +
                                (b[i - w - 1] * diag) + (b[i - w + 1] * diag) + (b[i + w - 1] * diag)
                                + (b[i + w + 1] * diag) +
                                (v * center);

                        double reaction = u * v * v;

                        nextA[i] = u + (da * lu - reaction + f * (1 - u)) * DT;
                        nextB[i] = v + (db * lv + reaction - (k + f) * v) * DT;

                        if (nextA[i] < 0)
                            nextA[i] = 0;
                        else if (nextA[i] > 1)
                            nextA[i] = 1;
                        if (nextB[i] < 0)
                            nextB[i] = 0;
                        else if (nextB[i] > 1)
                            nextB[i] = 1;
                    }
                }
                double[] temp = a;
                a = nextA;
                nextA = temp;
                temp = b;
                b = nextB;
                nextB = temp;
            }
        }
    }

    // --- Marching Squares ---
    private static class MarchingSquares {
        public static String vectorize(double[] data, int w, int h, double threshold) {
            StringBuilder path = new StringBuilder();

            for (int y = 0; y < h - 1; y++) {
                for (int x = 0; x < w - 1; x++) {
                    int i = x + y * w;
                    int state = 0;
                    if (data[i] > threshold)
                        state |= 8;
                    if (data[i + 1] > threshold)
                        state |= 4;
                    if (data[i + w + 1] > threshold)
                        state |= 2;
                    if (data[i + w] > threshold)
                        state |= 1;

                    if (state == 0 || state == 15)
                        continue;

                    double topX = x + 0.5, topY = y;
                    double rightX = x + 1, rightY = y + 0.5;
                    double botX = x + 0.5, botY = y + 1;
                    double leftX = x, leftY = y + 0.5;

                    switch (state) {
                        case 1:
                            path.append(line(leftX, leftY, botX, botY));
                            break;
                        case 2:
                            path.append(line(botX, botY, rightX, rightY));
                            break;
                        case 3:
                            path.append(line(leftX, leftY, rightX, rightY));
                            break;
                        case 4:
                            path.append(line(topX, topY, rightX, rightY));
                            break;
                        case 5:
                            path.append(line(leftX, leftY, topX, topY));
                            path.append(line(botX, botY, rightX, rightY));
                            break;
                        case 6:
                            path.append(line(topX, topY, botX, botY));
                            break;
                        case 7:
                            path.append(line(leftX, leftY, topX, topY));
                            break;
                        case 8:
                            path.append(line(leftX, leftY, topX, topY));
                            break;
                        case 9:
                            path.append(line(topX, topY, botX, botY));
                            break;
                        case 10:
                            path.append(line(topX, topY, rightX, rightY));
                            path.append(line(botX, botY, leftX, leftY));
                            break;
                        case 11:
                            path.append(line(topX, topY, rightX, rightY));
                            break;
                        case 12:
                            path.append(line(leftX, leftY, rightX, rightY));
                            break;
                        case 13:
                            path.append(line(botX, botY, rightX, rightY));
                            break;
                        case 14:
                            path.append(line(leftX, leftY, botX, botY));
                            break;
                    }
                }
            }
            return path.toString();
        }

        private static String line(double x1, double y1, double x2, double y2) {
            return "M " + ((float) x1) + " " + ((float) y1) + " L " + ((float) x2) + " " + ((float) y2) + " ";
        }
    }
}
