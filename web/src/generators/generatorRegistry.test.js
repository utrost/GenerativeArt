import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import {
  CATEGORY_LABELS,
  generatorRegistry,
  createGeneratorInstances,
  filterGeneratorEntries,
  getFavoriteGeneratorIds,
  toggleFavoriteGeneratorId,
  rememberRecentGeneratorId,
} from './generatorRegistry.js';
import { HelpSystem } from '../core/HelpSystem.js';

describe('generator registry library browsing', () => {
  it('registers every generator with category, tags, and description metadata', () => {
    expect(generatorRegistry).toHaveLength(33);
    expect(new Set(generatorRegistry.map((entry) => entry.id)).size).toBe(generatorRegistry.length);

    for (const entry of generatorRegistry) {
      expect(entry.name).toBeTruthy();
      expect(CATEGORY_LABELS).toContain(entry.category);
      expect(entry.description.length).toBeGreaterThan(12);
      expect(entry.tags.length).toBeGreaterThanOrEqual(2);
      expect(entry.create().getId()).toBe(entry.id);
    }
  });

  it('filters by generator name, tag, description, and category', () => {
    expect(filterGeneratorEntries(generatorRegistry, { query: 'loom' }).map((entry) => entry.name)).toContain('Thread Loom');
    expect(filterGeneratorEntries(generatorRegistry, { query: 'metadata' }).map((entry) => entry.name)).toContain('Archive Shards');
    expect(filterGeneratorEntries(generatorRegistry, { query: 'plotter' }).length).toBeGreaterThan(4);
    expect(filterGeneratorEntries(generatorRegistry, { category: 'Math / physics' }).map((entry) => entry.name)).toContain('Chladni Patterns');
  });

  it('creates generator instances in registry order', () => {
    const instances = createGeneratorInstances();
    expect(instances).toHaveLength(generatorRegistry.length);
    expect(instances[0].getDisplayName()).toBe(generatorRegistry[0].name);
    expect(instances.at(-1).getDisplayName()).toBe('Resonant Topography');
    expect(instances.map((generator) => generator.getDisplayName())).toContain('Botanical Gesture');
  });

  it('keeps all-generator smoke tests sourced from the registry', () => {
    const testSource = readFileSync(new URL('./allGenerators.test.js', import.meta.url), 'utf8');
    expect(testSource).toContain("import { createGeneratorInstances } from './generatorRegistry.js';");
    expect(testSource).not.toMatch(/import \{ .*Generator.* \} from '\.\/.+Generator\.js';/);
  });

  it('resolves ambiguous display names to their own help files', () => {
    expect(HelpSystem.getHelpPath('Botanical Circuit')).toContain('Readme_BotanicalCircuitGenerator.md');
    expect(HelpSystem.getHelpPath('Botanical Gesture')).toContain('Readme_BotanicalGestureGenerator.md');
    expect(HelpSystem.getHelpPath('Flow Field (Perlin)')).toContain('Readme_FlowFieldGenerator.md');
    expect(HelpSystem.getHelpPath('L-System Fractal')).toContain('Readme_LSystemGenerator.md');
  });

  it('has help documentation for every registered generator', () => {
    for (const entry of generatorRegistry) {
      const help = HelpSystem.getHelpContent(entry.name);
      expect(help, entry.name).not.toContain('No Help Found');
      expect(help, entry.name).toContain('markdown-body');
    }
  });

  it('persists favorites and recents through localStorage-compatible storage', () => {
    const store = new Map();
    const storage = {
      getItem: vi.fn((key) => store.get(key) ?? null),
      setItem: vi.fn((key, value) => store.set(key, value)),
    };

    expect(getFavoriteGeneratorIds(storage)).toEqual([]);
    expect(toggleFavoriteGeneratorId('thread-loom', storage)).toEqual(['thread-loom']);
    expect(toggleFavoriteGeneratorId('fault-lines', storage)).toEqual(['thread-loom', 'fault-lines']);
    expect(toggleFavoriteGeneratorId('thread-loom', storage)).toEqual(['fault-lines']);

    expect(rememberRecentGeneratorId('archive-shards', storage)).toEqual(['archive-shards']);
    expect(rememberRecentGeneratorId('fault-lines', storage)).toEqual(['fault-lines', 'archive-shards']);
    expect(rememberRecentGeneratorId('archive-shards', storage)).toEqual(['archive-shards', 'fault-lines']);
  });
});
