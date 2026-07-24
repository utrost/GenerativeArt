import { describe, expect, it } from 'vitest';

import { CapsuleInterferenceGenerator } from './CapsuleInterferenceGenerator.js';

function paramsFor(generator, overrides = {}) {
  const params = { width: 300, height: 220 };
  for (const definition of generator.getParameterDefinitions()) {
    params[definition.name] = definition.defaultValue;
  }
  return { ...params, ...overrides };
}

describe('CapsuleInterferenceGenerator mode-specific controls', () => {
  it('marks mode-specific controls with labels and applicable construction modes', () => {
    const generator = new CapsuleInterferenceGenerator();
    const definitions = generator.getParameterDefinitions();
    const byName = Object.fromEntries(definitions.map((definition) => [definition.name, definition]));

    expect(byName.lineCount.label).toBe('Line count');
    expect(byName.lineCount.appliesTo).toEqual(['Circle route']);
    expect(byName.contourCount.label).toBe('Contour count');
    expect(byName.contourCount.appliesTo).toEqual(['Capsule stacks']);
    expect(byName.colorMode.label).toBe('Stack color mode');
    expect(byName.colorMode.appliesTo).toEqual(['Capsule stacks']);
    expect(byName.layerPlacement.options).toEqual(['Single pen', 'Interleaved layers', 'Overprint layers', 'Custom phase']);
  });

  it('uses interleaved circle-route layer placement independent of stack color mode', () => {
    const generator = new CapsuleInterferenceGenerator();
    const svg = generator.generate(paramsFor(generator, {
      constructionMode: 'Circle route',
      lineCount: 6,
      spacing: 8,
      colorLayers: 2,
      layerPlacement: 'Interleaved layers',
      colorMode: 'Single pen',
    }));

    expect((svg.match(/<path /g) || []).length).toBe(12);
    expect(svg).toContain(' C ');
  });

  it('keeps single-pen circle routes to one layer', () => {
    const generator = new CapsuleInterferenceGenerator();
    const svg = generator.generate(paramsFor(generator, {
      constructionMode: 'Circle route',
      lineCount: 6,
      colorLayers: 4,
      layerPlacement: 'Single pen',
    }));

    expect((svg.match(/<path /g) || []).length).toBe(6);
  });

  it('uses cubic Bezier rounded corners in capsule-stack mode', () => {
    const generator = new CapsuleInterferenceGenerator();
    const svg = generator.generate(paramsFor(generator, {
      constructionMode: 'Capsule stacks',
      shapeCount: 2,
      contourCount: 4,
      colorMode: 'Single pen',
    }));

    expect(svg).toContain(' C ');
  });
});
