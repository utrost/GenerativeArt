package org.trostheide.generativeArt;

import org.trostheide.generativeArt.core.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Stack;

public class PipeNetworkGenerator implements ArtGenerator {

    @Override
    public String getId() {
        return "pipe_network";
    }

    @Override
    public String getDisplayName() {
        return "Pipe Network (WFC)";
    }

    public List<ParameterDefinition> getParameterDefinitions() {
        return List.of(
                ParameterDefinition.selection("Preset", "Custom", 
                    java.util.Arrays.asList("Custom", "Dense Industrial", "Large Conduits", "Complex Maze"), 
                    "Select a predefined style"),
                ParameterDefinition.integer("rows", 10, 3, 50, "Grid Rows"),
                ParameterDefinition.integer("cols", 10, 3, 50, "Grid Columns"),
                ParameterDefinition.doubleVal("pipeWidth", 15.0, 1.0, 50.0, "Pipe Width"),
                ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed"));
    }

    @Override
    public boolean onParameterChanged(String paramName, Object newValue, Map<String, Object> currentValues) {
        if ("Preset".equals(paramName) && newValue instanceof String) {
            String preset = (String) newValue;
            switch (preset) {
                case "Dense Industrial":
                    currentValues.put("rows", 20);
                    currentValues.put("cols", 20);
                    currentValues.put("pipeWidth", 10.0);
                    currentValues.put("seed", 101);
                    return true;
                case "Large Conduits":
                    currentValues.put("rows", 5);
                    currentValues.put("cols", 5);
                    currentValues.put("pipeWidth", 30.0);
                    currentValues.put("seed", 404);
                    return true;
                case "Complex Maze":
                    currentValues.put("rows", 30);
                    currentValues.put("cols", 30);
                    currentValues.put("pipeWidth", 5.0);
                    currentValues.put("seed", 999);
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

    // --- Inner Classes for WFC ---

    private enum Direction {
        NORTH(0, 0, -1), EAST(1, 1, 0), SOUTH(2, 0, 1), WEST(3, -1, 0);

        final int index;
        final int dx, dy;

        Direction(int index, int dx, int dy) {
            this.index = index;
            this.dx = dx;
            this.dy = dy;
        }

        Direction opposite() {
            return values()[(this.index + 2) % 4];
        }
    }

    // Connectivity: 0 = Empty, 1 = Pipe
    private record Tile(String name, int[] edges, String svgPathType) {
        // edges: [N, E, S, W]
    }

    private static final List<Tile> TILES = new ArrayList<>();

    static {
        // Definitions: 1=Pipe, 0=Empty
        // Straights
        TILES.add(new Tile("Vertical", new int[] { 1, 0, 1, 0 }, "VERT"));
        TILES.add(new Tile("Horizontal", new int[] { 0, 1, 0, 1 }, "HORIZ"));

        // Corners
        TILES.add(new Tile("Corner_NE", new int[] { 1, 1, 0, 0 }, "CORNER_NE"));
        TILES.add(new Tile("Corner_ES", new int[] { 0, 1, 1, 0 }, "CORNER_ES"));
        TILES.add(new Tile("Corner_SW", new int[] { 0, 0, 1, 1 }, "CORNER_SW"));
        TILES.add(new Tile("Corner_WN", new int[] { 1, 0, 0, 1 }, "CORNER_WN"));

        // Crossings (same connectivity, different render)
        TILES.add(new Tile("Cross_Vert_Over", new int[] { 1, 1, 1, 1 }, "CROSS_VERT_OVER"));
        TILES.add(new Tile("Cross_Horiz_Over", new int[] { 1, 1, 1, 1 }, "CROSS_HORIZ_OVER"));

        // Empty (optional, maybe rare?)
        // TILES.add(new Tile("Empty", new int[]{0, 0, 0, 0}, "EMPTY"));
        // Let's exclude Empty for now to force a dense network like the image
    }

    @Override
    @SuppressWarnings("unchecked")
    public String generate(Map<String, Object> params) {
        int rows = (int) params.getOrDefault("rows", 10);
        int cols = (int) params.getOrDefault("cols", 10);
        double pipeWidth = (double) params.getOrDefault("pipeWidth", 15.0);
        int seed = (int) params.getOrDefault("seed", 1234);

        Random rand = new Random(seed);

        // Initialize Wave
        List<Tile>[][] wave = new ArrayList[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                wave[r][c] = new ArrayList<>(TILES);
            }
        }

        // 1. Apply Boundary Constraints
        if (!applyBoundaryConstraints(wave, rows, cols)) {
            System.err.println("Evaluation check failed: Boundary constraints caused contradiction.");
            return render(wave, rows, cols, pipeWidth); // Should not happen with standard tiles
        }

        // 2. Solve with Backtracking
        if (solve(wave, rows, cols, rand)) {
            return render(wave, rows, cols, pipeWidth);
        } else {
            System.err.println("Solver failed to find a solution.");
            return render(wave, rows, cols, pipeWidth); // Render whatever partial state we have
        }
    }

    // Recursive Backtracking Solver
    private boolean solve(List<Tile>[][] wave, int rows, int cols, Random rand) {
        Point p = findMinEntropy(wave, rand);
        if (p == null) {
            return true; // Fully collapsed!
        }

        // Try options
        List<Tile> options = new ArrayList<>(wave[p.r][p.c]);
        // Shuffle options for randomness
        Collections.shuffle(options, rand);

        for (Tile option : options) {
            // Create a backup of the current state (Deep key)
            // Optimization: Only backup if we actually proceed? Backtracking requires
            // reverting.
            // Deep copy of wave is expensive but safe.
            List<Tile>[][] backup = cloneWave(wave, rows, cols);

            // Collapse cell
            wave[p.r][p.c].clear();
            wave[p.r][p.c].add(option);

            // Propagate constraints
            if (propagate(wave, rows, cols, p)) {
                // If consistent, recurse
                if (solve(wave, rows, cols, rand)) {
                    return true;
                }
            }

            // Revert state (Backtrack)
            restoreWave(wave, backup, rows, cols);
        }

        return false; // No options worked
    }

    private boolean applyBoundaryConstraints(List<Tile>[][] wave, int rows, int cols) {
        Stack<Point> stack = new Stack<>();
        boolean changed = false;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                boolean localChange = false;
                List<Tile> tiles = wave[r][c];
                List<Tile> valid = new ArrayList<>();

                for (Tile t : tiles) {
                    boolean ok = true;
                    // North Edge (r=0) -> N must be 0
                    if (r == 0 && t.edges[0] == 1)
                        ok = false;
                    // South Edge (r=rows-1) -> S must be 0
                    if (r == rows - 1 && t.edges[2] == 1)
                        ok = false;
                    // West Edge (c=0) -> W must be 0
                    if (c == 0 && t.edges[3] == 1)
                        ok = false;
                    // East Edge (c=cols-1) -> E must be 0
                    if (c == cols - 1 && t.edges[1] == 1)
                        ok = false;

                    if (ok)
                        valid.add(t);
                }

                if (valid.isEmpty())
                    return false;
                if (valid.size() < tiles.size()) {
                    wave[r][c] = valid;
                    stack.push(new Point(r, c));
                    changed = true;
                }
            }
        }

        if (changed) {
            return propagateStack(wave, rows, cols, stack);
        }
        return true;
    }

    // Returns true if consistent, false if contradiction
    private boolean propagate(List<Tile>[][] wave, int rows, int cols, Point start) {
        Stack<Point> stack = new Stack<>();
        stack.push(start);
        return propagateStack(wave, rows, cols, stack);
    }

    private boolean propagateStack(List<Tile>[][] wave, int rows, int cols, Stack<Point> stack) {
        while (!stack.isEmpty()) {
            Point current = stack.pop();
            List<Tile> currentTiles = wave[current.r][current.c];

            for (Direction dir : Direction.values()) {
                int nr = current.r + dir.dy;
                int nc = current.c + dir.dx;

                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    List<Tile> neighborTiles = wave[nr][nc];
                    List<Tile> validNeighbors = new ArrayList<>();

                    boolean changed = false;
                    for (Tile neighborTile : neighborTiles) {
                        boolean compatible = false;
                        for (Tile currentTile : currentTiles) {
                            if (canConnect(currentTile, neighborTile, dir)) {
                                compatible = true;
                                break;
                            }
                        }
                        if (compatible) {
                            validNeighbors.add(neighborTile);
                        } else {
                            changed = true;
                        }
                    }

                    if (validNeighbors.isEmpty()) {
                        return false; // Contradiction
                    }

                    if (changed) {
                        wave[nr][nc] = validNeighbors;
                        stack.push(new Point(nr, nc));
                    }
                }
            }
        }
        return true;
    }

