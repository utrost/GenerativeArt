import { Generator } from '../core/Generator';
import { ParameterDefinition } from '../core/ParameterDefinition';
import { addPolyline, clamp, fitBox, intParam, makeCanvas, marker, numberParam, randRange, rngFrom } from './PlotterGeneratorUtils';

const TAU = Math.PI * 2;

export class BotanicalGestureGenerator extends Generator {
  getId() { return 'botanical-gesture'; }
  getDisplayName() { return 'Botanical Gesture'; }

  getParameterDefinitions() {
    return [
      ParameterDefinition.selection('Preset', 'Wild Rose', ['Wild Rose', 'Cropped Bouquet', 'Winter Tree', 'Meadow Sketch', 'Custom'], 'Loose botanical drawing preset'),
      ParameterDefinition.integer('Plant Count', 3, 1, 9, 'Number of stems, flowers, or tree structures'),
      ParameterDefinition.integer('Flower Heads', 4, 0, 18, 'Rose-like clustered blossom heads'),
      ParameterDefinition.integer('Leaf Density', 7, 0, 12, 'How many leaves grow along stems'),
      ParameterDefinition.doubleVal('Gesture Looseness', 72, 0, 100, 'How far repeated strokes drift from the ideal contour'),
      ParameterDefinition.integer('Stroke Passes', 3, 1, 5, 'Repeated nearby strokes per important contour'),
      ParameterDefinition.doubleVal('Shadow Density', 48, 0, 100, 'Amount of hatch and inner fold marks'),
      ParameterDefinition.doubleVal('Crop Amount', 18, 0, 40, 'How much the composition is allowed to leave the page'),
      ParameterDefinition.integer('Colors', 3, 1, 6, 'Plotter color layers'),
      ParameterDefinition.doubleVal('Stroke Width', 0.65, 0.1, 3.0, 'Preview stroke width'),
      ParameterDefinition.integer('Seed', 1887, 1, 99999, 'Deterministic random seed'),
    ];
  }

  onParameterChanged(paramName, value, current) {
    const presets = {
      'Wild Rose': { 'Plant Count': 3, 'Flower Heads': 5, 'Leaf Density': 8, 'Gesture Looseness': 76, 'Stroke Passes': 3, 'Shadow Density': 54, 'Crop Amount': 18, Colors: 3, Seed: 1887 },
      'Cropped Bouquet': { 'Plant Count': 6, 'Flower Heads': 9, 'Leaf Density': 9, 'Gesture Looseness': 82, 'Stroke Passes': 4, 'Shadow Density': 60, 'Crop Amount': 32, Colors: 3, Seed: 2406 },
      'Winter Tree': { 'Plant Count': 2, 'Flower Heads': 0, 'Leaf Density': 1, 'Gesture Looseness': 62, 'Stroke Passes': 3, 'Shadow Density': 40, 'Crop Amount': 12, Colors: 3, Seed: 1975 },
      'Meadow Sketch': { 'Plant Count': 8, 'Flower Heads': 12, 'Leaf Density': 5, 'Gesture Looseness': 88, 'Stroke Passes': 2, 'Shadow Density': 36, 'Crop Amount': 26, Colors: 3, Seed: 511 },
    };
    if (paramName === 'Preset' && presets[value]) { Object.assign(current, presets[value]); return true; }
    if (paramName !== 'Preset' && current.Preset !== 'Custom') { current.Preset = 'Custom'; return true; }
    return false;
  }

  generate(params) {
    const canvas = makeCanvas(params, 3);
    marker(canvas, 0, 'layer_1_structure');
    marker(canvas, 1 % canvas.layers.length, 'layer_2_shadow_hatching');
    marker(canvas, 2 % canvas.layers.length, 'layer_3_loose_gesture');

    const rng = rngFrom(params);
    const width = canvas.width;
    const height = canvas.height;
    const box = fitBox(width, height, 0.08);
    const preset = params.Preset || 'Wild Rose';
    const plantCount = clamp(intParam(params, 'Plant Count', 3), 1, 9);
    const flowerHeads = clamp(intParam(params, 'Flower Heads', 4), 0, 18);
    const leafDensity = clamp(intParam(params, 'Leaf Density', 7), 0, 12);
    const looseness = numberParam(params, 'Gesture Looseness', 72) / 100;
    const passes = clamp(intParam(params, 'Stroke Passes', 3), 1, 5);
    const shadow = numberParam(params, 'Shadow Density', 48) / 100;
    const crop = numberParam(params, 'Crop Amount', 18) / 100;

    if (preset === 'Winter Tree') {
      drawWinterTrees(canvas, rng, box, plantCount, looseness, passes, shadow, crop);
    } else {
      drawBotanicalStems(canvas, rng, box, plantCount, flowerHeads, leafDensity, looseness, passes, shadow, crop, preset);
    }

    return canvas.toSvg();
  }
}

