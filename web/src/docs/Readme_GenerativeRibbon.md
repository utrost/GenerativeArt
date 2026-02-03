# Generative Ribbon

**Generative Ribbon** creates complex, twisting 3D-like structures by lofting thousands of thin lines. The visual effect relies on Moiré interference patterns created by the overlapping strokes.

## Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **Lines** | `Integer` | The density of the ribbon. <br>• **High (6000+):** Creates smooth gradients and strong 3D/Moiré effects.<br>• **Low (~2000):** Creates a wireframe or skeletal look. |
| **Length (Max T)** | `Double` | The total length of the ribbon. Increasing this adds more loops and folds to the structure. |
| **Scale** | `Double` | Zoom level. Increase this if the ribbon looks too small in the center of the canvas. |

## Tips
*   This generator produces very dense SVGs. If you plan to plot this with a pen plotter, significantly **reduce the Line count** (e.g., to 2000) to avoid tearing the paper.
*   The "twisting" behavior is mathematically hardcoded to create pleasing loops, but changing the **Scale** can reveal different details.