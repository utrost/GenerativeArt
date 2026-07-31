import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const readText = (path) => readFileSync(resolve(root, path), 'utf8');

describe('generator picker UI contracts', () => {
  it('desktop app exposes search, category, favorites, recent, and random picker hooks', () => {
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

  it('README documents generator library browsing controls', () => {
    const readme = readText('../README.md');
    expect(readme).toContain('Generator library');
    expect(readme).toContain('Search');
    expect(readme).toContain('Favorites');
    expect(readme).toContain('Recent');
  });
});
