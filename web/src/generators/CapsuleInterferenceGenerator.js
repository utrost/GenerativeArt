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
            ParameterDefinition.integer('shapeCount', 4, 2, 8, 'Number of overlapping rounded-rectangle contour stacks'),
            ParameterDefinition.integer('contourCount', 18, 4, 48, 'Number of parallel offset contours per stack'),
            ParameterDefinition.doubleVal('spacing', 5.0, 1.0, 14.0, 'Distance between neighboring contours in SVG units'),
            ParameterDefinition.doubleVal('baseWidth', 320.0, 80.0, 700.0, 'Outer width of the largest capsule'),
            ParameterDefinition.doubleVal('baseHeight', 150.0, 40.0, 420.0, 'Outer height of the largest capsule'),
            ParameterDefinition.doubleVal('cornerRadius', 52.0, 5.0, 220.0, 'Rounded corner radius before inset clamping'),
            ParameterDefinition.doubleVal('rotationSpread', 128.0, 0.0, 180.0, 'Total angular spread across all stacks'),
            ParameterDefinition.doubleVal('jitter', 22.0, 0.0, 90.0, 'Seeded translation and rotation looseness'),
            ParameterDefinition.doubleVal('strokeWidth', 0.9, 0.1, 5.0, 'Preview stroke width; physical line width comes from the pen'),
            ParameterDefinition.integer('seed', 303, 1, 99999, 'Deterministic random seed'),
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === 'Preset' && typeof newValue === 'string') {
            switch (newValue) {
                case '1+1=3 Study':
                    Object.assign(currentValues, {
                        shapeCount: 4,
                        contourCount: 18,
                        spacing: 5.0,
                        baseWidth: 320.0,
                        baseHeight: 150.0,
                        cornerRadius: 52.0,
                        rotationSpread: 128.0,
                        jitter: 22.0,
                        strokeWidth: 0.9,
                        seed: 303,
                    });
                    return true;
                case 'Quiet Offset':
                    Object.assign(currentValues, {
                        shapeCount: 3,
                        contourCount: 14,
                        spacing: 6.0,
                        baseWidth: 340.0,
                        baseHeight: 130.0,
                        cornerRadius: 46.0,
                        rotationSpread: 82.0,
                        jitter: 12.0,
                        strokeWidth: 0.8,
                        seed: 91,
                    });
                    return true;
                case 'Dense Knot':
                    Object.assign(currentValues, {
                        shapeCount: 5,
                        contourCount: 26,
                        spacing: 3.7,
                        baseWidth: 350.0,
                        baseHeight: 165.0,
                        cornerRadius: 60.0,
                        rotationSpread: 156.0,
                        jitter: 28.0,
                        strokeWidth: 0.7,
                        seed: 611,
                    });
                    return true;
                case 'Loose Stack':
                    Object.assign(currentValues, {
                        shapeCount: 4,
                        contourCount: 12,
                        spacing: 8.0,
                        baseWidth: 380.0,
                        baseHeight: 185.0,
                        cornerRadius: 72.0,
                        rotationSpread: 148.0,
                        jitter: 44.0,
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
        const strokeWidth = numberParam(params, 'strokeWidth', 0.9);
        const seed = Math.floor(numberParam(params, 'seed', 303));

        const canvas = new SvgCanvas(width, height, 2);
        canvas.setStrokeWidth(strokeWidth);

        const rng = mulberry32(seed);
        const cx = width / 2;
        const cy = height / 2;
        const startAngle = -rotationSpread / 2;
        const angleStep = shapeCount <= 1 ? 0 : rotationSpread / (shapeCount - 1);

        for (let s = 0; s < shapeCount; s++) {
            const normalized = shapeCount <= 1 ? 0.5 : s / (shapeCount - 1);
            const angleDeg = startAngle + angleStep * s + (rng() - 0.5) * jitter * 0.55;
            const localCx = cx + Math.cos(normalized * Math.PI * 2 + 0.6) * jitter * 0.55 + (rng() - 0.5) * jitter;
            const localCy = cy + Math.sin(normalized * Math.PI * 2 + 0.6) * jitter * 0.35 + (rng() - 0.5) * jitter;
            const wScale = 0.92 + rng() * 0.16;
            const hScale = 0.90 + rng() * 0.20;
            const rScale = 0.85 + rng() * 0.30;

            for (let c = 0; c < contourCount; c++) {
                const inset = c * spacing;
                const w = baseWidth * wScale - inset * 2;
                const h = baseHeight * hScale - inset * 2;
                if (w <= spacing * 3 || h <= spacing * 3) break;

                const r = Math.max(1, Math.min(cornerRadius * rScale - inset * 0.35, Math.min(w, h) / 2));
                const path = roundedRectPath(localCx, localCy, w, h, r, angleDeg * Math.PI / 180);
                canvas.addPath(1, `<path d='${path}' />`);
            }
        }

        return canvas.toSvg();
    }
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
