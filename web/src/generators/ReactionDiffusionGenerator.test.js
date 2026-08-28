import { describe, expect, it } from 'vitest';

import { ReactionDiffusionGenerator } from './ReactionDiffusionGenerator.js';

function defaultParams(generator) {
  const params = { width: 1000, height: 1000, paperSize: 'Screen' };
  for (const definition of generator.getParameterDefinitions()) params[definition.name] = definition.defaultValue;
  return params;
}

describe('Reaction Diffusion performance', () => {
  it('uses an interactive default iteration budget', () => {
    const generator = new ReactionDiffusionGenerator();
    const params = defaultParams(generator);
    expect(params.Iterations).toBeLessThanOrEqual(2500);

    const start = performance.now();
    const svg = generator.generate(params);
    const elapsedMs = performance.now() - start;

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(elapsedMs).toBeLessThan(3000);
  }, 10000);
});
