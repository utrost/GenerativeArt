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
});
