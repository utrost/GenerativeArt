# Generative Art Framework

**Repository:** [https://github.com/utrost/GenerativeArt](https://github.com/utrost/GenerativeArt)

**🌐 Live Demo:** [utrost.github.io/GenerativeArt](https://utrost.github.io/GenerativeArt/) · [simiono.com/genart](https://simiono.com/genart/)

A powerful, extensible framework for creating generative art, optimized for pen plotters (e.g., Axidraw). This project features two distinct interfaces:
1.  **Java Desktop App**: A robust Swing GUI for native performance and direct SVG generation.
2.  **Web Application**: A modern, interactive web interface built with Vite and vanilla JavaScript.

---

## 🎨 Available Generators

The framework currently includes **17 distinct generative algorithms**, all ported to both Java and Web versions:

1.  **Generative Ribbon**: Lofted 3D twisted ribbons using Moiré interference patterns.
2.  **Flow Fields (Perlin)**: Particle systems steered by noise fields for organic textures.
3.  **L-System Fractal**: Rule-based recursive fractals (e.g., Dragon Curve, Ferns).
4.  **Reaction Diffusion**: Simulates biological pattern formation (Gray-Scott model).
5.  **Harmonograph**: Simulates multi-pendulum mechanical drawings (Lissajous figures).
6.  **Phyllotaxis**: Nature-inspired sunflower spirals using the Golden Angle.
7.  **Strange Attractors**: Visualizes chaotic mathematical systems (Clifford Attractor).
8.  **Circle Packing**: Fills space with non-overlapping, growing bubbles.
9.  **Truchet Tiles**: Maze-like geometric tessellations.
10. **Twisted Moiré**: Interference patterns from overlapping distorted grids.
11. **Voronoi Ripples**: Concentric clipping patterns within Voronoi cells.
12. **Pipe Network**: Industrial pipe systems generated via Wave Function Collapse (WFC).
13. **Parametric Grid**: Ordered grids that decay into chaos.
14. **Magnetic Field**: Particle trajectories influenced by magnetic poles.
15. **Fourier Series**: Visualization of wave summation principles.
16. **Maze Generator**: Perfect solvable mazes using recursive backtracking.
17. **Spirograph**: Epicycloid and Hypocycloid curves.

---

## ☕ Java Application (Desktop)

The original Java application provides a robust environment for generating high-resolution SVGs.

### Prerequisites (Java)
*   **Java Development Kit (JDK) 17** or higher.
    *   *Verify:* `java -version`
*   **Maven 3.6+** (for building dependencies).
    *   *Verify:* `mvn -version`

### Installation & Running (Java)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/utrost/GenerativeArt.git
    cd GenerativeArt
    ```

2.  **Build the Project**
    We provide convenience scripts to handle compilation and dependencies for both Java and Web.
    *   **macOS / Linux**: `./build.sh`
    *   **Windows**: `build.bat`

    *Alternatively, you can build manually with Maven:*
    ```bash
    mvn clean compile
    ```

3.  **Run the Java App**
    *   **macOS / Linux**: `./start_swing.sh`
    *   **Windows**: `start_swing.bat`

### Java Features
*   **Swing GUI**: Clean, dark-mode interface using **FlatLaf**.
*   **Multi-Threading**: Background generation prevents UI freezing.
*   **Extensible**: Easily add new generators by implementing the `ArtGenerator` interface.

---

## 🌐 Web Application

The web version creates a modern, responsive experience accessible directly in the browser.

### Prerequisites (Web)
*   **Node.js** (v18 or higher recommended).
    *   *Verify:* `node -v`
*   **npm** (comes with Node.js).

### Installation & Running (Web)

1.  **Navigate to the Web Directory**
    ```bash
    cd web
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start Development Server**
    We provide a convenience script to start the web interface:
    *   **macOS / Linux**: `./start_web.sh`
    *   **Windows**: `start_web.bat`

    *Alternatively, you can run it manually:*
    ```bash
    npm run dev
    ```
    *   This will start a local server (usually at `http://localhost:5173`).
    *   Open your browser and navigate to the displayed URL.

4.  **Build for Production** (Optional)
    To create a static build for deployment (already handled by the root `build.sh`/`build.bat` scripts):
    ```bash
    npm run build
    ```
    The output will be in the `dist/` folder.

### Web Features
*   **Interactive UI**: Glassmorphism design with real-time feedback.
*   **Instant Preview**: Fast rendering using standard SVG DOM.
*   **Help System**: Integrated markdown manuals for each generator.
*   **Download**: One-click SVG download for plotting.

---

## 🛠 Plotter Optimization

Both versions of the application are designed with pen plotters in mind:
*   **Layering**: Most generators support a `Colors` parameter. This splits the output into separate SVG layers (`layer_1`, `layer_2`, etc.), allowing you to pause the plotter and swap pens for multi-color prints.
*   **Clean Paths**: Algorithms are tuned to minimize unnecessary pen-up/pen-down movements.
*   **Paper Sizes**: Native support for A4, A3, and Letter sizes ensures your design fits your physical media. Default is A4 Landscape.

---

## License

Copyright © 2025–2026 Uwe Trostheide

Licensed under the [GNU Affero General Public License v3.0](LICENSE).
