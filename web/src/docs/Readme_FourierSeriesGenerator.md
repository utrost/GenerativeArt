# Fourier Series Generator

This generator visualizes the mathematical concept of Fourier Series approximation. A Fourier Series represents a periodic function as a sum of simple sine waves. By adding more terms (harmonics) to the series, the sum converges closer and closer to the target waveform.

The visual output is a "stacked plot" or "waterfall plot", where each line represents an approximation with an increasing number of terms. The top lines are simple smooth curves (few terms), while the bottom lines become sharper and more defined (many terms), eventually taking the shape of the selected waveform.

## Parameters

*   **Waveform**: Select from the dropdown list.
    *   `Square`: Converges to a square wave (switching between high and low). Uses odd harmonics: $\sum_{k=1,3,5...} \frac{\sin(kx)}{k}$
    *   `Triangle`: Converges to a triangle wave (linear ramp up and down). Uses odd harmonics with alternating signs and faster decay: $\sum_{k=1,3,5...} (-1)^{\frac{k-1}{2}} \frac{\sin(kx)}{k^2}$
    *   `Sawtooth`: Converges to a sawtooth wave (ramp up, drop down). Uses all integer harmonics: $\sum_{k=1,2,3...} (-1)^{k+1} \frac{\sin(kx)}{k}$

*   **Line Count**: The number of lines to draw. This also corresponds to the maximum number of terms used in the bottom-most line. Ideally between 20 and 50 for a good visualization of convergence.

*   **Amplitude**: The vertical height of the waves.

*   **Frequency**: The number of full cycles shown across the width of the canvas.

*   **Vertical Spacing**: The vertical distance between each successive line in the stack.

## Technical Details

The generator iterates from `i = 0` to `Line Count - 1`. For each line `i`, it calculates the partial sum of the Fourier Series using the first `i + 1` non-zero terms.

For example, with a Square wave:
*   Line 1 (i=0): Uses 1 term ($k=1$). Result is a pure sine wave.
*   Line 2 (i=1): Uses 2 terms ($k=1, 3$). Result begins to flatten at peaks.
*   ...
*   Line 20 (i=19): Uses 20 terms. Result looks very box-like.

## Tips
*   Use a low `Frequency` (e.g., 1 or 2) to clearly see the shape of the wave.
*   Increase `Line Count` to see a smoother transition from sine to complex wave.
*   The `Sawtooth` wave has the slowest convergence and often shows "Gibbs Phenomenon" (overshoot at the jump discontinuities) clearly.
