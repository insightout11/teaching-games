# Brief for Terra: the regional character table

Written 28 Oct 2026 by Claude for Matt. **Data only, no rendering.** Sol will draw from this table later, in round 8.

## Why

The flight's new poster terrain shows real elevation, land cover and water everywhere. But every village and forest
looks the same worldwide. A landing in Bali should look like Bali: orange tile roofs, black volcanic stone and rice
terraces. Japan should show cherry blossom in April and red maples in November.

There is no global map of roof colours or tree species. So we need one table: for each region of the world, what its
buildings, plants and seasons typically look like **from a plane**. Sol's renderer looks up the region under the
plane and draws its character, mostly in the climb and descent, and at city stops.

## The rule: typical, never invented as fact

This table says what is **typical** of a region. It is never a claim about a specific spot. Each value must be true of
the region in general and backed by a source. If a region has no distinctive character for a field, leave it empty.
Do not pad it.

## Coverage

- **Every country in the world.** Small countries can share a region (e.g. the Baltic states). Large or varied
  countries are split into sub-regions where the look really changes. For example:
  - Indonesia: Bali / Java / Sumatra / Borneo / Papua;
  - Japan: Hokkaido / Honshu / Okinawa;
  - USA: New England / Southwest / Midwest / Pacific Northwest / Southeast / Alaska / Hawaii;
  - China, India, Brazil, Russia, Canada, Australia, Mexico: 3–6 each.
- Expect roughly **150–250 regions**.
- Each region is defined by ISO country codes, plus ISO 3166-2 subdivision codes for sub-regions, so the renderer can
  match the ground under the plane.

## The fields

One object per region:

```ts
interface RegionCharacter {
  id: string;                    // 'id-bali'
  name: string;                  // 'Bali'
  countries: string[];           // ISO 3166-1 alpha-2: ['ID']
  subdivisions?: string[];       // ISO 3166-2: ['ID-BA']
  hemisphere: 'N' | 'S';

  buildings: {
    roofColors: string[];        // hex, most common first, max 3: ['#c8643c', '#6b4a32']
    roofMaterial: string[];      // 'clay tile', 'thatch', 'flat concrete', 'corrugated metal', 'slate'
    roofShape: 'pitched' | 'steep' | 'flat' | 'hipped' | 'tiered' | 'mixed';
    wallColors: string[];        // hex, max 3
    wallMaterial: string[];      // 'black volcanic stone', 'whitewash', 'red-painted wood', 'mudbrick'
    villageLayout: 'walled compounds' | 'dense hill town' | 'scattered farms' | 'linear street' | 'grid' | 'courtyard blocks' | 'stilt houses' | 'mixed';
    density: 'sparse' | 'medium' | 'dense';
    signatureBuildings: string[]; // max 2, seen from above: 'meru tiered shrine', 'minaret', 'white church dome'
  };

  plants: {
    signatureTrees: Array<{
      name: string;              // 'cherry blossom'
      color: string;             // hex of the canopy as seen from above
      seasonColor?: { color: string; months: number[] };  // pink in [3, 4]
      where: 'hills' | 'valleys' | 'towns' | 'coast' | 'everywhere' | 'river banks';
    }>;                          // max 4
    signatureCrops: Array<{
      name: string;              // 'rice terraces', 'olive groves', 'tulip fields', 'vineyards', 'tea'
      pattern: 'terraces' | 'rows' | 'stripes' | 'patchwork' | 'circles' | 'scattered';
      colors: string[];          // hex; for stripes, all the colours
      months?: number[];         // when it shows (blank = all year)
    }>;                          // max 3
  };

  seasons: {
    snowMonths?: number[];       // months lowland snow is typical
    autumnColor?: { color: string; months: number[] };  // e.g. red maples [10, 11]
    wetGreen?: number[];         // months the land turns green (wet season)
    dryGold?: number[];          // months it turns gold or brown
  };

  sources: string[];             // URLs, at least 2 per region
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}
```

**Colours** must be what you'd see **from above at a distance**, softened, not close-up product colours. Sol will
pull them into the poster palette, but the hue must be right: terracotta orange, not red.

**Seasons are for the real class date.** Months are 1–12 for that region's own hemisphere. Spread varies with latitude:
for cherry blossom in Japan, give months per sub-region (Okinawa Jan–Feb, Honshu late Mar–Apr, Hokkaido May).

## Sources

Good sources:
- national tourism boards, UNESCO cultural landscape listings, encyclopedias;
- vernacular architecture references (e.g. the *Encyclopedia of Vernacular Architecture of the World*);
- agriculture statistics (FAO), Japan Meteorological Agency blossom dates;
- Wikipedia articles on regional architecture and crops, as a starting point only.

Not good enough on their own:
- travel blogs;
- AI summaries;
- your own general knowledge without a citation.

## Also, separately: OSM tags we can map for real

The renderer will draw the **real** orchards, vineyards and paddies where OpenStreetMap has them. Please list the OSM
tags and values that matter, with a rough global coverage note for each. For example:
- `landuse=orchard` + `trees=olive_trees`;
- `landuse=vineyard`;
- `crop=rice` / `landuse=paddy`;
- `landuse=farmland` + `crop=tea`;
- `trees=oil_palms`;
- `natural=wood` + `leaf_type`.

Put the list in a short `osm-crop-tags.md`. No downloading of OSM data in this round.

## Deliverables

1. `src/data/world-flight/regional-character.json`: an array of `RegionCharacter`.
2. `src/data/world-flight/regional-character.ts`: the type plus a typed export of the JSON.
3. `docs/osm-crop-tags.md`.
4. A validator script, `scripts/validate-regional-character.ts`, which checks:
   - every UN member country is covered exactly once, with no region overlapping another;
   - valid ISO codes;
   - hex colours, months 1–12, no more than the stated item counts;
   - at least 2 sources per region.
5. A report:
   - coverage;
   - the regions marked low confidence;
   - 10 sample regions for Matt to spot-check, chosen to be very different from each other: Bali, Japan (Honshu),
     Provence, Morocco, Norway, Kenya, Peru (Andes), the Gulf, the Netherlands, New England.

## Quality bar

- **Specific beats generic.** "Orange clay tile, black volcanic stone walls, walled compounds with tiered shrines" is
  right. "Traditional houses" is useless.
- **From the air.** Only things visible from a plane at 1–3 km. Skip door styles and interiors.
- **No stereotypes as fact.** Show what is common now, not a postcard from 1900. Many cities everywhere are now
  concrete and glass: say so (`'mixed'`, grey roofs). The traditional character goes where it's actually seen (villages,
  old towns).
- Keep it short. Sol needs drawable facts, not essays.

No installs, no commits, no pushes. Stop for review after the 10 sample regions are done, **before** filling in the
rest, so Matt can check the level of detail.
