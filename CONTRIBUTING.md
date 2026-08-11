# Contributing to Generative Art Framework

## Development Setup

```bash
cd web
npm install
npm run dev
```

The project is web-only. Generators live in `web/src/generators/` and produce SVG for preview/download.

## Adding a New Generator

1. Create `web/src/generators/YourGenerator.js`.
2. Implement the generator interface used by the existing files:
   - `getId()`
   - `getDisplayName()`
   - `getParameterDefinitions()`
   - `generate(params)`
   - optional `onParameterChanged(...)` for presets or linked controls
3. Add help text in `web/src/docs/Readme_YourGenerator.md`.
4. Register the generator in `web/src/generators/generatorRegistry.js`.
5. Add focused tests for geometry, bounds, presets, or performance when the generator has behavior beyond the shared registry/all-generator contracts.

The shared registry tests expect every registered generator to have matching help documentation, so missing or misnamed `Readme_*.md` files fail `npm test`.

## Running Tests

```bash
cd web
npm test
```

Before submitting changes, also run:

```bash
cd web
npm run build
```

## Code Style

- Vanilla JavaScript using ES modules.
- Keep generators deterministic where possible; expose a `seed` parameter for random-looking work.
- Prefer SVG paths/lines suitable for pen plotting over raster effects.
- Keep parameter names stable once used by presets or shared examples.

## Commit Messages

Use conventional prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
