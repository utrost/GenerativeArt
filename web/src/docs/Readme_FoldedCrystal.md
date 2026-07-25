# Folded Crystal

Folded Crystal generates an irregular cluster of polygon facets, then fills every face with clipped parallel hatch lines. It is meant for pen plotting: tones come from real line density and pen layers, not SVG fills or opacity.

## Construction

1. Build a tall irregular boundary from seeded radial points.
2. Recursively split the boundary into shared polygon faces.
3. Assign each face a fake lighting value from its edge direction and the light angle.
4. Generate parallel hatch lines for each face and clip those lines to the polygon.
5. Draw selected facet edges as a separate outline layer.

The result is closer to folded paper, faceted cloth, or a low-poly crystal than to a regular tiling.

## Plotter notes

- Use **Single pen** for a clean black hatch study.
- Use **Magenta/Violet** for a two-pen version of the reference image.
- Use **Three layer** when you want the darkest facets to get a separate shadow/crosshatch pass.
- Plot outlines last if your plotting workflow preserves SVG layer order.
- If the drawing is too dark, raise **Hatch Dark Spacing** or lower **Contrast**.
- If it looks too regular, raise **Irregularity**, **Protrusions**, or **Angle Jitter**.

## Parameters

- **Preset**: starting configuration.
- **Split Count**: number of recursive facet splits.
- **Boundary Points**: number of points in the outer silhouette.
- **Cluster Width / Height**: page coverage of the main shape.
- **Irregularity**: amount of boundary wobble.
- **Protrusions**: number of little wings/spikes on the silhouette.
- **Angle Jitter**: variation around the main fold direction families.
- **Hatch Light Spacing / Hatch Dark Spacing**: line spacing range for light and shadow facets.
- **Light Angle**: fake light direction used to choose density and pen layer.
- **Contrast**: strength of the light/shadow mapping.
- **Color Mode**: physical pen-layer strategy.
- **Outline Mode**: seam drawing strategy.
- **Stroke Width**: SVG preview stroke width.
- **Seed**: reproducible random seed.
