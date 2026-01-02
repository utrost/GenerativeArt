# Flow Field Generator

**Flow Field (Perlin)** generates organic, flowing lines that simulate fluid movement or wind. It uses Perlin noise to determine the angle of movement at every point on the canvas.

## Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **Particles** | `Integer` | The number of individual lines to draw. Higher values (e.g., 5000+) create denser, more detailed fields. |
| **Noise Scale** | `Double` | Controls the "zoom" of the noise pattern. <br>• **Low (0.001 - 0.005):** Smooth, sweeping curves.<br>• **High (0.02+):** Chaotic, scribbled textures. |
| **Step Length** | `Integer` | The length of each segment drawn in one step. Reducing this creates smoother curves but requires more steps. |
| **Max Steps** | `Integer` | How many steps a particle takes before stopping. Controls the length of the tails. |
| **Seed** | `Integer` | Random seed. Change this to see a completely different variation of the noise field. |

## Tips
*   **For "Hair" or "Fur" textures:** Use High Particles (5000+), Short Steps, and High Max Steps.
*   **For Abstract Maps:** Use Low Noise Scale (0.002) and Low Particles to trace major flow lines.
