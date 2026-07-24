# Capsule Interference

A plotter-oriented study of parallel line bundles flowing around distributed guide circles. It is based on the simple observation that two or three clean geometric systems can produce a third visual object through overlap, density, and registration.

## Visual Model

The default **Circle route** mode distributes invisible guide circles across the page. A bundle of parallel plotted lines routes from circle 1 to circle 2 to circle 3, and so on, then closes back to circle 1. At each circle the bundle flows around the left or right side. The default color setup keeps every pen on the same guide route family, but phase-shifts the line offsets so later pens sit in the gaps of earlier pens.

The older **Point field** and **Capsule stacks** constructions remain available through **constructionMode**. The UI hides parameters that do not apply to the selected construction mode.

## Shared Parameters

- **Preset**: Starting composition.
- **constructionMode**: `Circle route`, `Point field`, or `Capsule stacks`.
- **Color layers**: Number of SVG pen layers to emit where the selected mode uses multiple colors.
- **Stroke width**: Preview stroke width only; the real width is your pen.
- **Seed**: Reproducible variant seed.

## Circle Route Parameters

- **Circle count**: Number of randomized invisible guide circles.
- **Circle diameter**: Base diameter of the circles the lines flow around.
- **Route side**: Whether the bundle flows left, right, or alternates around successive guide circles.
- **Line count**: Number of parallel routed lines.
- **Line spacing**: Distance between neighboring routed lines.
- **Layer placement**:
  - `Single pen`: draw one layer only.
  - `Interleaved layers`: divide the line spacing among color layers; with two colors, the second pen sits halfway into the gap.
  - `Overprint layers`: each pen uses the same offsets.
  - `Custom phase`: use **Layer phase**.
- **Layer phase**: Custom layer shift as a fraction of **Line spacing**. `0.5` puts a second color in the gap; around `0.33` works well for three colors.

Circle-route detours use cubic Bézier arcs rather than segmented polygons, so large circles stay visually round without needing hundreds of vertices.

## Point Field Parameters

- **Point count**: Number of distributed attractor points per color layer.
- **Field contours**: Number of isolines traced through each color field.
- **Field resolution**: Sampling grid resolution; higher values make smoother contours but more paths.
- **Field softness**: Influence radius around each point; higher values merge the flows more strongly.
- **Field color mode**: `Single pen` or `Independent layers`.

Point-field isolines are still polyline paths generated from a sampled scalar field.

## Capsule Stack Parameters

- **Stack count**: Number of overlapping rounded-rectangle contour stacks.
- **Contour count**: Number of nested outlines in each stack.
- **Line spacing**: Distance between neighboring contours.
- **Base width / Base height**: Outer size of the first contour.
- **Corner radius**: How pill-like the rounded rectangle becomes.
- **Rotation spread**: Total angular fan across the stacks.
- **Focus count / Focus spread**: Seeded construction centers used to avoid every variant orbiting the same two points.
- **Asymmetry**: Allows the fitted composition to sit away from the exact page center while staying inside margins.
- **Page fill**: Slightly backs off the fit so asymmetry has room to move the composition.
- **Jitter**: Seeded imperfection in position, size, and rotation.
- **Stack color mode**:
  - `Single pen`
  - `By stack`
  - `Contour bands`
  - `Stacked passes`
- **Registration offset**: Optional per-color offset when using stacked duplicated passes.

Capsule-stack rounded corners now use cubic Bézier curve commands instead of segmented corner polylines.

## Plotter Notes

- Use **Circle route** + **Interleaved layers** for red/blue lines that weave through the same whitespace system.
- Use **Overprint layers** when you want every pen to redraw the exact same route offsets.
- Use **Stacked passes** in **Capsule stacks** only when you deliberately want every contour redrawn by several pens with a small registration shift.
- If the circle-route drawing looks too dense, lower **Line count** or increase **Line spacing**.
- If capsule stacks look too symmetrical, increase **Jitter** or change **Seed**.
- The output is plain SVG paths with strokes only, so `vpype` can sort and scale it cleanly.
