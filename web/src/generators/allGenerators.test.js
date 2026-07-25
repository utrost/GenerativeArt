import { describe, it, expect } from 'vitest';

import { GenerativeRibbon } from './GenerativeRibbon.js';
import { FlowFieldGenerator } from './FlowFieldGenerator.js';
import { CirclePackingGenerator } from './CirclePackingGenerator.js';
import { LSystemGenerator } from './LSystemGenerator.js';
import { ReactionDiffusionGenerator } from './ReactionDiffusionGenerator.js';
import { HarmonographGenerator } from './HarmonographGenerator.js';
import { PhyllotaxisGenerator } from './PhyllotaxisGenerator.js';
import { StrangeAttractorsGenerator } from './StrangeAttractorsGenerator.js';
import { TruchetTilesGenerator } from './TruchetTilesGenerator.js';
import { TwistedMoireGenerator } from './TwistedMoireGenerator.js';
import { VoronoiRipplesGenerator } from './VoronoiRipplesGenerator.js';
import { PipeNetworkGenerator } from './PipeNetworkGenerator.js';
import { ParametricGridGenerator } from './ParametricGridGenerator.js';
import { MagneticFieldGenerator } from './MagneticFieldGenerator.js';
import { FourierSeriesGenerator } from './FourierSeriesGenerator.js';
import { MazeGenerator } from './MazeGenerator.js';
import { SpirographGenerator } from './SpirographGenerator.js';
import { PenroseTilingGenerator } from './PenroseTilingGenerator.js';
import { WaveInterferenceGenerator } from './WaveInterferenceGenerator.js';
import { ChladniPatternGenerator } from './ChladniPatternGenerator.js';
import { CelticKnotGenerator } from './CelticKnotGenerator.js';
import { ContourMapGenerator } from './ContourMapGenerator.js';
import { CapsuleInterferenceGenerator } from './CapsuleInterferenceGenerator.js';
import { FoldedCrystalGenerator } from './FoldedCrystalGenerator.js';

const allGenerators = [
    new GenerativeRibbon(),
    new FlowFieldGenerator(),
    new CirclePackingGenerator(),
    new LSystemGenerator(),
    new ReactionDiffusionGenerator(),
    new HarmonographGenerator(),
    new PhyllotaxisGenerator(),
    new StrangeAttractorsGenerator(),
    new TruchetTilesGenerator(),
    new TwistedMoireGenerator(),
    new VoronoiRipplesGenerator(),
    new PipeNetworkGenerator(),
    new ParametricGridGenerator(),
    new MagneticFieldGenerator(),
    new FourierSeriesGenerator(),
    new MazeGenerator(),
    new SpirographGenerator(),
    new PenroseTilingGenerator(),
    new WaveInterferenceGenerator(),
    new ChladniPatternGenerator(),
    new CelticKnotGenerator(),
    new ContourMapGenerator(),
    new CapsuleInterferenceGenerator(),
    new FoldedCrystalGenerator(),
];

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
