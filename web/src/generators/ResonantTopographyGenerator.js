import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addCircle, addPolyline, clamp, fitBox, fbm, intParam, makeCanvas, marker, numberParam, rngFrom } from './PlotterGeneratorUtils';

export class ResonantTopographyGenerator extends Generator {
  getId() { return 'resonant-topography'; }
  getDisplayName() { return 'Resonant Topography'; }
  getParameterDefinitions() { return [
    ParameterDefinition.selection('Preset', 'Standing Ridge', ['Standing Ridge', 'Low Hum', 'Island Nodes', 'Broken Harmonics', 'Custom'], 'Contour terrain disturbed by acoustic resonance'),
    ParameterDefinition.integer('Contour Density', 32, 8, 70, 'Number of topographic contour bands'),
    ParameterDefinition.integer('Wave Modes', 5, 1, 12, 'Standing-wave mode count'),
    ParameterDefinition.doubleVal('Resonance Strength', 62, 0, 120, 'How strongly waves break and bend contours'),
    ParameterDefinition.doubleVal('Node Sharpness', 52, 0, 100, 'Crispness of silent nodes'),
    ParameterDefinition.doubleVal('Terrain Warp', 45, 0, 100, 'Base terrain complexity'),
    ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
    ParameterDefinition.doubleVal('Stroke Width', 0.65, 0.1, 3, 'Preview stroke width'),
    ParameterDefinition.integer('Seed', 31415, 1, 99999, 'Deterministic random seed'),
  ]; }
  onParameterChanged(paramName, value, current) { const presets = { 'Standing Ridge': { 'Contour Density': 32, 'Wave Modes': 5, 'Resonance Strength': 62, 'Node Sharpness': 52, 'Terrain Warp': 45, Colors: 3, Seed: 31415 }, 'Low Hum': { 'Contour Density': 22, 'Wave Modes': 3, 'Resonance Strength': 34, 'Node Sharpness': 28, 'Terrain Warp': 30, Colors: 2, Seed: 100 }, 'Island Nodes': { 'Contour Density': 38, 'Wave Modes': 7, 'Resonance Strength': 70, 'Node Sharpness': 82, 'Terrain Warp': 55, Colors: 3, Seed: 707 }, 'Broken Harmonics': { 'Contour Density': 48, 'Wave Modes': 9, 'Resonance Strength': 95, 'Node Sharpness': 74, 'Terrain Warp': 72, Colors: 4, Seed: 8080 } }; if (paramName === 'Preset' && presets[value]) { Object.assign(current, presets[value]); return true; } if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; } return false; }
  generate(params) {
    const canvas = makeCanvas(params, 3); marker(canvas, 0, 'layer_1_contours'); marker(canvas, 1 % canvas.layers.length, 'layer_2_resonance_nodes'); marker(canvas, 2 % canvas.layers.length, 'layer_3_break_marks');
    const rng = rngFrom(params); const width = canvas.width, height = canvas.height; const box = fitBox(width, height, 0.08); const seed = intParam(params, 'Seed', 31415);
    const density = clamp(intParam(params, 'Contour Density', 32), 8, 70); const modes = clamp(intParam(params, 'Wave Modes', 5), 1, 12); const resonance = numberParam(params, 'Resonance Strength', 62) / 100; const sharp = numberParam(params, 'Node Sharpness', 52) / 100; const warp = numberParam(params, 'Terrain Warp', 45) / 100;
    const nodes = []; for (let i = 0; i < modes; i++) { nodes.push({ x: box.left + rng.nextDouble() * box.width, y: box.top + rng.nextDouble() * box.height, phase: rng.nextDouble() * Math.PI * 2 }); }
    for (let i = 0; i < density; i++) {
      const baseY = box.top + (i + 0.5) * box.height / density; let segment = []; const steps = 150;
      for (let s = 0; s <= steps; s++) { const t = s / steps; let x = box.left + t * box.width; let y = baseY + (fbm(t * 3.2, i * 0.09, seed, 4) - 0.5) * box.height * 0.16 * warp; let amp = 0; for (const n of nodes) { const dx = (x - n.x) / box.width; const dy = (y - n.y) / box.height; const r = Math.sqrt(dx * dx + dy * dy); amp += Math.sin(r * Math.PI * modes * 1.7 + n.phase) / modes; } const breakNode = Math.abs(amp) < 0.035 + sharp * 0.045; y += amp * resonance * 70; x += Math.cos(amp * Math.PI) * resonance * 10; if (breakNode && resonance > 0.25) { addPolyline(canvas, i % canvas.layers.length, segment); segment = []; if (s % 9 === 0) canvas.addLine(2 % canvas.layers.length, x - 3, y - 3, x + 3, y + 3); } else { segment.push({ x: clamp(x, 0, width), y: clamp(y, 0, height) }); } }
      addPolyline(canvas, i % canvas.layers.length, segment);
    }
    nodes.forEach((n, i) => { addCircle(canvas, 1 % canvas.layers.length, n.x, n.y, 8 + sharp * 16, i % 2 ? "stroke-dasharray='2 5'" : ''); addCircle(canvas, 2 % canvas.layers.length, n.x, n.y, 1.8); });
    return canvas.toSvg();
  }
}