    @SuppressWarnings("unchecked")
    private List<Tile>[][] cloneWave(List<Tile>[][] source, int rows, int cols) {
        List<Tile>[][] dest = new ArrayList[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                dest[r][c] = new ArrayList<>(source[r][c]);
            }
        }
        return dest;
    }

    private void restoreWave(List<Tile>[][] target, List<Tile>[][] backup, int rows, int cols) {
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                target[r][c] = backup[r][c]; // Reference copy of list is fine as we replace the list object in backup
            }
        }
    }

    private boolean canConnect(Tile t1, Tile t2, Direction dir) {
        // T1 is current, T2 is neighbor in 'dir'
        // Edge of T1 in 'dir' must match Edge of T2 in 'opposite'
        int edge1 = t1.edges[dir.index];
        int edge2 = t2.edges[dir.opposite().index];
        return edge1 == edge2;
    }

    private Point findMinEntropy(List<Tile>[][] wave, Random rand) {
        int minEntropy = Integer.MAX_VALUE;
        List<Point> candidates = new ArrayList<>();

        for (int r = 0; r < wave.length; r++) {
            for (int c = 0; c < wave[0].length; c++) {
                int size = wave[r][c].size();
                if (size > 1) {
                    if (size < minEntropy) {
                        minEntropy = size;
                        candidates.clear();
                        candidates.add(new Point(r, c));
                    } else if (size == minEntropy) {
                        candidates.add(new Point(r, c));
                    }
                }
            }
        }

        if (candidates.isEmpty())
            return null;
        return candidates.get(rand.nextInt(candidates.size()));
    }

    // Rendering
    private String render(List<Tile>[][] wave, int rows, int cols, double pipeWidth) {
        double tileSize = 60.0; // Fixed tile size for coordinate logic
        double width = cols * tileSize;
        double height = rows * tileSize;

        SvgCanvas canvas = new SvgCanvas(width, height, 1);

        // Flange offset
        double flangeDist = tileSize / 2.0 - 5.0; // Distance from center to flange

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (wave[r][c].isEmpty())
                    continue; // Contradiction empty

                Tile t = wave[r][c].get(0); // Render the first option (if not fully collapsed, we pick one)

                double cx = c * tileSize + tileSize / 2.0;
                double cy = r * tileSize + tileSize / 2.0;

                // Draw Pipe center depending on type
                switch (t.svgPathType) {
                    case "VERT" -> drawLine(canvas, cx, cy - tileSize / 2, cx, cy + tileSize / 2, pipeWidth);
                    case "HORIZ" -> drawLine(canvas, cx - tileSize / 2, cy, cx + tileSize / 2, cy, pipeWidth);
                    case "CORNER_NE" -> drawCorner(canvas, cx, cy, tileSize, pipeWidth, 0, -1, 1, 0); // N to E
                    case "CORNER_ES" -> drawCorner(canvas, cx, cy, tileSize, pipeWidth, 1, 0, 0, 1); // E to S
                    case "CORNER_SW" -> drawCorner(canvas, cx, cy, tileSize, pipeWidth, 0, 1, -1, 0); // S to W
                    case "CORNER_WN" -> drawCorner(canvas, cx, cy, tileSize, pipeWidth, -1, 0, 0, -1); // W to N
                    case "CROSS_VERT_OVER" -> {
                        // Horizontal (Under)
                        drawLine(canvas, cx - tileSize / 2, cy, cx + tileSize / 2, cy, pipeWidth);
                        // Vertical (Over - with gap) -> Draw simply two lines to mask center?
                        // SVG painter's model: if we just draw lines, they merge.
                        // To simulate "Over", we need to outline?
                        // For a simple plotter style, usually "Over" means we draw the full vertical,
                        // and interrupt the horizontal.
                        // Wait, drawLine just adds a path.
                        // Let's implement interrupt:
                        // Draw vertical full.
                        drawLine(canvas, cx, cy - tileSize / 2, cx, cy + tileSize / 2, pipeWidth);
                        // Draw horizontal interrupted.
                        double gap = pipeWidth * 0.7;
                        drawLine(canvas, cx - tileSize / 2, cy, cx - gap, cy, pipeWidth);
                        drawLine(canvas, cx + gap, cy, cx + tileSize / 2, cy, pipeWidth);
                    }
                    case "CROSS_HORIZ_OVER" -> {
                        // Vertical (Under) - interrupted
                        double gap = pipeWidth * 0.7;
                        drawLine(canvas, cx, cy - tileSize / 2, cx, cy - gap, pipeWidth);
                        drawLine(canvas, cx, cy + gap, cx, cy + tileSize / 2, pipeWidth);
                        // Horizontal (Over) - full
                        drawLine(canvas, cx - tileSize / 2, cy, cx + tileSize / 2, cy, pipeWidth);
                    }
                }

                // Draw Flanges (Detail) based on connections
                // Check edge bits
                if (t.edges[0] == 1)
                    drawFlange(canvas, cx, cy - flangeDist, true, pipeWidth); // N
                if (t.edges[1] == 1)
                    drawFlange(canvas, cx + flangeDist, cy, false, pipeWidth); // E
                if (t.edges[2] == 1)
                    drawFlange(canvas, cx, cy + flangeDist, true, pipeWidth); // S
                if (t.edges[3] == 1)
                    drawFlange(canvas, cx - flangeDist, cy, false, pipeWidth); // W
            }
        }

        return canvas.toSvg();
    }

    private void drawFlange(SvgCanvas canvas, double x, double y, boolean horizontal, double pipeWidth) {
        // A little rectangle or line perpendicular to pipe
        double len = pipeWidth + 6;
        if (horizontal) {
            canvas.addLine(0, x - len / 2, y, x + len / 2, y);
            canvas.addLine(0, x - len / 2, y - 2, x + len / 2, y - 2); // double line
        } else {
            canvas.addLine(0, x, y - len / 2, x, y + len / 2);
            canvas.addLine(0, x - 2, y - len / 2, x - 2, y + len / 2);
        }
    }

    private void drawLine(SvgCanvas canvas, double x1, double y1, double x2, double y2, double width) {
        // Draw outline of pipe or center line?
        // Prompt image looks like "outlined" pipes.
        // SVG <line> is center line.
        // If we want outlines (like a tube), we need `rect` or path.
        // Let's draw "Parallel Lines" to simulate tube walls.
        double offset = width / 2.0;
        double angle = Math.atan2(y2 - y1, x2 - x1);
        double dx = -Math.sin(angle) * offset;
        double dy = Math.cos(angle) * offset;

        canvas.addLine(0, x1 + dx, y1 + dy, x2 + dx, y2 + dy);
        canvas.addLine(0, x1 - dx, y1 - dy, x2 - dx, y2 - dy);
    }

    private void drawCorner(SvgCanvas canvas, double cx, double cy, double size, double width, int dx1, int dy1,
            int dx2, int dy2) {
        // 90 degree arc.
        // Center of arc depends on which corner.
        // NE Corner connects (0, -1) and (1, 0). Arc center is (cx + size/2, cy -
        // size/2)? No.
        // Standard "rounded corner" pipe within a tile:
        // Center of curvature is at one of the tile corners.

        // E.g. NE Corner (North to East).
        // Enters at Top-Middle. Exits at Right-Middle.
        // Arc Center is (cx + size/2, cy - size/2) -> Top Right of tile.
        // Radius = size/2.

        // Let's map direction to arc center offset.
        // NE -> center at (cx + size/2, cy - size/2)??
        // If center is TR, radius to TopMid is width/2. Yes.

        double half = size / 2.0;
        double radius = size / 2.0;
        double arcCx = 0, arcCy = 0;
        double startAngle = 0, endAngle = 0;

        // Determine arc center quadrant based on connection
        // NE: Connects N and E. The "inner" corner is Bottom-Left? No.
        // The pipe curves around the Top-Right corner? No, that would mean center is
        // BL.
        // If center is BL (cx - half, cy + half):
        // Radius to Top-Mid (cx, cy-half) -> distance = sqrt(half^2 + (2half)^2)? No.
        // Correct arc for N<->E turn inside a square tile:
        // The arc is a quarter circle.
        // Center is Bottom-Right (cx + half, cy + half).
        // Radius = half.
        // Top-Mid is (cx, cy-half). Dist to BR: x-diff=half, y-diff=size. NO.

        // Let's visualize:
        // Tile:
        // | N
        // -+----
        // | E
        // --+-----
        // To connect N and E with smooth arc:
        // Center must be at Bottom-Right or Top-Left?
        // If Top-Left (cx-half, cy-half): Radius to TopMid is half. Radius to RightMid
        // is ... width + half? No.

        // Actually, simple pipe corners usually have radius = half_tile_size.
        // If center is (cx - half, cy + half) [Bottom Left], radius to TopMid (cx,
        // cy-half) is "size".
        // Radius to RightMid (cx+half, cy) is "size".
        // EXCEPT: We want the pipe to enter at x=0, y=-half (relative to center).

        // A standard elbow tile:
        // Connects Top (0, -R) to Right (R, 0).
        // Center of arc is (R, -R)? No.
        // Center is (0, 0) if calculating relative.
        // The corner of the tile is (R, -R) or (-R, R)?
        // Wait, for N->E turn, the "pivot" is the Bottom-Right corner. Radius R?
        // Point N: (0, -R). Point E: (R, 0).
        // Intersection of normals:
        // Normal at N (Vertical) -> Horizontal line y = -R? No, normal to flow. Flow is
        // Y. Normal is X axis.
        // Normal at E (Horizontal) -> Vertical line x = R? No.

        // Let's define it simply:
        // N->E is Top->Right.
        // Arc Center is Bottom-Right (cx + half, cy + half). radius = half.
        // Angle start: 180 (Left) -> 270 (Top)? Wait.
        // Circle at (1, 1). To hit (0, 0.5) (Top mid)? and (0.5, 0) (Right mid)?
        // No, standard grid is:
        // TopMid: (0.5, 0). RightMid: (1, 0.5).
        // Center being (1, 0) [Top Right] -> radius 0.5.
        // Angle 180 -> 90.
        // Center being (0, 1) [Bottom Left]? -> radius 0.5? No.

        // Correct Logic:
        // NE Corner: Connects Top-Edge to Right-Edge.
        // Arc Center is **Bottom-Right** (if we want it wide) or **Top-Left** ??
        // Standard "rounded square":
        // Center is at the corner ITSELF? i.e. (cx + half, cy - half) [Top Right].
        // Radius = half.
        // Then TopMid is (cx, cy-half). Dist to TR is half.
        // RightMid is (cx+half, cy). Dist to TR is half.
        // YES.

        // So:
        // NE -> Center Top-Right (cx+half, cy-half). Radius=half. S: 180, E: 90.
        // (CounterClockwise? No 180->270? or 180->90 via 0?)
        // Let's use standard angles. 0=Right, 90=Down, 180=Left, 270=Top.
        // TR center (start at Left(180) -> Top-Mid. to Bottom(90) -> Right-Mid).
        // Angles: 180 to 90.

        // But we want TWO parallel arcs for the tube walls.
        // Inner Radius = half - width/2.
        // Outer Radius = half + width/2.

        if (dx1 == 0 && dy1 == -1 && dx2 == 1 && dy2 == 0) { // N to E
            // NE Corner
            arcCx = cx + half;
            arcCy = cy - half;
            drawDoubleArc(canvas, arcCx, arcCy, half, width, Math.PI, Math.PI / 2);
        } else if (dx1 == 1 && dy1 == 0 && dx2 == 0 && dy2 == 1) { // E to S
            // ES Corner -> Center Bottom-Right. R=half.
            arcCx = cx + half;
            arcCy = cy + half;
            drawDoubleArc(canvas, arcCx, arcCy, half, width, Math.PI * 1.5, Math.PI);
        } else if (dx1 == 0 && dy1 == 1 && dx2 == -1 && dy2 == 0) { // S to W
            // SW Corner -> Center Bottom-Left.
            arcCx = cx - half;
            arcCy = cy + half;
            drawDoubleArc(canvas, arcCx, arcCy, half, width, 0, Math.PI * 1.5); // 0 (Right) to 270 (-90)?
            // Angles: Right is 0. Up is 270.
            // Center BL. RightMid is (cx, cy+half)? No.
            // Center BL (cx-h, cy+h). Top of circle is (cx-h, cy+h-R) = (cx-h, cy).
            // LeftMid.
            // WE WANT Right of circle -> (cx-h+R, cy+h) = (cx, cy+h) BottomMid.
            // S to W connects BottomMid to LeftMid.
            // Center is Top-Left (cx-h, cy-h).
            // Radius half.
            // BottomMid (cx, cy+h) dist is ... sqrt(h^2 + (2h)^2). NO.

            // Re-evaluate S to W.
            // Enters Bottom. Exits Left.
            // Pivot is Top-Left (cx-h, cy-h).
            // R = half.
            // BottomMid (cx, cy+half). Dist from TL: x=h, y=2h. NO.

            // Pivot must be the corner BETWEEN the connections.
            // S and W. The corner between South and West is Bottom-Left.
            // Center: (cx - half, cy + half).
            // Radius: half.
            // Point S (BottomMid): (cx, cy+half). Relative to Center: (half, 0). Angle 0.
            // Point W (LeftMid): (cx-half, cy). Relative to Center: (0, -half). Angle 270
            // (3pi/2).
            // Arc 0 to 270.
            drawDoubleArc(canvas, arcCx, arcCy, half, width, 0, Math.PI * 1.5);
        } else { // W to N
            // W and N. Corner is Top-Left (cx-half, cy-half).
            // Center: Top-Left. Radius half.
            // Point W (LeftMid): (cx-half, cy). Rel: (0, half). Angle 90 (pi/2).
            // Point N (TopMid): (cx, cy-half). Rel: (half, 0). Angle 0.
            // Arc 90 to 0.
            arcCx = cx - half;
            arcCy = cy - half;
            drawDoubleArc(canvas, arcCx, arcCy, half, width, Math.PI / 2, 0);
        }
    }

    private void drawDoubleArc(SvgCanvas canvas, double cx, double cy, double radius, double width, double startAngle,
            double endAngle) {
        double r1 = radius - width / 2;
        double r2 = radius + width / 2;

        renderArc(canvas, cx, cy, r1, startAngle, endAngle);
        renderArc(canvas, cx, cy, r2, startAngle, endAngle);
    }

    private void renderArc(SvgCanvas canvas, double cx, double cy, double r, double startAngle, double endAngle) {
        double x1 = cx + r * Math.cos(startAngle);
        double y1 = cy + r * Math.sin(startAngle);
        double x2 = cx + r * Math.cos(endAngle);
        double y2 = cy + r * Math.sin(endAngle);

        // Fix large arc flag
        // simple 90 deg arcs
        int largeArc = 0;
        // Sweep flag?
        // If we go 180 to 90... that's -90. Clockwise?
        // SVG paths are usually Arc To.
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y

        // Let's assume sweep 0.
        // We need to be careful with direction.

        canvas.addPath(0,
                String.format(Locale.US, "<path d='M %.2f %.2f A %.2f %.2f 0 0 0 %.2f %.2f' />", x1, y1, r, r, x2, y2));
    }

    private record Point(int r, int c) {
    }
}
