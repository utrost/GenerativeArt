# Reaction Diffusion

**Reaction Diffusion (Gray-Scott)** simulates chemicals diffusing and reacting on a grid to create organic spots, stripes, and maze-like patterns. The output is vectorized using Marching Squares.

## Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **Feed Rate (f)** | `Double` | Rate at which chemical A is added. Slight changes (e.g., 0.055 vs 0.056) radically alter the pattern. |
| **Kill Rate (k)** | `Double` | Rate at which chemical B is removed. |
| **Iterations** | `Integer` | Simulation steps. Higher values (8000+) allow the pattern to grow and stabilize. |
| **Threshold** | `Double` | Iso-contour threshold (0.0 - 1.0). <br>• **Low (~0.2):** Thicker shapes, blobby.<br>• **High (~0.4):** Thin, skeletal lines. |
| **Scale** | `Integer` | Upscaling factor for the final SVG output. |

## Famous Presets (f, k)

| Pattern | Feed (f) | Kill (k) |
| :--- | :--- | :--- |
| **Coral / Mazes** | `0.055` | `0.062` |
| **Mitosis / Spots** | `0.035` | `0.060` |
| **Chaos / Holes** | `0.025` | `0.060` |
| **Fingerprints** | `0.030` | `0.062` |

> **Note:** This simulation is computationally expensive. High iterations will take a few seconds to process.