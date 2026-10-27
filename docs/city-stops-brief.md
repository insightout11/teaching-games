# City stops and souvenirs from class votes (brief for Codex)

Written 27 October 2026 by Claude for Matt (the owner). **Data only.** Claude builds the room and phone features on top.
Needed for Matt's class on **Friday 7 November**: the class leaves **Dubai**, so cities reachable from Dubai come first.

## The feature (decided by Matt)

After landing, the class votes for one of four **stops** in the city. The winning stop launches a short role-play
(Scene Igniter) set there. When the scene is done, the class earns a souvenir from that stop:

| Stop | Scene (everyday English) | Reward |
|---|---|---|
| **restaurant** | ordering food, asking about dishes | a food item (class shelf) |
| **market** | haggling, asking about sizes and colours | an **accessory each student picks** for their own avatar (kept between lessons) |
| **station** | buying tickets, asking directions | a transport item (class shelf) |
| **sights** | describing a place, asking questions about it | a model, tile or magnet (class shelf) |

Accessories, never national dress or costumes. Respectful, accurate, as places are today.

## What to build: `src/data/world-flight/city-stops.json`

For **every city in `src/data/world-flight/city-packs.json`** (50), keyed by city id:

```json
{
  "dubai": {
    "restaurant": { "place": "a busy shawarma stall in Deira", "scene": "Order lunch for the group and ask what is in each dish.", "items": [ITEM, ITEM, ITEM] },
    "market":     { "place": "the textile souk", "scene": "Choose a souvenir to wear and agree on a fair price.", "items": [ACCESSORY, ACCESSORY, ACCESSORY] },
    "station":    { "place": "a metro station", "scene": "Buy tickets and ask how to get to the old town.", "items": [ITEM, ITEM, ITEM] },
    "sights":     { "place": "the creek with its abra boats", "scene": "Describe what you can see and ask the guide two questions.", "items": [ITEM, ITEM, ITEM] }
  }
}
```

- `place`: short, real and specific to the city (a real market, station, dish stall or sight), A2-B1 English.
- `scene`: one sentence describing what happens in the role-play; something students at A2-B1 can act out in about
  5 minutes.
- **ITEM** (restaurant, station, sights): `{ "id", "name", "description" (one plain sentence, a fact), "icon" (a
  lucide icon name used in city-packs, or null), "sticker" (an id from public/stickers that fits, or null),
  "artPrompt" (same style as city-packs: "sticker-style ..., no text, no people's faces"), "fromCityPacks" (the existing
  souvenir id if reused, else null) }`.
  **Reuse the existing city-pack souvenirs first** where they fit the stop; add new ones only to reach three.
- **ACCESSORY** (market): `{ "id", "name" (e.g. "Souk scarf"), "type" (one of: sun-hat, scarf, sunglasses, bag,
  bracelet, cap, badge, umbrella), "colors" ([main hex, accent hex] drawn from the city's real colours, e.g. Dubai
  sand gold and deep blue), "motif" (one short phrase: "a falcon pattern", "geometric tiles"), "description" (one
  sentence: why it fits the city) }`. Three per city, three **different** types per city.

## Also

- `src/lib/world-flight/city-stops.ts`: types and `cityStops(cityId)` returning the city's stops or null.
- A test that every city has all four stops, three items each, valid accessory types, valid hex colours, unique ids
  across all cities, and that every `fromCityPacks` id exists.
- `docs/city-stops-review.md`: a readable table per city (place, scene, the three items) for Matt's review, with
  anything uncertain marked.

## Order of work

1. First, the cities **reachable from Dubai** for a class's plane: use `WORLD_FLIGHT_RANGE_TIERS`
   (`src/lib/world-flight/progression.ts`) and the destinations, list every city within the longest tier's range of
   Dubai, and do those first (commit them as step 1).
2. Then the remaining cities (step 2).

## Rules

- Branch `codex/city-stops` from `origin/main`. One local commit per step (`City stops N:`). No push, no merge. Stage
  only your own files, never `git add -A`. **Never run `pnpm install` or any install in the repo.**
- Edit only: `src/data/world-flight/city-stops.json`, `src/lib/world-flight/city-stops.ts`, tests in
  `src/__tests__/lib/`, `docs/city-stops-review.md`. Do not edit `city-packs.json`.
- Checks before each commit: `npx tsc --noEmit -p .` (missing `@mozilla/readability` is known),
  `pnpm next lint --file <changed files>`, `pnpm test`.
- Facts must be true. Real places only. No made-up dishes, stations or sights.

## Report back

Commits, the list of Dubai-reachable cities, counts (items reused vs new), and the review doc path. Note anything you
were unsure about.
