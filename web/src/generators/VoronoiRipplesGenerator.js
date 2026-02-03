import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export class VoronoiRipplesGenerator extends Generator {
    getId() {
        return "voronoi_ripples";
    }

    getDisplayName() {
        return "Voronoi Ripples";
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.integer("pointCount", 12, 2, 50, "Number of seed points"),
            ParameterDefinition.doubleVal("lineSpacing", 6.0, 2.0, 50.0, "Distance between concentric rings"),
            ParameterDefinition.doubleVal("lineWidth", 1.0, 0.1, 10.0, "Stroke width of the lines"),
            ParameterDefinition.bool("monochrome", false, "Use single color (Black)"),
            ParameterDefinition.integer("colorCount", 6, 1, 12, "Number of colors/layers (if not monochrome)"),
            ParameterDefinition.integer("seed", 1234, 0, 100000, "Random Seed")
        ];
    }

    generate(params) {
        const pointCount = params["pointCount"] || 12;
        const lineSpacing = params["lineSpacing"] || 6.0;
        const lineWidth = params["lineWidth"] || 1.0;
        const monochrome = params["monochrome"] !== undefined ? params["monochrome"] : false;
        const colorCount = params["colorCount"] || 6;
        const seed = params["seed"] || 1234;

        const width = params["width"] || 800;
        const height = params["height"] || 600;

        const numLayers = monochrome ? 1 : colorCount;
        const canvas = new SvgCanvas(width, height, numLayers);
        // SvgCanvas currently doesn't support setting stroke width globally in JS version probably,
        // but we can pass it per path or update CSS.
        // For now let's assume standard stroke logic or ignore line width if SvgCanvas JS doesn't support it dynamically yet.
        // Actually I can wrap the content in a group with stroke-width? Or SvgCanvas.addPath supports string format.

        const rand = new SeededRandom(seed);
        const seeds = [];
        for (let i = 0; i < pointCount; i++) {
            seeds.push({ x: rand.nextDouble() * width, y: rand.nextDouble() * height });
        }

        const maxDim = Math.max(width, height) * 1.5;

        for (let i = 0; i < seeds.length; i++) {
            const p = seeds[i];
            const layerIndex = monochrome ? 0 : (i % colorCount);

            for (let r = lineSpacing; r < maxDim; r += lineSpacing) {
                // 1. Start with full circle interval [0, 2PI]
                let intervals = [{ start: 0, end: 2 * Math.PI }];

                // 2. Clip against all other points
                for (let j = 0; j < seeds.length; j++) {
                    if (i === j) continue;
                    const neighbor = seeds[j];
                    intervals = this.clipWithLine(intervals, p, r, neighbor);
                }

                // 3. Clip against Canvas Bounds
                // Left (-x < 0) => A=-r, B=0, K=p.x
                intervals = this.solveInequality(intervals, -r, 0, p.x);
                // Right (x < W) => A=r, B=0, K=width-p.x
                intervals = this.solveInequality(intervals, r, 0, width - p.x);
                // Top (-y < 0) => A=0, B=-r, K=p.y
                intervals = this.solveInequality(intervals, 0, -r, p.y);
                // Bottom (y < H) => A=0, B=r, K=height-p.y
                intervals = this.solveInequality(intervals, 0, r, height - p.y);

                // 4. Draw
                for (const interval of intervals) {
                    this.drawArc(canvas, layerIndex, p, r, interval.start, interval.end, lineWidth);
                }
            }
        }

        return canvas.toSvg();
    }

    clipWithLine(currentIntervals, p, r, neighbor) {
        // Line equation boundary between voronoi cells
        const vx = neighbor.x - p.x;
        const vy = neighbor.y - p.y;
        const mx = (p.x + neighbor.x) / 2.0;
        const my = (p.y + neighbor.y) / 2.0;

        const A = r * vx;
        const B = r * vy;
        const K = -((p.x - mx) * vx + (p.y - my) * vy);

        return this.solveInequality(currentIntervals, A, B, K);
    }

    solveInequality(intervals, A, B, K) {
        const R = Math.sqrt(A * A + B * B);
        if (R === 0) {
            return (0 < K) ? intervals : [];
        }

        const alpha = Math.atan2(B, A);
        const val = K / R;

        if (val >= 1.0) return intervals;
        if (val < -1.0) return [];

        const limit = Math.acos(val);
        const startAngle = limit;
        const endAngle = 2 * Math.PI - limit;

        // Shift interval: [startAngle + alpha, endAngle + alpha]
        const clipStart = startAngle + alpha;
        const clipEnd = endAngle + alpha;

        return this.intersect(intervals, clipStart, clipEnd);
    }

    intersect(current, clipStart, clipEnd) {
        const result = [];
        const validClips = this.normalize(clipStart, clipEnd);

        for (const validClip of validClips) {
            for (const existing of current) {
                const start = Math.max(existing.start, validClip.start);
                const end = Math.min(existing.end, validClip.end);

                if (start < end) {
                    result.push({ start, end });
                }
            }
        }
        return result;
    }

    normalize(start, end) {
        const twoPi = 2 * Math.PI;
        const width = end - start;

        let s = start % twoPi;
        if (s < 0) s += twoPi;
        let e = s + width; // Preserve width

        const res = [];
        if (e <= twoPi) {
            res.push({ start: s, end: e });
        } else {
            res.push({ start: s, end: twoPi });
            res.push({ start: 0, end: e - twoPi });
        }
        return res;
    }

    drawArc(canvas, layer, center, r, startAngle, endAngle, lineWidth) {
        const x1 = center.x + r * Math.cos(startAngle);
        const y1 = center.y + r * Math.sin(startAngle);
        const x2 = center.x + r * Math.cos(endAngle);
        const y2 = center.y + r * Math.sin(endAngle);

        let diff = endAngle - startAngle;
        while (diff < 0) diff += 2 * Math.PI;
        const largeArc = (diff > Math.PI) ? 1 : 0;

        const path = `<path d='M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}' fill='none' stroke-width='${lineWidth}' />`;
        canvas.addRaw(layer, path);
    }
}
