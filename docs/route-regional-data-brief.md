# Regional looks along the routes: data plan and Codex brief

Written 27 October 2026 by Claude for Matt (the owner). **Data and scripts only: no rendering, no class-facing change.**
Claude reviews afterwards; Matt reviews the regional style table for accuracy and respect.

## Why

The cockpit should show what is really below: palms and rice terraces in Bali, olive groves and terracotta roofs in
Italy, dark spruce in Norway, flat sand-coloured roofs and minarets in Egypt. The art direction (`docs/art-direction.md`:
vintage travel poster, dreamy, atmospheric) makes regions memorable through their trees, roofs and colours. The GPU
terrain (in testing) can draw thousands of trees and houses cheaply; it needs to know **what** to draw **where**. This
brief builds that knowledge as data.

## What the data must answer, anywhere along any route

For a point (lat, lng):

1. **Land:** forest, cropland, grassland, shrubland, built-up, bare/desert, wetland, water, snow/ice (and tree cover
   share if available).
2. **Ecoregion:** which ecoregion (e.g. "Sumatran lowland rain forests"), giving a **vegetation palette**: 2-4 tree or
   plant types to draw (e.g. coconut palm, banana, rainforest canopy; or olive, cypress, Aleppo pine; or spruce,
   birch).
3. **Climate:** Koppen-Geiger zone (drives vegetation, snow, colour).
4. **Crops** where cropland: the main crop pattern (rice paddies/terraces, wheat, maize, vineyards, olives, tea,
   palm oil, sugar cane), for field patterns.
5. **Settlement:** how built-up and how dense (none, scattered village, town, city), and where the villages and towns
   actually are (points, with a size class).
6. **Regional building style:** which of about 40-60 hand-curated styles applies (see the style table below), so a
   village is drawn with the right roofs, walls and signature building.
7. **Signature religious or civic building** for the style (spire, dome and minaret, pagoda, stupa, meru tower,
   none).

## Sources (free and open; check each licence and record the required credit)

| Need | Source | Notes |
|---|---|---|
| Land | ESA WorldCover 2021 (10 m) | CC-BY 4.0. Downsample to the grid below. |
| Ecoregions | RESOLVE Ecoregions 2017 (~846) | CC-BY 4.0. Polygons; rasterise to the grid. |
| Climate | Koppen-Geiger (Beck et al. 2023, 1 km) | CC-BY 4.0. |
| Crops | MapSPAM 2010/2020 or FAO GAEZ | Check licence; dominant crop per cell is enough. |
| Settlement density | GHSL built-up / settlement model (GHS-SMOD) | CC-BY 4.0. |
| Villages and towns | OpenStreetMap `place=village|town|city` | ODbL: credit OSM; keep only name-free points + size class, or names if the licence notes are added. |
| Places of worship mix | OpenStreetMap `amenity=place_of_worship` + `religion` | Only as an aggregate per region to check the style table, never per building. |

