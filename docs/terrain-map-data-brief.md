# Terrain map data: rivers, lakes, coastlines, elevation — brief for Codex

Written 20 October 2026 by Claude. This is the data for the next terrain upgrade (the owner approved the order:
rivers and lakes, softer land-type edges, real coastlines, mountains from real elevation, night lights). Claude draws
it in the cockpit; **this task is only the data**, shrunk into small static files the app can load, like your earlier
land-cover work (`src/data/world/land-cover.ts`, `src/lib/live-room/land-cover.ts` — read them first for the style).
Claude reviews the branch.

## Rules

- Branch `codex/terrain-map-data` from `origin/main`. One local commit per numbered item, message starting
  `Map data N:`. No push, no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing
  `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file:
  `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- **Never** run `pnpm install`; no new dependencies. Generation scripts may download public-domain data **while you
  run them** (Natural Earth is public domain; NASA/NOAA/USGS elevation sets are free), but the app itself must never
  download anything: the committed output is static data. Put scripts in `scripts/` and say in each file header where
  the data came from and its licence.
- **Do not touch** `src/components/live-room/`, `src/components/session/live-room/`. New data in `src/data/world/`, small
  lookup helpers in `src/lib/live-room/` **new files only** (do not edit existing files there), tests in
  `src/__tests__/lib/`.
- **Size budget:** every data file is loaded in the browser. Keep each under about 250 KB (gzipped well under 100 KB);
  lazy-loaded with `import()` like `countries-110m.json`. Coarse is fine: the plane is 8 km up and the view is about
  150 km wide. Simplify lines (Douglas-Peucker) and round coordinates to 2 decimals (about 1 km).
- Watch the **180° line** (Fiji, Russia, the Aleutians): a shape crossing it must not become a band round the world (see
  `toShapes` in `src/lib/live-room/places-below.ts` for how the country outlines handle it now).

## The work

1. **Rivers** — the world's major rivers as simplified lines (Natural Earth 1:10m or 1:50m rivers, scale rank ≤ 6 or
   so: the Nile, Amazon, Mississippi, Yangtze, Mekong, Danube, Rhine, Ganges, Volga, Congo, Niger, Murray...), each
   with its name and a width class (1 great, 2 big, 3 medium). File `src/data/world/rivers.ts` (or `.json`) plus
   `src/lib/live-room/rivers.ts` with `riversNear(p: LatLng, km: number)` returning the river segments within that
   distance (already cut to that box), so the cockpit can draw what is below and ahead.
2. **Lakes** — the major lakes as simplified polygons (Natural Earth lakes, the big ones: the Great Lakes, Victoria,
   Baikal, Titicaca, Ladoga, Tanganyika, the Caspian...), with names. `src/data/world/lakes.ts` and `lakesNear(p, km)`.
3. **Coastlines** — the land/sea edge good enough to say, for any point, which way the coast runs and where it is:
   Natural Earth 1:50m land (or 1:10m simplified), as polygons. Helper `coastNear(p, km)` returning the coastline
   segments within that distance (the cockpit will draw the shore at its real angle). Islands count (small ones too,
   above ~5 km across).
4. **Elevation** — a coarse world elevation grid (about 0.25° or 0.5° cells, metres, sea = 0 or negative), e.g. from
   ETOPO1 or GEBCO downsampled, packed compactly (e.g. one byte per cell on a non-linear scale, or Int16 base64).
   Helper `elevationAt(p: LatLng): number` (metres, bilinear). This places mountains where the real ones are.
5. **Tests** — each helper: known answers (the Nile near Luxor, Lake Victoria near Kampala, the coast near Sydney runs
   roughly north-south, elevation over the Tibetan Plateau above 4000 m and over the Netherlands near 0, a point near
   the 180° line in Fiji not giving a band round the world), file sizes under the budget.

## Report back

For each item: the commit, the files and their sizes, the source and licence, how much you simplified it, and anything
you could not do as written. Do not claim it looks right in the cockpit; Claude will draw it.
