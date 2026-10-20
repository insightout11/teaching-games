# Animals below the route (brief for Codex)

Written 20 October 2026 by Claude. Claude builds the display and reviews the branch; the owner tests in real classes.

## Why

During a flight, real things happening outside start the best conversations: the space station passing, a storm, a
volcano. Animals are next: "Below us right now, two million wildebeest are crossing the Serengeti." Kids love it, and it
is true only if the place and the season are right. This task builds the checked data; Claude shows it in the room.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. No pair work, ever: speaking is
  one student at a time while the class listens. Lucide icons only, never emoji. Short, plain wording.
- **Facts must be true and checkable.** No invented numbers. When unsure, leave it out and list it in your report.
  Calm and respectful about endangered animals and hunting: no graphic detail.

## Rules

- Branch `codex/animals-on-route` from `origin/main`. Make one local commit per numbered item, with the message starting
  `Animals N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
  The target is ES5: no `/u` regex, and no iterating a `Set` or `Map` directly.
- **Never** run `pnpm install`.
- **Do not edit** `src/components/live-room/`, `src/components/session/live-room/` or `src/lib/live-room/`. You may read
  them. Put new data in `src/data/world/` and a new lookup in `src/lib/animals-below.ts`.

## The work

1. **Migrations by place and season** (`src/data/world/animal-migrations.ts`). Cover the well-known, well-documented
   ones a flight could pass over. Some examples:
   - the Serengeti–Mara wildebeest;
   - humpback whales off eastern Australia, and grey whales along the Pacific coast of North America;
   - monarch butterflies in central Mexico;
   - Christmas Island red crabs;
   - sandhill cranes on the Platte River;
   - flamingos at Lake Natron or Lake Bogoria;
   - caribou in Alaska and Canada;
   - sardines off South Africa;
   - bar-headed geese over the Himalaya;
   - Arctic terns.

   For each migration, give:
   - the animal;
   - an area as one or more polygons in [lng, lat] (generous but honest: where you could really be above them);
   - the months it happens, which may wrap across the year;
   - whether it is on land or sea;
   - a one-line "below us right now" sentence;
   - 3 checked facts;
   - a 2 to 5 word photo search;
   - a source URL.

   About 25 to 40 entries, with no guesses.
2. **Animals that live below, year round** (`src/data/world/region-animals.ts`). For the ranked places in
   `docs/route-places.md` (countries, regions, oceans and seas), list 2 to 4 signature wild animals that really live there,
   each with one checked fact and a photo search. Cover the top 150 places in that list, and say where you stopped.
3. **Lookup** (`src/lib/animals-below.ts`):
   - `migrationsNear(point, date, km)`: migrations whose area is within `km` of the point and in season on that date.
   - `animalsOf(placeName)`: the year-round list, matching place names and aliases exactly, ignoring case and a leading
     "the".
4. **Tests.**
   - Every migration has a valid polygon, valid months, 3 facts, a photo search and a source.
   - Season wrap-around works (for example December to February).
   - Point-in-area and distance work.
   - Aliases don't collide.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- anything you could not do as written;
- the full list of migrations with their months and areas in words;
- where you stopped in item 2;
- every fact you were unsure of and left out.

Do not claim anything works in a real class.
