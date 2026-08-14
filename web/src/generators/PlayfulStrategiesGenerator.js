import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addCircle, addPolyline, clamp, fitBox, fbm, intParam, makeCanvas, marker, numberParam, randRange, rngFrom } from './PlotterGeneratorUtils';

function onlyFor(definition, strategy) {
  definition.visibleWhen = { param: 'Strategy', value: strategy };
  return definition;
}

export class PlayfulStrategiesGenerator extends Generator {
  getId() { return 'playful-strategies'; }
  getDisplayName() { return 'Playful Strategies'; }

  getParameterDefinitions() { return [
    ParameterDefinition.selection('Strategy', 'Kelp Forest', ['Kelp Forest', 'Orbit Weave', 'Signal Weather'], 'Choose the playful construction strategy'),
    onlyFor(ParameterDefinition.integer('Frond Count', 46, 8, 140, 'Number of swaying kelp stems'), 'Kelp Forest'),
    onlyFor(ParameterDefinition.doubleVal('Current Wiggle', 56, 0, 120, 'How strongly the imaginary tide bends the stems'), 'Kelp Forest'),
    onlyFor(ParameterDefinition.doubleVal('Bubble Mischief', 42, 0, 100, 'Small plotted bubbles around the forest'), 'Kelp Forest'),
    onlyFor(ParameterDefinition.integer('Orbit Count', 20, 3, 48, 'Number of eccentric orbital paths'), 'Orbit Weave'),
    onlyFor(ParameterDefinition.integer('Satellite Count', 9, 2, 24, 'Anchor points that pull orbit paths into weave knots'), 'Orbit Weave'),
    onlyFor(ParameterDefinition.doubleVal('Weave Twist', 64, 0, 120, 'Phase twist between neighbouring orbits'), 'Orbit Weave'),
    onlyFor(ParameterDefinition.integer('Cloud Bands', 28, 6, 90, 'Wavy pressure-map bands'), 'Signal Weather'),
    onlyFor(ParameterDefinition.integer('Rain Glyphs', 120, 0, 420, 'Short dash glyphs falling from the bands'), 'Signal Weather'),
    onlyFor(ParameterDefinition.doubleVal('Signal Noise', 48, 0, 100, 'Radio-weather jitter in bands and rain'), 'Signal Weather'),
    ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
    ParameterDefinition.doubleVal('Stroke Width', 0.85, 0.1, 2.5, 'SVG preview stroke width'),
    ParameterDefinition.integer('Seed', 2608, 1, 999999, 'Deterministic random seed'),
  ]; }

  onParameterChanged(paramName) { return paramName === 'Strategy'; }

  generate(params) {
    const strategy = params.Strategy || 'Kelp Forest';
    if (strategy === 'Orbit Weave') return this.generateOrbitWeave(params);
    if (strategy === 'Signal Weather') return this.generateSignalWeather(params);
    return this.generateKelpForest(params);
  }

