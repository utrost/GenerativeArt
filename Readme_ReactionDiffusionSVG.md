# **Java Reaction-Diffusion Vectorizer**

A lightweight Java utility that simulates Gray-Scott reaction-diffusion dynamics and exports the results as scalable vector graphics (SVG) via Marching Squares.  
Designed for **Linocut**, **CNC**, and **Plotter** workflows.

## **Prerequisites**

* Java JDK 17+
* Bash (for the helper script)

## **Quick Start**

1. **Compile & Run** (using wrapper):  
   ./simulate.sh

   *Generates pattern\_200x200\_t0.25.svg*
2. Custom Parameters:  
   The wrapper accepts arguments for width, height, and threshold:  
   \# Higher resolution (400x400) and stricter threshold (0.3)  
   ./simulate.sh 400 400 0.3

3. **Manual Compilation**:  
   javac ReactionDiffusionSVG.java  
   java ReactionDiffusionSVG 300 300 0.25

## **Tuning Parameters**

### **The f (Feed) and k (Kill) Rates**

The pattern type is determined by the f and k variables inside the main loop of ReactionDiffusionSVG.java.

| Pattern | Feed (f) | Kill (k) | Notes |
| :---- | :---- | :---- | :---- |
| **Mitosis (Spots)** | 0.035 | 0.060 | Good for drilling/stippling. |
| **Coral (Mazes)** | 0.055 | 0.062 | Best for continuous line plotting. |
| **Chaos** | 0.025 | 0.060 | Unstable, flickering (used in the red square). |

### **Thresholding**

The DEFAULT\_THRESHOLD (0.25) controls the "thickness" of the vector shapes.

* **Lower (0.15 \- 0.20):** Thicker shapes, more merging.
* **Higher (0.30+):** Thinner, skeletal shapes. Breaks may occur.

## **CNC / Plotter Notes**

* **Stroke Width:** The SVG sets stroke-width="1.5" for screen visibility. Change this to 0.01mm or your tool diameter for CAM software.
* **Path Optimization:** The output uses segmented lines (M x y L x y). For pen plotters, open the SVG in **Inkscape** and apply Path \> Combine to reduce pen-up movements.