# OSM tags for crops and plantations seen from a plane

Compiled 28 Oct 2026 by Gemini 3.8 Flash, checked by Claude: each wiki link below opens. One alternative Gemini proposed
(`crop=oil_palm`) has no wiki page and was removed. For Sol's round 8: draw real orchards, vineyards, paddies and
plantations where OSM maps them; elsewhere fall back to land cover plus the regional table
(`src/data/world-flight/regional-character.json`).

| Type | Tag(s) | From the air | Mapping quality |
|---|---|---|---|
| Vineyards | [`landuse=vineyard`](https://wiki.openstreetmap.org/wiki/Tag:landuse=vineyard) | Tight parallel "corduroy" rows, often along contours; rectangular plots with tracks. | Good in W/S Europe, California, South Africa, Australia, Chile; patchy elsewhere. |
| Olive groves | [`landuse=orchard`](https://wiki.openstreetmap.org/wiki/Tag:landuse=orchard) + [`trees=olive_trees`](https://wiki.openstreetmap.org/wiki/Key:trees) | Widely spaced grid of round silver-green crowns on pale or red earth. | Good in Mediterranean Europe; patchy in North Africa and the Levant; poor elsewhere. |
| Fruit orchards | `landuse=orchard` + `trees=apple_trees` / `citrus_trees` / … | Medium-density grids or hedgerows of bushy crowns; often windbreaks, sometimes netting. | `landuse=orchard` moderate–good in Europe and N America; the `trees=*` detail patchy. |
| Oil palm | `landuse=orchard` + `trees=oil_palms` | Huge dark-green star-crown grids, contour terraces, red-dirt roads. | Moderate–patchy in Malaysia/Indonesia (often just `farmland`/`forest`); poor in W Africa, Latin America. |
| Rice paddies | [`landuse=paddy`](https://wiki.openstreetmap.org/wiki/Tag:landuse=paddy), or `landuse=farmland` + [`crop=rice`](https://wiki.openstreetmap.org/wiki/Tag:crop=rice) | Mirror-like when flooded; terraces or small basins with raised banks; green then gold. | Good in Japan, Korea, Taiwan, Po valley, Valencia; patchy–poor in India, Bangladesh, mainland SE Asia, China. |
| Tea | `landuse=farmland` + [`crop=tea`](https://wiki.openstreetmap.org/wiki/Tag:crop=tea) (or `landuse=orchard` + `trees=tea_plants`) | Continuous bright green rounded shrub rows over steep slopes, fine paths, scattered shade trees. | Moderate–patchy in Sri Lanka, Kenya, Assam/Darjeeling; poor in China and SE Asia. |
| Conifer forest | `landuse=forest` + [`leaf_type=needleleaved`](https://wiki.openstreetmap.org/wiki/Key:leaf_type) | Dark, bristly canopy; plantations with straight edges and clear-cut patches. | Good in Scandinavia, central Europe, Baltics, parts of N America; patchy elsewhere. |
| Broadleaf forest | `landuse=forest` + `leaf_type=broadleaved` | Soft billowing canopy, lighter greens, autumn colour and winter bareness in temperate zones. | Good in W/C Europe; moderate in N America; poor in tropical rainforest belts. |
| Centre-pivot irrigation | `landuse=farmland` + [`irrigation=pivot`](https://wiki.openstreetmap.org/wiki/Tag:irrigation=pivot) | Crisp green circles or quarter-circles against dry ground. | Circles often traced (US Plains, Saudi Arabia, Spain, South Africa) but the tag itself is patchy; the round shape can be detected instead. |
| Greenhouses | [`landuse=greenhouse_horticulture`](https://wiki.openstreetmap.org/wiki/Tag:landuse=greenhouse_horticulture) | Shining white/silver "sea of plastic" or glass in rectangles. | Good in Almería and the Dutch Westland; patchy in East Asia; poor elsewhere. |

Rule for the renderer: OSM coverage is uneven, so the absence of a tag never means the crop is absent. Fill gaps from
land cover and the regional table, drawn as typical rather than placed as fact.
