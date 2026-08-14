# GenerativeArt Roadmap

**Last reviewed:** 2026-08-11  
**Evidence base:** repository `utrost/GenerativeArt` at commit `e1e2e17` (`fix: coalesce mobile art regeneration`).  
**Current health at review:** initial digest `npm test` passed 390/390 tests; after the first roadmap implementation slice, `npm test` passed 393/393 tests and `npm run build` succeeded; GitHub CI and Pages deploy were green for `e1e2e17`; live GitHub Pages rendered the app and generated SVG.

## Goal

Make GenerativeArt a dependable plotter-first SVG studio: easy to extend, easy to verify, pleasant on desktop/mobile, and honest about whether an exported SVG is ready for a real pen plotter.

## Product thesis

GenerativeArt should stay focused on **plotter-oriented generative SVG** rather than becoming a broad graphics sandbox. The strongest direction is the newer “physical mark-making / diagrammatic / paper artifact” family: Botanical Gesture, Paper Memory, Archive Shards, Resonant Topography, Thread Loom, Folded Crystal, Crumpled Mesh, and similar studies.

## Current state summary

- Web-only Vite app; former Java/Swing implementation is retired.
- 34 registered generators in `web/src/generators/generatorRegistry.js`.
- Desktop shell: `web/src/main.js`.
- Mobile shell: `web/src/mobile.js`.
- Core abstractions:
  - `web/src/core/Generator.js`
  - `web/src/core/ParameterDefinition.js`
  - `web/src/core/PaperSize.js`
  - `web/src/core/SvgCanvas.js`
  - `web/src/core/HelpSystem.js`
- Tests are substantial for a creative-code project: all generators are smoke-tested for IDs, metadata, parameter ranges, SVG output, and SVG dimensions.
- Deployments:
  - GitHub Pages uses `/GenerativeArt/` via workflow override.
  - simiono route uses `/genart/` via `web/vite.config.js`.

## Guiding principles

1. **Plotter-first:** SVG structure, layers, path counts, travel, bounds, and paper size matter more than visual novelty alone.
2. **One source of truth:** Generator metadata and wiring should not require repetitive edits in several files.
3. **Small tested slices:** Each code change should preserve `npm test` and `npm run build`.
4. **Docs reflect reality:** README, GitHub metadata, contribution docs, and in-app help should match actual code.
5. **Keep creative friction low:** Refactors should reduce generator-author overhead, not add ceremony.

---

# Phase 0 — Hygiene and alignment

**Purpose:** Remove immediate sources of confusion before larger architecture work.

**Exit criteria:** Docs and metadata match the current app; no stale setup instructions remain.

## Task 0.1 — Fix generator count and project metadata

**Objective:** Make public-facing descriptions match the actual 34-generator registry.

**Files / locations:**
- GitHub repository description: may still have a stale exact algorithm count.
- `README.md`: already says 34; keep as source text for the updated description.

**Steps:**
1. Run `gh repo view utrost/GenerativeArt --json description`.
2. If still stale, update description to mention 34 algorithms or avoid an exact count.
3. Verify with `gh repo view utrost/GenerativeArt --json description`.

**Suggested wording:**

```text
Plotter-oriented SVG generative art studio — 34 algorithms, Vite web app, PWA/mobile UI.
```

## Task 0.2 — Fix contribution instructions

**Objective:** Stop telling contributors to register generators in the wrong file.

**Files:**
- Modify: `CONTRIBUTING.md`

**Current issue:**
`CONTRIBUTING.md` says to register new generators in `web/src/main.js`, but current architecture uses `web/src/generators/generatorRegistry.js`.

**Steps:**
1. Change “Register the generator in `web/src/main.js`” to “Register the generator in `web/src/generators/generatorRegistry.js`.”
2. Mention that `web/src/generators/allGenerators.test.js` currently also needs the generator until Task 1.1 is complete.
3. Run `npm test` from `web/`.
4. Run `npm run build` from `web/`.

## Task 0.3 — Clarify working-copy discipline

**Objective:** Avoid implementing against stale or duplicate checkouts.

**Suggested action:**
Before editing, run `git status -sb`, `git fetch --prune`, and `git rev-parse --short HEAD` in the checkout being used. Prefer a clean working tree that matches `origin/main`, and note any duplicate/stale checkout risk before implementation.

---

# Phase 1 — Single source of truth for generators

**Purpose:** Make adding and maintaining generators safer.

**Exit criteria:** A generator is registered once, and tests/docs derive from that registry wherever practical.

## Task 1.1 — Make all-generator tests derive from the registry

**Objective:** Remove the duplicate import/list in `web/src/generators/allGenerators.test.js`.

**Files:**
- Modify: `web/src/generators/allGenerators.test.js`
- Possibly modify: `web/src/generators/generatorRegistry.js`

**Current issue:**
Each generator is imported in both `generatorRegistry.js` and `allGenerators.test.js`. This creates a predictable missed-wiring risk.

