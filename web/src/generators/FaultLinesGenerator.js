import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addPolyline, clamp, fitBox, fbm, intParam, makeCanvas, marker, numberParam, rngFrom, signedDistanceToSegment } from './PlotterGeneratorUtils';

export class FaultLinesGenerator extends Generator {
  getId() { return 'fault-lines'; }
  getDisplayName() { return 'Fault Lines'; }

  getParameterDefinitions() {
    return [
      ParameterDefinition.selection('Preset', 'Tectonic Survey', ['Tectonic Survey', 'Quiet Drift', 'Broken Coast', 'Stress Field', 'Custom'], 'Named geological fracture studies'),
      ParameterDefinition.integer('Contour Lines', 34, 10, 80, 'Number of contour lines crossing the page'),
      ParameterDefinition.integer('Fault Count', 4, 1, 8, 'Number of tectonic fracture paths'),
      ParameterDefinition.doubleVal('Fault Strength', 42, 0, 120, 'How far contours shear across each fracture'),
      ParameterDefinition.doubleVal('Erosion', 55, 0, 100, 'How much contours jitter and break near fractures'),
      ParameterDefinition.doubleVal('Stress Ticks', 65, 0, 100, 'Density of perpendicular stress marks along faults'),
      ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
      ParameterDefinition.doubleVal('Stroke Width', 0.7, 0.1, 3.0, 'Preview stroke width'),
      ParameterDefinition.integer('Seed', 811, 1, 99999, 'Deterministic random seed'),
    ];
  }

  onParameterChanged(paramName, value, current) {
    if (paramName === 'Preset') {
      const presets = {
        'Tectonic Survey': { 'Contour Lines': 34, 'Fault Count': 4, 'Fault Strength': 42, Erosion: 55, 'Stress Ticks': 65, Colors: 3, Seed: 811 },
        'Quiet Drift': { 'Contour Lines': 26, 'Fault Count': 2, 'Fault Strength': 24, Erosion: 20, 'Stress Ticks': 20, Colors: 2, Seed: 119 },
        'Broken Coast': { 'Contour Lines': 46, 'Fault Count': 5, 'Fault Strength': 72, Erosion: 75, 'Stress Ticks': 48, Colors: 3, Seed: 2317 },
        'Stress Field': { 'Contour Lines': 30, 'Fault Count': 6, 'Fault Strength': 58, Erosion: 42, 'Stress Ticks': 95, Colors: 3, Seed: 503 },
      };
      if (presets[value]) { Object.assign(current, presets[value]); return true; }
    }
    if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; }
    return false;
  }

  generate(params) {
    const canvas = makeCanvas(params, 3);
    marker(canvas, 0, 'layer_1_contours');
    marker(canvas, 1 % canvas.layers.length, 'layer_2_faults');
    marker(canvas, 2 % canvas.layers.length, 'layer_3_stress');
    const rng = rngFrom(params);
    const width = canvas.width, height = canvas.height;
    const box = fitBox(width, height, 0.07);
    const faultCount = clamp(intParam(params, 'Fault Count', 4), 1, 8);
    const strength = numberParam(params, 'Fault Strength', 42);
    const erosion = numberParam(params, 'Erosion', 55) / 100;
    const contours = clamp(intParam(params, 'Contour Lines', 34), 10, 80);
    const ticks = numberParam(params, 'Stress Ticks', 65) / 100;
    const seed = intParam(params, 'Seed', 811);

    const faults = [];
    for (let f = 0; f < faultCount; f++) {
      const angle = -Math.PI * 0.22 + (f / Math.max(1, faultCount - 1)) * Math.PI * 0.44 + (rng.nextDouble() - 0.5) * 0.35;
      const cx = box.left + rng.nextDouble() * box.width;
      const cy = box.top + rng.nextDouble() * box.height;
      const len = Math.max(width, height) * 1.15;
      faults.push({ ax: cx - Math.cos(angle) * len, ay: cy - Math.sin(angle) * len, bx: cx + Math.cos(angle) * len, by: cy + Math.sin(angle) * len, phase: rng.nextDouble() * 9 });
    }

    for (let i = 0; i < contours; i++) {
      const baseY = box.top + (i + 0.5) * box.height / contours;
      const points = [];
      const steps = 130;
      for (let s = 0; s <= steps; s++) {
        let x = box.left + (s / steps) * box.width;
        let y = baseY + (fbm(s * 0.045, i * 0.15, seed, 4) - 0.5) * box.height * 0.11;
        for (const fault of faults) {
          const d = signedDistanceToSegment(x, y, fault.ax, fault.ay, fault.bx, fault.by);
          const influence = Math.exp(-Math.pow(d.distance / (box.width * 0.075), 2));
          const shear = d.side * influence * strength * Math.sin((i * 0.33) + fault.phase);
          x += d.nx * shear;
          y += d.ny * shear * 0.5;
          if (d.distance < 9 + erosion * 22 && fbm(s * 0.23, i * 0.31, seed + 99, 2) < erosion * 0.38) {
            points.push(null);
          }
        }
        points.push({ x: clamp(x, 0, width), y: clamp(y, 0, height) });
      }
      let segment = [];
      for (const p of points) {
        if (p) segment.push(p); else { addPolyline(canvas, i % canvas.layers.length, segment); segment = []; }
      }
      addPolyline(canvas, i % canvas.layers.length, segment);
    }

    faults.forEach((fault, index) => {
      const faultLayer = 1 % canvas.layers.length;
      addPolyline(canvas, faultLayer, [{ x: fault.ax, y: fault.ay }, { x: fault.bx, y: fault.by }], "stroke-width='1.55'");
      const count = Math.floor(12 + ticks * 32);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const x = fault.ax + (fault.bx - fault.ax) * t;
        const y = fault.ay + (fault.by - fault.ay) * t;
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
        const wiggle = (fbm(t * 9, index, seed + 17, 2) - 0.5) * 14;
        const len = 5 + 13 * ticks + wiggle;
        canvas.addLine(2 % canvas.layers.length, x - fault.by * 0 + (-Math.sin(Math.atan2(fault.by - fault.ay, fault.bx - fault.ax)) * len), y + Math.cos(Math.atan2(fault.by - fault.ay, fault.bx - fault.ax)) * len, x + Math.sin(Math.atan2(fault.by - fault.ay, fault.bx - fault.ax)) * len, y - Math.cos(Math.atan2(fault.by - fault.ay, fault.bx - fault.ax)) * len);
      }
    });
    return canvas.toSvg();
  }
}