function drawBotanicalStems(canvas, rng, box, plantCount, flowerHeads, leafDensity, looseness, passes, shadow, crop, preset) {
  const centers = [];
  const spread = box.width * (0.58 + crop * 0.5);
  const startX = box.left + box.width * 0.5 - spread * 0.5;
  for (let i = 0; i < plantCount; i++) {
    const t = plantCount === 1 ? 0.5 : i / (plantCount - 1);
    const root = {
      x: startX + spread * t + randRange(rng, -box.width * 0.08, box.width * 0.08),
      y: box.bottom + randRange(rng, -box.height * 0.04, box.height * crop * 0.38),
    };
    const top = {
      x: root.x + randRange(rng, -box.width * 0.18, box.width * 0.18),
      y: box.top + box.height * randRange(rng, preset === 'Meadow Sketch' ? 0.10 : -crop * 0.25, 0.54),
    };
    const c1 = { x: root.x + randRange(rng, -box.width * 0.09, box.width * 0.09), y: root.y - box.height * randRange(rng, 0.20, 0.38) };
    const c2 = { x: top.x + randRange(rng, -box.width * 0.12, box.width * 0.12), y: top.y + box.height * randRange(rng, 0.10, 0.28) };
    const stem = sampleCubic(root, c1, c2, top, 28);
    drawRepeatedCurve(canvas, 0, stem, passes, looseness, rng, 1.8);
    if (rng.nextDouble() < 0.65) drawRepeatedCurve(canvas, 2, partial(stem, 0.08, randRange(rng, 0.42, 0.82)), 1, looseness, rng, 2.2, "stroke-opacity='0.58'");
    centers.push({ point: top, size: Math.min(box.width, box.height) * randRange(rng, 0.050, 0.105), angle: Math.atan2(top.y - root.y, top.x - root.x) });

    const leaves = Math.floor(leafDensity * randRange(rng, 0.45, 1.15));
    for (let j = 0; j < leaves; j++) {
      const t = randRange(rng, 0.18, 0.86);
      const attach = pointAt(stem, t);
      const side = rng.nextDouble() < 0.5 ? -1 : 1;
      const angle = -Math.PI / 2 + side * randRange(rng, 0.65, 1.25) + randRange(rng, -0.22, 0.22);
      const length = Math.min(box.width, box.height) * randRange(rng, 0.045, 0.105) * (preset === 'Meadow Sketch' ? 0.72 : 1);
      drawLeaf(canvas, rng, attach, angle, length, looseness, passes, shadow);
    }

    const sideBranches = preset === 'Cropped Bouquet' ? 3 : 2;
    for (let b = 0; b < sideBranches; b++) {
      if (rng.nextDouble() < 0.35 && preset !== 'Cropped Bouquet') continue;
      const t = randRange(rng, 0.28, 0.78);
      const p = pointAt(stem, t);
      const side = rng.nextDouble() < 0.5 ? -1 : 1;
      const end = { x: p.x + side * box.width * randRange(rng, 0.08, 0.18), y: p.y - box.height * randRange(rng, 0.04, 0.18) };
      const branch = sampleCubic(p, { x: p.x + side * 22, y: p.y - 16 }, { x: end.x - side * 18, y: end.y + 10 }, end, 16);
      drawRepeatedCurve(canvas, 0, branch, Math.max(1, passes - 1), looseness, rng, 1.5, "stroke-opacity='0.82'");
      if (flowerHeads > centers.length && rng.nextDouble() < 0.58) centers.push({ point: end, size: Math.min(box.width, box.height) * randRange(rng, 0.032, 0.070), angle: -Math.PI / 2 });
    }
  }

  while (centers.length < flowerHeads) {
    centers.push({
      point: { x: randRange(rng, box.left - box.width * crop * 0.45, box.right + box.width * crop * 0.45), y: randRange(rng, box.top - box.height * crop * 0.30, box.top + box.height * 0.62) },
      size: Math.min(box.width, box.height) * randRange(rng, 0.038, 0.088),
      angle: randRange(rng, -TAU, TAU),
    });
  }

  centers.slice(0, flowerHeads).forEach((flower, index) => {
    drawRoseHead(canvas, rng, flower.point, flower.size, flower.angle + index * 0.18, looseness, passes, shadow);
  });
}

