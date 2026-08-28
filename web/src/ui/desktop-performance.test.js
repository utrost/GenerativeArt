import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('desktop interaction performance wiring', () => {
  it('coalesces noisy control and resize events instead of regenerating on every slider tick', () => {
    const source = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

    expect(source).toContain('let pendingGenerateTimer');
    expect(source).toContain('function scheduleGenerateArt');
    expect(source).toContain('cancelAnimationFrame');
    expect(source).toContain('scheduleGenerateArt();');
    expect(source).toContain('debounce(scheduleGenerateArt, 500)');
  });
});
