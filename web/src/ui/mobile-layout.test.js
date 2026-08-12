import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const uiDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(uiDir, '../..');

function read(relativePath) {
  return readFileSync(join(webRoot, relativePath), 'utf8');
}

describe('mobile web app entry point', () => {
  it('ships a separate mobile page with a mobile-specific entry script and stylesheet', () => {
    const html = read('mobile.html');

    expect(html).toMatch(/<div\s+id="mobile-app"\s+class="mobile-studio">/);
    expect(html).toContain('src="/src/mobile.js"');
    expect(html).toContain('href="./src/ui/mobile.css"');
    expect(html).toContain('name="viewport"');
  });

  it('uses a one-column mobile studio layout with canvas-first preview and touch-sized controls', () => {
    const css = read('src/ui/mobile.css');

    expect(css).toMatch(/\.mobile-studio\s*{[^}]*grid-template-rows\s*:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/s);
    expect(css).toMatch(/\.mobile-preview\s*{[^}]*min-height\s*:\s*45dvh/s);
    expect(css).toMatch(/\.bottom-sheet\s*{[^}]*position\s*:\s*fixed/s);
    expect(css).toMatch(/button,\s*select,\s*input\[type="number"\]\s*{[^}]*min-height\s*:\s*44px/s);
  });

  it('provides mobile controls for generator selection and opening the controls sheet', () => {
    const html = read('mobile.html');

    expect(html).toContain('id="btn-mobile-generator-picker"');
    expect(html).toContain('id="mobile-generator-sheet"');
    expect(html).toContain('id="mobile-generator-list"');
  });

  it('surfaces compact plotter diagnostics near mobile export actions', () => {
    const html = read('mobile.html');
    const css = read('src/ui/mobile.css');
    const js = read('src/mobile.js');

    expect(html).toContain('id="mobile-svg-diagnostics"');
    expect(html).toMatch(/<p\s+id="mobile-svg-diagnostics"[^>]*aria-live="polite"/);
    expect(css).toMatch(/\.mobile-svg-diagnostics\s*{[^}]*font-size\s*:\s*0\.72rem/s);
    expect(js).toContain("import { buildSvgDiagnosticsViewModel } from './core/SvgDiagnostics.js';");
    expect(js).toContain('updateSvgDiagnostics(output);');
    expect(js).toContain('updateSvgDiagnostics(null);');
  });

  it('supports polished bottom-sheet interactions for touch devices', () => {
    const css = read('src/ui/mobile.css');
    const js = read('src/mobile.js');

    expect(css).toMatch(/\.bottom-sheet\s*{[^}]*max-height\s*:\s*min\(82dvh,\s*44rem\)/s);
    expect(css).toMatch(/\.secondary-btn\.active\s*{/s);
    expect(css).toMatch(/\.bottom-sheet\.dragging\s*{/s);
    expect(js).toContain('pointerdown');
    expect(js).toContain('setPointerCapture');
    expect(js).toContain('translateY');
  });

  it('lets the desktop entry point offer automatic mobile navigation without affecting desktop users', () => {
    const html = read('index.html');
    const js = read('src/main.js');

    expect(html).toContain('id="mobile-redirect-banner"');
    expect(js).toContain('matchMedia(\'(max-width: 720px)\')');
    expect(js).toContain('mobile.html');
    expect(js).toContain('stayDesktop');
  });
});
