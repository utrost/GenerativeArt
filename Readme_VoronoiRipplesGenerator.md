# Voronoi Ripples Generator

The **Voronoi Ripples** generator creates a pattern of concentric rings that look like ripples in water, but they are constrained to "territories" defined by Voronoi regions.

## How it works
1.  **Seeds**: A set of random points is scattered across the canvas.
2.  **Voronoi Cells**: For each seed, the canvas is divided into a region where that seed is the closest point.
3.  **Ripples**: Within each cell, concentric circular arcs are drawn around the seed. The arcs stop exactly at the boundary where they would become closer to another seed, creating sharp, precise junctions.

## Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Point Count** | Integer | 12 | The number of ripple centers. More points create smaller cell territories. |
| **Line Spacing** | Double | 6.0 | The distance between adjacent rings. Smaller values create denser patterns. |
| **Seed** | Integer | 1234 | Random seed for the position of the points. Change this to explore different layouts. |

## Usage Tips
- **Vibrant Colors**: Each cell is assigned a different layer color (cycling through 6 standard plotter colors). This looks fantastic when plotted with multiple pens.
- **High Density**: Try a low `Line Spacing` (e.g., 2.0 or 3.0) for a very detailed, "hypnotic" effect.
- **Minimalist**: Use a low `Point Count` (e.g., 3-5) to see the pure geometry of the expanding circles meeting each other.
