# Country items for every country on a route (brief for Sol)

Written 27 October 2026 by Claude for Matt (the owner). **Data only.** Claude reviews and wires it in.

## Why

In flight, when the class talks about the country below, the teacher taps "We talked about [country]" and the class
earns that country's item for the cabin shelf (and students can hold it up in selfies). Today only **39 countries**
have an item (`src/data/world-flight/country-items.ts`), so over most countries nothing can be earned. Matt approved the
current list's style: **objects, not clothing**, respectful, accurate, one fun fact each.

## The work

1. **Find every country that real routes fly over.** Real routes: every pair of cities in
   `WORLD_DESTINATIONS` (`src/data/world-flight/destinations.ts`) within the longest range in
   `WORLD_FLIGHT_RANGE_TIERS` (`src/lib/world-flight/progression.ts`), both directions. Sample each great-circle route
   (`greatCirclePoint` in `src/lib/live-room/route-terrain.ts`) every ~25 km and look up the country with `countryAt`
   (`src/lib/live-room/places-below.ts`, shapes from `src/data/world/countries-110m.json`). Use the country **names
   exactly as in that file** (e.g. "United States of America"). List each country with how many routes cross it.
2. **Add an item for every country crossed by at least one route** that does not have one yet, in the same shape:
   `{ country, item, sticker, fact }`.
   - `item`: an object strongly associated with the country (food, craft, instrument, animal, transport, landmark
     model). No clothing or national dress, no stereotypes, no religious objects, nothing political or disputed.
   - `sticker`: an existing sticker id from `public/stickers/` (587 drawn stickers; check the file exists). Prefer an
     exact match; a close, honest match is fine (e.g. "teapot" for a tea-drinking culture's teapot). If nothing fits,
     use `null` and add an `artPrompt` field: "sticker-style ..., no text, no people's faces".
   - `fact`: one plain, true sentence a 10-year-old could understand.
   - Avoid repeating an item already used for a neighbour where a more specific one exists.
3. Keep the existing 39 items exactly as they are.

## Output

- Update `src/data/world-flight/country-items.ts` (append; keep the existing order, then new ones alphabetically).
- Add `artPrompt?: string` to the `CountryItem` interface if you use it.
- A test: every route-crossed country has an item; every sticker id exists; facts are one sentence; no duplicate
  countries.
- `docs/country-items-review.md`: a table of the new items (country, routes crossing, item, sticker or art prompt, fact)
  for Matt's review, with anything uncertain marked.

## Rules

- Branch `codex/country-items-v2` from `origin/main`. One local commit (`Country items v2:`). No push, no merge. Stage
  only your own files, never `git add -A`. **Never run `pnpm install` or any install in the repo** (use a tools folder
  outside the repo if you need a helper script, as before).
- Edit only: `src/data/world-flight/country-items.ts`, a test in `src/__tests__/lib/`, `docs/country-items-review.md`.
- Checks: `npx tsc --noEmit -p .` (missing `@mozilla/readability` is known), `pnpm next lint --file <changed>`,
  `pnpm test`. True facts only.

## Report back

The commit, how many countries routes cross, how many items were added, how many use an existing sticker vs an art
prompt, and the review doc path.
