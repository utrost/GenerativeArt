import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const cssPath = join(dirname(fileURLToPath(import.meta.url)), 'style.css');
const css = readFileSync(cssPath, 'utf8');

describe('application layout CSS', () => {
    it('allows fixed-height grid children to shrink so side panels can scroll internally', () => {
        expect(css).toMatch(/#app\s*>\s*\*\s*{[^}]*min-height\s*:\s*0\s*;/s);
    });

    it('provides a desktop plotter diagnostics block near export controls', () => {
        const htmlPath = join(dirname(fileURLToPath(import.meta.url)), '../../index.html');
        const html = readFileSync(htmlPath, 'utf8');
        const mainPath = join(dirname(fileURLToPath(import.meta.url)), '../main.js');
        const mainJs = readFileSync(mainPath, 'utf8');

        expect(html).toContain('id="svg-diagnostics"');
        expect(html).toMatch(/<p\s+id="svg-diagnostics"[^>]*aria-live="polite"/);
        expect(css).toMatch(/\.svg-diagnostics\s*{[^}]*font-family\s*:\s*var\(--font-mono\)/s);
        expect(mainJs).toContain("import { buildSvgDiagnosticsViewModel } from './core/SvgDiagnostics.js';");
        expect(mainJs).toContain('updateSvgDiagnostics(output);');
        expect(mainJs).toContain('updateSvgDiagnostics(null);');
    });
});
