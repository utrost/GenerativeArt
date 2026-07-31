import { SvgCanvas } from '../core/SvgCanvas';
import { SeededRandom } from '../utils/SeededRandom';

export function numberParam(params, name, fallback) {
  const value = Number(params?.[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function intParam(params, name, fallback) {
  return Math.floor(numberParam(params, name, fallback));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function makeCanvas(params, defaultLayers = 3) {
  const colors = clamp(intParam(params, 'Colors', defaultLayers), 1, 6);
  const canvas = new SvgCanvas(numberParam(params, 'width', 1000), numberParam(params, 'height', 1000), colors);
  canvas.setStrokeWidth(numberParam(params, 'Stroke Width', 0.75));
  return canvas;
}

export function marker(canvas, layer, name) {
  canvas.addRaw(layer, `<!-- ${name} -->`);
}

export function pathFromPoints(points, close = false) {
  if (!points || points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  if (close) d += ' Z';
  return d;
}

export function addPolyline(canvas, layer, points, attrs = '') {
  if (!points || points.length < 2) return;
  canvas.addRaw(layer, `<path d='${pathFromPoints(points)}' ${attrs}/>`);
}

export function addPolygon(canvas, layer, points, attrs = '') {
  if (!points || points.length < 3) return;
  canvas.addRaw(layer, `<path d='${pathFromPoints(points, true)}' ${attrs}/>`);
}

export function addCircle(canvas, layer, x, y, r, attrs = '') {
  canvas.addRaw(layer, `<circle cx='${x.toFixed(2)}' cy='${y.toFixed(2)}' r='${r.toFixed(2)}' ${attrs}/>`);
}

export function addRect(canvas, layer, x, y, w, h, attrs = '') {
  canvas.addRaw(layer, `<rect x='${x.toFixed(2)}' y='${y.toFixed(2)}' width='${w.toFixed(2)}' height='${h.toFixed(2)}' ${attrs}/>`);
}

export function rngFrom(params, offset = 0) {
  return new SeededRandom(intParam(params, 'Seed', 42) + offset);
}

export function randRange(rng, min, max) {
  return min + rng.nextDouble() * (max - min);
}

export function signedDistanceToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const lenSq = vx * vx + vy * vy || 1;
  const t = clamp((wx * vx + wy * vy) / lenSq, 0, 1);
  const qx = ax + vx * t;
  const qy = ay + vy * t;
  const dx = px - qx;
  const dy = py - qy;
  const side = Math.sign(vx * (py - ay) - vy * (px - ax)) || 1;
  return { distance: Math.sqrt(dx * dx + dy * dy), side, t, qx, qy, nx: -vy / Math.sqrt(lenSq), ny: vx / Math.sqrt(lenSq) };
}

export function fieldNoise(x, y, seed = 0) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return v - Math.floor(v);
}

export function smoothNoise(x, y, seed = 0) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const tx = x - x0, ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = fieldNoise(x0, y0, seed);
  const b = fieldNoise(x0 + 1, y0, seed);
  const c = fieldNoise(x0, y0 + 1, seed);
  const d = fieldNoise(x0 + 1, y0 + 1, seed);
  const ab = a + (b - a) * sx;
  const cd = c + (d - c) * sx;
  return ab + (cd - ab) * sy;
}

export function fbm(x, y, seed = 0, octaves = 4) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * freq, y * freq, seed + i * 17) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / total;
}

export function fitBox(width, height, marginFraction = 0.08) {
  const margin = Math.min(width, height) * marginFraction;
  return { left: margin, top: margin, right: width - margin, bottom: height - margin, width: width - 2 * margin, height: height - 2 * margin, margin };
}
