import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';

export class CapsuleInterferenceGenerator extends Generator {
    getId() {
        return 'capsule_interference';
    }

    getDisplayName() {
        return 'Capsule Interference';
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection('Preset', '1+1=3 Study', ['1+1=3 Study', 'Quiet Offset', 'Dense Knot', 'Loose Stack', 'Custom'], 'Named starting points inspired by overlapped plotter contour studies'),
            ParameterDefinition.selection('constructionMode', 'Circle route', ['Circle route', 'Point field', 'Capsule stacks'], 'Circle route keeps parallel lines flowing around distributed circles'),
            ParameterDefinition.integer('circleCount', 4, 2, 12, 'Number of randomized circles the parallel lines route around'),
            ParameterDefinition.doubleVal('circleDiameter', 86.0, 20.0, 220.0, 'Diameter of the invisible guide circles'),
            ParameterDefinition.selection('routeSide', 'Alternate', ['Left', 'Right', 'Alternate'], 'Which side the line bundle takes around each circle'),
            ParameterDefinition.integer('pointCount', 9, 2, 28, 'Number of distributed flow points per color layer'),
            ParameterDefinition.integer('fieldContours', 13, 4, 28, 'Number of field contour lines per color layer'),
            ParameterDefinition.integer('fieldResolution', 58, 28, 90, 'Sampling grid resolution for field contours'),
            ParameterDefinition.doubleVal('fieldSoftness', 42.0, 12.0, 120.0, 'Point influence radius for flowing contour fields'),
            ParameterDefinition.integer('shapeCount', 6, 2, 10, 'Number of overlapping rounded-rectangle contour stacks'),
            ParameterDefinition.integer('contourCount', 16, 4, 48, 'Number of parallel offset contours per stack'),
            ParameterDefinition.doubleVal('spacing', 6.0, 1.0, 14.0, 'Distance between neighboring contours in SVG units'),
            ParameterDefinition.doubleVal('baseWidth', 560.0, 80.0, 900.0, 'Outer width of the largest capsule'),
            ParameterDefinition.doubleVal('baseHeight', 155.0, 40.0, 420.0, 'Outer height of the largest capsule'),
            ParameterDefinition.doubleVal('cornerRadius', 46.0, 5.0, 220.0, 'Rounded corner radius before inset clamping'),
            ParameterDefinition.doubleVal('rotationSpread', 118.0, 0.0, 180.0, 'Total angular spread across all stacks'),
            ParameterDefinition.integer('focusCount', 5, 1, 7, 'Number of seeded construction centers that stacks orbit or bridge'),
            ParameterDefinition.doubleVal('focusSpread', 72.0, 0.0, 100.0, 'How widely the construction centers are scattered across the page'),
            ParameterDefinition.doubleVal('asymmetry', 62.0, 0.0, 100.0, 'How far the fitted composition may sit away from the exact page center'),
            ParameterDefinition.doubleVal('pageFill', 92.0, 60.0, 100.0, 'How much of the safe page box the composition should occupy after fitting'),
            ParameterDefinition.doubleVal('jitter', 70.0, 0.0, 180.0, 'Seeded translation and rotation looseness'),
            ParameterDefinition.selection('colorMode', 'By stack', ['Single pen', 'By stack', 'Contour bands', 'Stacked passes'], 'How paths are assigned to SVG pen-color layers'),
            ParameterDefinition.integer('colorLayers', 2, 1, 6, 'Number of plotted color layers to emit'),
            ParameterDefinition.selection('layerPlacement', 'Interleaved gaps', ['Interleaved gaps', 'Overprint', 'Custom phase'], 'How color layers sit relative to the parallel-line spacing in circle-route mode'),
            ParameterDefinition.doubleVal('layerPhase', 0.5, 0.0, 1.0, 'Custom color-layer phase as a fraction of line spacing; 0.5 puts a second pen in the gaps'),
            ParameterDefinition.doubleVal('registrationOffset', 0.0, 0.0, 16.0, 'Small per-color offset for stacked multi-pen passes'),
            ParameterDefinition.doubleVal('strokeWidth', 0.75, 0.1, 5.0, 'Preview stroke width; physical line width comes from the pen'),
            ParameterDefinition.integer('seed', 303, 1, 99999, 'Deterministic random seed'),
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === 'Preset' && typeof newValue === 'string') {
            switch (newValue) {
                case '1+1=3 Study':
                    Object.assign(currentValues, {
                        constructionMode: 'Circle route',
                        circleCount: 4,
                        circleDiameter: 86.0,
                        routeSide: 'Alternate',
                        pointCount: 9,
                        fieldContours: 13,
                        fieldResolution: 58,
                        fieldSoftness: 42.0,
                        shapeCount: 6,
                        contourCount: 16,
                        spacing: 6.0,
                        baseWidth: 560.0,
                        baseHeight: 155.0,
                        cornerRadius: 46.0,
                        rotationSpread: 118.0,
                        focusCount: 5,
                        focusSpread: 72.0,
                        asymmetry: 62.0,
                        pageFill: 92.0,
                        jitter: 70.0,
                        colorMode: 'By stack',
                        colorLayers: 2,
                        layerPlacement: 'Interleaved gaps',
                        layerPhase: 0.5,
                        registrationOffset: 0.0,
                        strokeWidth: 0.75,
                        seed: 303,
                    });
                    return true;
                case 'Quiet Offset':
                    Object.assign(currentValues, {
                        constructionMode: 'Circle route',
                        circleCount: 3,
                        circleDiameter: 92.0,
                        routeSide: 'Left',
                        pointCount: 6,
                        fieldContours: 10,
                        fieldResolution: 52,
                        fieldSoftness: 48.0,
                        shapeCount: 3,
                        contourCount: 14,
                        spacing: 6.0,
                        baseWidth: 520.0,
                        baseHeight: 130.0,
                        cornerRadius: 46.0,
                        rotationSpread: 82.0,
                        focusCount: 3,
                        focusSpread: 48.0,
                        asymmetry: 35.0,
                        pageFill: 94.0,
                        jitter: 38.0,
                        colorMode: 'By stack',
                        colorLayers: 2,
                        layerPlacement: 'Interleaved gaps',
                        layerPhase: 0.5,
                        registrationOffset: 1.5,
                        strokeWidth: 0.8,
                        seed: 91,
                    });
                    return true;
                case 'Dense Knot':
                    Object.assign(currentValues, {
                        constructionMode: 'Circle route',
                        circleCount: 6,
                        circleDiameter: 64.0,
                        routeSide: 'Alternate',
                        pointCount: 14,
                        fieldContours: 18,
                        fieldResolution: 68,
                        fieldSoftness: 34.0,
                        shapeCount: 5,
                        contourCount: 24,
                        spacing: 4.2,
                        baseWidth: 620.0,
                        baseHeight: 165.0,
                        cornerRadius: 60.0,
                        rotationSpread: 156.0,
                        focusCount: 5,
                        focusSpread: 85.0,
                        asymmetry: 52.0,
                        pageFill: 96.0,
                        jitter: 78.0,
                        colorMode: 'Contour bands',
                        colorLayers: 4,
                        layerPlacement: 'Interleaved gaps',
                        layerPhase: 0.25,
                        registrationOffset: 2.0,
                        strokeWidth: 0.7,
                        seed: 611,
                    });
                    return true;
                case 'Loose Stack':
                    Object.assign(currentValues, {
                        constructionMode: 'Circle route',
                        circleCount: 5,
                        circleDiameter: 112.0,
                        routeSide: 'Right',
                        pointCount: 11,
                        fieldContours: 11,
                        fieldResolution: 58,
                        fieldSoftness: 56.0,
                        shapeCount: 4,
                        contourCount: 12,
                        spacing: 8.0,
                        baseWidth: 680.0,
                        baseHeight: 185.0,
                        cornerRadius: 72.0,
                        rotationSpread: 148.0,
                        focusCount: 4,
                        focusSpread: 92.0,
                        asymmetry: 74.0,
                        pageFill: 88.0,
                        jitter: 105.0,
                        colorMode: 'Stacked passes',
                        colorLayers: 3,
                        layerPlacement: 'Custom phase',
                        layerPhase: 0.33,
                        registrationOffset: 5.0,
                        strokeWidth: 1.0,
                        seed: 44,
                    });
                    return true;
                case 'Custom':
                default:
                    return false;
            }
        }
        if (paramName !== 'Preset' && currentValues.Preset !== 'Custom') {
            currentValues.Preset = 'Custom';
            return true;
        }
        return false;
    }

    generate(params) {
        const width = numberParam(params, 'width', 800);
        const height = numberParam(params, 'height', 600);
        const constructionMode = typeof params.constructionMode === 'string' ? params.constructionMode : 'Circle route';
        const circleCount = clamp(Math.floor(numberParam(params, 'circleCount', 4)), 2, 12);
        const circleDiameter = numberParam(params, 'circleDiameter', 86.0);
        const routeSide = typeof params.routeSide === 'string' ? params.routeSide : 'Alternate';
        const pointCount = clamp(Math.floor(numberParam(params, 'pointCount', 9)), 2, 28);
        const fieldContours = clamp(Math.floor(numberParam(params, 'fieldContours', 13)), 4, 28);
        const fieldResolution = clamp(Math.floor(numberParam(params, 'fieldResolution', 58)), 28, 90);
        const fieldSoftness = numberParam(params, 'fieldSoftness', 42.0);
        const shapeCount = Math.floor(numberParam(params, 'shapeCount', 6));
        const contourCount = Math.floor(numberParam(params, 'contourCount', 18));
        const spacing = numberParam(params, 'spacing', 5.0);
        const baseWidth = numberParam(params, 'baseWidth', 320.0);
        const baseHeight = numberParam(params, 'baseHeight', 150.0);
        const cornerRadius = numberParam(params, 'cornerRadius', 52.0);
        const rotationSpread = numberParam(params, 'rotationSpread', 128.0);
        const focusCount = clamp(Math.floor(numberParam(params, 'focusCount', 5)), 1, 7);
        const focusSpread = numberParam(params, 'focusSpread', 72.0) / 100;
        const asymmetry = numberParam(params, 'asymmetry', 62.0) / 100;
        const pageFill = numberParam(params, 'pageFill', 92.0) / 100;
        const jitter = numberParam(params, 'jitter', 22.0);
        const colorMode = typeof params.colorMode === 'string' ? params.colorMode : 'By stack';
        const colorLayers = clamp(Math.floor(numberParam(params, 'colorLayers', 2)), 1, 6);
        const layerPlacement = typeof params.layerPlacement === 'string' ? params.layerPlacement : 'Interleaved gaps';
        const layerPhase = numberParam(params, 'layerPhase', 0.5);
        const registrationOffset = numberParam(params, 'registrationOffset', 0.0);
        const strokeWidth = numberParam(params, 'strokeWidth', 0.9);
        const seed = Math.floor(numberParam(params, 'seed', 303));

        const canvas = new SvgCanvas(width, height, colorMode === 'Single pen' ? 1 : colorLayers);
        canvas.layerColors = ['#F05A4A', '#1FA2E1', '#8E63CE', '#F6A11A', '#33A02C', '#6A3D9A'];
        canvas.setStrokeWidth(strokeWidth);

        if (constructionMode === 'Circle route') {
            return generateCircleRoute(canvas, width, height, circleCount, circleDiameter, contourCount, spacing, routeSide, colorLayers, colorMode, layerPlacement, layerPhase, seed);
        }

        if (constructionMode === 'Point field') {
            return generatePointField(canvas, width, height, pointCount, fieldContours, fieldResolution, fieldSoftness, colorLayers, colorMode, seed);
        }

        const paths = [];

        const rng = mulberry32(seed);
        const cx = width / 2;
        const cy = height / 2;
        const startAngle = -rotationSpread / 2;
        const angleStep = shapeCount <= 1 ? 0 : rotationSpread / (shapeCount - 1);
        const compositionAngle = (-18 + (rng() - 0.5) * 38) * Math.PI / 180;
        const spanX = Math.min(width * 0.74, baseWidth * 0.92 + jitter * 2.2) * focusSpread;
        const spanY = Math.min(height * 0.46, baseHeight * 0.95 + jitter * 1.65) * focusSpread;
        const foci = buildFoci(focusCount, cx, cy, spanX, spanY, compositionAngle, rng);

        for (let s = 0; s < shapeCount; s++) {
            const normalized = shapeCount <= 1 ? 0.5 : s / (shapeCount - 1);
            const primary = foci[s % foci.length];
            const secondary = foci[(s + 1 + Math.floor(rng() * Math.max(1, foci.length - 1))) % foci.length];
            const blend = 0.18 + rng() * 0.64;
            const wave = Math.sin(normalized * Math.PI * 2.3 + seed * 0.017);
            const localCx = lerp(primary.x, secondary.x, blend) + (rng() - 0.5) * jitter * 1.25;
            const localCy = lerp(primary.y, secondary.y, blend) + wave * spanY * 0.16 + (rng() - 0.5) * jitter * 1.15;
            const bridgeAngle = Math.atan2(secondary.y - primary.y, secondary.x - primary.x) * 180 / Math.PI;
            const fanAngle = startAngle + angleStep * s;
            const angleDeg = 90 + bridgeAngle * 0.55 + fanAngle * 0.45 + (rng() - 0.5) * jitter * 0.42;
            const wScale = 0.82 + rng() * 0.38;
            const hScale = 0.78 + rng() * 0.30;
            const rScale = 0.75 + rng() * 0.35;
            const contourDrift = (rng() - 0.5) * jitter * 0.05;

            for (let c = 0; c < contourCount; c++) {
                const inset = c * spacing;
                const w = baseWidth * wScale - inset * 2;
                const h = baseHeight * hScale - inset * 2;
                if (w <= spacing * 3 || h <= spacing * 3) break;

                const r = Math.max(1, Math.min(cornerRadius * rScale - inset * 0.35, Math.min(w, h) / 2));
                const drift = (c - contourCount / 2) * contourDrift;
                paths.push({
                    path: roundedRectPath(localCx + drift, localCy - drift * 0.35, w, h, r, angleDeg * Math.PI / 180),
                    shapeIndex: s,
                    contourIndex: c,
                });
            }
        }

        const bounds = pathBounds(paths.map((record) => record.path));
        if (bounds) {
            const margin = Math.min(width, height) * 0.08;
            const drawnW = bounds.maxX - bounds.minX;
            const drawnH = bounds.maxY - bounds.minY;
            const scale = Math.min((width - margin * 2) / drawnW, (height - margin * 2) / drawnH) * clamp(pageFill, 0.6, 1.0);
            let dx = width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
            let dy = height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale;
            if (asymmetry > 0) {
                const placementRng = mulberry32(seed ^ 0xA5A5A5A5);
                const desiredCx = width * (0.5 + (placementRng() - 0.5) * 0.34 * asymmetry);
                const desiredCy = height * (0.5 + (placementRng() - 0.5) * 0.28 * asymmetry);
                dx = clamp(desiredCx - ((bounds.minX + bounds.maxX) / 2) * scale, margin - bounds.minX * scale, width - margin - bounds.maxX * scale);
                dy = clamp(desiredCy - ((bounds.minY + bounds.maxY) / 2) * scale, margin - bounds.minY * scale, height - margin - bounds.maxY * scale);
            }

            for (const record of paths) {
                const d = transformPath(record.path, scale, dx, dy);
                for (const layerIndex of layersFor(record, colorMode, colorLayers, contourCount)) {
                    const offset = stackedOffset(layerIndex, colorMode, colorLayers, registrationOffset, seed);
                    canvas.addPath(layerIndex, `<path d='${offsetPath(d, offset.x, offset.y)}' />`);
                }
            }
        }

        return canvas.toSvg();
    }
}

