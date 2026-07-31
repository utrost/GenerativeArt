# Botanical Circuit

Branching plant growth constrained by PCB-style 45/90 degree routing.

## Concept

This generator blends an L-system-like plant habit with circuit-board routing. Branches become traces, leaf tips become solder pads, and junctions become vias.

## Parameters

Key controls: Branch Depth, Growth Bias, Node Density, Trace Spacing, Leaf Pads.

Every preset is deterministic through `Seed`, and `Colors` controls how many plotter layers are emitted. `Stroke Width` only affects the browser preview and SVG stroke metadata; the real line weight comes from the pen.

## Plotter notes

Separate traces, pads, and vias for pen changes. Strict Routing is best for technical drawing; Wild Creeper gives more organic plotter studies.
