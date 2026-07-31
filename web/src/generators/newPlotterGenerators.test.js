import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { FaultLinesGenerator } from './FaultLinesGenerator.js';
import { ThreadLoomGenerator } from './ThreadLoomGenerator.js';
import { BotanicalCircuitGenerator } from './BotanicalCircuitGenerator.js';
import { PaperMemoryGenerator } from './PaperMemoryGenerator.js';
import { MechanicalRainGenerator } from './MechanicalRainGenerator.js';
import { ArchiveShardsGenerator } from './ArchiveShardsGenerator.js';
import { ResonantTopographyGenerator } from './ResonantTopographyGenerator.js';

const docsRoot = resolve(__dirname, '../docs');

const newGenerators = [
  {
    generator: new FaultLinesGenerator(),
    id: 'fault-lines',
    name: 'Fault Lines',
    required: ['layer_1_contours', 'layer_2_faults', 'layer_3_stress'],
    doc: 'Readme_FaultLinesGenerator.md',
  },
  {
    generator: new ThreadLoomGenerator(),
    id: 'thread-loom',
    name: 'Thread Loom',
    required: ['layer_1_threads', 'layer_2_shadow_threads', 'layer_3_anchor_marks'],
    doc: 'Readme_ThreadLoomGenerator.md',
  },
  {
    generator: new BotanicalCircuitGenerator(),
    id: 'botanical-circuit',
    name: 'Botanical Circuit',
    required: ['layer_1_traces', 'layer_2_leaf_pads', 'layer_3_vias'],
    doc: 'Readme_BotanicalCircuitGenerator.md',
  },
  {
    generator: new PaperMemoryGenerator(),
    id: 'paper-memory',
    name: 'Paper Memory',
    required: ['layer_1_current_creases', 'layer_2_ghost_creases', 'layer_3_rubbing'],
    doc: 'Readme_PaperMemoryGenerator.md',
  },
  {
    generator: new MechanicalRainGenerator(),
    id: 'mechanical-rain',
    name: 'Mechanical Rain',
    required: ['layer_1_rain_paths', 'layer_2_deflectors', 'layer_3_splashes'],
    doc: 'Readme_MechanicalRainGenerator.md',
  },
  {
    generator: new ArchiveShardsGenerator(),
    id: 'archive-shards',
    name: 'Archive Shards',
    required: ['layer_1_shards', 'layer_2_links', 'layer_3_metadata_marks'],
    doc: 'Readme_ArchiveShardsGenerator.md',
  },
  {
    generator: new ResonantTopographyGenerator(),
    id: 'resonant-topography',
    name: 'Resonant Topography',
    required: ['layer_1_contours', 'layer_2_resonance_nodes', 'layer_3_break_marks'],
    doc: 'Readme_ResonantTopographyGenerator.md',
  },
];

function buildDefaultParams(generator) {
  const params = { width: 320, height: 240, paperSize: 'Screen (1000x1000)' };
  for (const definition of generator.getParameterDefinitions()) {
    params[definition.name] = definition.defaultValue;
  }
  return params;
}

describe('new plotter-native generators', () => {
  for (const { generator, id, name, required, doc } of newGenerators) {
    describe(name, () => {
      it('has stable registry metadata', () => {
        expect(generator.getId()).toBe(id);
        expect(generator.getDisplayName()).toBe(name);
        expect(generator.getParameterDefinitions().length).toBeGreaterThanOrEqual(6);
        expect(generator.getParameterDefinitions().some((definition) => definition.name === 'Seed')).toBe(true);
        expect(generator.getParameterDefinitions().some((definition) => definition.name === 'Colors')).toBe(true);
      });

      it('generates deterministic multi-layer SVG with named plotter groups', () => {
        const params = buildDefaultParams(generator);
        const first = generator.generate(params);
        const second = generator.generate(params);

        expect(first).toBe(second);
        expect(first).toContain('<svg');
        expect(first).toContain('</svg>');
        for (const marker of required) {
          expect(first).toContain(marker);
        }
        expect((first.match(/<path|<line|<circle|<rect/g) || []).length).toBeGreaterThan(20);
      });

      it('has generator help documentation', () => {
        const docPath = resolve(docsRoot, doc);
        expect(existsSync(docPath)).toBe(true);
        const content = readFileSync(docPath, 'utf8');
        expect(content).toContain(`# ${name}`);
        expect(content).toContain('## Parameters');
        expect(content).toContain('## Plotter notes');
      });
    });
  }
});
