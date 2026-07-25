import { describe, expect, it } from 'vitest';

import { FoldedCrystalGenerator } from './FoldedCrystalGenerator.js';

function paramsFor(generator, overrides = {}) {
  const params = { width: 360, height: 520 };
  for (const definition of generator.getParameterDefinitions()) {
    params[definition.name] = definition.defaultValue;
  }
  return { ...params, ...overrides };
}

function layerPathCount(svg, layerId) {
  const match = svg.match(new RegExp(`<g id='${layerId}'[\\s\\S]*?<\\/g>`));
  return match ? (match[0].match(/<path /g) || []).length : 0;
}

describe('FoldedCrystalGenerator', () => {
  it('exposes a plotter-friendly faceted hatch generator contract', () => {
    const generator = new FoldedCrystalGenerator();
    const definitions = Object.fromEntries(generator.getParameterDefinitions().map((definition) => [definition.name, definition]));

    expect(generator.getId()).toBe('folded-crystal');
    expect(generator.getDisplayName()).toBe('Folded Crystal');
    expect(definitions['Split Count'].description).toContain('facets');
    expect(definitions['Color Mode'].options).toEqual(['Single pen', 'Magenta/Violet', 'Three layer']);
    expect(definitions['Outline Mode'].options).toEqual(['All shared edges', 'Outer only', 'None']);
  });

  it('generates clipped hatch paths and separate outline paths', () => {
    const generator = new FoldedCrystalGenerator();
    const svg = generator.generate(paramsFor(generator, {
      'Split Count': 24,
      'Color Mode': 'Single pen',
      'Outline Mode': 'All shared edges',
      'Seed': 123,
    }));

    expect(svg).toContain('<svg');
    expect((svg.match(/<path /g) || []).length).toBeGreaterThan(120);
    expect(layerPathCount(svg, 'layer_1')).toBeGreaterThan(80);
    expect(layerPathCount(svg, 'layer_2')).toBeGreaterThan(10);
    expect(svg).not.toContain('fill-opacity');
    expect(svg).not.toContain('<polygon');
  });

  it('uses multiple physical pen layers without fake opacity in color modes', () => {
    const generator = new FoldedCrystalGenerator();
    const svg = generator.generate(paramsFor(generator, {
      'Split Count': 18,
      'Color Mode': 'Three layer',
      'Outline Mode': 'All shared edges',
      'Seed': 77,
    }));

    expect(layerPathCount(svg, 'layer_1')).toBeGreaterThan(0);
    expect(layerPathCount(svg, 'layer_2')).toBeGreaterThan(0);
    expect(layerPathCount(svg, 'layer_3')).toBeGreaterThan(0);
    expect(layerPathCount(svg, 'layer_4')).toBeGreaterThan(0);
    expect(svg).not.toContain('opacity');
  });

  it('adds explicit 3D shading controls and weighted shadow/highlight passes', () => {
    const generator = new FoldedCrystalGenerator();
    const definitions = Object.fromEntries(generator.getParameterDefinitions().map((definition) => [definition.name, definition]));

    expect(definitions['Shade Bands'].description).toContain('plastic');
    expect(definitions['Shadow Crosshatch'].description).toContain('darkest facets');
    expect(definitions['Highlight Dropout'].description).toContain('lightest facets');

    const svg = generator.generate(paramsFor(generator, {
      'Split Count': 34,
      'Color Mode': 'Three layer',
      'Shade Bands': 6,
      'Shadow Crosshatch': 0.9,
      'Highlight Dropout': 0.4,
      'Seed': 321,
    }));

    expect(svg).toContain('data-shade-band=');
    expect(svg).toContain('data-shadow-pass=');
    expect(svg).toContain('data-highlight-pass=');
    expect(layerPathCount(svg, 'layer_3')).toBeGreaterThan(layerPathCount(svg, 'layer_1') * 0.25);
  });

  it('is deterministic for the same seed', () => {
    const generator = new FoldedCrystalGenerator();
    const params = paramsFor(generator, { 'Seed': 999, 'Split Count': 16 });

    expect(generator.generate(params)).toBe(generator.generate(params));
  });
});
