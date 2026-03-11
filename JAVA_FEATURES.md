# Features of the Java Generative Art App

This document outlines the key features and capabilities of the original Java Swing application.

## 1. Core Architecture
*   **Plug-and-Play System**: The application is built on a modular `ArtGenerator` interface, allowing new algorithms to be added easily by registering them in `SwingApp.java`.
*   **Vector-First**: All art is generated as **SVG (Scalable Vector Graphics)**, ensuring infinite resolution and perfect compatibility with pen plotters (Axidraw, iDraw, etc.).

## 2. User Interface (UI)
*   **Modern Look & Feel**: Uses **FlatLaf Dark Theme** for a professional, comfortable aesthetic suitable for creative work.
*   **Three-Pane Layout**:
    *   **Sidebar**: Contains the list of generators and their specific parameters.
    *   **Preview Area**: A large central canvas that renders the SVG result.
*   **Responsive**: The UI adapts to window resizing, with `JSplitPane` allowing users to adjust the ratio between controls and preview.

## 3. Art Generators
The application includes **17 distinct algorithms** covering various styles of generative art:

### Simulation & Nature
*   **Reaction Diffusion**: Simulates chemical patterns (Gray-Scott model) vectorized using Marching Squares.
*   **Flow Field**: Particle trails following Perlin Noise vectors.
*   **Phyllotaxis**: Mathematical sunflower spirals.
*   **Circle Packing**: Non-overlapping organic bubble structures.
*   **Magnetic Field**: Simulates particle trajectories through magnetic poles.

### Geometry & Tiling
*   **Truchet Tiles**: Complex mazes built from simple rotating tiles.
*   **Voronoi Ripples**: Concentric rings constrained by cellular territories.
*   **Parametric Grid**: A grid of shapes that evolves chaotically across the X/Y axis.
*   **Pipe Network**: Industrial-looking pipe mazes using Wave Function Collapse logic.
*   **Maze Generator**: Perfect solvable mazes using recursive backtracking.

### Math & Chaos
*   **Strange Attractors**: Visualizes millions of points in chaotic orbits (Clifford Attractors).
*   **Harmonograph**: Simulates physical pendulums to create Lissajous figures.
*   **L-System**: Fractal generation using string rewriting rules (Dragon Curve, Sierpinski).
*   **Spirograph**: Epicycloid and Hypocycloid curves.
*   **Fourier Series**: Visualization of wave summation.

### Visual Effects
*   **Generative Ribbon**: 3D-like folded structures created by lofting lines.
*   **Twisted Moiré**: Interference patterns created by overlapping distorted grids.

## 4. Parameter Controls
The application features a **Dynamic Parameter System**:
*   **Auto-Generated Forms**: The UI reads the usage data from each generator and automatically builds the control panel.
*   **Rich Inputs**:
    *   **Numeric Spinners**: For precise integer/decimal control.
    *   **Checkboxes**: For boolean toggles (e.g., "Rotary Mode", "Solve Maze").
    *   **Dropdowns**: For multiple-choice modes (e.g., "Hypotrochoid" vs "Epitrochoid").
*   **Tooltips**: Hovering over a parameter name displays its description.

## 5. Output management
*   **Paper Size Support**: Native support for standard paper sizes (A4, A3, Letter) in both Portrait and Landscape. Default is A4 Landscape. The preview automatically scales to fit the selected page.
*   **Real-Time SVG Rendering**: Uses `JSVG` library to render the SVG code directly to the screen with high-quality anti-aliasing.
*   **Drop Shadow Preview**: The paper visually "floats" on the gray background to simulate the final look.
*   **SVG Export**: One-click saving to `.svg` files for use with plotters or editing software.

## 6. Performance
*   **Multi-Threading**: Generation runs in a background thread (`SwingWorker`), ensuring the UI never freezes even when calculating millions of points (e.g., for Strange Attractors).
*   **Error Handling**: Graceful error reporting via pop-up dialogs if a generator fails.

## 7. Plotter-Specific Features
*   **Layering**: Most generators support a `Colors` parameter. This splits the output into separate SVG layers (groups), allowing for multi-color plotting by pausing and swapping pens.
*   **Clean Paths**: Algorithms are tuned to produce clean paths minimizing pen-up/pen-down movements where possible.