function generateCircleRoute(canvas, width, height, circleCount, circleDiameter, lineCount, spacing, routeSide, colorLayers, colorMode, layerPlacement, layerPhase, seed) {
    const activeLayers = colorMode === 'Single pen' ? 1 : colorLayers;
    const margin = Math.min(width, height) * 0.18;
    const records = [];
    const guideRng = mulberry32(seed + 701);
    const circles = distributedPoints(circleCount, width, height, Math.min(margin, Math.min(width, height) * 0.28), guideRng);

    for (let layer = 0; layer < activeLayers; layer++) {
        const lineOffset = layerPhaseOffset(layer, activeLayers, spacing, colorMode, layerPlacement, layerPhase);

        for (let i = 0; i < lineCount; i++) {
            const radius = circleDiameter / 2 + i * spacing + lineOffset;
            if (radius < 4) continue;
            const d = routeAroundCirclesPath(circles, radius, routeSide);
            records.push({ layer, path: d });
        }
    }

    const bounds = pathBounds(records.map((record) => record.path));
    if (bounds) {
        const safe = Math.min(width, height) * 0.07;
        const drawnW = bounds.maxX - bounds.minX;
        const drawnH = bounds.maxY - bounds.minY;
        const scale = Math.min((width - safe * 2) / drawnW, (height - safe * 2) / drawnH);
        const dx = width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
        const dy = height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale;
        for (const record of records) {
            canvas.addPath(record.layer, `<path d='${transformPath(record.path, scale, dx, dy)}' />`);
        }
    }

    return canvas.toSvg();
}

