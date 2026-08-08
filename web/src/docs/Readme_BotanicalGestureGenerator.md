# Botanical Gesture

Loose flower, branch, and tree sketches built from repeated plotter strokes.

## Concept

This generator treats botanical drawing as a line grammar rather than a tracing problem. Stems are wandering Bézier spines. Rose heads are nested petal arcs. Leaves are pointed curves with veins and sparse hatching. Important contours are drawn several times with small offsets so a single pen can suggest brushy thick/thin marks.

Presets cover wild rose stems, a cropped bouquet, bare winter trees, and a lighter meadow sketch.

## Parameters

Key controls: Preset, Plant Count, Flower Heads, Leaf Density, Gesture Looseness, Stroke Passes, Shadow Density, and Crop Amount.

Every preset is deterministic through `Seed`, and `Colors` controls how many plotter layers are emitted. `Stroke Width` only affects the browser preview and SVG stroke metadata; the real line weight comes from the pen.

## Plotter notes

The SVG uses three named plotter layers: structure, shadow hatching, and loose gesture. Plot all layers with one black pen for an ink-sketch look, or use a grey pen for hatching/gesture and black for the structure pass.

The drawing deliberately leaves gaps, overshoots, and repeated nearby contours. That is the point. If the output starts looking like clipart, raise Gesture Looseness, Crop Amount, or Stroke Passes.
