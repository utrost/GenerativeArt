# Crumpled Mesh

Crumpled Mesh generates a dense plotter-friendly wireframe sheet. It is inspired by plotted technical-pen references where a rectangular mesh is pushed through a fake 3D heightfield until it reads as crumpled paper, folded fabric, or a terrain relief.

This is different from **Folded Crystal**. Folded Crystal builds polygon faces and clips hatches inside each face. Crumpled Mesh keeps one continuous grid grammar: rows and columns bend together over the same surface.

## Construction

1. Build an irregular sheet boundary in normalized page space.
2. Generate sharp fold ridges and softer broad undulations.
3. Sample a regular 2D grid inside the boundary.
4. Convert every grid point to a height value.
5. Project `(x, y, z)` back to 2D with a page-relative height direction.
6. Draw the surviving grid rows and columns as SVG polylines.
7. Send steeper line families to shadow layers when layer mode allows it.
8. Fit the full projected mesh back into the page with margins.

The output uses paths only: no fills, no opacity, no raster shading. Tone comes from real mesh density and optional overplotting.

## Plotter notes

- **Rotring sheet** is the closest preset to the reference: dense but still practical.
- **Dense wireframe** can become slow to plot. Use it for smaller paper or patient days.
- Lower **Row Density** or **Column Density** if plotting time gets silly.
- Use **Single pen** for a clean black technical-pen study.
- Use **Mesh + shadow** when you want darker ridge areas to be separable as a second pass.
- Use **Three pass** only when you want a visibly heavier shadow structure.
- If it reads too much like terrain, raise **Ridge Sharpness** and **Fold Count**.
- If it reads too much like a flat wobbly grid, raise **Surface Height** and **Crumple Amount**.

## Parameters

- **Preset**: starting configuration.
- **Grid Rows / Grid Columns**: mesh density.
- **Sheet Width / Sheet Height**: pre-projection surface size.
- **Surface Height**: how far height moves the projected mesh.
- **Fold Count**: number of sharp ridges and dents.
- **Ridge Sharpness**: narrowness/angularity of folds.
- **Crumple Amount**: strength of the generated heightfield.
- **Noise Scale**: scale of broad undulations.
- **Projection Angle**: direction in which height pushes the grid.
- **Vertical Compression**: perspective-like compression of sheet depth.
- **Boundary Irregularity**: torn-edge wobble.
- **Shadow Threshold**: slope cutoff for shadow layers.
- **Row Density / Column Density**: line skipping controls for plotting time.
- **Layer Mode**: single pen, mesh plus shadow, or three pass.
- **Stroke Width**: SVG preview stroke width.
- **Seed**: reproducible random seed.
