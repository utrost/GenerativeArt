# Penrose Tiling Generator

## Overview
Generates aperiodic Penrose tilings — mathematical patterns that fill the plane without ever repeating. Based on Roger Penrose's discovery, these tilings exhibit five-fold symmetry and fascinating self-similar properties. The algorithm uses Robinson triangle decomposition with recursive subdivision.

## Parameters

### Preset
*   **Description**: Predefined configurations for common Penrose patterns.
*   **Options**: Custom, Classic Kite & Dart, Thick Rhombus, Fine Detail, Sparse Stars

### Tile Type
*   **Description**: The type of Penrose tiling to generate.
*   **Options**:
    *   **Kite & Dart**: Uses thin Robinson triangles, producing the classic Penrose P2 tiling with kite and dart shapes.
    *   **Rhombus**: Uses thick Robinson triangles, producing the P3 tiling with thin and thick rhombuses.

### Subdivisions
*   **Description**: Number of recursive subdivision steps.
*   **Effect**:
    *   **Low (1-3)**: Large, clearly visible tiles with obvious geometric structure.
    *   **High (6-8)**: Very fine detail with thousands of tiny tiles. May be slower to render.

### Seed
*   **Description**: Random seed for variation in the initial configuration.

### Show Arcs
*   **Description**: When enabled, draws small circular arcs at tile vertices.
*   **Effect**: These arcs form the "Ammann bars" — continuous curves that highlight the quasiperiodic structure of the tiling.

### Colors
*   **Description**: Number of plotter layers. Tiles are assigned to layers by type (thin vs thick triangles), creating natural two-tone separation ideal for pen plotting.
