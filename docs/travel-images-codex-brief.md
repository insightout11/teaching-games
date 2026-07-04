# Handoff Brief: Travel Anchor Images (dishes + attractions)

**Owner: Codex** · **Consumer: Claude (Travel menu + attraction board)** · Drafted 2026-07-04

## Why

World Flight is image-rich everywhere (destination `heroImage`, focus images — all licensed and credited) *except* the two places students make choices in the Travel arc: the **Local Table menu** and the **Out & About attraction cards** are text-only. A real photo of the dish or the place changes the quality of the discussion — students argue about what they can see.

The UI already renders these images when present (small thumbnails on the menu and attraction cards) and degrades gracefully when absent. This brief is the data side.

## What to add

Add an optional `image` to `TravelDish` and `TravelAttraction` in `src/lib/world-flight/types.ts`, reusing the existing `DestinationImage` type (same licensing/credit pattern as `heroImage` and focus images):

```ts
export interface TravelDish {
  // ...existing fields...
  image?: DestinationImage;
}
export interface TravelAttraction {
  // ...existing fields...
  image?: DestinationImage;
}
```

Then populate `image` for the dishes and attractions in `TRAVEL_ANCHORS_BY_DESTINATION`, **hero cities first** (the ones with the deepest curation — e.g. Dublin, Tokyo, Paris, London, New York), long tail over time.

## Quality bar

- **Same standards as `heroImage`/focus images**: openly licensed (Wikimedia Commons etc.), with `sourceName`, `sourceUrl`, `creator`, `license` filled in — these are projected to a class.
- The photo shows **the actual dish / the actual place** (a bowl of coddle, Trinity College's facade) — not a generic stock lookalike.
- Landscape-ish crops work best; the UI shows small square thumbnails (`focalPoint` supported if needed).

## Validation

Extend the `travelAnchors` validator in `src/data/world-flight/destinations.test.ts`: when `image` is present it must have a non-empty `url`, `alt`, `sourceName`, and `sourceUrl`.

## Boundary

Codex owns the type addition + data + validator. Claude's consumers read `image?.url` defensively (`buildTripMealContent`, `buildTripAttractionsContent`) and already render thumbnails when present — no Claude-side changes needed when the data lands.

## One line

Every hero-city dish and attraction gets a real, licensed photo; the Travel menu and attraction board light up automatically.
