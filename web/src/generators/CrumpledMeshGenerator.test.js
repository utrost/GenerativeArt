import { describe, it, expect } from 'vitest';

import { CrumpledMeshGenerator } from './CrumpledMeshGenerator.js';

function defaultParams(generator) {
    const params = { width: 842, height: 595 };
    for (const definition of generator.getParameterDefinitions()) {
        params[definition.name] = definition.defaultValue;
    }
    return params;
}

describe('CrumpledMeshGenerator', () => {
    it('generates a dense line-only SVG mesh', () => {
        const generator = new CrumpledMeshGenerator();
        const svg = generator.generate(defaultParams(generator));

        expect(svg).toContain('<svg');
        expect(svg).toContain("data-role='row'");
        expect(svg).toContain("data-role='column'");
        expect(svg).not.toContain('<circle');
        expect(svg).not.toContain('<polygon');
        expect(svg.match(/<path /g).length).toBeGreaterThan(90);
    });

    it('is deterministic for the same seed', () => {
        const generator = new CrumpledMeshGenerator();
        const params = defaultParams(generator);

        expect(generator.generate(params)).toEqual(generator.generate(params));
    });

    it('keeps generated coordinates inside the page after fit-to-page', () => {
        const generator = new CrumpledMeshGenerator();
        const params = defaultParams(generator);
        const svg = generator.generate(params);
        const numbers = [...svg.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
        const coords = [];
        const coordRe = /([ML])\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;
        let match;
        while ((match = coordRe.exec(svg)) !== null) {
            coords.push([Number(match[2]), Number(match[3])]);
        }

        expect(numbers.length).toBeGreaterThan(0);
        expect(coords.length).toBeGreaterThan(1000);
        for (const [x, y] of coords) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(params.width);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(params.height);
        }
    });
});
