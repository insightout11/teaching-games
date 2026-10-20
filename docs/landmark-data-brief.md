# Landmark Quest data (and one bug) — brief for Codex

Written 20 October 2026 by Claude. Background: `docs/landmark-quest-concept-oct-2026.md` (read it first). Classes see
real landmarks in the scenery along their real flight route, and the teacher photographs them into a class album.
Claude draws the landmarks (`src/components/live-room/flight/world-landmarks.ts`); **this task is the data behind them**
plus one small bug. Claude reviews the branch; the owner tests in real classes.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), one shared screen. Never answers or private
  information on it. No pair work, ever. Lucide icons only, never emoji. Short, plain wording.
- Junior classes (`classes.junior`) are never ranked and need very little reading.

## Rules

- Branch `codex/landmark-data` from `origin/main`. One local commit per numbered item, message starting
  `Landmark data N:`. No push, no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing
  `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file:
  `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- **Never** run `pnpm install`. **Do not touch** `src/components/live-room/`, `src/components/session/live-room/` or
  `src/lib/live-room/` (Claude is working there). New data goes in `src/data/world/`; tests in `src/__tests__/lib/`.
- Facts must be **true and checkable** (Wikipedia-level), in simple English. No invented numbers. When unsure, leave
  the field out rather than guess.

## The work

0. **Grammar Spotlight shows its rule card twice** (`src/activities/grammar-spotlight/`). Find why the rule card
   appears twice in one round (the shared screen and/or the phone), fix it with the smallest change, add a test if the
   logic is testable. Report what caused it.

1. **The landmark catalogue** — `src/data/world/landmark-catalog.ts`. One entry per landmark that can come up on a
   route: the 30 sights and 15 mountains in `src/data/world/named-features.ts` (kinds `sight` and `mountain`) and the
   40 volcanoes and canyons in `TEACHING_LANDMARKS` (`src/data/world/named-regions.ts`). Merge duplicates (Fuji, the
   Grand Canyon...). Each entry:
   - `id` (kebab-case), `name` (as the class sees it, "Mount Fuji", "the Pyramids of Giza"), `country`, `lat`, `lng`
     (the landmark itself, good to ~1 km), `heightM` (summit height for mountains and volcanoes; omit for others).
   - `shape`: which drawing it uses. Hand-made ids for the ones Claude draws by hand (`fuji`, `pyramids`, `everest`,
     `matterhorn`, `kilimanjaro`, `niagara`, and later others), otherwise one of the shared shapes: `volcano`,
     `peak`, `canyon`, `waterfall`, `rock` (Uluru-like), `ruins`, `building`, `reef`, `flat` (salt flats, deltas,
     anything seen as a patch of ground).
   - `look` for the shared shapes, only the fields that apply: `snowLine` (0 none … 1 summit only; tropical
     volcanoes mostly 0), `steam` (true for active volcanoes that usually show a plume), `crater` (true/false),
     `steep` (0.5 gentle … 1.5 steep), `colour` (one of `dark-lava`, `red-rock`, `grey-rock`, `green`, `white`,
     `sand`), `width` (rough footprint in km).
   - `facts`: three levels, each 3 short true facts: `junior` (very easy, at most 8 words each), `core` (A2-B1),
     `advanced` (B2+, with real names and numbers).
   - `question`: one open question for the class (not a quiz question).
2. **Rare conditions** — `src/data/world/landmark-rare.ts`. For about 25 landmarks, the special photos a class could
   get by luck of the real weather and time: e.g. `{ landmark: 'norwegian-fjords', when: { timeOfDay: 'night',
   weather: 'aurora' }, title: 'The Northern Lights over the fjords' }`. Use only weather values the app already has
   (`src/components/world-flight/arrival-scene/weather.ts`: look at its types) and times `day | dusk | night | dawn`.
   Keep them plausible for the place (no aurora in Egypt, snow on the Great Wall in winter is fine).
3. **Tests** — `src/__tests__/lib/landmark-catalog.test.ts`: every entry has a valid shape, coordinates in range,
   three fact levels of three facts each, unique ids; every rare condition points at a real catalogue id and uses a
   real weather value; every `named-features` sight/mountain and every `TEACHING_LANDMARKS` entry is in the catalogue
   (by name). Avoid exact-count assertions that break when entries are added.

## Report back

For each item: the commit, the files changed, anything you could not do exactly as written (and why), and for item 0
the cause of the bug. List any facts you were unsure of and left out. Do not claim anything works in a real class.