function layerPhaseOffset(layer, activeLayers, spacing, colorMode, layerPlacement, layerPhase) {
    if (colorMode === 'Single pen' || activeLayers <= 1 || layerPlacement === 'Overprint') return 0;
    if (layerPlacement === 'Custom phase') {
        return positiveModulo(layer * clamp(layerPhase, 0, 1), 1) * spacing;
    }
    return layer / activeLayers * spacing;
}

function routeAroundCirclesPath(circles, radius, routeSide) {
    const n = circles.length;
    const parts = [];
    let first = null;
    let previousExit = null;

    for (let i = 0; i < n; i++) {
        const prev = circles[(i - 1 + n) % n];
        const cur = circles[i];
        const next = circles[(i + 1) % n];
        const side = sideForCircle(routeSide, i);
        const incoming = Math.atan2(cur.y - prev.y, cur.x - prev.x);
        const outgoing = Math.atan2(next.y - cur.y, next.x - cur.x);
        const entryAngle = incoming + side * Math.PI / 2;
        const exitAngle = outgoing + side * Math.PI / 2;
        const entry = circlePoint(cur, radius, entryAngle);

        if (i === 0) {
            first = entry;
            parts.push(`M ${entry.x.toFixed(2)} ${entry.y.toFixed(2)}`);
        } else if (previousExit) {
            parts.push(`L ${entry.x.toFixed(2)} ${entry.y.toFixed(2)}`);
        }

        parts.push(...cubicArcCommands(cur, radius, entryAngle, exitAngle, side));
        previousExit = circlePoint(cur, radius, exitAngle);
    }

    if (first && previousExit) {
        parts.push(`L ${first.x.toFixed(2)} ${first.y.toFixed(2)}`);
    }
    return parts.join(' ');
}

