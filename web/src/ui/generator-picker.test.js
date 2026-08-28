import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const readText = (path) => readFileSync(resolve(root, path), 'utf8');

describe('generator picker UI contracts', () => {
  it('desktop web UI exposes search, category, favorites, recent, and random picker hooks', () => {
    const html = readText('index.html');
    const css = readText('src/ui/style.css');

    expect(html).toContain('id="generator-search"');
    expect(html).toContain('id="generator-category-filters"');
    expect(html).toContain('id="generator-recent"');
    expect(html).toContain('id="generator-favorites"');
    expect(html).toContain('id="btn-random-generator"');
    expect(css).toContain('.generator-card');
    expect(css).toContain('.category-chip');
  });

  it('mobile app uses a generator picker sheet instead of a long native select', () => {
    const html = readText('mobile.html');
    const css = readText('src/ui/mobile.css');

    expect(html).toContain('id="btn-mobile-generator-picker"');
    expect(html).toContain('id="mobile-generator-sheet"');
    expect(html).toContain('id="mobile-generator-search"');
    expect(html).toContain('id="mobile-generator-category-filters"');
    expect(html).toContain('id="mobile-generator-list"');
    expect(css).toContain('.generator-sheet');
    expect(css).toContain('.mobile-generator-card');
  });

  it('mobile parameter changes are coalesced before regenerating art', () => {
    const js = readText('src/mobile.js');

    expect(js).toContain('MOBILE_GENERATION_DELAY_MS');
    expect(js).toContain('function scheduleGenerateArt');
    expect(js).toContain('clearTimeout(pendingGenerateTimer)');
    expect(js).toContain('requestAnimationFrame');
    expect(js).toContain('scheduleGenerateArt();');
  });

  it('selecting a generator defers SVG work until Generate is pressed', () => {
    const desktop = readText('src/main.js');
    const mobile = readText('src/mobile.js');

    expect(desktop).toContain('let hasGeneratedCurrentSelection = false');
    expect(desktop).toContain('function markGeneratorReady');
    expect(desktop.match(/function selectGenerator\(gen\) \{[\s\S]*?\n\}/)?.[0]).toContain('markGeneratorReady');
    expect(desktop.match(/function selectGenerator\(gen\) \{[\s\S]*?\n\}/)?.[0]).not.toContain('generateArt();');

    expect(mobile).toContain('let hasGeneratedCurrentSelection = false');
    expect(mobile).toContain('function markGeneratorReady');
    expect(mobile.match(/function selectGenerator\(generator\) \{[\s\S]*?\n\}/)?.[0]).toContain('markGeneratorReady');
    expect(mobile.match(/function selectGenerator\(generator\) \{[\s\S]*?\n\}/)?.[0]).not.toContain('generateArt();');
  });

  it('README documents generator library browsing controls', () => {
    const readme = readText('../README.md');
    expect(readme).toContain('Generator library');
    expect(readme).toContain('Search');
    expect(readme).toContain('Favorites');
    expect(readme).toContain('Recent');
  });
});
