import { describe, it, expect } from 'vitest';

import { createGeneratorInstances } from './generatorRegistry.js';

const allGenerators = createGeneratorInstances();

function buildDefaultParams(generator) {
    const params = {
        width: 200,
        height: 200,
        paperSize: 'A4 Portrait',
    };
    for (const pd of generator.getParameterDefinitions()) {
        if (pd.defaultValue !== undefined && pd.defaultValue !== null) {
            params[pd.name] = pd.defaultValue;
        }
    }
    return params;
}

describe('All Generators', () => {
    for (const generator of allGenerators) {
        const name = generator.getDisplayName();

        describe(name, () => {
            it('has a valid id', () => {
                const id = generator.getId();
                expect(id).toBeTruthy();
                expect(id.length).toBeGreaterThan(0);
            });

            it('has a valid display name', () => {
                expect(name).toBeTruthy();
                expect(name.length).toBeGreaterThanOrEqual(3);
            });

            it('has non-empty parameter definitions', () => {
                const params = generator.getParameterDefinitions();
                expect(params).toBeDefined();
                expect(Array.isArray(params)).toBe(true);
                expect(params.length).toBeGreaterThan(0);
            });

            it('parameter definitions have valid names and types', () => {
                for (const param of generator.getParameterDefinitions()) {
                    expect(param.name).toBeTruthy();
                    expect(param.type).toBeTruthy();
                }
            });

            it('numeric parameters have min <= max', () => {
                for (const param of generator.getParameterDefinitions()) {
                    if ((param.type === 'integer' || param.type === 'double') &&
                        param.min !== null && param.min !== undefined &&
                        param.max !== null && param.max !== undefined) {
                        expect(param.min).toBeLessThanOrEqual(param.max);
                    }
                }
            });

            it('numeric parameter defaults are in range', () => {
                for (const param of generator.getParameterDefinitions()) {
                    if ((param.type === 'integer' || param.type === 'double') &&
                        param.min !== null && param.min !== undefined &&
                        param.max !== null && param.max !== undefined &&
                        param.defaultValue !== null && param.defaultValue !== undefined) {
                        expect(param.defaultValue).toBeGreaterThanOrEqual(param.min);
                        expect(param.defaultValue).toBeLessThanOrEqual(param.max);
                    }
                }
            });

            it('selection parameters have valid defaults', () => {
                for (const param of generator.getParameterDefinitions()) {
                    if (param.options && param.options.length > 0) {
                        expect(param.defaultValue).toBeDefined();
                        expect(param.options).toContain(param.defaultValue);
                    }
                }
            });

            it('generates valid SVG', () => {
                const params = buildDefaultParams(generator);
                // Reduce iterations for slow generators
                if (params['Iterations'] && params['Iterations'] > 500) params['Iterations'] = 100;
                const svg = generator.generate(params);

                expect(svg).toBeTruthy();
                expect(svg).toContain('<svg');
                expect(svg).toContain('</svg>');
            }, 15000);

            it('generates SVG with dimensions', () => {
                const params = buildDefaultParams(generator);
                if (params['Iterations'] && params['Iterations'] > 500) params['Iterations'] = 100;
                const svg = generator.generate(params);

                expect(svg).toContain('width=');
                expect(svg).toContain('height=');
            }, 15000);
        });
    }
});