**Implementation sketch:**

```js
import { describe, it, expect } from 'vitest';
import { createGeneratorInstances } from './generatorRegistry.js';

const allGenerators = createGeneratorInstances();
```

Then keep the existing test body.

**Verification:**

```bash
cd web
npm test -- src/generators/allGenerators.test.js
npm test
npm run build
```

## Task 1.2 — Add a registry completeness test for docs

**Objective:** Make sure every registered generator has in-app help documentation.

**Files:**
- Add or modify: `web/src/generators/generatorRegistry.test.js`
- Possibly adjust: `web/src/core/HelpSystem.js`

**Desired behavior:**
For each registry entry, `HelpSystem.getHelpContent(entry.name)` should not return the “No Help Found” fallback.

**Verification:**

```bash
cd web
npm test -- src/generators/generatorRegistry.test.js
```

## Task 1.3 — Add a “new generator checklist” to docs

**Objective:** Make future generator additions mechanical.

**Files:**
- Modify: `CONTRIBUTING.md`
- Optional: create `docs/new-generator-checklist.md`

**Checklist should include:**
- Create generator class in `web/src/generators/`.
- Expose deterministic seed parameter where random-looking output is used.
- Add Markdown help in `web/src/docs/`.
- Register once in `web/src/generators/generatorRegistry.js`.
- Add focused tests for tricky geometry/bounds/performance if needed.
- Run `npm test` and `npm run build`.
- Browser-smoke at least one generated SVG.

---

# Phase 2 — Shared desktop/mobile app controller

**Purpose:** Reduce duplicated state and event logic while preserving separate layouts.

**Exit criteria:** Desktop and mobile still feel tailored, but core generator selection, parameter state, download, help, and generation scheduling live in shared modules.

## Task 2.1 — Extract generator session state

**Objective:** Move shared generator state into a small controller module.

**Files:**
- Create: `web/src/app/generatorSession.js`
- Modify: `web/src/main.js`
- Modify: `web/src/mobile.js`
- Add: `web/src/app/generatorSession.test.js`

**Responsibilities:**
- active generator
- current params
- current paper size
- reset params on generator change
- call `onParameterChanged(...)`
- expose current SVG generation function

**Non-goals:**
- Do not move DOM rendering into this module.
- Do not unify desktop/mobile layouts.

**Verification:**

```bash
cd web
npm test -- src/app/generatorSession.test.js
npm test
npm run build
```

## Task 2.2 — Extract shared SVG download helper

**Objective:** Avoid duplicated download logic between desktop and mobile.

**Files:**
- Create: `web/src/app/downloadSvg.js`
- Modify: `web/src/main.js`
- Modify: `web/src/mobile.js`
- Add: `web/src/app/downloadSvg.test.js`

**Acceptance criteria:**
- Download filename remains stable and useful.
- Downloaded content is the current SVG, not stale or empty UI text.
- Tests cover missing SVG/no-op behavior.

## Task 2.3 — Keep mobile-specific generation coalescing intentional

**Objective:** Preserve the recent mobile regeneration fix while making its boundary explicit.

**Files:**
- Modify: `web/src/mobile.js`
- Add or modify: `web/src/ui/mobile-layout.test.js` or a new app-level test.

**Acceptance criteria:**
- Rapid parameter changes coalesce into one final generation.
- Desktop remains immediate/debounced as currently intended.

---

# Phase 3 — Plotter readiness diagnostics

**Purpose:** Make the app more useful for real plotting, not just previewing.

**Exit criteria:** Users can see whether an SVG is simple, bounded, layered, and plotter-friendly before downloading.

## Task 3.1 — Add SVG metrics utility ✅

**Objective:** Compute lightweight plotter metrics from generated SVG content.

**Implemented files:**
- `web/src/core/SvgMetrics.js`
- `web/src/core/SvgMetrics.test.js`

**Initial metrics:**
- page width/height from SVG attributes/viewBox
- layer count
- element count by layer
- line count
- path count
- approximate drawn length for `<line>` and simple `M/L` path elements
- bounding box for parseable line/simple-path elements
- unparseable element count

**Boundary:**
- No full SVG path parser yet; curve/arc paths are counted as unparseable for length/bounds.
- SVGs without `layer_*` groups still get document-level drawable metrics.
- Nested groups inside `layer_*` groups are included in per-layer counts.
- Pen-up travel is intentionally not estimated in this slice.

**Verification completed:**

```bash
cd web
npm test -- src/core/SvgMetrics.test.js
npm test
npm run build
```

## Task 3.2 — Show export diagnostics in the UI ✅

**Objective:** Surface metrics near the Generate/Download controls.

**Files:**
- Modify: `web/src/main.js`
- Modify: `web/src/mobile.js`
- Modify: `web/src/ui/style.css`
- Modify: `web/src/ui/mobile.css`
- Add/modify tests as appropriate.

