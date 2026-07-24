# Capsule Interference

A plotter-oriented study of overlapping rounded-rectangle contour stacks. It is based on the simple observation that two or three clean geometric systems can produce a third visual object through overlap, density, and registration.

## Visual Model

Each stack is a rounded rectangle repeatedly inset by a fixed spacing. Several stacks are then rotated and shifted across a loose horizontal construction axis, so the result reads as vertical and diagonal contour bands rather than one centered knot. Where the contours cross or align, the plotted ink naturally darkens.

The default now emits separate red and blue SVG layers, similar to multi-pen plotter studies where the third color appears optically through overlap. The SVG itself stays simple: many closed polyline paths, no fills, no raster effects.

## Parameters

- **Preset**: Starting composition.
- **shapeCount**: Number of overlapping contour stacks.
- **contourCount**: Number of nested outlines in each stack.
- **spacing**: Distance between neighboring outlines.
- **baseWidth / baseHeight**: Outer size of the first contour.
- **cornerRadius**: How pill-like the rounded rectangle becomes.
- **rotationSpread**: Total angular fan across the stacks.
- **focusCount**: Number of seeded construction centers; this avoids every variant orbiting the same two points.
- **focusSpread**: How widely those construction centers are scattered before the final page fit.
- **asymmetry**: Allows the fitted composition to sit away from the exact page center while staying inside margins.
- **pageFill**: Slightly backs off the fit so asymmetry has room to move the composition.
- **jitter**: Seeded imperfection in position, size, and rotation.
- **colorMode**: Assign colors by stack, by contour band, as duplicated stacked passes, or as one pen.
- **colorLayers**: Number of SVG pen layers to emit.
- **registrationOffset**: Optional per-color offset when using stacked duplicated passes.
- **strokeWidth**: Preview stroke width only; the real width is your pen.
- **seed**: Reproducible variant seed.

## Plotter Notes

- Default **By stack** mode alternates red and blue plotted stacks; intersections create the purple/darker third effect.
- Use **Single pen** if you want the earlier monochrome version.
- Use **Stacked passes** only when you deliberately want every contour redrawn by several pens with a small registration shift.
- Start with **1+1=3 Study** and A4 portrait or landscape.
- If the drawing looks too dense, lower `contourCount` or increase `spacing`.
- If the drawing becomes too symmetrical, increase `jitter` or change `seed`.
- The output is intentionally plain SVG paths so `vpype` can sort and scale it cleanly.
