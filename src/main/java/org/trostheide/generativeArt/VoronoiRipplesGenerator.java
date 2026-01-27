package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Random;

public class VoronoiRipplesGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "voronoi_ripples";
    }

    @Override
    public String getDisplayName() {
        return "Voronoi Ripples";
    }

    @Override
    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.integer("pointCount", 12, 2, 50, "Number of seed points"),
                ParameterDefinition.doubleVal("lineSpacing", 6.0, 2.0, 50.0, "Distance between concentric rings"),
                ParameterDefinition.doubleVal("lineWidth", 1.0, 0.1, 10.0, "Stroke width of the lines"),
                ParameterDefinition.bool("monochrome", false, "Use single color (Black)"),
                ParameterDefinition.integer("colorCount", 6, 1, 12, "Number of colors/layers (if not monochrome)"),
                ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed"));
    }

    private record Point(double x, double y) {
    }

    private record AngularInterval(double start, double end) {
    } // start < end, in [0, 2pi]. Wraparound handled by splitting.

    @Override
    public String generate(Map<String, Object> params) {
        int pointCount = (int) params.getOrDefault("pointCount", 12);
        double lineSpacing = (double) params.getOrDefault("lineSpacing", 6.0);
        double lineWidth = (double) params.getOrDefault("lineWidth", 1.0);
        boolean monochrome = (boolean) params.getOrDefault("monochrome", false);
        int colorCount = (int) params.getOrDefault("colorCount", 6);
        int seed = (int) params.getOrDefault("seed", 1234);

        double width = 800; // Standardize for now, SvgCanvas handles viewbox
        double height = 600;

        int numLayers = monochrome ? 1 : colorCount;
        SvgCanvas canvas = new SvgCanvas(width, height, numLayers);
        canvas.setStrokeWidth(lineWidth);

        Random rand = new Random(seed);
        List<Point> seeds = new ArrayList<>();
        for (int i = 0; i < pointCount; i++) {
            seeds.add(new Point(rand.nextDouble() * width, rand.nextDouble() * height));
        }

        double maxDim = Math.max(width, height) * 1.5; // Draw enough rings to cover corners

        for (int i = 0; i < seeds.size(); i++) {
            Point p = seeds.get(i);
            int layerIndex = monochrome ? 0 : (i % colorCount);

            // Draw concentric circles
            for (double r = lineSpacing; r < maxDim; r += lineSpacing) {

                // 1. Start with full circle interval [0, 2PI]
                List<AngularInterval> intervals = new ArrayList<>();
                intervals.add(new AngularInterval(0, 2 * Math.PI));

                // 2. Clip against all other points (Voronoi Bisectors)
                for (int j = 0; j < seeds.size(); j++) {
                    if (i == j)
                        continue;
                    Point neighbor = seeds.get(j);

                    // The bisector line condition: Dist(X, P) < Dist(X, Neighbor)
                    // Let X = P + (r cos t, r sin t)
                    // The boundary is where Dist(X, P) = Dist(X, Neighbor)
                    // Actually simpler: Project Vector(P->Neighbor) onto Vector(P->X).
                    // The boundary is the perpendicular bisector.
                    // The midpoint M = (P+N)/2.
                    // The vector V = N - P.
                    // We want points X such that (X-M) dot V < 0.
                    // This defines a half plane. The line is L.
                    // Intersection of Line L with Circle(P, r).

                    intervals = clipWithLine(intervals, p, r, neighbor);
                }

                // 3. Clip against Canvas Bounds (0,0) to (W,H)

                // Left Edge (x > 0) -> -x < 0 -> -(px + r cos t) < 0 -> -r cos t < px -> A=-r,
                // B=0, K=px
                intervals = solveInequality(intervals, -r, 0, p.x);

                // Right Edge (x < W) -> x - W < 0 -> (px + r cos t) < W -> r cos t < W - px ->
                // A=r, B=0, K=width - p.x
                intervals = solveInequality(intervals, r, 0, width - p.x);

                // Top Edge (y > 0) -> -y < 0 -> -(py + r sin t) < 0 -> -r sin t < py -> A=0,
                // B=-r, K=p.y
                intervals = solveInequality(intervals, 0, -r, p.y);

                // Bottom Edge (y < H) -> y - H < 0 -> (py + r sin t) < H -> r sin t < H - p.y
                // -> A=0, B=r, K=height - p.y
                intervals = solveInequality(intervals, 0, r, height - p.y);

                // 4. Draw remaining intervals
                for (AngularInterval interval : intervals) {
                    drawArc(canvas, layerIndex, p, r, interval.start, interval.end);
                }
            }
        }

        return canvas.toSvg();
    }

    private List<AngularInterval> clipWithLine(List<AngularInterval> currentIntervals, Point p, double r,
            Point neighbor) {
        // We want the half plane containing P.
        // Vector V = Neighbor - P
        double vx = neighbor.x - p.x;
        double vy = neighbor.y - p.y;

        // Midpoint M
        double mx = (p.x + neighbor.x) / 2.0;
        double my = (p.y + neighbor.y) / 2.0;

        // Equation of boundary line:
        // (X - M) dot V = 0
        // We want (X - M) dot V < 0 (closer to P)

        // Let X = (p.x + r cos t, p.y + r sin t)
        // (p.x + r cos t - mx) * vx + (p.y + r sin t - my) * vy < 0
        // (p.x - mx) * vx + (p.y - my) * vy + r(vx cos t + vy sin t) < 0

        // Let C = (p.x - mx) * vx + (p.y - my) * vy
        // C + r * vx * cos t + r * vy * sin t < 0
        // r * vx * cos t + r * vy * sin t < -C

        // This is of form A cos t + B sin t < K
        // R_len * cos(t - alpha) < K
        // where R_len = sqrt( (r*vx)^2 + (r*vy)^2 )
        // alpha = atan2(r*vy, r*vx) = atan2(vy, vx)

        double A = r * vx;
        double B = r * vy;
        double K = -((p.x - mx) * vx + (p.y - my) * vy);

        return solveInequality(currentIntervals, A, B, K);
    }

    // Solves A cos t + B sin t < K
    private List<AngularInterval> solveInequality(List<AngularInterval> intervals, double A, double B, double K) {
        double R = Math.sqrt(A * A + B * B);
        if (R == 0) {
            // 0 < K. If true, all valid. If false, none valid.
            if (0 < K)
                return intervals;
            else
                return new ArrayList<>();
        }

        // cos(t - alpha) < K / R
        double alpha = Math.atan2(B, A);
        double val = K / R;

        // cos(theta) < val
        // If val >= 1, always true (cos <= 1 <= val) -> return intervals
        if (val >= 1.0)
            return intervals;
        // If val < -1, never true (cos >= -1 > val) -> return empty
        if (val < -1.0)
            return new ArrayList<>();

        // cos(theta) < val
        // The valid range for theta (shifted by alpha) is roughly (acos(val), 2pi -
        // acos(val))
        // because cos starts at 1 (invalid if val<1) and goes down.
        // Wait, cos(0)=1. If we want cos < 0.5, we want angles away from 0.
        // Range is [acos(val), 2pi - acos(val)].

        double limit = Math.acos(val);
        double startAngle = limit;
        double endAngle = 2 * Math.PI - limit;

        // Shift back by alpha: t - alpha \in [start, end]
        // t \in [start + alpha, end + alpha]

        return intersect(intervals, new AngularInterval(startAngle + alpha, endAngle + alpha));
    }

    private List<AngularInterval> intersect(List<AngularInterval> current, AngularInterval clip) {
        List<AngularInterval> result = new ArrayList<>();

        // Normalize clip interval to generated segments in [0, 2pi)
        // Since clip can be e.g. [3pi, 5pi], we need to handle wrapping.
        // Simplify: Just normalize the clip range to 0-2pi visually?
        // No, simplest is to handle the generic overlap logic.

        // Strategy:
        // The clip interval defines a "valid region" on the circle. It creates 1 or 2
        // valid segments in [0, 2pi].
        // e.g. if range is [0.1, 0.2] -> one segment.
        // if range is [6.0, 6.5] (crossing 0) -> [6.0, 2pi] AND [0, 0.2-ish].

        List<AngularInterval> validClips = normalize(clip.start, clip.end);

        for (AngularInterval validClip : validClips) {
            for (AngularInterval existing : current) {
                // Intersect existent [s1, e1] with validClip [s2, e2]
                double start = Math.max(existing.start, validClip.start);
                double end = Math.min(existing.end, validClip.end);

                if (start < end) {
                    result.add(new AngularInterval(start, end));
                }
            }
        }
        return result;
    }

    private List<AngularInterval> normalize(double start, double end) {
        // normalize to [0, 2pi)
        // width is end - start. assumed <= 2pi (it is, from acos logic).

        double twoPi = 2 * Math.PI;

        // wrap start to [0, 2pi)
        double width = end - start;
        start = start % twoPi;
        if (start < 0)
            start += twoPi;
        end = start + width;

        List<AngularInterval> res = new ArrayList<>();
        if (end <= twoPi) {
            res.add(new AngularInterval(start, end));
        } else {
            res.add(new AngularInterval(start, twoPi));
            res.add(new AngularInterval(0, end - twoPi));
        }
        return res;
    }

    private void drawArc(SvgCanvas canvas, int layer, Point center, double r, double startAngle, double endAngle) {
        // Convert to Cartesian
        double x1 = center.x + r * Math.cos(startAngle);
        double y1 = center.y + r * Math.sin(startAngle);
        double x2 = center.x + r * Math.cos(endAngle);
        double y2 = center.y + r * Math.sin(endAngle);

        // Large arc flag
        // If difference > pi, flag is 1
        double diff = endAngle - startAngle;
        while (diff < 0)
            diff += 2 * Math.PI; // safety
        int largeArc = (diff > Math.PI) ? 1 : 0;

        String path = String.format(Locale.US, "<path d='M %.2f %.2f A %.2f %.2f 0 %d 1 %.2f %.2f' />",
                x1, y1, r, r, largeArc, x2, y2);
        canvas.addPath(layer, path);
    }
}
