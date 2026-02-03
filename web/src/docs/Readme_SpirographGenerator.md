# Spirograph (Hypo/Epitrochoid)

**Spirograph** simulates the geometric curves produced by a spirograph toy, where a smaller circle rolls inside (Hypotrochoid) or outside (Epitrochoid) a fixed larger circle. This creates intricate, floral, and symmetrical patterns.

## Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **Type** | `Selection` | **Hypotrochoid:** Circle rolls inside. <br>**Epitrochoid:** Circle rolls outside. |
| **Outer Radius (R)** | `Double` | Radius of the fixed outer circle. |
| **Inner Radius (r)** | `Double` | Radius of the moving rolling circle. |
| **Pen Offset (d)** | `Double` | Distance of the drawing pen from the center of the rolling circle. <br>• `d = r`: Cycloid (cusps on the circle). <br>• `d < r`: Curtate (loops). <br>• `d > r`: Prolate (extended loops). |
| **Revolutions** | `Double` | Total number of rotations the inner circle performs. Increase to close complex curves. |
| **Resolution** | `Double` | Step size for the drawing. Lower values yield smoother curves but larger file sizes. |
| **Colors** | `Integer` | Number of color layers to cycle through while drawing the curve. |

## Tips
*   **Symmetry:** Rational ratios between `R` and `r` create closed loops with n-fold symmetry. Irrational ratios create chaotic, space-filling curves.
*   **Visual Variety:** 
    *   Try `d > r` for "loopy" flower petals.
    *   Try `d < r` for softer, wave-like polygons.
*   **Plotting:** This generator creates a single continuous path (unless segmented by color), making it very efficient for plotters.
