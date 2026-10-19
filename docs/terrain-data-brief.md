# Real terrain data — brief for Codex

Written 19 October 2026 by Claude, for Phase 3.5 of `docs/design-direction-plan-v4.md` and
`docs/phase3-concept-oct-2026.md` (section 3.5). **Data and lookup only.** Do not change how the flight is drawn: Claude
wires the new data into the scenery afterwards.

## What it is for

During a lesson the room shows the real world under the plane (`src/lib/live-room/route-terrain.ts`, `terrainAt`). Today
that comes from 7 kinds of ground placed by a hand-made list of boxes (`REGIONS`) plus rough coastlines
(`src/lib/live-room/land-outlines.ts`). It is often wrong: farmland over rainforest, no savanna, no rice paddies, few
named ranges and deserts. The goal: **what the class sees below matches the real world**, from free data, with no live
calls and no running cost.

## Rules

- Branch `codex/terrain-data` from `origin/main`. One local commit per numbered item, message starting `Terrain N:`.
  No push, no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing
  `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file:
  `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- **Never** fetch data at runtime. Downloading happens once, in a local script, and the result is committed as a small
  static file.
- **Never** run `pnpm install` (the worktree's `node_modules` is shared). If a build script needs a package that is not
  installed, write the script without it (plain Node, `fetch`, `zlib`) or say so in the report.
- Licences: only data that is free to use commercially, with attribution. Record the source, version, licence and the
  attribution line in `docs/terrain-data-sources.md`.

## The work

1. **Choose the land-cover source** and write `docs/terrain-data-sources.md`: which dataset (for example ESA WorldCover,
   ESA CCI Land Cover, or NASA MODIS MCD12C1), its licence, resolution, and why. It must be free for commercial use with
   attribution. If the best source needs a login (NASA Earthdata), say so and choose one that doesn't, or tell the owner
   what to download by hand.

2. **Build script** `scripts/build-land-cover.ts` (run locally with `npx tsx`): downloads or reads the source, and writes
   a compact grid to `src/data/world/land-cover.ts`.
   - Grid: 0.5° or 1° cells (choose by size), one character per cell from a fixed alphabet, rows north to south, plus
     the legend. **Total file under 300 KB.** Run-length encoding is fine if you decode it once, lazily.
   - Classes (map the source's classes onto these): `ocean`, `ice`, `tundra`, `boreal-forest`, `forest`,
     `rainforest`, `savanna`, `grassland` (steppe), `farmland`, `rice-paddies` (where you can tell; otherwise leave as
     farmland and say so), `desert`, `salt-flats`, `wetlands`, `mountains` (from elevation or the source's own class),
     `city`.
   - Small features the grid will miss (volcanoes, canyons, reefs, deltas, tropical islands) are handled in item 4, not
     here.

3. **Lookup** `src/lib/live-room/land-cover.ts`:
   - `landCoverAt(p: LatLng): LandCover` (the class at that point; `LatLng` from `route-terrain.ts`).
   - `toSceneTerrain(c: LandCover): Terrain`: maps the new classes onto today's 7 (`Terrain` in
     `src/components/live-room/flight/cockpit-ground.tsx`) so nothing breaks until Claude adds the new scenery.
   - The data loads lazily (a dynamic import or a decode-once cache), so pages that never fly don't pay for it.
   - Tests in `src/__tests__/lib/land-cover.test.ts` with real points: the Amazon (rainforest), the Sahara (desert),
     the Serengeti (savanna), Siberia (boreal forest or tundra), the Mekong delta (rice paddies or wetlands), Kansas
     (farmland), Greenland's interior (ice), Salar de Uyuni (salt flats, if the grid can see it), the Himalaya
     (mountains), mid-Atlantic (ocean), Paris (city or farmland).

4. **Named places** from Natural Earth (already used for borders; public domain):
   - Mountain ranges, deserts, plains, plateaus, deltas, reefs and major islands from Natural Earth's
     geography regions and marine areas, simplified, written to `src/data/world/named-regions.ts` (under 200 KB).
   - Volcanoes and canyons that matter for kids (a short list, about 40, with coordinates and a one-line fact each) in
     the same file, kind `volcano` / `canyon`.
   - Lookup `namedRegionAt(p: LatLng): { name: string; kind: string } | null` in `land-cover.ts`, smallest region first
     (a range inside a desert wins).
   - Tests: the Andes, the Alps, the Sahara, the Gobi, the Great Barrier Reef, the Nile delta, Mount Etna (within its
     radius), the Grand Canyon.

5. **Compare with today:** a small script `scripts/compare-terrain.ts` that samples 20 real routes between the World Flight
   cities (`src/data/world-flight/` city list), and prints, for each, the old `terrainAt` result and the new
   `landCoverAt` + `namedRegionAt` at 10 points. Put the output in the report so Claude can judge the improvement.

**Do not** change `terrainAt`, the cockpit renderer, `cockpit-ground.tsx` scenery, or anything in `src/components/`.

## Report back

For each item: the commit, the files and their sizes, the data source and licence, and anything you could not do exactly
as written (and why). Include the comparison output from item 5. Do not claim anything works in the live room; it is not
wired in yet.
