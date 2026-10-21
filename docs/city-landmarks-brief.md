# Landmarks by our cities (brief for Codex)

Written 21 October 2026 by Claude. Claude reviews the branch; the owner tests in real classes.

## Why

When a class takes off from a city with a drawn landmark close by (Giza from Cairo, Fuji from Tokyo), the windscreen
now shows that landmark slowly after the climb, so the class can take a photo for its album. This works only for
landmarks in `src/data/world/landmark-catalog.ts` whose shape is drawn in the scenery: `fuji`, `pyramids`, `everest`,
`matterhorn`, `kilimanjaro` and the shared `volcano` (see `DRAWN` in `src/lib/live-room/landmarks-ahead.ts`).
The goal is for more of our cities to have one.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. Junior and A1 classes need very
  little reading. No pair work, ever. Lucide icons only, never emoji.
- **Facts must be true and checkable.** When unsure, leave it out and list it in your report.

## Rules

- Branch `codex/city-landmarks` from `origin/main`. Make one local commit per numbered item, with the message starting
  `City landmarks N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
- **Never** run `pnpm install`.
- Edit only `src/data/world/landmark-catalog.ts`, a new script in `scripts/dev/`, and tests in `src/__tests__/lib/`.
  Do not change the renderer, the drawings or `landmarks-ahead.ts`.

## The work

1. **The report script.** Write `scripts/dev/city-landmarks-report.ts`. For every destination in
   `src/data/world-flight/destinations.ts`, list the catalogue landmarks within 150 km (great-circle distance), with
   their shape, their distance and whether that shape is drawn. Print a table and the cities with no drawn landmark
   in reach.
2. **New volcanoes and mountains near our cities.** For cities with nothing drawn in reach, add real landmarks within
   150 km that fit a drawn shape:
   - a volcano or volcanic cone → `volcano`, with a `look` (snow line, steam only where a plume is usual, crater, colour);
   - a lone snowy peak → `volcano` only if it is a volcano; otherwise leave it out (a general peak drawing comes later).

   Possible examples, each to be checked: Vesuvius (Naples), Popocatépetl (Mexico City), Mount Rainier (Seattle),
   Taal (Manila), Cotopaxi (Quito), Rangitoto (Auckland), Etna (Catania).
   - Use the catalogue's existing format, including `facts` at three levels (junior: three very short sentences),
     a `question`, `sources` and a `note` where needed.
   - Coordinates must be the summit, from a checkable source.
   - Do not add a landmark already in the catalogue under another name.
   - Do not describe current eruptions or danger levels.
3. **Tests.**
   - Every new landmark has valid coordinates, a drawn shape, three facts at each level and at least one source.
   - Junior facts are at most eight words each.
   - No two catalogue landmarks are within 1 km of each other.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- the full table from item 1 before and after;
- each new landmark with its source;
- anything you could not do as written;
- every fact you were unsure of and left out.

Do not claim anything works in a real class.
