# Mechanical Rain

Falling traces deflected by mechanical pins, paddles, and invisible wind.

## Concept

This generator draws rain as physical trajectories. Droplets fall through a field of deflectors, bend around their influence, and leave small splash marks where they collide.

## Parameters

Key controls: Drop Count, Deflector Count, Gravity, Wind, Splash Marks.

Every preset is deterministic through `Seed`, and `Colors` controls how many plotter layers are emitted. `Stroke Width` only affects the browser preview and SVG stroke metadata; the real line weight comes from the pen.

## Plotter notes

Use deflectors as a second pen pass. High Drop Count creates dense vertical texture; test on smaller paper before A3.
