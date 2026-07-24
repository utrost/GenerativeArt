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
                        registrationOffset: 0.0,
                        strokeWidth: 0.75,
                        seed: 303,
                    });
                    return true;
                case 'Quiet Offset':
                    Object.assign(currentValues, {
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
                        registrationOffset: 1.5,
                        strokeWidth: 0.8,
                        seed: 91,
                    });
                    return true;
                case 'Dense Knot':
                    Object.assign(currentValues, {
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
                        registrationOffset: 2.0,
                        strokeWidth: 0.7,
                        seed: 611,
                    });
                    return true;
                case 'Loose Stack':
                    Object.assign(currentValues, {
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
        const registrationOffset = numberParam(params, 'registrationOffset', 0.0);
        const strokeWidth = numberParam(params, 'strokeWidth', 0.9);
        const seed = Math.floor(numberParam(params, 'seed', 303));

        const canvas = new SvgCanvas(width, height, colorMode === 'Single pen' ? 1 : colorLayers);
        canvas.layerColors = ['#F05A4A', '#1FA2E1', '#8E63CE', '#F6A11A', '#33A02C', '#6A3D9A'];
        canvas.setStrokeWidth(strokeWidth);
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
        for (const [, _command, xStr, yStr] of path.matchAll(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)) {
            const x = Number(xStr);
            const y = Number(yStr);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    return Number.isFinite(minX) ? { minX, maxX, minY, maxY } : null;
}

function transformPath(path, scale, dx, dy) {
    return path.replace(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_match, command, xStr, yStr) => {
        const x = Number(xStr) * scale + dx;
        const y = Number(yStr) * scale + dy;
        return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
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
