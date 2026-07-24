import { describe, expect, it } from 'vitest';

import { MazeGenerator } from './MazeGenerator.js';

function lineSegments(svg) {
  return [...svg.matchAll(/<line x1='([\d.-]+)' y1='([\d.-]+)' x2='([\d.-]+)' y2='([\d.-]+)'/g)]
    .map((match) => match.slice(1).map(Number));
}

function hasLine(lines, x1, y1, x2, y2) {
  return lines.some(([ax1, ay1, ax2, ay2]) =>
    ax1 === x1 && ay1 === y1 && ax2 === x2 && ay2 === y2 ||
    ax1 === x2 && ay1 === y2 && ax2 === x1 && ay2 === y1
  );
}

describe('MazeGenerator border openings', () => {
  it('creates exactly one entry and one exit and closes the other border walls', () => {
    const generator = new MazeGenerator();
    const svg = generator.generate({
      rows: 5,
      cols: 5,
      cellSize: 10,
      wallWidth: 1,
      entrySide: 'Top',
      entryPosition: 0,
      exitSide: 'Bottom',
      exitPosition: 100,
      seed: 1234,
      solve: false,
    });
    const lines = lineSegments(svg);

    // Entry gap: top wall of top-left cell is omitted.
    expect(hasLine(lines, 0, 0, 10, 0)).toBe(false);
    // Exit gap: bottom wall of bottom-right cell is omitted.
    expect(hasLine(lines, 40, 50, 50, 50)).toBe(false);

    // Neighboring border segments remain closed.
    expect(hasLine(lines, 10, 0, 20, 0)).toBe(true);
    expect(hasLine(lines, 30, 50, 40, 50)).toBe(true);
    expect(hasLine(lines, 0, 0, 0, 10)).toBe(true);
    expect(hasLine(lines, 50, 40, 50, 50)).toBe(true);
  });

  it('routes the solution from entry opening to exit opening', () => {
    const generator = new MazeGenerator();
    const svg = generator.generate({
      rows: 5,
      cols: 5,
      cellSize: 10,
      wallWidth: 1,
      entrySide: 'Left',
      entryPosition: 50,
      exitSide: 'Right',
      exitPosition: 50,
      seed: 42,
      solve: true,
    });

    expect(svg).toContain('M -5 25');
    expect(svg).toContain(' L 55 25');
  });

  it('moves the exit if entry and exit point at the same boundary cell', () => {
    const generator = new MazeGenerator();
    const svg = generator.generate({
      rows: 5,
      cols: 5,
      cellSize: 10,
      wallWidth: 1,
      entrySide: 'Top',
      entryPosition: 0,
      exitSide: 'Top',
      exitPosition: 0,
      seed: 1,
      solve: false,
    });
    const lines = lineSegments(svg);

    expect(hasLine(lines, 0, 0, 10, 0)).toBe(false);
    expect(hasLine(lines, 40, 50, 50, 50)).toBe(false);
  });
});
