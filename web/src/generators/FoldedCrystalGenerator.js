import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

const EPS = 1e-6;

export class FoldedCrystalGenerator extends Generator {
    getId() {
        return 'folded-crystal';
    }

    getDisplayName() {
        return 'Folded Crystal';
    }

    getParameterDefinitions() {
        return [
            ParameterDefinition.selection('Preset', 'Reference cluster', ['Custom', 'Reference cluster', 'Tall shard', 'Dense shadow', 'Quiet facets'], 'Choose a starting point for the faceted hatch cluster'),
            ParameterDefinition.integer('Split Count', 44, 8, 90, 'Number of recursive splits used to create facets'),
            ParameterDefinition.integer('Boundary Points', 18, 10, 36, 'Number of points around the outer irregular silhouette'),
            ParameterDefinition.doubleVal('Cluster Width', 0.62, 0.25, 0.95, 'Fraction of page width used by the folded cluster'),
            ParameterDefinition.doubleVal('Cluster Height', 0.88, 0.35, 0.98, 'Fraction of page height used by the folded cluster'),
            ParameterDefinition.doubleVal('Irregularity', 0.28, 0.0, 0.75, 'How uneven the outer boundary is'),
            ParameterDefinition.integer('Protrusions', 4, 0, 10, 'Extra boundary spikes/wings around the cluster'),
            ParameterDefinition.doubleVal('Angle Jitter', 18.0, 0.0, 60.0, 'Random variation around the main fold angle families'),
            ParameterDefinition.doubleVal('Hatch Light Spacing', 9.0, 2.0, 24.0, 'Line spacing for light facets'),
            ParameterDefinition.doubleVal('Hatch Dark Spacing', 3.0, 1.0, 12.0, 'Line spacing for dark facets'),
            ParameterDefinition.doubleVal('Light Angle', 315.0, 0.0, 360.0, 'Direction of the fake light used to select hatch density and pen layer'),
            ParameterDefinition.doubleVal('Contrast', 1.25, 0.2, 3.0, 'How strongly light direction changes hatch spacing'),
            ParameterDefinition.integer('Shade Bands', 5, 2, 9, 'Discrete plastic shading bands: fewer bands make the faceted 3D planes read more clearly'),
            ParameterDefinition.doubleVal('Shadow Crosshatch', 0.65, 0.0, 1.0, 'Extra crosshatch strength on the darkest facets'),
            ParameterDefinition.doubleVal('Highlight Dropout', 0.25, 0.0, 0.8, 'Line removal on the lightest facets to create bright highlights'),
            ParameterDefinition.selection('Color Mode', 'Magenta/Violet', ['Single pen', 'Magenta/Violet', 'Three layer'], 'Use real plotter pen layers, never fake opacity'),
            ParameterDefinition.selection('Outline Mode', 'All shared edges', ['All shared edges', 'Outer only', 'None'], 'Which facet seams to draw as a separate outline pass'),
            ParameterDefinition.doubleVal('Stroke Width', 0.65, 0.1, 2.5, 'SVG preview stroke width'),
            ParameterDefinition.integer('Seed', 42, 1, 999999, 'Random seed for reproducible variants'),
        ];
    }

