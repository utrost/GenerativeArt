# Paper Memory

A handled sheet with recent creases, ghost folds, and dry rubbing marks.

## Concept

This generator treats the paper itself as the subject. It builds a history of folds, then leaves some as sharp current creases and others as faint remembered marks.

## Parameters

Key controls: Fold Count, Memory Depth, Crease Sharpness, Rubbing Density, Fold Symmetry.

Every preset is deterministic through `Seed`, and `Colors` controls how many plotter layers are emitted. `Stroke Width` only affects the browser preview and SVG stroke metadata; the real line weight comes from the pen.

## Plotter notes

Plot ghost creases with a light pen or low-pressure pass. The rubbing layer is intentionally sparse and broken.