function sideForCircle(routeSide, circleIndex) {
    if (routeSide === 'Left') return 1;
    if (routeSide === 'Right') return -1;
    return circleIndex % 2 === 0 ? 1 : -1;
}

function cubicArcCommands(center, radius, from, to, side) {
    const total = angleArc(from, to, side);
    const segments = Math.max(1, Math.ceil(Math.abs(total) / (Math.PI / 2)));
    const commands = [];
    for (let i = 0; i < segments; i++) {
        const a0 = from + total * i / segments;
        const a1 = from + total * (i + 1) / segments;
        const delta = a1 - a0;
        const k = 4 / 3 * Math.tan(delta / 4);
        const p0 = circlePoint(center, radius, a0);
        const p1 = circlePoint(center, radius, a1);
        const c1 = { x: p0.x - Math.sin(a0) * radius * k, y: p0.y + Math.cos(a0) * radius * k };
        const c2 = { x: p1.x + Math.sin(a1) * radius * k, y: p1.y - Math.cos(a1) * radius * k };
        commands.push(`C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`);
    }
    return commands;
}

function circlePoint(center, radius, angle) {
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
}

function angleArc(from, to, side) {
    let delta = normalizeAngle(to - from);
    if (side > 0 && delta < 0) delta += Math.PI * 2;
    if (side < 0 && delta > 0) delta -= Math.PI * 2;
    return delta;
}

