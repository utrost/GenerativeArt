# Celtic Knot Generator

## Overview
Creates interlaced Celtic knot patterns inspired by the decorative art found in medieval manuscripts like the Book of Kells. The generator builds a grid of crossing points where ribbons weave over and under each other, creating continuous interlocking loops. Each crossing uses quadratic Bézier curves with parallel offset lines to give the ribbons visual width.

## Parameters

### Preset
*   **Description**: Predefined knot styles.
*   **Options**: Custom, Simple Braid, Dense Weave, Border Pattern, Round Knot

### Grid Width / Grid Height
*   **Description**: The number of crossing cells in each direction.
*   **Effect**:
    *   **Small (2-4)**: Simple knots with few crossings — good for clear, bold designs.
    *   **Large (8-16)**: Dense weave patterns with many interlocking loops.
    *   **Unequal**: Rectangular grids create border or band patterns.

### Ribbon Width
*   **Description**: The visual width of the interlaced ribbons in pixels.
*   **Effect**: Wider ribbons create bolder, more prominent knots. Narrower ribbons allow for more intricate detail.

### Corner Radius
*   **Description**: Controls how rounded the curves are at turning points.
*   **Effect**:
    *   **0.0**: Sharp, angular turns.
    *   **0.5**: Smooth, circular arcs.

### Seed
*   **Description**: Random seed controlling which crossings go over vs under.

### Break Probability
*   **Description**: Probability that a crossing will have a break in its pattern.
*   **Effect**: Higher values create more complex, interlocking knot structures. Lower values create simpler braids.

### Colors
*   **Description**: Number of plotter layers. Over-crossings and under-crossings alternate between layers, creating natural color separation for pen plotting.
