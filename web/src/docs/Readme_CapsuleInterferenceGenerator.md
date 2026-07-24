# Capsule Interference

A plotter-oriented study of parallel line bundles flowing around distributed guide circles. It is based on the simple observation that two or three clean geometric systems can produce a third visual object through overlap, density, and registration.

## Visual Model

The default mode distributes a configurable number of invisible guide circles across the page. A bundle of parallel plotted lines routes from circle 1 to circle 2 to circle 3, and so on, then closes back to circle 1. At each circle the bundle consistently flows around the left or right side, preserving the appeal of the earlier parallel-line construction while avoiding copied/mirrored two-pivot capsule stacks.

In the default color setup, every pen layer shares the same guide-circle route family, but the line bundle is phase-shifted by a fraction of the line spacing. With two colors, the second pen sits halfway between the first pen's parallel lines; with three or more colors, the layers divide the gaps evenly. The older point-field isoline and rounded-rectangle constructions remain available through **constructionMode**, but the default is now **Circle route**. The SVG itself stays simple: stroked paths, no fills, no raster effects.

## Parameters

- **Preset**: Starting composition.
- **constructionMode**: `Circle route` for parallel line bundles around guide circles, `Point field` for distributed flowing contours, or `Capsule stacks` for the earlier rounded-rectangle construction.
- **circleCount**: Number of randomized guide circles in each route.
- **circleDiameter**: Diameter of the invisible circles the lines flow around.
- **routeSide**: Whether the bundle flows left, right, or alternates around successive guide circles.
- **pointCount**: Number of distributed attractor points per color layer in point-field mode.
- **fieldContours**: Number of isolines traced through each color field.
- **fieldResolution**: Sampling grid resolution; higher values make smoother contours but more paths.
- **fieldSoftness**: Influence radius around each point; higher values merge the flows more strongly.
- **shapeCount**: Number of overlapping contour stacks in capsule-stack mode.
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
- **layerPlacement**: In circle-route mode, `Interleaved gaps` puts color layers into the whitespace between neighboring parallel lines, `Overprint` draws each color on the same offsets, and `Custom phase` uses **layerPhase**.
- **layerPhase**: Custom layer shift as a fraction of **spacing**. `0.5` puts a second color in the gap; around `0.33` works well for three colors.
- **registrationOffset**: Optional per-color offset when using stacked duplicated passes.
- **strokeWidth**: Preview stroke width only; the real width is your pen.
- **seed**: Reproducible variant seed.

## Plotter Notes

- Default **By stack** plus **Interleaved gaps** mode draws red and blue as one shared route family with blue deliberately placed in the red gaps.
- Use **Overprint** when you want each pen to redraw the exact same route offsets.
- Use **Custom phase** when you want a less regular relationship than the automatic `1 / colorLayers` spacing.
- Circle-route detours use cubic Bézier arcs rather than segmented polygons, so large circles stay visually round without needing hundreds of vertices.
- Use **Single pen** if you want the earlier monochrome version.
- Use **Stacked passes** only when you deliberately want every contour redrawn by several pens with a small registration shift.
- Start with **1+1=3 Study** and A4 portrait or landscape.
- If the drawing looks too dense, lower `contourCount` or increase `spacing`.
- If the drawing becomes too symmetrical, increase `jitter` or change `seed`.
- The output is intentionally plain SVG paths so `vpype` can sort and scale it cleanly.
