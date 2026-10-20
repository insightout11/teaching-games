# World Quiz country data (brief for Codex)

Written 21 October 2026 by Claude. Claude built the World Quiz game (`src/games/world-quiz/`,
`src/lib/world-quiz/`): Flags, Shapes, Clue ladder and Postcards. The next modes need checked country data. Claude reviews
the branch and wires it in; the owner tests in real classes.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. No pair work. Lucide icons only,
  never emoji. Junior classes are never ranked.
- **Facts must be true and checkable,** with a source per number. When unsure, leave it out and list it in your report.
  Calm and neutral: no border politics. Disputed areas and territories are left out (see the list in
  `src/lib/world-quiz/countries.ts`).

## Rules

- Branch `codex/world-quiz-data` from `origin/main`. Make one local commit per numbered item, with the message starting
  `World data N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
  The target is ES5.
- **Never** run `pnpm install`.
- **Do not edit** `src/components/`, `src/games/`, `src/lib/live-room/` or `src/lib/world-quiz/`. Put new files in
  `src/data/world-quiz/`.

## The work

1. **Country facts** (`src/data/world-quiz/country-facts.ts`): for every country in `QUIZ_COUNTRIES` (by `iso2`), give:
   - capital;
   - population, as a recent official estimate with its year;
   - area in km²;
   - main languages;
   - "hello" in the main language, with a simple pronunciation for English speakers;
   - currency;
   - continent;
   - 3 neighbours, or "island" where it has none;
   - one famous food;
   - one famous animal;
   - one famous landmark;
   - a source URL for each number.
2. **Local flags** (`public/flags/<iso2>.svg`): public-domain national flag SVGs, so the quiz works without an outside
   service. Keep each file small. List the source of each.
3. **Question banks for the new modes** (`src/data/world-quiz/`):
   - **Which is bigger:** 60 pairs (population or area) with the real numbers, mixing easy and surprising ones. One line
     on why it is surprising.
   - **Capitals:** a question per country (A1 wording).
   - **Hello around the world:** a question per country, "This is how people say hello in…", with 3 wrong choices from
     the same continent.
   - **Pin drop places:** 80 famous places (landmarks, cities, natural wonders) with lat/lng, the country, and a one-line
     fact. Child-safe and well known.
4. **Tests.**
   - Every `QUIZ_COUNTRIES` entry has facts with sources.
   - Numbers are positive and of a sensible size.
   - Flags exist for every `iso2`.
   - No pair repeats.
   - Pin drop coordinates are valid.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- anything you could not do as written;
- any number you were unsure of and left out.

Do not claim anything works in a real class.
