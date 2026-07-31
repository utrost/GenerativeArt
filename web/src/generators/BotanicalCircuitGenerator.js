import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addCircle, addPolyline, clamp, fitBox, intParam, makeCanvas, marker, numberParam, randRange, rngFrom } from './PlotterGeneratorUtils';

export class BotanicalCircuitGenerator extends Generator {
  getId() { return 'botanical-circuit'; }
  getDisplayName() { return 'Botanical Circuit'; }
  getParameterDefinitions() { return [
    ParameterDefinition.selection('Preset', 'Fern PCB', ['Fern PCB', 'Strict Routing', 'Wild Creeper', 'Pad Garden', 'Custom'], 'Plant growth constrained by circuit-board routing'),
    ParameterDefinition.integer('Branch Depth', 8, 3, 9, 'Recursive growth depth'),
    ParameterDefinition.doubleVal('Growth Bias', 88, 0, 100, 'Organic curve vs circuit angle discipline'),
    ParameterDefinition.integer('Node Density', 5, 1, 7, 'Side branches per node'),
    ParameterDefinition.doubleVal('Trace Spacing', 9, 4, 28, 'Distance between paired traces'),
    ParameterDefinition.doubleVal('Leaf Pads', 55, 0, 100, 'How often leaves become solder pads'),
    ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
    ParameterDefinition.doubleVal('Stroke Width', 0.75, 0.1, 3.0, 'Preview stroke width'),
    ParameterDefinition.integer('Seed', 99, 1, 99999, 'Deterministic random seed'),
  ]; }
  onParameterChanged(paramName, value, current) {
    const presets = {
      'Fern PCB': { 'Branch Depth': 6, 'Growth Bias': 58, 'Node Density': 3, 'Trace Spacing': 11, 'Leaf Pads': 70, Colors: 3, Seed: 2718 },
      'Strict Routing': { 'Branch Depth': 5, 'Growth Bias': 12, 'Node Density': 2, 'Trace Spacing': 12, 'Leaf Pads': 52, Colors: 2, Seed: 402 },
      'Wild Creeper': { 'Branch Depth': 7, 'Growth Bias': 92, 'Node Density': 4, 'Trace Spacing': 8, 'Leaf Pads': 36, Colors: 3, Seed: 99 },
      'Pad Garden': { 'Branch Depth': 6, 'Growth Bias': 35, 'Node Density': 5, 'Trace Spacing': 14, 'Leaf Pads': 100, Colors: 4, Seed: 1204 },
    };
    if (paramName === 'Preset' && presets[value]) { Object.assign(current, presets[value]); return true; }
    if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; }
    return false;
  }
  generate(params) {
    const canvas = makeCanvas(params, 3); marker(canvas, 0, 'layer_1_traces'); marker(canvas, 1 % canvas.layers.length, 'layer_2_leaf_pads'); marker(canvas, 2 % canvas.layers.length, 'layer_3_vias');
    const rng = rngFrom(params); const width = canvas.width, height = canvas.height; const box = fitBox(width, height, 0.1);
    const depth = clamp(intParam(params, 'Branch Depth', 6), 3, 9); const organic = numberParam(params, 'Growth Bias', 58) / 100; const nodeDensity = clamp(intParam(params, 'Node Density', 3), 1, 7); const spacing = numberParam(params, 'Trace Spacing', 11); const pads = numberParam(params, 'Leaf Pads', 70) / 100;
    const queue = [{ x: width * 0.5, y: box.bottom, angle: -Math.PI / 2, len: box.height * 0.24, d: 0 }];
    let branchIndex = 0;
    while (queue.length) {
      const b = queue.shift(); if (b.d > depth || b.len < 7) continue;
      const bend = (rng.nextDouble() - 0.5) * organic * 0.75; const angle = snapAngle(b.angle + bend, organic);
      const mid = { x: b.x + Math.cos(angle) * b.len * 0.55, y: b.y + Math.sin(angle) * b.len * 0.55 };
      const end = { x: mid.x + Math.cos(angle + (rng.nextDouble() - 0.5) * organic * 0.55) * b.len * 0.45, y: mid.y + Math.sin(angle + (rng.nextDouble() - 0.5) * organic * 0.55) * b.len * 0.45 };
      const pts = orthogonalTrace({ x: b.x, y: b.y }, mid, end, organic);
      addPolyline(canvas, branchIndex % canvas.layers.length, pts);
      if (branchIndex % 3 === 0) addPolyline(canvas, branchIndex % canvas.layers.length, pts.map((p) => ({ x: p.x + Math.sin(angle) * spacing * 0.35, y: p.y - Math.cos(angle) * spacing * 0.35 })), "stroke-opacity='0.55'");
      addCircle(canvas, 2 % canvas.layers.length, b.x, b.y, Math.max(1.5, spacing * 0.18));
      const boundedEnd = { x: clamp(end.x, box.left, box.right), y: clamp(end.y, box.top, box.bottom) };
      if (rng.nextDouble() < pads || b.d === depth) {
        addCircle(canvas, 1 % canvas.layers.length, boundedEnd.x, boundedEnd.y, randRange(rng, 2.5, spacing * 0.75));
        if (rng.nextDouble() < 0.55) addCircle(canvas, 2 % canvas.layers.length, boundedEnd.x, boundedEnd.y, randRange(rng, 0.8, 1.8));
      }
      const children = Math.max(1, Math.floor(nodeDensity * (1 - b.d / (depth + 2))));
      for (let i = 0; i < children; i++) {
        const side = i % 2 === 0 ? -1 : 1; const spread = randRange(rng, 0.35, 0.85) * side;
        queue.push({ x: boundedEnd.x, y: boundedEnd.y, angle: angle + spread, len: b.len * randRange(rng, 0.58, 0.76), d: b.d + 1 });
      }
      branchIndex += 1;
    }
    return canvas.toSvg();
  }
}
function snapAngle(angle, organic) { const step = Math.PI / 4; const snapped = Math.round(angle / step) * step; return snapped * (1 - organic) + angle * organic; }
function orthogonalTrace(start, mid, end, organic) { if (organic > 0.65) return [start, mid, end]; return [start, { x: mid.x, y: start.y }, mid, { x: end.x, y: mid.y }, end]; }