function drawWinterTrees(canvas, rng, box, plantCount, looseness, passes, shadow, crop) {
  for (let i = 0; i < plantCount; i++) {
    const root = { x: box.left + box.width * ((i + 1) / (plantCount + 1)) + randRange(rng, -box.width * 0.12, box.width * 0.12), y: box.bottom + box.height * crop * 0.18 };
    const height = box.height * randRange(rng, 0.62, 0.92);
    growTree(canvas, rng, root, -Math.PI / 2 + randRange(rng, -0.10, 0.10), height * 0.28, 8, looseness, passes, shadow);
  }
}

function growTree(canvas, rng, start, angle, length, depth, looseness, passes, shadow) {
  if (depth <= 0 || length < 5) return;
  const end = { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
  const c1 = { x: start.x + Math.cos(angle + 0.16) * length * 0.35, y: start.y + Math.sin(angle + 0.16) * length * 0.35 };
  const c2 = { x: end.x - Math.cos(angle - 0.12) * length * 0.20, y: end.y - Math.sin(angle - 0.12) * length * 0.20 };
  const branch = sampleCubic(start, c1, c2, end, 12);
  drawRepeatedCurve(canvas, depth > 5 ? 0 : 2, branch, depth > 5 ? passes : 1, looseness, rng, depth > 5 ? 1.8 : 1.1, depth < 5 ? "stroke-opacity='0.75'" : '');
  if (rng.nextDouble() < shadow && depth > 4) drawHatchAlong(canvas, rng, branch, 1, 3, 0.45, 6, 15);
  const children = depth > 5 ? 3 : 2;
  for (let i = 0; i < children; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const a = angle + side * randRange(rng, 0.33, 0.78) + randRange(rng, -0.16, 0.16);
    growTree(canvas, rng, end, a, length * randRange(rng, 0.58, 0.76), depth - 1, looseness, Math.max(1, passes - 1), shadow);
  }
}

function drawRoseHead(canvas, rng, center, radius, baseAngle, looseness, passes, shadow) {
  const rings = [0.34, 0.58, 0.82, 1.05];
  drawRepeatedCurve(canvas, 0, spiral(center, radius * 0.36, baseAngle, 22), Math.max(1, passes - 1), looseness, rng, 1.0);
  rings.forEach((scale, ringIndex) => {
    const petals = 5 + ringIndex * 2 + Math.floor(randRange(rng, 0, 2));
    for (let i = 0; i < petals; i++) {
      if (rng.nextDouble() < 0.09 * looseness) continue;
      const a = baseAngle + (i / petals) * TAU + randRange(rng, -0.18, 0.18);
      const petal = petalCurve(center, radius * scale, a, randRange(rng, 0.55, 1.08), randRange(rng, -0.35, 0.35));
      drawRepeatedCurve(canvas, 0, petal, ringIndex === 0 ? 1 : Math.min(passes, 2), looseness, rng, 0.35 + ringIndex * 0.12, '');
      if (ringIndex > 1 && rng.nextDouble() < 0.26 + looseness * 0.22) {
        drawRepeatedCurve(canvas, 2, partial(petal, randRange(rng, 0.05, 0.22), randRange(rng, 0.64, 0.94)), 1, looseness, rng, 0.75, "stroke-opacity='0.58'");
      }
      if (rng.nextDouble() < shadow) {
        const inner = petalCurve(center, radius * scale * randRange(rng, 0.64, 0.86), a + randRange(rng, -0.10, 0.10), 0.38, 0.0);
        drawRepeatedCurve(canvas, 1, partial(inner, 0.12, 0.78), 1, looseness, rng, 0.38, "stroke-opacity='0.64'");
      }
    }
  });
}

function drawLeaf(canvas, rng, attach, angle, length, looseness, passes, shadow) {
  const width = length * randRange(rng, 0.28, 0.44);
  const tip = { x: attach.x + Math.cos(angle) * length, y: attach.y + Math.sin(angle) * length };
  const n = { x: -Math.sin(angle), y: Math.cos(angle) };
  const left = sampleCubic(attach, { x: attach.x + Math.cos(angle) * length * 0.28 + n.x * width, y: attach.y + Math.sin(angle) * length * 0.28 + n.y * width }, { x: tip.x - Math.cos(angle) * length * 0.24 + n.x * width * 0.45, y: tip.y - Math.sin(angle) * length * 0.24 + n.y * width * 0.45 }, tip, 10);
  const right = sampleCubic(attach, { x: attach.x + Math.cos(angle) * length * 0.28 - n.x * width, y: attach.y + Math.sin(angle) * length * 0.28 - n.y * width }, { x: tip.x - Math.cos(angle) * length * 0.24 - n.x * width * 0.45, y: tip.y - Math.sin(angle) * length * 0.24 - n.y * width * 0.45 }, tip, 10);
  drawRepeatedCurve(canvas, 0, left, Math.max(1, passes - 1), looseness, rng, 0.8);
  drawRepeatedCurve(canvas, 0, right, Math.max(1, passes - 1), looseness, rng, 0.8);
  drawRepeatedCurve(canvas, 1, [attach, tip], 1, looseness, rng, 0.45, "stroke-opacity='0.72'");
  if (shadow <= 0.02) return;
  const veinCount = Math.floor(3 + shadow * 7);
  for (let i = 1; i <= veinCount; i++) {
    if (rng.nextDouble() > shadow + 0.12) continue;
    const t = i / (veinCount + 1);
    const mid = { x: attach.x + (tip.x - attach.x) * t, y: attach.y + (tip.y - attach.y) * t };
    const side = i % 2 === 0 ? -1 : 1;
    const end = { x: mid.x + n.x * side * width * (1 - t) * randRange(rng, 0.45, 0.9), y: mid.y + n.y * side * width * (1 - t) * randRange(rng, 0.45, 0.9) };
    drawRepeatedCurve(canvas, 1, [mid, end], 1, looseness, rng, 0.25, "stroke-opacity='0.55'");
  }
}

function drawHatchAlong(canvas, rng, curve, layer, step, chance, minLen, maxLen) {
  for (let i = 2; i < curve.length - 2; i += step) {
    if (rng.nextDouble() > chance) continue;
    const p = curve[i];
    const prev = curve[i - 1];
    const next = curve[i + 1];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const h = randRange(rng, minLen, maxLen);
    addPolyline(canvas, layer, [{ x: p.x - nx * h * 0.5, y: p.y - ny * h * 0.5 }, { x: p.x + nx * h * 0.5, y: p.y + ny * h * 0.5 }], "stroke-opacity='0.48'");
  }
}

function drawRepeatedCurve(canvas, layer, pts, passes, looseness, rng, amount = 1, attrs = '') {
  if (!pts || pts.length < 2) return;
  for (let pass = 0; pass < passes; pass++) {
    const drift = pass === 0 ? 0 : amount * looseness * pass;
    const startTrim = pass === 0 ? 0 : Math.floor(randRange(rng, 0, Math.min(pts.length - 2, 3)));
    const endTrim = pass === 0 ? 0 : Math.floor(randRange(rng, 0, Math.min(pts.length - 2, 4)));
    const out = pts.slice(startTrim, pts.length - endTrim).map((p, index) => ({
      x: p.x + randRange(rng, -drift, drift) + Math.sin(index * 1.7 + pass) * drift * 0.28,
      y: p.y + randRange(rng, -drift, drift) + Math.cos(index * 1.3 - pass) * drift * 0.28,
    }));
    if (out.length > 1) addPolyline(canvas, layer, out, attrs);
  }
}

function sampleCubic(p0, p1, p2, p3, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return pts;
}

function pointAt(points, t) {
  const idx = clamp(Math.floor(t * (points.length - 1)), 0, points.length - 1);
  return points[idx];
}

function partial(points, from, to) {
  const a = clamp(Math.floor(from * (points.length - 1)), 0, points.length - 2);
  const b = clamp(Math.ceil(to * (points.length - 1)), a + 1, points.length);
  return points.slice(a, b);
}

function spiral(center, radius, baseAngle, steps) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = baseAngle + t * TAU * 1.85;
    const r = radius * (0.12 + t * 0.95);
    pts.push({ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r * 0.72 });
  }
  return pts;
}

function petalCurve(center, radius, angle, openness, curl) {
  const tangent = angle + Math.PI / 2;
  const start = { x: center.x + Math.cos(angle - 0.36) * radius * 0.25, y: center.y + Math.sin(angle - 0.36) * radius * 0.18 };
  const end = { x: center.x + Math.cos(angle + 0.48 + curl * 0.2) * radius * openness, y: center.y + Math.sin(angle + 0.48 + curl * 0.2) * radius * openness * 0.72 };
  const c1 = { x: center.x + Math.cos(angle) * radius * 0.58 + Math.cos(tangent) * radius * 0.25, y: center.y + Math.sin(angle) * radius * 0.38 + Math.sin(tangent) * radius * 0.18 };
  const c2 = { x: end.x - Math.cos(angle + curl) * radius * 0.25, y: end.y - Math.sin(angle + curl) * radius * 0.22 };
  return sampleCubic(start, c1, c2, end, 12);
}
