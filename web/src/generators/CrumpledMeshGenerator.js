import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

const EPS = 1e-6;

export class CrumpledMeshGenerator extends Generator {
    getId() {
        return 'crumpled-mesh';
    }

    getDisplayName() {
        return 'Crumpled Mesh';
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection('Preset', 'Rotring sheet', ['Custom', 'Rotring sheet', 'Tall relief', 'Dense wireframe', 'Quiet terrain'], 'Choose a starting point for the warped mesh surface'),
            ParameterDefinition.integer('Grid Rows', 70, 24, 260, 'Number of horizontal mesh lines; primary control for mesh density'),
            ParameterDefinition.integer('Grid Columns', 92, 24, 320, 'Number of vertical mesh lines; primary control for mesh density'),
            ParameterDefinition.doubleVal('Sheet Width', 0.78, 0.35, 0.96, 'Fraction of page width used before projection'),
            ParameterDefinition.doubleVal('Sheet Height', 0.72, 0.35, 0.96, 'Fraction of page height used before projection'),
            ParameterDefinition.doubleVal('Surface Height', 92.0, 0.0, 180.0, 'Maximum projected height displacement'),
            ParameterDefinition.integer('Fold Count', 14, 0, 28, 'Number of sharp fold ridges and dents'),
            ParameterDefinition.doubleVal('Ridge Sharpness', 0.68, 0.05, 1.0, 'How narrow and angular the fold ridges are'),
            ParameterDefinition.doubleVal('Crumple Amount', 1.18, 0.0, 1.8, 'Strength of the irregular crumpled heightfield'),
            ParameterDefinition.doubleVal('Noise Scale', 2.6, 0.4, 8.0, 'Scale of broad surface undulations'),
            ParameterDefinition.doubleVal('Projection Angle', 312.0, 0.0, 360.0, 'Direction in which height pushes the mesh on the page'),
            ParameterDefinition.doubleVal('Vertical Compression', 0.82, 0.45, 1.2, 'Perspective-like compression of the sheet depth'),
            ParameterDefinition.doubleVal('Boundary Irregularity', 0.18, 0.0, 0.55, 'Torn-edge irregularity of the sheet boundary'),
            ParameterDefinition.doubleVal('Shadow Threshold', 0.56, 0.0, 1.0, 'Slope threshold for sending darker mesh segments to the shadow layer'),
            ParameterDefinition.doubleVal('Row Draw Fraction', 1.0, 0.15, 1.0, 'Fraction of generated row lines to keep; lower values thin the mesh and plot faster'),
            ParameterDefinition.doubleVal('Column Draw Fraction', 1.0, 0.15, 1.0, 'Fraction of generated column lines to keep; lower values thin the mesh and plot faster'),
            ParameterDefinition.selection('Layer Mode', 'Mesh + shadow', ['Single pen', 'Mesh + shadow', 'Three pass'], 'Plotter layer strategy for mesh and darker ridge/shadow passes'),
            ParameterDefinition.doubleVal('Stroke Width', 0.38, 0.1, 1.5, 'SVG preview stroke width'),
            ParameterDefinition.integer('Seed', 31415, 1, 999999, 'Random seed for reproducible variants'),
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === 'Preset') {
            const presets = {
                'Rotring sheet': {
                    'Grid Rows': 70,
                    'Grid Columns': 92,
                    'Sheet Width': 0.78,
                    'Sheet Height': 0.72,
                    'Surface Height': 92.0,
                    'Fold Count': 14,
                    'Ridge Sharpness': 0.68,
                    'Crumple Amount': 1.18,
                    'Noise Scale': 2.6,
                    'Projection Angle': 312.0,
                    'Vertical Compression': 0.82,
                    'Boundary Irregularity': 0.18,
                    'Shadow Threshold': 0.56,
                    'Row Draw Fraction': 1.0,
                    'Column Draw Fraction': 1.0,
                    'Layer Mode': 'Mesh + shadow',
                },
                'Tall relief': {
                    'Grid Rows': 86,
                    'Grid Columns': 78,
                    'Sheet Width': 0.60,
                    'Sheet Height': 0.90,
                    'Surface Height': 112.0,
                    'Fold Count': 15,
                    'Ridge Sharpness': 0.64,
                    'Crumple Amount': 1.28,
                    'Noise Scale': 2.2,
                    'Projection Angle': 300.0,
                    'Vertical Compression': 0.76,
                    'Boundary Irregularity': 0.26,
                    'Shadow Threshold': 0.50,
                    'Row Draw Fraction': 0.92,
                    'Column Draw Fraction': 0.92,
                    'Layer Mode': 'Three pass',
                },
                'Dense wireframe': {
                    'Grid Rows': 112,
                    'Grid Columns': 138,
                    'Sheet Width': 0.84,
                    'Sheet Height': 0.78,
                    'Surface Height': 86.0,
                    'Fold Count': 18,
                    'Ridge Sharpness': 0.72,
                    'Crumple Amount': 1.38,
                    'Noise Scale': 3.4,
                    'Projection Angle': 318.0,
                    'Vertical Compression': 0.84,
                    'Boundary Irregularity': 0.22,
                    'Shadow Threshold': 0.46,
                    'Row Draw Fraction': 1.0,
                    'Column Draw Fraction': 1.0,
                    'Layer Mode': 'Mesh + shadow',
                },
                'Quiet terrain': {
                    'Grid Rows': 48,
                    'Grid Columns': 62,
                    'Sheet Width': 0.76,
                    'Sheet Height': 0.66,
                    'Surface Height': 38.0,
                    'Fold Count': 5,
                    'Ridge Sharpness': 0.30,
                    'Crumple Amount': 0.48,
                    'Noise Scale': 1.6,
                    'Projection Angle': 305.0,
                    'Vertical Compression': 0.90,
                    'Boundary Irregularity': 0.10,
                    'Shadow Threshold': 0.72,
                    'Row Draw Fraction': 0.82,
                    'Column Draw Fraction': 0.82,
                    'Layer Mode': 'Single pen',
                },
            };
            const preset = presets[newValue];
            if (!preset) return false;
            Object.assign(currentValues, preset);
            return true;
        }
        if (paramName !== 'Preset' && currentValues['Preset'] !== 'Custom') {
            currentValues['Preset'] = 'Custom';
            return true;
        }
        return false;
    }

    generate(params) {
        const width = params.width || params['width'] || 842;
        const height = params.height || params['height'] || 595;
        const random = new SeededRandom(params['Seed'] || 31415);
        const layerMode = params['Layer Mode'] || 'Mesh + shadow';
        const layerCount = layerMode === 'Three pass' ? 3 : (layerMode === 'Mesh + shadow' ? 2 : 1);
        const canvas = new SvgCanvas(width, height, layerCount);
        canvas.layerColors = layerMode === 'Three pass'
            ? ['#111111', '#6A3D9A', '#000000']
            : (layerMode === 'Mesh + shadow' ? ['#111111', '#000000'] : ['#111111']);
        canvas.setStrokeWidth(params['Stroke Width'] || 0.38);

        const sheetWidth = width * (params['Sheet Width'] || 0.78);
        const sheetHeight = height * (params['Sheet Height'] || 0.72);
        const rows = Math.max(2, params['Grid Rows'] || 70);
        const cols = Math.max(2, params['Grid Columns'] || 92);
        const surfaceHeight = params['Surface Height'] || 58;
        const projectionAngle = this.degToRad(params['Projection Angle'] || 312);
        const verticalCompression = params['Vertical Compression'] || 0.82;
        const shadowThreshold = params['Shadow Threshold'] ?? 0.56;
        const rowDensity = params['Row Draw Fraction'] ?? params['Row Density'] ?? 1.0;
        const columnDensity = params['Column Draw Fraction'] ?? params['Column Density'] ?? 1.0;

        const folds = this.createFolds(params['Fold Count'] || 9, random);
        const boundary = this.createBoundary(params['Boundary Irregularity'] ?? 0.18, random);
        const heightFn = (u, v) => this.heightAt(u, v, folds, params, random);
        const project = (u, v) => {
            const z = heightFn(u, v) * surfaceHeight;
            const x0 = (u - 0.5) * sheetWidth;
            const y0 = (v - 0.5) * sheetHeight * verticalCompression;
            const px = x0 + z * Math.cos(projectionAngle) * 0.95;
            const py = y0 + z * Math.sin(projectionAngle) * 1.18;
            return { x: px, y: py, z };
        };

        const paths = [];

        for (let r = 0; r < rows; r++) {
            if (!this.keepLine(r, rows, rowDensity)) continue;
            const v = rows === 1 ? 0.5 : r / (rows - 1);
            const points = [];
            for (let c = 0; c < cols; c++) {
                const u = cols === 1 ? 0.5 : c / (cols - 1);
                points.push(this.samplePoint(u, v, boundary, project));
            }
            this.addSegmentedPaths(paths, points, 'row', layerMode, shadowThreshold);
        }

        for (let c = 0; c < cols; c++) {
            if (!this.keepLine(c, cols, columnDensity)) continue;
            const u = cols === 1 ? 0.5 : c / (cols - 1);
            const points = [];
            for (let r = 0; r < rows; r++) {
                const v = rows === 1 ? 0.5 : r / (rows - 1);
                points.push(this.samplePoint(u, v, boundary, project));
            }
            this.addSegmentedPaths(paths, points, 'column', layerMode, shadowThreshold);
        }

        const transformed = this.fitPaths(paths, width, height, Math.min(width, height) * 0.065);
        for (const path of transformed) {
            canvas.addPath(path.layer, this.pathElement(path.points, { role: path.role, shade: path.shade }));
        }

        return canvas.toSvg();
    }

    keepLine(index, count, density) {
        if (density >= 0.999) return true;
        if (index === 0 || index === count - 1) return true;
        const period = Math.max(2, Math.round(1 / Math.max(0.05, 1 - density)));
        return index % period !== 0;
    }

    createFolds(count, random) {
        const folds = [];
        const angleFamilies = [this.degToRad(18), this.degToRad(66), this.degToRad(126), this.degToRad(154)];
        for (let i = 0; i < count; i++) {
            const angle = angleFamilies[i % angleFamilies.length] + (random.nextDouble() - 0.5) * this.degToRad(34);
            folds.push({
                cx: 0.16 + random.nextDouble() * 0.68,
                cy: 0.12 + random.nextDouble() * 0.76,
                nx: Math.cos(angle),
                ny: Math.sin(angle),
                width: 0.025 + random.nextDouble() * 0.105,
                amp: (random.nextDouble() < 0.44 ? -1 : 1) * (0.22 + random.nextDouble() * 0.78),
                lengthBias: 0.35 + random.nextDouble() * 0.65,
            });
        }
        return folds;
    }

    createBoundary(irregularity, random) {
        const samples = 24;
        const top = [];
        const bottom = [];
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const wobble = (random.nextDouble() - 0.5) * irregularity;
            top.push({ x: t, y: this.clamp(0.03 + wobble * 0.55 + 0.025 * Math.sin(t * Math.PI * 5), 0, 0.18) });
            bottom.push({ x: 1 - t, y: this.clamp(0.97 + wobble * 0.55 + 0.025 * Math.cos(t * Math.PI * 4), 0.82, 1) });
        }
        const right = [];
        const left = [];
        for (let i = 1; i < samples; i++) {
            const t = i / samples;
            const wobble = (random.nextDouble() - 0.5) * irregularity;
            right.push({ x: this.clamp(0.97 + wobble * 0.55 + 0.025 * Math.sin(t * Math.PI * 6), 0.82, 1), y: t });
            left.push({ x: this.clamp(0.03 + wobble * 0.55 + 0.025 * Math.cos(t * Math.PI * 5), 0, 0.18), y: 1 - t });
        }
        return [...top, ...right, ...bottom, ...left];
    }

    samplePoint(u, v, boundary, project) {
        if (!this.pointInPolygon({ x: u, y: v }, boundary)) return null;
        const p = project(u, v);
        return { ...p, u, v, inside: true };
    }

    heightAt(u, v, folds, params) {
        const crumple = params['Crumple Amount'] ?? 0.85;
        const ridgeSharpness = params['Ridge Sharpness'] ?? 0.42;
        const noiseScale = params['Noise Scale'] ?? 2.6;
        let h = 0;

        for (const fold of folds) {
            const dx = u - fold.cx;
            const dy = v - fold.cy;
            const across = Math.abs(dx * fold.nx + dy * fold.ny);
            const along = Math.abs(-dx * fold.ny + dy * fold.nx);
            const ridge = Math.exp(-Math.pow(across / Math.max(0.006, fold.width * (1.15 - ridgeSharpness)), 1.15 + ridgeSharpness * 2.4));
            const lengthFalloff = Math.exp(-Math.pow(along / Math.max(0.12, fold.lengthBias), 2.0));
            h += fold.amp * ridge * lengthFalloff;
        }

        h += 0.34 * Math.sin((u * 2.1 + v * 0.55) * Math.PI * noiseScale + 0.8);
        h += 0.22 * Math.cos((u * -0.8 + v * 2.4) * Math.PI * (noiseScale * 0.75) + 1.9);
        h += 0.12 * Math.sin((u + v) * Math.PI * (noiseScale * 1.9));

        const edgeLift = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
        return this.clamp((h * crumple * edgeLift) / 2.35, -1, 1);
    }

    addSegmentedPaths(paths, points, role, layerMode, shadowThreshold) {
        let current = [];
        for (const point of points) {
            if (!point) {
                this.flushPath(paths, current, role, layerMode, shadowThreshold);
                current = [];
            } else {
                current.push(point);
            }
        }
        this.flushPath(paths, current, role, layerMode, shadowThreshold);
    }

    flushPath(paths, points, role, layerMode, shadowThreshold) {
        if (points.length < 2) return;
        const slope = this.averageSlope(points);
        const shade = this.clamp(slope, 0, 1);
        let layer = 0;
        if (layerMode === 'Mesh + shadow') {
            layer = shade > shadowThreshold ? 1 : 0;
        } else if (layerMode === 'Three pass') {
            layer = shade > shadowThreshold + 0.22 ? 2 : (shade > shadowThreshold ? 1 : 0);
        }
        paths.push({ points, role, layer, shade });
    }

    averageSlope(points) {
        if (points.length < 3) return 0;
        let total = 0;
        for (let i = 1; i < points.length; i++) {
            const dz = Math.abs(points[i].z - points[i - 1].z);
            const du = Math.abs(points[i].u - points[i - 1].u);
            const dv = Math.abs(points[i].v - points[i - 1].v);
            total += dz / Math.max(EPS, Math.sqrt(du * du + dv * dv));
        }
        return this.clamp(total / (points.length - 1) / 115, 0, 1);
    }

    fitPaths(paths, width, height, margin) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const path of paths) {
            for (const p of path.points) {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            }
        }
        if (!Number.isFinite(minX)) return [];
        const scale = Math.min((width - 2 * margin) / Math.max(EPS, maxX - minX), (height - 2 * margin) / Math.max(EPS, maxY - minY));
        const dx = (width - (minX + maxX) * scale) / 2;
        const dy = (height - (minY + maxY) * scale) / 2;
        return paths.map((path) => ({
            ...path,
            points: path.points.map((p) => ({ ...p, x: p.x * scale + dx, y: p.y * scale + dy })),
        }));
    }

    pathElement(points, attrs = {}) {
        let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x.toFixed(2)},${points[i].y.toFixed(2)}`;
        }
        const attrText = Object.entries(attrs)
            .map(([key, value]) => `data-${key}='${String(value)}'`)
            .join(' ');
        return `<path d='${d}' ${attrText}/>`;
    }

    pointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const pi = polygon[i];
            const pj = polygon[j];
            const intersects = ((pi.y > point.y) !== (pj.y > point.y))
                && (point.x < (pj.x - pi.x) * (point.y - pi.y) / ((pj.y - pi.y) || EPS) + pi.x);
            if (intersects) inside = !inside;
        }
        return inside;
    }

    degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
}
