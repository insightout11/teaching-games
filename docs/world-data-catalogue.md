# World data catalogue

One list of every world dataset LessonCaptain builds or uses for the flight terrain. Kept so the data could one day be
offered on its own (a stylised world kit or API; Matt, 29 Oct 2026). Rule: **every dataset gets a row here when it is
added or changed**: where it lives, source, licence, version, how it was built, and whether it could be redistributed.

Licence key: **open-credit** = free incl. commercial with attribution (redistributable). **share-alike** = derived data
must be released under the same open licence (OpenStreetMap ODbL), so keep it separate from anything sold.
**ours** = written by us (AI-assisted research with cited sources; needs a fact-check before selling as data).

| Dataset | Where | Source | Licence | Version / date | Built by | Sellable? |
|---|---|---|---|---|---|---|
| Regional character (205 regions: crops, months, tree colours, roofs, town layout, terrain notes) | `src/data/world-flight/regional-character.json` + `src/lib/world-flight/regional-character.ts` | AI research batches (DeepSeek, GLM), cited | ours | Oct 2026 | Claude merged + checker test | Yes, after fact-check |
| Vegetation structure (hedgerows, shelterbelts, belts, terraces, forest pattern per region) | in progress (scratchpad batches, will join the regional table) | DeepSeek research, cited | ours | Oct 2026 | Claude to merge | Yes, after fact-check |
| ISO 3166 country/subdivision reference | `scripts/data/iso-3166.json` | pycountry (ISO 3166) | open (LGPL tool; code list is public) | Oct 2026 | Claude | Reference only |
| Rivers (HydroRIVERS, 10° tiles, width classes) | `public/data/rivers/` (manifest with source sha256, LICENSE.txt) | HydroSHEDS, Lehner & Grill 2013 | open-credit | v1.0 | `scripts/build-river-tiles.py` | Yes, with credit |
| Day roads (motorway/trunk tiles) | Sol's worktree `public/data/poster-world/day-roads/` (not merged yet) | OpenStreetMap | **share-alike** | Oct 2026 | Sol | Only as open data |
| Settlement points (851,517), ecoregion plants, 53 building styles | Codex branch `codex/regional-data` | GHS / ecoregions / research (see branch SOURCES) | check per source | Oct 2026 | Codex | Check before use |
| Land cover fractions (tree/crop/built-up) | Sol's GPU terrain assets | ESA WorldCover | open-credit (CC BY 4.0) | 2021 | Sol | Yes, with credit |
| Resort coasts | requested (DeepSeek task 2) | research | ours | — | — | Yes, after check |

## Conventions
- One folder per dataset, with a `manifest.json` (version, source, checksum, counts) and a `LICENSE.txt` or `SOURCES.md`.
- Credits shown in the app where the data is drawn (e.g. `RIVER_CREDIT`).
- Never mix share-alike (OSM) data into files we might sell; keep it in its own tiles.
- AI-researched fields keep their `sources` and a confidence note.
