# Capsule Interference

A plotter-oriented study of overlapping rounded-rectangle contour stacks. It is based on the simple observation that two or three clean geometric systems can produce a third visual object through overlap, density, and registration.

## Visual Model

Each stack is a rounded rectangle repeatedly inset by a fixed spacing. Several stacks are then rotated and slightly shifted around the page center. Where the contours cross or align, the plotted ink naturally darkens.

This works well with translucent red, orange, or brown pens on warm paper. The SVG itself stays simple: many closed polyline paths, no fills, no raster effects.

## Parameters

- **Preset**: Starting composition.
- **shapeCount**: Number of overlapping contour stacks.
- **contourCount**: Number of nested outlines in each stack.
- **spacing**: Distance between neighboring outlines.
- **baseWidth / baseHeight**: Outer size of the first contour.
- **cornerRadius**: How pill-like the rounded rectangle becomes.
- **rotationSpread**: Total angular fan across the stacks.
- **jitter**: Seeded imperfection in position, size, and rotation.
- **strokeWidth**: Preview stroke width only; the real width is your pen.
- **seed**: Reproducible variant seed.

## Plotter Notes

- Use a single pen layer, preferably red/orange.
- Start with **1+1=3 Study** and A4 landscape.
- If the drawing looks too dense, lower `contourCount` or increase `spacing`.
- If the drawing becomes too symmetrical, increase `jitter` or change `seed`.
- The output is intentionally plain SVG paths so `vpype` can sort and scale it cleanly.
