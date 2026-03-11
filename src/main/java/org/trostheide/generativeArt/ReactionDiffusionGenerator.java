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

    @Override
    public String getId() {
        return "reaction-diffusion";
    }

    @Override
    public String getDisplayName() {
        return "Reaction Diffusion (Gray-Scott)";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Coral Growth", "Mitosis", "Mazes", "Moving Spots"), 
                    "Select a predefined style"),
                ParameterDefinition.doubleVal("Feed Rate", 0.055, 0.01, 0.1, "Feed rate (f)"),
                ParameterDefinition.doubleVal("Kill Rate", 0.062, 0.01, 0.1, "Kill rate (k)"),
                ParameterDefinition.integer("Iterations", 8000, 1000, 20000, "Simulation steps"),
                ParameterDefinition.doubleVal("Threshold", 0.25, 0.1, 0.9, "Start iso-contour threshold"),
                ParameterDefinition.integer("Scale", 2, 1, 5, "Output scale"),
                ParameterDefinition.integer("Colors", 1, 1, 6, "Number of layers (contours)"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Coral Growth":
                    currentValues.put("Feed Rate", 0.0545);
                    currentValues.put("Kill Rate", 0.062);
                    currentValues.put("Iterations", 10000);
                    currentValues.put("Threshold", 0.3);
                    currentValues.put("Scale", 2);
                    currentValues.put("Colors", 2);
                    return true;
                case "Mitosis":
                    currentValues.put("Feed Rate", 0.0367);
                    currentValues.put("Kill Rate", 0.0649);
                    currentValues.put("Iterations", 8000);
                    currentValues.put("Threshold", 0.25);
                    currentValues.put("Scale", 2);
                    currentValues.put("Colors", 1);
                    return true;
                case "Mazes":
                    currentValues.put("Feed Rate", 0.029);
                    currentValues.put("Kill Rate", 0.057);
                    currentValues.put("Iterations", 10000);
                    currentValues.put("Threshold", 0.2);
                    currentValues.put("Scale", 2);
                    currentValues.put("Colors", 1);
                    return true;
                case "Moving Spots":
                    currentValues.put("Feed Rate", 0.014);
                    currentValues.put("Kill Rate", 0.054);
                    currentValues.put("Iterations", 12000);
                    currentValues.put("Threshold", 0.4);
                    currentValues.put("Scale", 3);
                    currentValues.put("Colors", 3);
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

        int totalW = width * scale;
        int totalH = height * scale;
        double startThreshold = (double) params.getOrDefault("Threshold", 0.25);
        int numColors = (int) params.getOrDefault("Colors", 1);

        // Ensure simulation is run
        Simulation sim = new Simulation(width, height, da, db, f, k);
        sim.run(iterations);

        org.trostheide.generativeArt.core.SvgCanvas canvas = new org.trostheide.generativeArt.core.SvgCanvas(totalW,
                totalH, numColors);

        // Generate contours for each layer
        for (int i = 0; i < numColors; i++) {
            // Vary threshold slightly for each layer to create concentric rings
            // e.g., 0.2, 0.25, 0.3...
            double threshold = startThreshold + (i * 0.05);
            if (threshold >= 1.0)
                threshold = 0.99;

            String paths = MarchingSquares.vectorize(sim.b, width, height, threshold);

            String groupContent = String.format(java.util.Locale.US,
                    "<g transform='scale(%d)'>\n" +
                            "<path d='%s' fill='none' stroke-width='1.5' stroke-linecap='round' />\n" +
                            "</g>",
                    scale, paths);

            canvas.addRaw(i, groupContent);
        }

        return canvas.toSvg();
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
