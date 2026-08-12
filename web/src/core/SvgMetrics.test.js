import { describe, it, expect } from 'vitest';
import { analyzeSvgMetrics } from './SvgMetrics.js';

const sampleSvg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100' width='200' height='100'>
  <defs><clipPath id='pageClip'><rect width='200' height='100'/></clipPath></defs>
  <rect width='200' height='100' fill='white'/>
  <g id='layer_1' stroke='black' fill='none'>
    <line x1='10' y1='20' x2='40' y2='20' />
    <path d='M 40 20 L 40 60 L 70 60' />
  </g>
  <g id='layer_2' stroke='red' fill='none'>
    <path d='M 80 10 C 90 20 100 20 110 10' />
    <circle cx='120' cy='50' r='8' />
  </g>
</svg>`;

describe('analyzeSvgMetrics', () => {
  it('reads SVG page dimensions from width and height attributes', () => {
    const metrics = analyzeSvgMetrics(sampleSvg);

    expect(metrics.page).toEqual({ width: 200, height: 100 });
  });

  it('falls back to viewBox dimensions when width and height are missing', () => {
    const metrics = analyzeSvgMetrics("<svg viewBox='5 10 300 150'><g id='layer_1'></g></svg>");

    expect(metrics.page).toEqual({ width: 300, height: 150 });
  });

  it('counts layers and drawable elements per layer', () => {
    const metrics = analyzeSvgMetrics(sampleSvg);

    expect(metrics.layers.count).toBe(2);
    expect(metrics.layers.items).toEqual([
      { id: 'layer_1', elementCount: 2 },
      { id: 'layer_2', elementCount: 2 },
    ]);
    expect(metrics.elements.totalDrawable).toBe(4);
  });

  it('counts lines, paths, and unparseable drawable elements', () => {
    const metrics = analyzeSvgMetrics(sampleSvg);

    expect(metrics.elements.lineCount).toBe(1);
    expect(metrics.elements.pathCount).toBe(2);
    expect(metrics.elements.unparseableCount).toBe(2);
  });

  it('estimates drawn length for lines and simple M/L paths', () => {
    const metrics = analyzeSvgMetrics(sampleSvg);

    expect(metrics.length.parseable).toBeCloseTo(100, 5);
  });

  it('returns a bounding box for parseable line and simple path geometry', () => {
    const metrics = analyzeSvgMetrics(sampleSvg);

    expect(metrics.bounds).toEqual({ minX: 10, minY: 20, maxX: 70, maxY: 60, withinPage: true });
  });

  it('marks bounds as exceeding the page when parseable geometry leaves the viewBox', () => {
    const metrics = analyzeSvgMetrics("<svg viewBox='0 0 50 50'><g id='layer_1'><line x1='10' y1='10' x2='60' y2='10' /></g></svg>");

    expect(metrics.bounds.withinPage).toBe(false);
  });

  it('still counts drawable elements in SVGs without layer groups', () => {
    const metrics = analyzeSvgMetrics("<svg viewBox='0 0 100 100'><g transform='translate(5,5)'><path d='M 0 0 L 3 4' /></g></svg>");

    expect(metrics.layers.count).toBe(0);
    expect(metrics.elements.totalDrawable).toBe(1);
    expect(metrics.length.parseable).toBeCloseTo(5, 5);
  });

  it('counts all elements inside a layer that contains nested groups', () => {
    const metrics = analyzeSvgMetrics(`
      <svg viewBox='0 0 100 100'>
        <g id='layer_1'>
          <g transform='translate(5,5)'>
            <path d='M 0 0 L 3 4' />
          </g>
          <line x1='10' y1='10' x2='20' y2='10' />
        </g>
      </svg>
    `);

    expect(metrics.layers.items).toEqual([{ id: 'layer_1', elementCount: 2 }]);
    expect(metrics.elements.totalDrawable).toBe(2);
    expect(metrics.length.parseable).toBeCloseTo(15, 5);
  });

  it('handles relative line commands in simple paths', () => {
    const metrics = analyzeSvgMetrics("<svg viewBox='0 0 100 100'><g id='layer_1'><path d='M 10 10 l 5 0 l 0 5' /></g></svg>");

    expect(metrics.length.parseable).toBeCloseTo(10, 5);
    expect(metrics.bounds).toEqual({ minX: 10, minY: 10, maxX: 15, maxY: 15, withinPage: true });
  });

  it('does not count move commands between simple subpaths as drawn length', () => {
    const metrics = analyzeSvgMetrics("<svg viewBox='0 0 100 100'><g id='layer_1'><path d='M 0 0 L 10 0 M 50 0 L 60 0' /></g></svg>");

    expect(metrics.length.parseable).toBeCloseTo(20, 5);
    expect(metrics.bounds).toEqual({ minX: 0, minY: 0, maxX: 60, maxY: 0, withinPage: true });
  });

  it('reports parser limitations so later UI can label metrics as best-effort', () => {
    const metrics = analyzeSvgMetrics(sampleSvg);

    expect(metrics.limitations).toContain('Transforms are not applied to metrics.');
    expect(metrics.limitations).toContain('Only line elements and simple M/L path commands contribute to length and bounds.');
  });
});
