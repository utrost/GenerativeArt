import { describe, expect, it } from 'vitest';

import { WaveInterferenceGenerator } from './WaveInterferenceGenerator.js';
import { buildSvgDiagnosticsViewModel } from '../core/SvgDiagnostics.js';

function defaultParams(generator) {
  const params = { width: 1000, height: 1000, paperSize: 'Screen' };
  for (const definition of generator.getParameterDefinitions()) params[definition.name] = definition.defaultValue;
  return params;
}

describe('Wave Interference performance', () => {
  it('renders the default preset fast enough for interactive browser use', () => {
    const generator = new WaveInterferenceGenerator();
    const params = defaultParams(generator);

    const start = performance.now();
    const svg = generator.generate(params);
    const generateMs = performance.now() - start;

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect((svg.match(/<path/g) || []).length).toBeGreaterThan(50);
    expect(generateMs).toBeLessThan(2500);
  }, 10000);

  it('keeps diagnostics bounded for the generated wave SVG', () => {
    const generator = new WaveInterferenceGenerator();
    const svg = generator.generate(defaultParams(generator));

    const start = performance.now();
    const diagnostics = buildSvgDiagnosticsViewModel(svg);
    const diagnosticsMs = performance.now() - start;

    expect(diagnostics.status).not.toBe('error');
    expect(diagnosticsMs).toBeLessThan(750);
  }, 10000);
});
