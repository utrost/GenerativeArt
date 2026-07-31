# Generator Library

The generator list is now a small browser shared by desktop and mobile.

## Desktop

The left sidebar contains:

- Search across generator names, descriptions, categories, and tags.
- Category chips for visual families such as line fields, geometry, organic systems, math/physics, constructed systems, and plotter studies.
- A random button that chooses from the current search/category result.
- Favorites and Recent sections stored in browser `localStorage`.
- Generator cards with short descriptions and tags.

## Mobile

The mobile toolbar opens a generator picker bottom sheet instead of using a long native select. The sheet contains the same search, categories, favorites, recent items, and generator cards as the desktop sidebar.

## Registry

Generator metadata lives in `web/src/generators/generatorRegistry.js`. Add new generators there with:

- factory function,
- category,
- tags,
- short description.

The desktop app, mobile app, and registry tests all read from the same source so the generator count and browsing metadata stay aligned.
