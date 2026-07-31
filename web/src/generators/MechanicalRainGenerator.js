import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addCircle, addPolyline, clamp, fitBox, fbm, intParam, makeCanvas, marker, numberParam, randRange, rngFrom } from './PlotterGeneratorUtils';

export class MechanicalRainGenerator extends Generator {
  getId() { return 'mechanical-rain'; }
  getDisplayName() { return 'Mechanical Rain'; }
  getParameterDefinitions() { return [
    ParameterDefinition.selection('Preset', 'Deflector Plate', ['Deflector Plate', 'Light Drizzle', 'Pin Storm', 'Wind Tunnel', 'Custom'], 'Rain paths through mechanical deflectors'),
    ParameterDefinition.integer('Drop Count', 180, 30, 650, 'Number of falling traces'),
    ParameterDefinition.integer('Deflector Count', 16, 2, 45, 'Mechanical pins and paddles'),
    ParameterDefinition.doubleVal('Gravity', 72, 10, 120, 'Downward persistence'),
    ParameterDefinition.doubleVal('Wind', 18, -80, 80, 'Horizontal drift'),
    ParameterDefinition.doubleVal('Splash Marks', 55, 0, 100, 'Small arcs and ticks after impact'),
    ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
    ParameterDefinition.doubleVal('Stroke Width', 0.6, 0.1, 3, 'Preview stroke width'),
    ParameterDefinition.integer('Seed', 4242, 1, 99999, 'Deterministic random seed'),
  ]; }
  onParameterChanged(paramName, value, current) { const presets = { 'Deflector Plate': { 'Drop Count': 180, 'Deflector Count': 16, Gravity: 72, Wind: 18, 'Splash Marks': 55, Colors: 3, Seed: 4242 }, 'Light Drizzle': { 'Drop Count': 80, 'Deflector Count': 8, Gravity: 84, Wind: -8, 'Splash Marks': 20, Colors: 2, Seed: 123 }, 'Pin Storm': { 'Drop Count': 420, 'Deflector Count': 32, Gravity: 68, Wind: 35, 'Splash Marks': 80, Colors: 4, Seed: 912 }, 'Wind Tunnel': { 'Drop Count': 230, 'Deflector Count': 18, Gravity: 42, Wind: 72, 'Splash Marks': 45, Colors: 3, Seed: 7001 } }; if (paramName === 'Preset' && presets[value]) { Object.assign(current, presets[value]); return true; } if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; } return false; }
  generate(params) {
    const canvas = makeCanvas(params, 3); marker(canvas, 0, 'layer_1_rain_paths'); marker(canvas, 1 % canvas.layers.length, 'layer_2_deflectors'); marker(canvas, 2 % canvas.layers.length, 'layer_3_splashes');
    const rng = rngFrom(params); const width = canvas.width, height = canvas.height; const box = fitBox(width, height, 0.07);
    const drops = clamp(intParam(params, 'Drop Count', 180), 30, 650); const deflectorCount = clamp(intParam(params, 'Deflector Count', 16), 2, 45); const gravity = numberParam(params, 'Gravity', 72) / 100; const wind = numberParam(params, 'Wind', 18) / 100; const splashes = numberParam(params, 'Splash Marks', 55) / 100; const seed = intParam(params, 'Seed', 4242);
    const deflectors = [];
    for (let i = 0; i < deflectorCount; i++) { deflectors.push({ x: box.left + rng.nextDouble() * box.width, y: box.top + rng.nextDouble() * box.height, r: randRange(rng, 12, 36), a: randRange(rng, -1, 1) }); }
    deflectors.forEach((d, i) => { addCircle(canvas, 1 % canvas.layers.length, d.x, d.y, d.r, i % 2 ? "stroke-dasharray='3 4'" : ''); canvas.addLine(1 % canvas.layers.length, d.x - Math.cos(d.a) * d.r, d.y - Math.sin(d.a) * d.r, d.x + Math.cos(d.a) * d.r, d.y + Math.sin(d.a) * d.r); });
    for (let i = 0; i < drops; i++) {
      let x = box.left + rng.nextDouble() * box.width; let y = box.top - rng.nextDouble() * box.height * 0.15; const pts = [{ x, y: Math.max(0, y) }];
      for (let s = 0; s < 46 && y < box.bottom; s++) { let vx = wind * 9 + (fbm(i * 0.07, s * 0.11, seed, 3) - 0.5) * 7; let vy = 6 + gravity * 9; for (const d of deflectors) { const dx = x - d.x, dy = y - d.y, rr = d.r * 1.45; const dist2 = dx * dx + dy * dy; if (dist2 < rr * rr) { const dist = Math.sqrt(dist2) || 1; const force = (1 - dist / rr) * 17; vx += (dx / dist) * force + Math.cos(d.a) * 2.5; vy -= (dy / dist) * force * 0.25; if (splashes > 0.25 && s % 7 === 0) canvas.addLine(2 % canvas.layers.length, x, y, x + randRange(rng, -12, 12) * splashes, y + randRange(rng, -4, 9) * splashes); } } x += vx; y += vy; if (x < box.left || x > box.right) break; pts.push({ x: clamp(x, 0, width), y: clamp(y, 0, height) }); }
      addPolyline(canvas, i % canvas.layers.length, pts);
    }
    return canvas.toSvg();
  }
}
