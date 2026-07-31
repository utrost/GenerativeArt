import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addPolygon, addRect, clamp, fitBox, intParam, makeCanvas, marker, numberParam, randRange, rngFrom } from './PlotterGeneratorUtils';

export class ArchiveShardsGenerator extends Generator {
  getId() { return 'archive-shards'; }
  getDisplayName() { return 'Archive Shards'; }
  getParameterDefinitions() { return [
    ParameterDefinition.selection('Preset', 'Index Drift', ['Index Drift', 'Sparse Catalog', 'Broken Manifest', 'Dense Backlog', 'Custom'], 'Document fragments arranged by invisible metadata axes'),
    ParameterDefinition.integer('Shard Count', 90, 15, 260, 'Number of rectangular fragments'),
    ParameterDefinition.integer('Cluster Count', 5, 2, 12, 'Metadata clusters'),
    ParameterDefinition.doubleVal('Link Density', 38, 0, 100, 'Cross-reference lines between shards'),
    ParameterDefinition.doubleVal('Fragmentation', 62, 0, 100, 'Rotation, clipped corners, and broken edges'),
    ParameterDefinition.doubleVal('Axis Bias', 56, 0, 100, 'How strongly shards align to metadata axes'),
    ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
    ParameterDefinition.doubleVal('Stroke Width', 0.65, 0.1, 3, 'Preview stroke width'),
    ParameterDefinition.integer('Seed', 1984, 1, 99999, 'Deterministic random seed'),
  ]; }
  onParameterChanged(paramName, value, current) { const presets = { 'Index Drift': { 'Shard Count': 90, 'Cluster Count': 5, 'Link Density': 38, Fragmentation: 62, 'Axis Bias': 56, Colors: 3, Seed: 1984 }, 'Sparse Catalog': { 'Shard Count': 38, 'Cluster Count': 4, 'Link Density': 20, Fragmentation: 24, 'Axis Bias': 82, Colors: 2, Seed: 501 }, 'Broken Manifest': { 'Shard Count': 120, 'Cluster Count': 7, 'Link Density': 62, Fragmentation: 95, 'Axis Bias': 22, Colors: 3, Seed: 404 }, 'Dense Backlog': { 'Shard Count': 210, 'Cluster Count': 9, 'Link Density': 44, Fragmentation: 50, 'Axis Bias': 48, Colors: 4, Seed: 770 } }; if (paramName === 'Preset' && presets[value]) { Object.assign(current, presets[value]); return true; } if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; } return false; }
  generate(params) {
    const canvas = makeCanvas(params, 3); marker(canvas, 0, 'layer_1_shards'); marker(canvas, 1 % canvas.layers.length, 'layer_2_links'); marker(canvas, 2 % canvas.layers.length, 'layer_3_metadata_marks');
    const rng = rngFrom(params); const width = canvas.width, height = canvas.height; const box = fitBox(width, height, 0.08);
    const shardCount = clamp(intParam(params, 'Shard Count', 90), 15, 260); const clusterCount = clamp(intParam(params, 'Cluster Count', 5), 2, 12); const links = numberParam(params, 'Link Density', 38) / 100; const frag = numberParam(params, 'Fragmentation', 62) / 100; const axis = numberParam(params, 'Axis Bias', 56) / 100;
    const clusters = []; for (let i = 0; i < clusterCount; i++) clusters.push({ x: box.left + rng.nextDouble() * box.width, y: box.top + rng.nextDouble() * box.height });
    const shards = [];
    for (let i = 0; i < shardCount; i++) { const c = clusters[i % clusters.length]; const spread = (1 - axis) * 0.85 + 0.15; const x = c.x + randRange(rng, -box.width, box.width) * 0.23 * spread; const y = c.y + randRange(rng, -box.height, box.height) * 0.23 * spread; const w = randRange(rng, 8, 34) * (1 + frag * 0.8); const h = randRange(rng, 5, 24) * (1 + frag * 0.4); const a = (rng.nextDouble() - 0.5) * frag * 0.9 + (axis > 0.6 ? 0 : 0.2); const shard = { x: clamp(x, box.left, box.right), y: clamp(y, box.top, box.bottom), w, h, a, c: i % clusters.length }; shards.push(shard); drawShard(canvas, shard, i % canvas.layers.length, frag); if (rng.nextDouble() < 0.85) drawMarks(canvas, shard, 2 % canvas.layers.length, rng); }
    const linkCount = Math.floor(shardCount * links * 1.7); for (let i = 0; i < linkCount; i++) { const a = shards[Math.floor(rng.nextDouble() * shards.length)]; const b = shards[Math.floor(rng.nextDouble() * shards.length)]; if (!a || !b || a === b) continue; canvas.addLine(1 % canvas.layers.length, a.x, a.y, b.x, b.y); }
    clusters.forEach((c, i) => addRect(canvas, 2 % canvas.layers.length, c.x - 3, c.y - 3, 6, 6, i % 2 ? "stroke-dasharray='2 2'" : ''));
    return canvas.toSvg();
  }
}
function rot(p, c, a) { const dx = p.x - c.x, dy = p.y - c.y; return { x: c.x + Math.cos(a) * dx - Math.sin(a) * dy, y: c.y + Math.sin(a) * dx + Math.cos(a) * dy }; }
function drawShard(canvas, s, layer, frag) { let pts = [{ x: s.x - s.w / 2, y: s.y - s.h / 2 }, { x: s.x + s.w / 2, y: s.y - s.h / 2 }, { x: s.x + s.w / 2, y: s.y + s.h / 2 }, { x: s.x - s.w / 2, y: s.y + s.h / 2 }].map((p) => rot(p, s, s.a)); if (frag > 0.55) pts[1].x -= s.w * 0.16; addPolygon(canvas, layer, pts); }
function drawMarks(canvas, s, layer, rng) { const lines = 1 + Math.floor(rng.nextDouble() * 4); for (let i = 0; i < lines; i++) { const y = s.y - s.h * 0.25 + i * s.h / 5; canvas.addLine(layer, s.x - s.w * 0.28, y, s.x + s.w * randRange(rng, 0.0, 0.34), y); } }
