import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addCircle, addPolyline, clamp, fitBox, fbm, intParam, makeCanvas, marker, numberParam, randRange, rngFrom } from './PlotterGeneratorUtils';

export class ThreadLoomGenerator extends Generator {
  getId() { return 'thread-loom'; }
  getDisplayName() { return 'Thread Loom'; }
  getParameterDefinitions() {
    return [
      ParameterDefinition.selection('Preset', 'Warped Weft', ['Warped Weft', 'Sparse Frame', 'Dense Moire', 'Off-Center Knot', 'Custom'], 'Named thread studies'),
      ParameterDefinition.integer('Anchor Count', 44, 12, 120, 'Pins distributed around the frame'),
      ParameterDefinition.integer('Thread Count', 220, 30, 700, 'Number of plotted threads'),
      ParameterDefinition.doubleVal('Warp Strength', 54, 0, 120, 'How strongly threads bow through invisible fields'),
      ParameterDefinition.doubleVal('Field Complexity', 42, 0, 100, 'Variation in the sagging vector field'),
      ParameterDefinition.doubleVal('Focus Pull', 48, 0, 100, 'How much threads route toward the inner focus'),
      ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
      ParameterDefinition.doubleVal('Stroke Width', 0.55, 0.1, 2.5, 'Preview stroke width'),
      ParameterDefinition.integer('Seed', 1441, 1, 99999, 'Deterministic random seed'),
    ];
  }
  onParameterChanged(paramName, value, current) {
    const presets = {
      'Warped Weft': { 'Anchor Count': 44, 'Thread Count': 220, 'Warp Strength': 54, 'Field Complexity': 42, 'Focus Pull': 48, Colors: 3, Seed: 1441 },
      'Sparse Frame': { 'Anchor Count': 28, 'Thread Count': 90, 'Warp Strength': 24, 'Field Complexity': 25, 'Focus Pull': 22, Colors: 2, Seed: 77 },
      'Dense Moire': { 'Anchor Count': 80, 'Thread Count': 520, 'Warp Strength': 34, 'Field Complexity': 70, 'Focus Pull': 18, Colors: 4, Seed: 909 },
      'Off-Center Knot': { 'Anchor Count': 52, 'Thread Count': 260, 'Warp Strength': 86, 'Field Complexity': 58, 'Focus Pull': 82, Colors: 3, Seed: 306 },
    };
    if (paramName === 'Preset' && presets[value]) { Object.assign(current, presets[value]); return true; }
    if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; }
    return false;
  }
  generate(params) {
    const canvas = makeCanvas(params, 3);
    marker(canvas, 0, 'layer_1_threads'); marker(canvas, 1 % canvas.layers.length, 'layer_2_shadow_threads'); marker(canvas, 2 % canvas.layers.length, 'layer_3_anchor_marks');
    const rng = rngFrom(params); const width = canvas.width, height = canvas.height; const box = fitBox(width, height, 0.09);
    const anchorCount = clamp(intParam(params, 'Anchor Count', 44), 12, 120); const threadCount = clamp(intParam(params, 'Thread Count', 220), 30, 700);
    const warp = numberParam(params, 'Warp Strength', 54); const complexity = numberParam(params, 'Field Complexity', 42) / 100; const pull = numberParam(params, 'Focus Pull', 48) / 100; const seed = intParam(params, 'Seed', 1441);
    const anchors = [];
    for (let i = 0; i < anchorCount; i++) {
      const side = i % 4; const t = (Math.floor(i / 4) + rng.nextDouble() * 0.55) / Math.ceil(anchorCount / 4);
      let x, y; if (side === 0) { x = box.left + t * box.width; y = box.top; } else if (side === 1) { x = box.right; y = box.top + t * box.height; } else if (side === 2) { x = box.right - t * box.width; y = box.bottom; } else { x = box.left; y = box.bottom - t * box.height; }
      anchors.push({ x, y });
    }
    const focus = { x: box.left + randRange(rng, 0.33, 0.72) * box.width, y: box.top + randRange(rng, 0.28, 0.74) * box.height };
    for (let i = 0; i < threadCount; i++) {
      const a = anchors[i % anchors.length]; const b = anchors[(i * 17 + Math.floor(anchorCount * 0.37)) % anchors.length];
      const pts = []; const steps = 28;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps; let x = a.x + (b.x - a.x) * t; let y = a.y + (b.y - a.y) * t;
        const sag = Math.sin(Math.PI * t) * warp; const n = fbm(t * (3 + complexity * 8), i * 0.022, seed, 4) - 0.5;
        x += (focus.x - x) * pull * 0.28 * Math.sin(Math.PI * t) + n * sag;
        y += (focus.y - y) * pull * 0.28 * Math.sin(Math.PI * t) + (fbm(i * 0.018, t * (4 + complexity * 7), seed + 21, 4) - 0.5) * sag;
        pts.push({ x: clamp(x, 0, width), y: clamp(y, 0, height) });
      }
      addPolyline(canvas, i % canvas.layers.length, pts, i % 5 === 0 ? "stroke-opacity='0.7'" : '');
    }
    anchors.forEach((a, i) => { if (i % 2 === 0) addCircle(canvas, 2 % canvas.layers.length, a.x, a.y, 1.6 + (i % 3) * 0.55); });
    addCircle(canvas, 2 % canvas.layers.length, focus.x, focus.y, 4.0, "stroke-dasharray='2 3'");
    return canvas.toSvg();
  }
}
