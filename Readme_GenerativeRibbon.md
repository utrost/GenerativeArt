# GenerativeRibbon

A dependency-free Java utility that generates "lofted" surface geometry—complex, twisting 3D ribbons—and renders them as 2D SVG vector files. The visual aesthetic relies on the Moiré interference patterns created by overlapping thousands of thin lines.

## Prerequisites

* **Java 17+** (Required for `record` keyword usage).
* No external libraries (Maven/Gradle not required).

## Quick Start

1.  **Compile:**
    ```bash
    javac GenerativeRibbon.java
    ```

2.  **Run:**
    ```bash
    java GenerativeRibbon
    ```

3.  **View:**
    The program outputs `ribbon.svg` in the working directory.
    ```bash
    # Linux (Ubuntu) one-liner to compile, run, and view:
    javac GenerativeRibbon.java && java GenerativeRibbon && xdg-open ribbon.svg
    ```

## Configuration & Parameters

The visual output is controlled entirely by static final variables and mathematical functions within `GenerativeRibbon.java`.

### Global Constants

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NUM_LINES` | `int` | `6000` | **Density.** Controls the resolution. Higher values (10k+) create darker, smoother gradients and stronger Moiré effects. Lower values (2k) look like wireframes. |
| `MAX_T` | `double` | `25.0` | **Length.** How "long" the ribbon is. Increasing this adds more loops to the structure. |
| `SCALE` | `double` | `2.0` | **Zoom.** Global multiplier for coordinates. Increase if the object looks too small in the viewport. |
| `WIDTH` / `HEIGHT` | `int` | `1000` | **Canvas.** The viewBox dimensions of the resulting SVG. |

### Shaping the Geometry

The shape is defined in `calculatePathA(t)` and `calculatePathB(t)`. These functions determine the position of the two edges of the ribbon at time `t`.

#### 1. The "Base" Path (Trajectory)
Code: `baseX`, `baseY`, `baseZ`
* **Function:** Defines the invisible central wire the ribbon wraps around.
* **How to modify:** Change the divisors in `Math.sin(t * 0.7)`.
    * *Lower frequency (e.g., 0.1):* Broad, sweeping curves.
    * *Higher frequency (e.g., 2.0):* Erratic, scribbled movement.

#### 2. The "Offset" (Ribbon Width & Twist)
Code: `offsetX`, `offsetY`, `offsetZ`
* **Function:** These values are added to the Base. They determine how far the edge is from the center.
* **How to modify:**
    * **Width:** Change the multiplier (e.g., `* 60` to `* 100`) to make the ribbon wider.
    * **Twist Rate:** Change the frequency (e.g., `Math.cos(t * 3.1)`). If this number is significantly higher than the Base frequency, the ribbon will coil tightly like a telephone cord.

## Project Structure

* **Initialization:** Sets up the `StringBuilder` for SVG XML construction.
* **Loop (`0` to `NUM_LINES`):**
    1.  Calculates normalized progress (`t`).
    2.  Computes 3D coordinates for Edge A and Edge B using parametric equations.
    3.  Projects 3D coordinates to 2D space (Weak Perspective projection).
    4.  Appends an SVG `<line>` element connecting Edge A to Edge B.
* **Output:** Writes the buffer to `ribbon.svg`.

## Tips for Plotting (Pen Plotters)

If you intend to use this with a plotter (Axidraw, etc.):
1.  **Reduce Density:** Drop `NUM_LINES` to ~2000 to prevent paper tearing.
2.  **Stroke Width:** In the Java code, change `stroke-width="0.5"` to match your pen nib size relative to the canvas scale.
3.  **Optimization:** This script generates raw lines. Use `vpype` (CLI tool) to optimize the SVG for plotting:
    ```bash
    vpype read ribbon.svg linemerge linesort write ribbon_optimized.svg
    ```