**UI copy example:**

```text
Layers: 3 · Elements: 842 · Parseable length: 18.4 m · Bounds: within page
```

**Acceptance criteria:**
- Empty/error state is clear.
- Metrics update after generation.
- Mobile UI stays compact.

**Implemented files:**
- `web/src/core/SvgDiagnostics.js`
- `web/src/core/SvgDiagnostics.test.js`
- `web/index.html`
- `web/mobile.html`
- `web/src/main.js`
- `web/src/mobile.js`
- `web/src/ui/style.css`
- `web/src/ui/mobile.css`
- `web/src/ui/style.test.js`
- `web/src/ui/mobile-layout.test.js`

**Implemented UI copy:**
- Desktop: `Layers: 0 · Elements: 5 · Parseable length: 406.3 m · Bounds: exceeds page`
- Mobile compact: `0 layers · 5 elems · 406.3 m · exceeds page`

**Verification completed:**

```bash
cd web
npm test -- src/core/SvgDiagnostics.test.js src/ui/style.test.js src/ui/mobile-layout.test.js
npm test
npm run build
```

Browser smoke verified desktop and mobile diagnostics update after generation. The mobile diagnostics line renders above the footer buttons without overlap; long text is intentionally single-line ellipsized on narrow screens.

## Task 3.3 — Add warnings for likely plotting problems

**Objective:** Warn before exporting SVGs that may be awkward to plot.

**Possible warnings:**
- bounds exceed page
- very high element count
- only one layer when generator claims multi-pen output
- many unparseable raw elements
- no drawable elements found

**Verification:**
Tests should cover warning thresholds with synthetic SVG strings.

---

# Phase 4 — Gallery and public face refresh

**Purpose:** Make the public README/showcase reflect the strongest current creative direction.

**Exit criteria:** README/gallery shows newer plotter-study generators, not only older/classic algorithms.

## Task 4.1 — Generate fresh gallery examples

**Objective:** Add representative images for the newer generators.

**Candidate generators:**
- Botanical Gesture
- Paper Memory
- Archive Shards
- Resonant Topography
- Thread Loom
- Folded Crystal
- Crumpled Mesh
- Fault Lines

**Files:**
- Add: `images/*.webp`
- Modify: `README.md`

**Acceptance criteria:**
- Images are exported from the current web app or deterministic script, not handwaved.
- Filenames are descriptive and stable.
- README gallery balances classic algorithms and newer plotter studies.

## Task 4.2 — Add “plotter-first” quickstart

**Objective:** Help a user go from web UI to plotted SVG.

**Files:**
- Modify: `README.md`
- Optional: create `docs/plotter-workflow.md`

**Content should cover:**
- choose paper size
- choose/generate seed or preset
- inspect layers
- download SVG
- optional `vpype` post-processing
- open in Inkscape/Axidraw-compatible tool
- pen-change notes

---

# Phase 5 — Release discipline

**Purpose:** Make the project easier to reference, share, and return to.

**Exit criteria:** There is a known-good tagged version with clear release notes.

## Task 5.1 — Create a first web-only release

**Objective:** Tag the current web-only era as a stable baseline.

**Files:**
- Modify: `CHANGELOG.md`
- GitHub release metadata

**Steps:**
1. Move relevant `[Unreleased]` items into a dated version section.
2. Decide version number, e.g. `v2.0.0` if treating Java retirement as a breaking change.
3. Tag and create GitHub release after CI is green.

**Verification:**

```bash
git status -sb
git tag --list 'v*'
gh release list --repo utrost/GenerativeArt
```

## Task 5.2 — Add release checklist

**Objective:** Make future releases repeatable.

**Files:**
- Create: `docs/release-checklist.md`

**Checklist:**
- `npm test`
- `npm run build`
- local browser smoke of `/genart/`
- GitHub Pages workflow green
- live URL smoke
- README generator count/gallery current
- CHANGELOG updated

---

# Suggested execution order

1. Phase 0 docs/metadata hygiene.
2. Task 1.1 registry-driven all-generator tests.
3. Task 1.2 docs completeness test.
4. Task 3.1 SVG metrics utility.
5. Task 3.2 UI diagnostics.
6. Phase 4 gallery refresh.
7. Phase 2 shared controller refactor, only when the next feature would otherwise duplicate desktop/mobile logic.
8. Phase 5 release discipline.

This order favors quick confidence and user-visible plotter value before deeper UI architecture work.

# Always-run verification

For any non-trivial change:

```bash
cd web
npm test
npm run build
```

For UI-affecting changes, also run a browser smoke:

1. Start preview or static server with the correct base path.
2. Open the app.
3. Generate the default generator.
4. Search/select at least one newer generator, e.g. Botanical Gesture.
5. Confirm SVG appears and the browser console has no relevant application errors.
6. If deployment changed, verify the live URL after GitHub Pages finishes.

