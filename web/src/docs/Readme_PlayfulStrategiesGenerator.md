# Playful Strategies

A small strategy playground for plotter-native mark making. One generator exposes three quite different construction strategies, and the UI only shows the controls that belong to the selected strategy.

## Strategies

- **Kelp Forest** — swaying stems, side fronds, and tiny bubble marks. Good for organic vertical motion.
- **Orbit Weave** — eccentric orbital paths pulled by satellite anchors. Good for dense curve nests and diagram-like knots.
- **Signal Weather** — noisy pressure bands with short rain glyphs. Good for abstract landscapes, maps, and radio-static skies.

## Parameters

Shared controls:

- **Strategy** selects the construction mode.
- **Colors** controls how many physical pen layers are emitted.
- **Stroke Width** changes SVG preview weight.
- **Seed** makes variants reproducible.

Kelp-only controls:

- **Frond Count** sets the number of stems.
- **Current Wiggle** bends stems with an imaginary tide.
- **Bubble Mischief** adds optional small circle marks.

Orbit-only controls:

- **Orbit Count** sets the number of orbit paths.
- **Satellite Count** sets the anchor points that tug the orbits.
- **Weave Twist** controls phase shift and knotting.

Weather-only controls:

- **Cloud Bands** sets the number of wavy bands.
- **Rain Glyphs** adds short dash marks.
- **Signal Noise** controls band jitter and rain slant.

## Plotter notes

- Each strategy emits named semantic layers so layers can be separated by pen color.
- The SVG is deterministic for a given seed and parameter set.
- Dense Orbit Weave settings can produce long plotting times; start with defaults before turning the orbit count into a spaghetti opera.
- Kelp Forest and Signal Weather are forgiving with broad pens; Orbit Weave benefits from finer pens.
