# Generative Art Framework

A powerful, extensible Java framework for creating generative art, optimized for pen plotters (e.g., Axidraw). This project features a modern **Swing GUI** for real-time parameter tuning, previewing, and SVG generation.

## 🚀 Quick Start

### Prerequisites
*   **Java 17** or higher
*   **Maven** 3.6+

### Running the App
1.  **Launch via Script:**

    *   **macOS / Linux**:
        ```bash
        ./run.sh
        ```
    *   **Windows**:
        Double-click `start_gui.bat` or run from a terminal:
        ```cmd
        .\start_gui.bat
        ```
    
    These scripts compile the project using Maven and launch the Swing GUI.

2.  **Generate Art:**
    *   Select an algorithm from the sidebar (e.g., "Phyllotaxis").
    *   Adjust parameters (Density, Colors, Scale, etc.).
    *   Click **"Generate Art"** to see the preview.
    *   **Saving**: The SVG output is automatically saved to the `output/` directory and can be copied to the clipboard.
    *   **Help**: Click the "Help" button for detailed documentation on the selected generator's parameters.

## 🎨 Available Generators

The framework currently includes 8 distinct generative algorithms:

1.  **Generative Ribbon**: Lofted 3D twisted ribbons using Moiré interference patterns.
2.  **Flow Fields (Perlin)**: Particle systems steered by noise fields for organic textures.
3.  **L-System Fractal**: Rule-based recursive fractals (e.g., Dragon Curve, Ferns).
4.  **Reaction Diffusion**: Simulates biological pattern formation (spots/stripes) using Gray-Scott equations.
5.  **Harmonograph**: Simulates multi-pendulum mechanical drawings (Lissajous figures).
6.  **Phyllotaxis**: Nature-inspired sunflower spirals using the Golden Angle.
7.  **Strange Attractors**: Visualizes chaotic mathematical systems (Clifford Attractor).
8.  **Circle Packing**: Fills space with non-overlapping, growing bubbles.
9.  **Truchet Tiles**: Maze-like geometric tessellations.

## ✨ Key Features

*   **Swing GUI**: Clean, dark-mode interface using **FlatLaf**.
*   **Multi-Color Support**: Define 1-6 "Colors" to split the output into separate SVG layers (`<g id="layer_1">`), ready for multi-pen plotting.
*   **SVG Clipping**: All outputs are cleanly clipped to standard paper sizes (A4, Letter, etc.).
*   **Extensible**: Easily add new generators by implementing the `ArtGenerator` interface.

## 🛠 Extending the Framework

To add a new art algorithm:

1.  **Create a Class** that implements `org.trostheide.generativeArt.core.ArtGenerator`.
2.  **Implement Methods**:
    *   `getParameterDefinitions()`: Define UI controls (Sliders, Checkboxes).
    *   `generate(Map params)`: Use `SvgCanvas` to draw and return an SVG string.
3.  **Register It**:
    Add your new class to `src/main/java/org/trostheide/generativeArt/swing/SwingApp.java`:
    ```java
    GeneratorRegistry.register(new MyNewAlgorithm());
    ```
4.  **Recompile**: Run `./run.sh` again.
