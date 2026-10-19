# Terrain data sources

Selected 19 October 2026. This is a static educational approximation, not a navigation map.
All downloads happen in local build scripts; the application makes no data-service calls.

## Land cover

Use **MODIS MCD12Q1 Collection 6.1, IGBP, year 2024**, through NASA GIBS's public
`MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual` WMS layer. The native product is
500 m; the shipped grid is 0.5 degrees (720 columns by 360 rows), north to south,
west to east. Each cell samples the categorical browse layer at its centre. This
is deliberately a browse-derived approximation, not an aggregation of the native
science pixels. A half-degree cell can miss a city, small island or narrow wetland.

- [GIBS layer metadata (product and version)](https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual.json)
- [IGBP colour table (source values and labels)](https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_IGBP_Land_Cover_Type.xml)
- [MODIS land-cover user guide](https://www.earthdata.nasa.gov/s3fs-public/2025-04/MCD12_User_Guide_V6.pdf)
- [NASA data use policy](https://www.earthdata.nasa.gov/engage/open-data-services-software/data-use-policy)

Licence: NASA-led mission data without a separate restriction are **CC0** under
the linked policy; commercial use is permitted. Credit NASA without suggesting
endorsement. Attribution: **Land cover derived from NASA MODIS MCD12Q1 V061
(2024), distributed by NASA EOSDIS GIBS; adapted for a 0.5-degree teaching grid.**

Why: one modest public download, no Earthdata login or additional libraries, a
documented categorical legend, and global coverage. Native MCD12Q1/MCD12C1
science downloads usually require Earthdata access and HDF tooling. ESA WorldCover
is finer than needed and requires many tiles. NEO's former easy CSV service was
[decommissioned in September 2026](https://science.nasa.gov/earth/nasa-earth-observations-neo/).

### Mapping and limits

IGBP water becomes `ocean` (including inland water); snow/ice becomes `ice`;
wetlands, croplands/mosaics, urban, savannas and grasslands map to their corresponding
classes. Evergreen broadleaf forest within 25 degrees of the equator is called
`rainforest`; other broadleaf/mixed forest is `forest`. Needleleaf forest north of
45 degrees is `boreal-forest`. Shrublands/grassland north of 60 degrees are called
`tundra`; other shrubland is `grassland`. These latitude refinements are explicitly
heuristics, not extra satellite classes. Barren becomes `desert`.

Natural Earth range polygons add `mountains` at cell centres, except over water,
ice, wetlands, cropland or city. Natural Earth's named salt deserts (names beginning
Salar, Salina or Salt) refine barren cells to `salt-flats`. This avoids interpreting
all barren ground as sand and does not overwrite observed productive land.

IGBP cannot distinguish rice from other crops: `rice-paddies` is reserved in the
legend but not generated. Agricultural parts of the Mekong delta remain `farmland`;
only source-classified wetlands are `wetlands`. Salt flats and mountains use
generalised cartographic regions, not measured salinity or elevation. No test-point
patches or manually painted biome boxes are used. Unclassified land or unexpected
colours cause the build to fail rather than silently inventing a class. Transparent
GIBS background is water; Antarctic land south of the product coverage is ice.

## Named geography and mountain/salt refinements

**Natural Earth vector release v5.1.2**, 1:10 million geography regions polygons,
marine polygons and reefs. Per-layer revision numbers may differ from the release.
Pinned upstream: [Natural Earth v5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2).
Licence: **public domain**, including commercial use and modification;
[terms](https://www.naturalearthdata.com/about/terms-of-use/).
Attribution: **Made with Natural Earth. Free vector and raster map data at naturalearthdata.com.**

Named polygons are simplified, retain holes, and use actual polygon membership,
not their bounding rectangles. Very small islands and reefs can disappear during
simplification; named features are teaching labels rather than surveyed boundaries.
Volcano/canyon facts and approximate coordinates are a separately maintained,
original editorial list; their radii are explicit teaching proximity zones.

## Reproduction

Run `npx tsx scripts/build-land-cover.ts` from the repository root. Downloads and
SHA-256 provenance manifests are cached outside the repo under
`C:/Users/insig/Documents/Codex/_outputs/terrain-source-cache` by default; pass
`--cache <directory>` for another location. A cached rebuild needs no network.
The scripts verify pinned source hashes and reject malformed inputs. Generated
TypeScript headers record provenance; only compact derived files are committed.
