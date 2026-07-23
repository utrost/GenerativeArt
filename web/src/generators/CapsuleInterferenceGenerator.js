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
            ParameterDefinition.integer('shapeCount', 5, 2, 8, 'Number of overlapping rounded-rectangle contour stacks'),
            ParameterDefinition.integer('contourCount', 16, 4, 48, 'Number of parallel offset contours per stack'),
            ParameterDefinition.doubleVal('spacing', 6.0, 1.0, 14.0, 'Distance between neighboring contours in SVG units'),
            ParameterDefinition.doubleVal('baseWidth', 560.0, 80.0, 900.0, 'Outer width of the largest capsule'),
            ParameterDefinition.doubleVal('baseHeight', 155.0, 40.0, 420.0, 'Outer height of the largest capsule'),
            ParameterDefinition.doubleVal('cornerRadius', 46.0, 5.0, 220.0, 'Rounded corner radius before inset clamping'),
            ParameterDefinition.doubleVal('rotationSpread', 118.0, 0.0, 180.0, 'Total angular spread across all stacks'),
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
                        shapeCount: 5,
                        contourCount: 16,
                        spacing: 6.0,
                        baseWidth: 560.0,
                        baseHeight: 155.0,
                        cornerRadius: 46.0,
                        rotationSpread: 118.0,
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
        const shapeCount = Math.floor(numberParam(params, 'shapeCount', 4));
        const contourCount = Math.floor(numberParam(params, 'contourCount', 18));
        const spacing = numberParam(params, 'spacing', 5.0);
        const baseWidth = numberParam(params, 'baseWidth', 320.0);
        const baseHeight = numberParam(params, 'baseHeight', 150.0);
        const cornerRadius = numberParam(params, 'cornerRadius', 52.0);
        const rotationSpread = numberParam(params, 'rotationSpread', 128.0);
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
        const compositionAngle = (-10 + (rng() - 0.5) * 18) * Math.PI / 180;
        const spanX = Math.min(width * 0.62, baseWidth * 0.78 + jitter * 1.8);
        const spanY = Math.min(height * 0.28, baseHeight * 0.45 + jitter * 0.85);

        for (let s = 0; s < shapeCount; s++) {
            const normalized = shapeCount <= 1 ? 0.5 : s / (shapeCount - 1);
            const centered = normalized - 0.5;
            const wave = Math.sin(normalized * Math.PI * 2 + seed * 0.01);
            const along = centered * spanX + (rng() - 0.5) * jitter * 0.75;
            const across = wave * spanY * 0.5 + (rng() - 0.5) * jitter * 0.95;
            const localCx = cx + along * Math.cos(compositionAngle) - across * Math.sin(compositionAngle);
            const localCy = cy + along * Math.sin(compositionAngle) + across * Math.cos(compositionAngle);
            const angleDeg = 90 + startAngle + angleStep * s + (rng() - 0.5) * jitter * 0.38;
            const wScale = 0.86 + rng() * 0.30;
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
            const scale = Math.min((width - margin * 2) / drawnW, (height - margin * 2) / drawnH);
            const dx = width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
            const dy = height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale;

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
