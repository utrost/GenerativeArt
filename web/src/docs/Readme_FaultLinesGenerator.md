# Fault Lines

Geological contour lines sheared by tectonic cracks.

## Concept

This generator is plotter-native SVG: linework first, no raster effects, and separate SVG groups for pen changes. It starts with a quiet contour field, then offsets and breaks the field around seeded fault lines.

## Parameters

Key controls: Fault Count, Fault Strength, Erosion, Stress Ticks.

Every preset is deterministic through `Seed`, and `Colors` controls how many plotter layers are emitted. `Stroke Width` only affects the browser preview and SVG stroke metadata; the real line weight comes from the pen.

## Plotter notes

Use layer_1_contours for the terrain bundle, layer_2_faults for bold crack lines, and layer_3_stress for perpendicular survey ticks. Good first plots use black plus one faint accent pen.