  generateKelpForest(params) {
    const canvas = makeCanvas(params, 3);
    marker(canvas, 0, 'layer_1_stems'); marker(canvas, 1 % canvas.layers.length, 'layer_2_fronds'); marker(canvas, 2 % canvas.layers.length, 'layer_3_bubbles');
    const box = fitBox(canvas.width, canvas.height, 0.08);
    const rng = rngFrom(params, 11);
    const count = clamp(intParam(params, 'Frond Count', 46), 8, 140);
    const wiggle = numberParam(params, 'Current Wiggle', 56) / 100;
    const bubbles = numberParam(params, 'Bubble Mischief', 42) / 100;
    const seed = intParam(params, 'Seed', 2608);

    for (let i = 0; i < count; i++) {
      const baseX = box.left + (i + 0.5) * box.width / count + randRange(rng, -box.width / count * 0.35, box.width / count * 0.35);
      const height = randRange(rng, box.height * 0.38, box.height * 0.96);
      const phase = randRange(rng, 0, Math.PI * 2);
      const pts = [];
      const steps = 24;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const y = box.bottom - t * height;
        const sway = Math.sin(t * Math.PI * 2.4 + phase) * wiggle * 18 * (0.2 + t);
        const drift = (fbm(i * 0.08, t * 3.2, seed, 3) - 0.5) * wiggle * 26 * t;
        pts.push({ x: baseX + sway + drift, y });
      }
      addPolyline(canvas, 0, pts);
      for (let l = 4; l < steps; l += 4) {
        const p = pts[l];
        const side = (l + i) % 2 ? 1 : -1;
        const leaf = [];
        for (let k = 0; k <= 8; k++) {
          const u = k / 8;
          leaf.push({ x: p.x + side * Math.sin(u * Math.PI) * randRange(rng, 8, 22), y: p.y - u * randRange(rng, 18, 42) });
        }
        addPolyline(canvas, 1 % canvas.layers.length, leaf);
      }
      if (bubbles > 0.05 && i % 2 === 0) {
        for (let b = 0; b < Math.ceil(bubbles * 3); b++) {
          addCircle(canvas, 2 % canvas.layers.length, baseX + randRange(rng, -30, 30), box.bottom - randRange(rng, 10, height), randRange(rng, 1.4, 4.5) * bubbles);
        }
      }
    }
    return canvas.toSvg();
  }

  generateOrbitWeave(params) {
    const canvas = makeCanvas(params, 3);
    marker(canvas, 0, 'layer_1_orbits'); marker(canvas, 1 % canvas.layers.length, 'layer_2_weave_links'); marker(canvas, 2 % canvas.layers.length, 'layer_3_ticks');
    const box = fitBox(canvas.width, canvas.height, 0.10);
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const rng = rngFrom(params, 23);
    const orbitCount = clamp(intParam(params, 'Orbit Count', 16), 3, 48);
    const satellites = clamp(intParam(params, 'Satellite Count', 9), 2, 24);
    const twist = numberParam(params, 'Weave Twist', 64) / 100;
    const anchors = [];

    for (let i = 0; i < satellites; i++) {
      const a = i * Math.PI * 2 / satellites + randRange(rng, -0.16, 0.16);
      anchors.push({ x: cx + Math.cos(a) * box.width * randRange(rng, 0.16, 0.46), y: cy + Math.sin(a) * box.height * randRange(rng, 0.16, 0.46) });
      addCircle(canvas, 2 % canvas.layers.length, anchors[i].x, anchors[i].y, randRange(rng, 2.5, 6));
    }

    for (let i = 0; i < orbitCount; i++) {
      const pts = [];
      const radius = Math.min(box.width, box.height) * (0.10 + 0.39 * (i + 1) / orbitCount);
      const phase = i * twist * 0.73;
      for (let s = 0; s <= 160; s++) {
        const t = s / 160;
        const a = t * Math.PI * 2 + phase;
        let x = cx + Math.cos(a) * radius * (1.15 + Math.sin(a * 3 + phase) * 0.12);
        let y = cy + Math.sin(a) * radius * (0.72 + Math.cos(a * 2 - phase) * 0.18);
        for (const anchor of anchors) {
          const dx = anchor.x - x;
          const dy = anchor.y - y;
          const d2 = dx * dx + dy * dy;
          const pull = Math.min(0.08, 290 / (d2 + 6000)) * twist;
          x += dx * pull;
          y += dy * pull;
        }
        pts.push({ x, y });
      }
      addPolyline(canvas, i % canvas.layers.length, pts);
      if (i > 0 && i % 3 === 0) {
        const a = phase;
        canvas.addLine(1 % canvas.layers.length, cx + Math.cos(a) * radius * 0.45, cy + Math.sin(a) * radius * 0.45, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * 0.72);
      }
    }
    return canvas.toSvg();
  }

  generateSignalWeather(params) {
    const canvas = makeCanvas(params, 3);
    marker(canvas, 0, 'layer_1_cloud_bands'); marker(canvas, 1 % canvas.layers.length, 'layer_2_signal_rain'); marker(canvas, 2 % canvas.layers.length, 'layer_3_pressure_marks');
    const box = fitBox(canvas.width, canvas.height, 0.08);
    const rng = rngFrom(params, 37);
    const bands = clamp(intParam(params, 'Cloud Bands', 28), 6, 90);
    const rain = clamp(intParam(params, 'Rain Glyphs', 120), 0, 420);
    const noise = numberParam(params, 'Signal Noise', 48) / 100;
    const seed = intParam(params, 'Seed', 2608);

    for (let i = 0; i < bands; i++) {
      const y0 = box.top + (i + 0.5) * box.height / bands;
      const pts = [];
      for (let s = 0; s <= 80; s++) {
        const t = s / 80;
        const x = box.left + t * box.width;
        const y = y0 + (fbm(t * 5, i * 0.17, seed, 4) - 0.5) * 42 * noise + Math.sin(t * Math.PI * 2 + i * 0.55) * 7;
        pts.push({ x, y });
      }
      addPolyline(canvas, 0, pts, i % 5 === 0 ? "stroke-dasharray='4 5'" : '');
    }
    for (let i = 0; i < rain; i++) {
      const x = box.left + rng.nextDouble() * box.width;
      const y = box.top + rng.nextDouble() * box.height;
      const len = randRange(rng, 5, 24) * (0.5 + noise);
      const slant = randRange(rng, -6, 8) * noise;
      canvas.addLine(1 % canvas.layers.length, x, y, x + slant, y + len);
      if (i % 9 === 0) addCircle(canvas, 2 % canvas.layers.length, x + slant, y + len, randRange(rng, 1, 3));
    }
    for (let i = 0; i < Math.max(12, bands / 2); i++) {
      const x = box.left + rng.nextDouble() * box.width;
      const y = box.top + rng.nextDouble() * box.height;
      canvas.addLine(2 % canvas.layers.length, x - 5, y, x + 5, y);
      canvas.addLine(2 % canvas.layers.length, x, y - 5, x, y + 5);
    }
    return canvas.toSvg();
  }
}