Do not use paid APIs or services that need keys. Download sources once to a local cache folder **outside the repo**
(e.g. `C:\Users\insig\Documents\Codex\_outputs\route-data-cache\`), never commit raw downloads.

## Output format (small, tiled, loaded only along the route)

- A **global grid at 0.1 degrees** (about 11 km), stored as **10 x 10 degree tiles** of small binary records, under
  `public/data/regional/` (one file per tile that contains land; skip pure ocean).
- Per cell: land class (uint8), tree cover share (uint8), ecoregion id (uint16), climate zone (uint8), crop pattern
  (uint8), settlement class (uint8), style id (uint8). Pack tightly; a tile should be well under 200 KB.
- **Total size budget: 15 MB for all tiles.** If over, coarsen remote areas (open ocean, ice caps, deep desert) first.
- Settlement points: per tile, a compact list of (lat, lng, size class, style id) for villages and towns; cap the count
  per tile sensibly (keep the larger ones), and say what was dropped.
- Lookup tables as JSON in `src/data/regional/`:
  - `ecoregions.json`: id -> name, biome, realm, vegetation palette (2-4 plant types from a fixed list, below).
  - `building-styles.json`: id -> the style table entries (below).
  - `crops.json`, `climate.json`: id -> name.
- A small loader `src/lib/regional/regional-data.ts`: `regionalAt(lat, lng)` (reads the tile, cached) and
  `settlementsNear(lat, lng, km)`. Tiles fetched lazily and only for tiles the route band touches.

### Fixed plant type list (vegetation palettes draw from these)

coconut palm, date palm, fan palm, banana, rainforest canopy, mangrove, bamboo, acacia, baobab, eucalyptus, olive,
cypress, Mediterranean pine, oak, beech, maple, birch, spruce, fir, larch, cactus, desert scrub, savanna grass,
tea bushes, rice paddies, rice terraces, vineyard rows, orchard rows, heather, tundra, cherry blossom.
(Add up to 10 more if clearly needed; say which and why.)

## The regional building style table (for Matt's review)

About 40-60 styles, each with: id, name, where it applies (countries, or provinces/states where a country has clearly
different regions), roof colour and form, wall colour and material, typical house shape and village layout, signature
building, and a one-line plain-English note. Examples of the level of detail wanted:

- **Balinese:** orange clay-tile and thatched roofs, walled family compounds, black volcanic-stone temples with tiered
  meru towers, villages among rice terraces. Applies to Bali (and Lombok's Balinese areas), not all of Indonesia.
- **Javanese:** clay-tile pitched roofs, joglo houses, mosques with domes and minarets.
- **Mediterranean (Italy, Spain, southern France):** terracotta roofs, cream and ochre walls, bell towers.
- **Greek island:** whitewashed cubes, blue domes.
- **North African / Middle Eastern:** flat roofs, sand and white walls, courtyards, minarets.
- **Japanese:** dark grey tiled roofs with curved eaves, wooden houses, pagodas and shrines.
- **Chinese (south / north):** curved grey tile roofs; courtyard houses in the north.
- **Scandinavian:** red and ochre wooden houses, white trim, stave churches in places.
- **Alpine:** chalets with wide low roofs and balconies.
- **Andean:** adobe walls, terracotta roofs, colonial churches.
- **Thai / Burmese:** steep layered temple roofs, gold stupas, stilt houses by water.
- **Rural East African:** round huts with conical thatch alongside tin-roofed houses.

Rules for the table: describe places respectfully and accurately, as they look today (not stereotypes or
costumes); where a region has modern towns, say so; mark anything uncertain for Matt to check.

## Script

`scripts/regional-data.ts` (run with `npx tsx scripts/regional-data.ts`): reads the cached sources, builds the grid
tiles, settlement points and lookup tables, prints a summary (tiles, sizes, cells per land class, styles used), and
writes a sample report for these real routes: Bali (Denpasar) to Tokyo, Rome to Athens, Cairo to Dubai, Oslo to
London, Bangkok to Hanoi, Nairobi to Cape Town (use whichever of these are real LessonCaptain routes; check
`src/data/world-flight/destinations.ts` and the route rarity data, and substitute real routes if needed).

## Rules

- Branch `codex/regional-data` from `origin/main`. One local commit per step (`Regional data N:`). No push, no merge.
  Stage only your own files; never `git add -A`. **Never run `pnpm install`**; if a needed package is missing, stop and
  say which one and why.
- Edit only: `scripts/regional-data.ts`, `src/lib/regional/`, `src/data/regional/`, `public/data/regional/`, tests in
  `src/__tests__/lib/`, and a `docs/regional-data-sources.md` with every source, version, licence and credit line.
- Checks: `npx tsc --noEmit -p .` (missing `@mozilla/readability` is known), `pnpm next lint --file <changed>`,
  `pnpm test`.

## Report back

1. Commits, files, total data size, size per tile (largest five).
2. The sources used, licences, and the credit lines to show in the app.
3. The full building style table (as a readable markdown table) for Matt's review.
4. For each sample route: a strip every 100 km listing land, ecoregion, vegetation palette, crop, settlement and style.
   Check by eye that Bali reads as Balinese, Java as Javanese, the Nile valley as farmland among desert, and so on.
5. Anything uncertain, coarse or wrong.

Do not claim it is drawn in class: rendering comes later, on the GPU terrain.
