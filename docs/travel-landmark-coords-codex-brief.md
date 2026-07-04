# Handoff Brief: Landmark Coordinates (for the Directions game)

**Owner: Codex** · **Consumer: Claude (Find Your Way directions game)** · Drafted 2026-07-04

## Why

The Travel arc's **Find Your Way** directions game puts a real city street map on screen (OpenMapTiles, zoomed to street level) and has students give/follow directions to a real landmark, then drop a pin — scored by real-world distance (same engine as Radar Fix / World Lens). For that, each attraction needs a real **lat/lng**.

Right now `travelAnchors.attractions` has `name` / `whatItIs` / `whyVisit` but **no coordinates**. Please add them.

## What to add

Add `lat` and `lng` to the `TravelAttraction` type in `src/lib/world-flight/types.ts` (optional so existing entries still typecheck), and populate them for every attraction in `TRAVEL_ANCHORS_BY_DESTINATION`:

```ts
export interface TravelAttraction {
  id: string;
  name: string;
  whatItIs: string;
  whyVisit?: string;
  lat?: number;   // real latitude of the place
  lng?: number;   // real longitude of the place
  sourceUrl?: string;
  review: TravelAnchorReview;
}
```

- **Real coordinates of the actual place** (the landmark itself, not the city center). e.g. Senso-ji Temple → `35.7148, 139.7967`. Wikipedia's coordinates are fine.
- 4 decimal places is plenty.
- Every attraction that already exists should get coords.

## Validation

Extend the validator in `src/data/world-flight/destinations.test.ts`: every attraction should have finite `lat` in [-90, 90] and `lng` in [-180, 180], and all attractions in a city should sit within ~40 km of each other and of the city's `lat`/`lng` (a cheap sanity check that catches swapped/typo'd coords).

## Boundary

Codex owns the coords + validator (data). Claude owns the directions game that reads them. Claude has added interim coords for a few hero cities in `src/data/world-flight/city-landmarks.ts`; once attractions carry real coords, the game prefers those and the interim file can shrink.

## One line

Every attraction gets a real `lat`/`lng`, validated. Claude's directions game turns them into a real map round.
