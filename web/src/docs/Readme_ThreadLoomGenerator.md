# Thread Loom

A woven field of sagging thread curves routed between frame anchors.

## Concept

This generator treats the page as a pin loom. Threads connect edge anchors, sag through a soft vector field, and gather toward an optional focus point to create optical overlap.

## Parameters

Key controls: Anchor Count, Thread Count, Warp Strength, Field Complexity, Focus Pull.

Every preset is deterministic through `Seed`, and `Colors` controls how many plotter layers are emitted. `Stroke Width` only affects the browser preview and SVG stroke metadata; the real line weight comes from the pen.

## Plotter notes

The thread layers deliberately overprint. Keep stroke width low and test pen density before plotting dense moire presets.