function normalizeAngle(angle) {
    while (angle <= -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;
    return angle;
}

function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function generatePointField(canvas, width, height, pointCount, contourCount, resolution, softness, colorLayers, colorMode, seed) {
    const activeLayers = colorMode === 'Single pen' ? 1 : colorLayers;
    const margin = Math.min(width, height) * 0.10;
    const stepX = (width - margin * 2) / resolution;
    const stepY = (height - margin * 2) / resolution;

    for (let layer = 0; layer < activeLayers; layer++) {
        const rng = mulberry32(seed + 1009 * (layer + 1));
        const points = distributedPoints(pointCount, width, height, margin, rng);
        const grid = [];
        let maxValue = 0;

        for (let y = 0; y <= resolution; y++) {
            const row = [];
            const py = margin + y * stepY;
            for (let x = 0; x <= resolution; x++) {
                const px = margin + x * stepX;
                const value = fieldValue(px, py, points, softness);
                row.push(value);
                maxValue = Math.max(maxValue, value);
            }
            grid.push(row);
        }

        for (let i = 0; i < contourCount; i++) {
            const t = (i + 1) / (contourCount + 1);
            const level = maxValue * (0.12 + Math.pow(t, 1.85) * 0.72);
            const segments = marchingSegments(grid, resolution, stepX, stepY, margin, margin, level);
            const polylines = joinSegments(segments, 0.75);
            for (const line of polylines) {
                if (line.length < 3) continue;
                const d = line.map((pt, index) => `${index === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(' ');
                canvas.addPath(layer, `<path d='${d}' />`);
            }
        }
    }

    return canvas.toSvg();
}

function distributedPoints(count, width, height, margin, rng) {
    const points = [];
    const minDim = Math.min(width, height);
    for (let i = 0; i < count; i++) {
        let best = null;
        let bestScore = -Infinity;
        const candidates = i === 0 ? 1 : 24;
        for (let c = 0; c < candidates; c++) {
            const x = margin + rng() * (width - margin * 2);
            const y = margin + rng() * (height - margin * 2);
            const edgeBias = Math.min(x - margin, width - margin - x, y - margin, height - margin - y) / minDim;
            let nearest = Infinity;
            for (const p of points) {
                const dx = x - p.x;
                const dy = y - p.y;
                nearest = Math.min(nearest, dx * dx + dy * dy);
            }
            const score = (points.length === 0 ? 1 : nearest / (minDim * minDim)) + edgeBias * 0.45 + (rng() - 0.5) * 0.08;
            if (score > bestScore) {
                bestScore = score;
                best = { x, y, weight: 0.78 + rng() * 0.54 };
            }
        }
        points.push(best);
    }
    return points;
}

function fieldValue(x, y, points, softness) {
    let value = 0;
    const soft2 = softness * softness;
    for (const p of points) {
        const dx = x - p.x;
        const dy = y - p.y;
        value += p.weight * soft2 / (dx * dx + dy * dy + soft2);
    }
    return value;
}

function marchingSegments(grid, resolution, stepX, stepY, originX, originY, level) {
    const segments = [];
    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const x0 = originX + x * stepX;
            const y0 = originY + y * stepY;
            const v0 = grid[y][x];
            const v1 = grid[y][x + 1];
            const v2 = grid[y + 1][x + 1];
            const v3 = grid[y + 1][x];
            const crossings = [];
            addCrossing(crossings, v0, v1, level, x0, y0, x0 + stepX, y0);
            addCrossing(crossings, v1, v2, level, x0 + stepX, y0, x0 + stepX, y0 + stepY);
            addCrossing(crossings, v2, v3, level, x0 + stepX, y0 + stepY, x0, y0 + stepY);
            addCrossing(crossings, v3, v0, level, x0, y0 + stepY, x0, y0);
            if (crossings.length === 2) {
                segments.push([crossings[0], crossings[1]]);
            } else if (crossings.length === 4) {
                segments.push([crossings[0], crossings[1]], [crossings[2], crossings[3]]);
            }
        }
    }
    return segments;
}

function addCrossing(crossings, a, b, level, x1, y1, x2, y2) {
    if ((a < level && b < level) || (a >= level && b >= level)) return;
    const t = (level - a) / (b - a || 1);
    crossings.push({ x: lerp(x1, x2, t), y: lerp(y1, y2, t) });
}

function joinSegments(segments, tolerance) {
    const remaining = segments.map(([a, b]) => [a, b]);
    const polylines = [];
    while (remaining.length > 0) {
        const line = [...remaining.pop()];
        let grew = true;
        while (grew) {
            grew = false;
            for (let i = remaining.length - 1; i >= 0; i--) {
                const [a, b] = remaining[i];
                if (pointsClose(line[line.length - 1], a, tolerance)) {
                    line.push(b);
                } else if (pointsClose(line[line.length - 1], b, tolerance)) {
                    line.push(a);
                } else if (pointsClose(line[0], b, tolerance)) {
                    line.unshift(a);
                } else if (pointsClose(line[0], a, tolerance)) {
                    line.unshift(b);
                } else {
                    continue;
                }
                remaining.splice(i, 1);
                grew = true;
            }
        }
        polylines.push(line);
    }
    return polylines;
}

function pointsClose(a, b, tolerance) {
    return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function buildFoci(focusCount, cx, cy, spanX, spanY, angle, rng) {
    const foci = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < focusCount; i++) {
        const radial = focusCount === 1 ? 0 : Math.sqrt((i + 0.65) / focusCount);
        const theta = angle + i * golden + (rng() - 0.5) * 0.65;
        const squash = 0.62 + rng() * 0.62;
        foci.push({
            x: cx + Math.cos(theta) * spanX * radial * squash + (rng() - 0.5) * spanX * 0.18,
            y: cy + Math.sin(theta) * spanY * radial / squash + (rng() - 0.5) * spanY * 0.22,
        });
    }
    return foci;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function pathBounds(paths) {
    if (paths.length === 0) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const path of paths) {
        for (const [match] of path.matchAll(/-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g)) {
            const [x, y] = match.trim().split(/\s+/).map(Number);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    return Number.isFinite(minX) ? { minX, maxX, minY, maxY } : null;
}

function transformPath(path, scale, dx, dy) {
    return path.replace(/-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g, (pair) => {
        const [x, y] = pair.trim().split(/\s+/).map(Number);
        return `${(x * scale + dx).toFixed(2)} ${(y * scale + dy).toFixed(2)}`;
    });
}

function layersFor(record, colorMode, colorLayers, contourCount) {
    if (colorMode === 'Single pen') return [0];
    if (colorMode === 'By stack') return [record.shapeIndex % colorLayers];
    if (colorMode === 'Contour bands') {
        const band = Math.floor(record.contourIndex / Math.max(1, contourCount) * colorLayers);
        return [Math.min(colorLayers - 1, band)];
    }
    if (colorMode === 'Stacked passes') {
        return Array.from({ length: colorLayers }, (_unused, i) => i);
    }
    return [0];
}

function stackedOffset(layerIndex, colorMode, colorLayers, registrationOffset, seed) {
    if (colorMode !== 'Stacked passes' || colorLayers <= 1 || registrationOffset <= 0) {
        return { x: 0, y: 0 };
    }
    const centered = layerIndex - (colorLayers - 1) / 2;
    const angle = (34 + (seed % 37)) * Math.PI / 180;
    return {
        x: Math.cos(angle) * centered * registrationOffset,
        y: Math.sin(angle) * centered * registrationOffset,
    };
}

function offsetPath(path, ox, oy) {
    if (ox === 0 && oy === 0) return path;
    return path.replace(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_match, command, xStr, yStr) => {
        const x = Number(xStr) + ox;
        const y = Number(yStr) + oy;
        return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    });
}

function roundedRectPath(cx, cy, w, h, r, angle) {
    const pts = [];
    const hw = w / 2;
    const hh = h / 2;

    addPoint(pts, -hw + r, -hh, cx, cy, angle);
    addPoint(pts, hw - r, -hh, cx, cy, angle);
    addArc(pts, hw - r, -hh + r, r, -90, 0, cx, cy, angle);
    addPoint(pts, hw, hh - r, cx, cy, angle);
    addArc(pts, hw - r, hh - r, r, 0, 90, cx, cy, angle);
    addPoint(pts, -hw + r, hh, cx, cy, angle);
    addArc(pts, -hw + r, hh - r, r, 90, 180, cx, cy, angle);
    addPoint(pts, -hw, -hh + r, cx, cy, angle);
    addArc(pts, -hw + r, -hh + r, r, 180, 270, cx, cy, angle);
    addPoint(pts, -hw + r, -hh, cx, cy, angle);

    return pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`).join(' ');
}

function addArc(pts, arcCx, arcCy, r, startDeg, endDeg, cx, cy, angle) {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
        const t = (startDeg + (endDeg - startDeg) * i / steps) * Math.PI / 180;
        addPoint(pts, arcCx + Math.cos(t) * r, arcCy + Math.sin(t) * r, cx, cy, angle);
    }
}

function addPoint(pts, x, y, cx, cy, angle) {
    const rx = x * Math.cos(angle) - y * Math.sin(angle) + cx;
    const ry = x * Math.sin(angle) + y * Math.cos(angle) + cy;
    pts.push([rx, ry]);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function numberParam(params, name, fallback) {
    const value = params[name];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return function next() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}