    onParameterChanged(paramName, newValue, currentValues) {
        if (paramName === 'Preset') {
            const presets = {
                'Reference cluster': {
                    'Split Count': 44,
                    'Boundary Points': 18,
                    'Cluster Width': 0.62,
                    'Cluster Height': 0.88,
                    'Irregularity': 0.28,
                    'Protrusions': 4,
                    'Angle Jitter': 18.0,
                    'Hatch Light Spacing': 9.0,
                    'Hatch Dark Spacing': 3.0,
                    'Light Angle': 315.0,
                    'Contrast': 1.25,
                    'Shade Bands': 5,
                    'Shadow Crosshatch': 0.65,
                    'Highlight Dropout': 0.25,
                    'Color Mode': 'Magenta/Violet',
                    'Outline Mode': 'All shared edges',
                },
                'Tall shard': {
                    'Split Count': 34,
                    'Boundary Points': 16,
                    'Cluster Width': 0.44,
                    'Cluster Height': 0.94,
                    'Irregularity': 0.22,
                    'Protrusions': 2,
                    'Angle Jitter': 12.0,
                    'Hatch Light Spacing': 10.0,
                    'Hatch Dark Spacing': 3.5,
                    'Light Angle': 300.0,
                    'Contrast': 1.1,
                    'Shade Bands': 4,
                    'Shadow Crosshatch': 0.4,
                    'Highlight Dropout': 0.35,
                    'Color Mode': 'Single pen',
                    'Outline Mode': 'All shared edges',
                },
                'Dense shadow': {
                    'Split Count': 68,
                    'Boundary Points': 22,
                    'Cluster Width': 0.70,
                    'Cluster Height': 0.90,
                    'Irregularity': 0.36,
                    'Protrusions': 6,
                    'Angle Jitter': 26.0,
                    'Hatch Light Spacing': 8.0,
                    'Hatch Dark Spacing': 2.2,
                    'Light Angle': 335.0,
                    'Contrast': 1.8,
                    'Shade Bands': 7,
                    'Shadow Crosshatch': 0.9,
                    'Highlight Dropout': 0.1,
                    'Color Mode': 'Three layer',
                    'Outline Mode': 'All shared edges',
                },
                'Quiet facets': {
                    'Split Count': 24,
                    'Boundary Points': 14,
                    'Cluster Width': 0.58,
                    'Cluster Height': 0.78,
                    'Irregularity': 0.16,
                    'Protrusions': 1,
                    'Angle Jitter': 10.0,
                    'Hatch Light Spacing': 12.0,
                    'Hatch Dark Spacing': 5.0,
                    'Light Angle': 285.0,
                    'Contrast': 0.8,
                    'Shade Bands': 3,
                    'Shadow Crosshatch': 0.25,
                    'Highlight Dropout': 0.45,
                    'Color Mode': 'Single pen',
                    'Outline Mode': 'Outer only',
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
        const seed = params['Seed'] || 42;
        const random = new SeededRandom(seed);
        const colorMode = params['Color Mode'] || 'Magenta/Violet';
        const outlineMode = params['Outline Mode'] || 'All shared edges';
        const layerCount = colorMode === 'Three layer' ? 4 : (colorMode === 'Magenta/Violet' ? 3 : 2);
        const outlineLayer = layerCount - 1;
        const canvas = new SvgCanvas(width, height, layerCount);
        canvas.layerColors = this.layerColorsFor(colorMode, layerCount);
        canvas.setStrokeWidth(params['Stroke Width'] || 0.65);

        const margin = Math.min(width, height) * 0.06;
        const boundary = this.createBoundary({
            width,
            height,
            margin,
            pointCount: params['Boundary Points'] || 18,
            clusterWidth: params['Cluster Width'] || 0.62,
            clusterHeight: params['Cluster Height'] || 0.88,
            irregularity: params['Irregularity'] ?? 0.28,
            protrusions: params['Protrusions'] || 4,
            random,
        });

        const faces = this.splitFaces(boundary, params['Split Count'] || 44, params['Angle Jitter'] || 18, random, width * height * 0.0013);
        const lightAngle = this.degToRad(params['Light Angle'] || 315);
        const light = { x: Math.cos(lightAngle), y: Math.sin(lightAngle) };
        const contrast = params['Contrast'] || 1.25;
        const lightSpacing = params['Hatch Light Spacing'] || 9;
        const darkSpacing = params['Hatch Dark Spacing'] || 3;
        const shadeBands = params['Shade Bands'] || 5;
        const shadowCrosshatch = params['Shadow Crosshatch'] ?? 0.65;
        const highlightDropout = params['Highlight Dropout'] ?? 0.25;

        for (const [index, face] of faces.entries()) {
            const centroid = this.centroid(face);
            const angleFamily = this.faceAngle(face, centroid, index, random);
            const shade = this.quantizedShade(this.faceShade(face, centroid, angleFamily, light, width, height, contrast), shadeBands);
            const darkness = 1 - shade;
            const spacing = darkSpacing + (lightSpacing - darkSpacing) * Math.pow(shade, 1.35);
            const hatchAngle = angleFamily + Math.PI / 2 + this.degToRad((random.nextDouble() - 0.5) * 14);
            const hatchLayer = this.layerForShade(shade, colorMode);
            const segments = this.hatchPolygon(face, hatchAngle, spacing);
            const keptSegments = this.applyHighlightDropout(segments, shade, highlightDropout, index);
            for (const segment of keptSegments) {
                canvas.addPath(hatchLayer, this.pathFromSegment(segment, { shadeBand: this.shadeBand(shade, shadeBands) }));
            }

            if (shade > 0.78 && highlightDropout > 0) {
                const highlightSegments = this.hatchPolygon(face, hatchAngle, spacing * 2.6).filter((_, segmentIndex) => segmentIndex % 3 === 0);
                for (const segment of highlightSegments) {
                    canvas.addPath(0, this.pathFromSegment(segment, { highlightPass: true, shadeBand: this.shadeBand(shade, shadeBands) }));
                }
            }

            if (darkness > 0.48 && shadowCrosshatch > 0) {
                const crossSpacing = spacing * (1.15 + (1 - shadowCrosshatch) * 1.4);
                const crossSegments = this.hatchPolygon(face, hatchAngle + this.degToRad(64 + 18 * darkness), crossSpacing);
                const shadowLayer = colorMode === 'Three layer' ? 2 : hatchLayer;
                for (const segment of crossSegments) {
                    canvas.addPath(shadowLayer, this.pathFromSegment(segment, { shadowPass: true, shadeBand: this.shadeBand(shade, shadeBands) }));
                }
            }
        }

        if (outlineMode !== 'None') {
            for (const edge of this.collectEdges(faces, outlineMode)) {
                canvas.addPath(outlineLayer, this.pathFromSegment(edge));
            }
        }

        return canvas.toSvg();
    }

    createBoundary({ width, height, margin, pointCount, clusterWidth, clusterHeight, irregularity, protrusions, random }) {
        const cx = width * (0.48 + (random.nextDouble() - 0.5) * 0.08);
        const cy = height * (0.51 + (random.nextDouble() - 0.5) * 0.05);
        const rx = Math.min(width * clusterWidth * 0.5, width * 0.5 - margin);
        const ry = Math.min(height * clusterHeight * 0.5, height * 0.5 - margin);
        const protrusionCenters = Array.from({ length: protrusions }, () => random.nextDouble() * Math.PI * 2);
        const points = [];

        for (let i = 0; i < pointCount; i++) {
            const base = (Math.PI * 2 * i) / pointCount;
            const angle = base + (random.nextDouble() - 0.5) * (Math.PI * 2 / pointCount) * 0.45;
            let scale = 1 + (random.nextDouble() - 0.5) * irregularity;
            for (const center of protrusionCenters) {
                const d = Math.abs(Math.atan2(Math.sin(angle - center), Math.cos(angle - center)));
                if (d < 0.34) scale += (0.18 + random.nextDouble() * 0.22) * (1 - d / 0.34);
            }
            const x = this.clamp(cx + Math.cos(angle) * rx * scale, margin, width - margin);
            const y = this.clamp(cy + Math.sin(angle) * ry * scale, margin, height - margin);
            points.push({ x, y });
        }
        return points;
    }

    splitFaces(initialPolygon, splitCount, angleJitterDeg, random, minArea) {
        const faces = [initialPolygon];
        const angleFamilies = [this.degToRad(18), this.degToRad(78), this.degToRad(138), this.degToRad(-32)];

        for (let i = 0; i < splitCount; i++) {
            const faceIndex = this.pickFaceByArea(faces, random);
            const face = faces[faceIndex];
            if (!face || Math.abs(this.area(face)) < minArea * 1.5) continue;

            const centroid = this.centroid(face);
            let split = null;
            for (let attempt = 0; attempt < 8 && !split; attempt++) {
                const angle = angleFamilies[(i + random.nextInt(angleFamilies.length)) % angleFamilies.length]
                    + this.degToRad((random.nextDouble() - 0.5) * angleJitterDeg * 2);
                const n = { x: -Math.sin(angle), y: Math.cos(angle) };
                const bounds = this.bounds(face);
                const span = Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
                const offset = (random.nextDouble() - 0.5) * span * 0.18;
                const point = { x: centroid.x + n.x * offset, y: centroid.y + n.y * offset };
                const a = this.clipHalfPlane(face, point, n, true);
                const b = this.clipHalfPlane(face, point, n, false);
                if (a.length >= 3 && b.length >= 3 && Math.abs(this.area(a)) >= minArea && Math.abs(this.area(b)) >= minArea) {
                    split = [a, b];
                }
            }
            if (split) faces.splice(faceIndex, 1, split[0], split[1]);
        }
        return faces;
    }

    pickFaceByArea(faces, random) {
        const weights = faces.map((face) => Math.max(0, Math.abs(this.area(face))));
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let cursor = random.nextDouble() * total;
        for (let i = 0; i < weights.length; i++) {
            cursor -= weights[i];
            if (cursor <= 0) return i;
        }
        return faces.length - 1;
    }

    clipHalfPlane(poly, point, normal, keepPositive) {
        const output = [];
        const inside = (p) => keepPositive ? this.signedDistance(p, point, normal) >= -EPS : this.signedDistance(p, point, normal) <= EPS;
        for (let i = 0; i < poly.length; i++) {
            const current = poly[i];
            const previous = poly[(i + poly.length - 1) % poly.length];
            const currentInside = inside(current);
            const previousInside = inside(previous);
            if (currentInside !== previousInside) {
                output.push(this.linePlaneIntersection(previous, current, point, normal));
            }
            if (currentInside) output.push(current);
        }
        return this.cleanPolygon(output);
    }

    linePlaneIntersection(a, b, point, normal) {
        const da = this.signedDistance(a, point, normal);
        const db = this.signedDistance(b, point, normal);
        const t = da / (da - db || EPS);
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
        };
    }

    signedDistance(p, point, normal) {
        return (p.x - point.x) * normal.x + (p.y - point.y) * normal.y;
    }

    cleanPolygon(poly) {
        const cleaned = [];
        for (const point of poly) {
            const previous = cleaned[cleaned.length - 1];
            if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 0.4) cleaned.push(point);
        }
        if (cleaned.length > 2) {
            const first = cleaned[0];
            const last = cleaned[cleaned.length - 1];
            if (Math.hypot(first.x - last.x, first.y - last.y) < 0.4) cleaned.pop();
        }
        return cleaned;
    }

    hatchPolygon(poly, angle, spacing) {
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        const normal = { x: -dir.y, y: dir.x };
        const projections = poly.map((p) => p.x * normal.x + p.y * normal.y);
        const min = Math.min(...projections) - spacing;
        const max = Math.max(...projections) + spacing;
        const segments = [];

        for (let offset = min; offset <= max; offset += spacing) {
            const hits = [];
            for (let i = 0; i < poly.length; i++) {
                const a = poly[i];
                const b = poly[(i + 1) % poly.length];
                const da = a.x * normal.x + a.y * normal.y - offset;
                const db = b.x * normal.x + b.y * normal.y - offset;
                if (Math.abs(da) < EPS) hits.push(a);
                if (da * db < -EPS) {
                    const t = da / (da - db);
                    hits.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
                }
            }
            const unique = this.uniquePoints(hits).sort((a, b) => (a.x * dir.x + a.y * dir.y) - (b.x * dir.x + b.y * dir.y));
            for (let i = 0; i + 1 < unique.length; i += 2) {
                if (Math.hypot(unique[i + 1].x - unique[i].x, unique[i + 1].y - unique[i].y) > 2.0) {
                    segments.push([unique[i], unique[i + 1]]);
                }
            }
        }
        return segments;
    }

    uniquePoints(points) {
        const result = [];
        for (const point of points) {
            if (!result.some((other) => Math.hypot(point.x - other.x, point.y - other.y) < 0.5)) result.push(point);
        }
        return result;
    }

    layerForShade(shade, colorMode) {
        if (colorMode === 'Single pen') return 0;
        if (colorMode === 'Magenta/Violet') return shade < 0.52 ? 1 : 0;
        if (shade < 0.34) return 2;
        if (shade < 0.64) return 1;
        return 0;
    }

    layerColorsFor(colorMode, layerCount) {
        if (colorMode === 'Single pen') return ['#1f1b20', '#1f78b4'];
        if (colorMode === 'Magenta/Violet') return ['#c13c8a', '#5b3b8f', '#253858'];
        if (colorMode === 'Three layer') return ['#d66aa8', '#7b4ab0', '#241a42', '#26364f'];
        return Array.from({ length: layerCount }, (_, index) => ['black', '#E31A1C', '#1F78B4', '#33A02C'][index % 4]);
    }

    faceShade(face, centroid, angleFamily, light, width, height, contrast) {
        const edgeNormal = { x: Math.cos(angleFamily), y: Math.sin(angleFamily) };
        const rx = (centroid.x - width * 0.5) / width;
        const ry = (centroid.y - height * 0.5) / height;
        const radial = this.normalize({ x: edgeNormal.x * 0.7 + rx * 1.8, y: edgeNormal.y * 0.7 + ry * 1.8 });
        const areaTone = this.clamp(Math.sqrt(Math.abs(this.area(face)) / (width * height)) * 3.5, 0, 0.35);
        const dot = radial.x * light.x + radial.y * light.y;
        return this.clamp(0.5 + contrast * 0.5 * dot + areaTone - 0.12, 0, 1);
    }

    quantizedShade(shade, bands) {
        if (bands <= 1) return shade;
        return Math.round(this.clamp(shade, 0, 1) * (bands - 1)) / (bands - 1);
    }

    shadeBand(shade, bands) {
        return Math.round(this.clamp(shade, 0, 1) * (bands - 1));
    }

    applyHighlightDropout(segments, shade, highlightDropout, faceIndex) {
        if (shade < 0.72 || highlightDropout <= 0) return segments;
        const skipModulo = Math.max(2, Math.round(1 / highlightDropout));
        return segments.filter((_, segmentIndex) => (segmentIndex + faceIndex) % skipModulo !== 0);
    }

    normalize(vector) {
        const length = Math.hypot(vector.x, vector.y) || 1;
        return { x: vector.x / length, y: vector.y / length };
    }

    collectEdges(faces, outlineMode) {
        const edges = new Map();
        for (const face of faces) {
            for (let i = 0; i < face.length; i++) {
                const a = face[i];
                const b = face[(i + 1) % face.length];
                const key = this.edgeKey(a, b);
                const existing = edges.get(key);
                if (existing) existing.count += 1;
                else edges.set(key, { count: 1, edge: [a, b] });
            }
        }
        return Array.from(edges.values())
            .filter((entry) => outlineMode === 'All shared edges' || entry.count === 1)
            .map((entry) => entry.edge);
    }

    edgeKey(a, b) {
        const pa = `${Math.round(a.x * 10)},${Math.round(a.y * 10)}`;
        const pb = `${Math.round(b.x * 10)},${Math.round(b.y * 10)}`;
        return pa < pb ? `${pa}|${pb}` : `${pb}|${pa}`;
    }

    pathFromSegment([a, b], metadata = {}) {
        const attrs = [];
        if (metadata.shadeBand !== undefined) attrs.push(`data-shade-band='${metadata.shadeBand}'`);
        if (metadata.shadowPass) attrs.push("data-shadow-pass='true'");
        if (metadata.highlightPass) attrs.push("data-highlight-pass='true'");
        const attrText = attrs.length ? ` ${attrs.join(' ')}` : '';
        return `<path d='M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}'${attrText} />`;
    }

    faceAngle(face, centroid, index, random) {
        const longest = this.longestEdgeAngle(face);
        const radial = Math.atan2(centroid.y, centroid.x);
        return longest * 0.72 + radial * 0.10 + (index % 3) * 0.28 + (random.nextDouble() - 0.5) * 0.35;
    }

    longestEdgeAngle(face) {
        let best = 0;
        let bestLength = -Infinity;
        for (let i = 0; i < face.length; i++) {
            const a = face[i];
            const b = face[(i + 1) % face.length];
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            if (length > bestLength) {
                bestLength = length;
                best = Math.atan2(b.y - a.y, b.x - a.x);
            }
        }
        return best;
    }

    area(poly) {
        let sum = 0;
        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = poly[(i + 1) % poly.length];
            sum += a.x * b.y - b.x * a.y;
        }
        return sum / 2;
    }

    centroid(poly) {
        let x = 0;
        let y = 0;
        for (const point of poly) {
            x += point.x;
            y += point.y;
        }
        return { x: x / poly.length, y: y / poly.length };
    }

    bounds(poly) {
        return {
            minX: Math.min(...poly.map((p) => p.x)),
            maxX: Math.max(...poly.map((p) => p.x)),
            minY: Math.min(...poly.map((p) => p.y)),
            maxY: Math.max(...poly.map((p) => p.y)),
        };
    }

    degToRad(degrees) {
        return (degrees * Math.PI) / 180;
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
}
