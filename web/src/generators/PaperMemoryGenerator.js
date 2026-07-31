import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addPolyline, clamp, fitBox, fbm, intParam, makeCanvas, marker, numberParam, randRange, rngFrom } from './PlotterGeneratorUtils';

export class PaperMemoryGenerator extends Generator {
  getId() { return 'paper-memory'; }
  getDisplayName() { return 'Paper Memory'; }
  getParameterDefinitions() { return [
    ParameterDefinition.selection('Preset', 'Handled Sheet', ['Handled Sheet', 'Quiet Ghosts', 'Hard Fold', 'Rubbing Study', 'Custom'], 'Fold and rubbing memory presets'),
    ParameterDefinition.integer('Fold Count', 12, 2, 40, 'Number of crease histories'),
    ParameterDefinition.doubleVal('Memory Depth', 64, 0, 100, 'How many ghost creases remain visible'),
    ParameterDefinition.doubleVal('Crease Sharpness', 58, 0, 100, 'Straightness and emphasis of recent folds'),
    ParameterDefinition.doubleVal('Rubbing Density', 48, 0, 100, 'Short dry-brush pressure marks'),
    ParameterDefinition.doubleVal('Fold Symmetry', 34, 0, 100, 'Mirrored handling marks'),
    ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
    ParameterDefinition.doubleVal('Stroke Width', 0.65, 0.1, 3, 'Preview stroke width'),
    ParameterDefinition.integer('Seed', 616, 1, 99999, 'Deterministic random seed'),
  ]; }
  onParameterChanged(paramName, value, current) { const presets = { 'Handled Sheet': { 'Fold Count': 12, 'Memory Depth': 64, 'Crease Sharpness': 58, 'Rubbing Density': 48, 'Fold Symmetry': 34, Colors: 3, Seed: 616 }, 'Quiet Ghosts': { 'Fold Count': 8, 'Memory Depth': 82, 'Crease Sharpness': 22, 'Rubbing Density': 18, 'Fold Symmetry': 50, Colors: 2, Seed: 222 }, 'Hard Fold': { 'Fold Count': 7, 'Memory Depth': 35, 'Crease Sharpness': 95, 'Rubbing Density': 30, 'Fold Symmetry': 20, Colors: 3, Seed: 88 }, 'Rubbing Study': { 'Fold Count': 16, 'Memory Depth': 58, 'Crease Sharpness': 36, 'Rubbing Density': 95, 'Fold Symmetry': 12, Colors: 3, Seed: 1492 } }; if (paramName === 'Preset' && presets[value]) { Object.assign(current, presets[value]); return true; } if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; } return false; }
  generate(params) {
    const canvas = makeCanvas(params, 3); marker(canvas, 0, 'layer_1_current_creases'); marker(canvas, 1 % canvas.layers.length, 'layer_2_ghost_creases'); marker(canvas, 2 % canvas.layers.length, 'layer_3_rubbing');
    const rng = rngFrom(params); const width = canvas.width, height = canvas.height; const box = fitBox(width, height, 0.08);
    const folds = clamp(intParam(params, 'Fold Count', 12), 2, 40); const memory = numberParam(params, 'Memory Depth', 64) / 100; const sharp = numberParam(params, 'Crease Sharpness', 58) / 100; const rub = numberParam(params, 'Rubbing Density', 48) / 100; const sym = numberParam(params, 'Fold Symmetry', 34) / 100; const seed = intParam(params, 'Seed', 616);
    const creases = [];
    for (let i = 0; i < folds; i++) { const a = randRange(rng, -Math.PI, Math.PI); const cx = box.left + rng.nextDouble() * box.width; const cy = box.top + rng.nextDouble() * box.height; creases.push({ a, cx, cy, age: i / Math.max(1, folds - 1) }); }
    creases.forEach((c, i) => {
      const len = Math.max(width, height) * randRange(rng, 0.45, 1.2); const steps = 34; const pts = [];
      for (let s = 0; s <= steps; s++) { const t = (s / steps - 0.5) * len; const wobble = (fbm(s * 0.08, i * 0.31, seed, 3) - 0.5) * (1 - sharp) * 24; pts.push({ x: clamp(c.cx + Math.cos(c.a) * t - Math.sin(c.a) * wobble, 0, width), y: clamp(c.cy + Math.sin(c.a) * t + Math.cos(c.a) * wobble, 0, height) }); }
      const recent = c.age > 0.55; addPolyline(canvas, recent ? 0 : 1 % canvas.layers.length, pts, recent ? "stroke-width='1.25'" : `stroke-opacity='${(0.25 + memory * 0.55).toFixed(2)}'`);
      if (sym > 0.35 && i % 3 === 0) addPolyline(canvas, 1 % canvas.layers.length, pts.map((p) => ({ x: width - p.x, y: p.y })), "stroke-opacity='0.35'");
    });
    const rubs = Math.floor(45 + rub * 260);
    for (let i = 0; i < rubs; i++) { const x = box.left + rng.nextDouble() * box.width; const y = box.top + rng.nextDouble() * box.height; const a = creases[i % creases.length].a + Math.PI / 2 + randRange(rng, -0.35, 0.35); const len = randRange(rng, 3, 18 + rub * 28); if (fbm(x * 0.012, y * 0.012, seed + 91, 4) < 0.35) continue; canvas.addLine(2 % canvas.layers.length, x, y, x + Math.cos(a) * len, y + Math.sin(a) * len); }
    return canvas.toSvg();
  }
}
