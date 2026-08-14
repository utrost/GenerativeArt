import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getVisibleParameterDefinitions } from '../core/ParameterVisibility.js';
import { PlayfulStrategiesGenerator } from './PlayfulStrategiesGenerator.js';
import { generatorRegistry } from './generatorRegistry.js';

function buildParams(generator, overrides = {}) {
  const params = { width: 360, height: 260, paperSize: 'A4 Landscape' };
  for (const definition of generator.getParameterDefinitions()) {
    params[definition.name] = definition.defaultValue;
  }
  return { ...params, ...overrides };
}

function visibleNames(generator, overrides = {}) {
  const params = buildParams(generator, overrides);
  return getVisibleParameterDefinitions(generator.getParameterDefinitions(), params).map((definition) => definition.name);
}

describe('Playful Strategies generator', () => {
  it('registers as one generator with three selectable plotter strategies', () => {
    const entry = generatorRegistry.find((candidate) => candidate.id === 'playful-strategies');
    expect(entry).toBeTruthy();
    expect(entry.name).toBe('Playful Strategies');
    expect(entry.tags).toContain('strategy');

    const generator = new PlayfulStrategiesGenerator();
    const strategy = generator.getParameterDefinitions().find((definition) => definition.name === 'Strategy');
    expect(strategy.options).toEqual(['Kelp Forest', 'Orbit Weave', 'Signal Weather']);
  });

  it('shows only the controls for the selected strategy plus shared controls', () => {
    const generator = new PlayfulStrategiesGenerator();

    const kelp = visibleNames(generator, { Strategy: 'Kelp Forest' });
    expect(kelp).toContain('Frond Count');
    expect(kelp).toContain('Current Wiggle');
    expect(kelp).not.toContain('Orbit Count');
    expect(kelp).not.toContain('Cloud Bands');

    const orbit = visibleNames(generator, { Strategy: 'Orbit Weave' });
    expect(orbit).toContain('Orbit Count');
    expect(orbit).toContain('Weave Twist');
    expect(orbit).not.toContain('Frond Count');
    expect(orbit).not.toContain('Cloud Bands');

    const weather = visibleNames(generator, { Strategy: 'Signal Weather' });
    expect(weather).toContain('Cloud Bands');
    expect(weather).toContain('Rain Glyphs');
    expect(weather).not.toContain('Frond Count');
    expect(weather).not.toContain('Orbit Count');

    for (const names of [kelp, orbit, weather]) {
      expect(names).toContain('Strategy');
      expect(names).toContain('Colors');
      expect(names).toContain('Stroke Width');
      expect(names).toContain('Seed');
    }
  });

  it('generates deterministic named-layer SVG for each strategy', () => {
    const generator = new PlayfulStrategiesGenerator();
    const expectedMarkers = {
      'Kelp Forest': ['layer_1_stems', 'layer_2_fronds', 'layer_3_bubbles'],
      'Orbit Weave': ['layer_1_orbits', 'layer_2_weave_links', 'layer_3_ticks'],
      'Signal Weather': ['layer_1_cloud_bands', 'layer_2_signal_rain', 'layer_3_pressure_marks'],
    };

    for (const [strategy, markers] of Object.entries(expectedMarkers)) {
      const params = buildParams(generator, { Strategy: strategy });
      const first = generator.generate(params);
      const second = generator.generate(params);
      expect(first).toBe(second);
      expect(first).toContain('<svg');
      for (const marker of markers) expect(first).toContain(marker);
      expect((first.match(/<path|<line|<circle/g) || []).length).toBeGreaterThan(30);
    }
  });

  it('has help documentation for the strategy selector and all three strategies', () => {
    const docPath = resolve(__dirname, '../docs/Readme_PlayfulStrategiesGenerator.md');
    expect(existsSync(docPath)).toBe(true);
    const content = readFileSync(docPath, 'utf8');
    expect(content).toContain('# Playful Strategies');
    expect(content).toContain('Kelp Forest');
    expect(content).toContain('Orbit Weave');
    expect(content).toContain('Signal Weather');
    expect(content).toContain('## Parameters');
    expect(content).toContain('## Plotter notes');
  });
});
