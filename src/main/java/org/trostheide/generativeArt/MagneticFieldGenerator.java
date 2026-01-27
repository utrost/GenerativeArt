package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.*;

import java.util.*;
import java.util.stream.Collectors;

public class MagneticFieldGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "magnetic_field";
    }

    @Override
    public String getDisplayName() {
        return "Magnetic Field";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("lineCount", 500, 50, 2000, "Number of field lines"),
                ParameterDefinition.doubleVal("lineWidth", 1.0, 0.1, 10.0, "Line Width"),
                ParameterDefinition.integer("colorCount", 3, 1, 6, "Number of Colors"),
                ParameterDefinition.integer("poleCount", 2, 1, 10, "Number of Magnetic Poles"),
                ParameterDefinition.doubleVal("stepSize", 5.0, 1.0, 20.0, "Integration Step Size"),
                ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed"));
    }

    private record Pole(double x, double y, double charge) {
    }

    private record Point(double x, double y) {
    }

    @Override
    public String generate(Map<String, Object> params) {
        int lineCount = (int) params.getOrDefault("lineCount", 500);
        double lineWidth = (double) params.getOrDefault("lineWidth", 1.0);
        int colorCount = (int) params.getOrDefault("colorCount", 3);
        int poleCount = (int) params.getOrDefault("poleCount", 2);
        double stepSize = (double) params.getOrDefault("stepSize", 5.0);
        int seed = (int) params.getOrDefault("seed", 1234);

        double width = 800;
        double height = 600;

        SvgCanvas canvas = new SvgCanvas(width, height, colorCount);
        canvas.setStrokeWidth(lineWidth);

        Random rand = new Random(seed);

        // 1. Generate Poles
        List<Pole> poles = new ArrayList<>();
        // bias poles towards center area
        double margin = 200;
        for (int i = 0; i < poleCount; i++) {
            double x = margin + rand.nextDouble() * (width - 2 * margin);
            double y = margin + rand.nextDouble() * (height - 2 * margin);
            // alternating charges or random? Reference image looks like a sink (attractor).
            // Let's make them all attractors (negative charge) so lines go TOWARDS them.
            double charge = -1000.0 - rand.nextDouble() * 2000.0;
            poles.add(new Pole(x, y, charge));
        }

        // 2. Generate Start Points along Edges
        List<Point> startPoints = new ArrayList<>();
        double perimeter = 2 * (width + height);
        for (int i = 0; i < lineCount; i++) {
            // Random distance along perimeter
            double d = rand.nextDouble() * perimeter;
            if (d < width) {
                // Top edge
                startPoints.add(new Point(d, 0));
            } else if (d < width + height) {
                // Right edge
                startPoints.add(new Point(width, d - width));
            } else if (d < 2 * width + height) {
                // Bottom edge
                startPoints.add(new Point(2 * width + height - d, height));
            } else {
                // Left edge
                startPoints.add(new Point(0, perimeter - d));
            }
        }

        // 3. Trace Lines
        for (int i = 0; i < lineCount; i++) {
            Point start = startPoints.get(i);
            int layerIndex = i % colorCount;
            traceLine(canvas, layerIndex, start, poles, width, height, stepSize);
        }

        return canvas.toSvg();
    }

    private void traceLine(SvgCanvas canvas, int layer, Point start, List<Pole> poles,
            double width, double height, double stepSize) {

        StringBuilder path = new StringBuilder();
        path.append(String.format(Locale.US, "M %.2f %.2f", start.x, start.y));

        double x = start.x;
        double y = start.y;

        int maxSteps = 1000;
        boolean first = true;

        for (int step = 0; step < maxSteps; step++) {
            // Calculate Force/Velocity at (x,y)
            double vx = 0;
            double vy = 0;

            double minDist = Double.MAX_VALUE;

            for (Pole pole : poles) {
                double dx = pole.x - x;
                double dy = pole.y - y;
                double distSq = dx * dx + dy * dy;
                double dist = Math.sqrt(distSq);

                if (dist < minDist)
                    minDist = dist;

                // Force ~ Charge / dist^2 (Coulomb's law)
                // Avoid singularity
                if (dist < 10.0) {
                    // Too close to pole, stop tracing
                    // Force singularity makes it shoot off.
                    // Just end the line here.
                }

                double force = pole.charge / (distSq + 100); // +100 to soften

                // Vector is unit(d) * force.
                // Since charge is negative, force is negative.
                // But we want extraction.
                // If charge is negative, it attracts.
                // Vector P->Pole is (dx, dy).
                // Force direction: We want it to be attractive.
                // If we treat field lines as going FROM Positive TO Negative.
                // We are tracing FROM edges (assume positive or neutral source) TO Poles
                // (negative).
                // Velocity should be towards pole.
                // vector (dx, dy) points TO pole.

                // Strength
                double strength = 5000.0 / (distSq + 100);

                vx += (dx / dist) * strength;
                vy += (dy / dist) * strength;
            }

            if (minDist < 10.0)
                break; // Reached target

            // Normalize velocity to step size
            double vMag = Math.sqrt(vx * vx + vy * vy);
            if (vMag == 0)
                break;

            x += (vx / vMag) * stepSize;
            y += (vy / vMag) * stepSize;

            // Check bounds (optional, if we want them to enter and leave?)
            // Usually they stay inside if attracted.
            if (x < 0 || x > width || y < 0 || y > height) {
                // break; // Let them curve back in?
                // If it's pure attraction, they won't leave.
            }

            path.append(String.format(Locale.US, " L %.2f %.2f", x, y));
        }

        canvas.addPath(layer, "<path d='" + path.toString() + "' />");
    }
}
