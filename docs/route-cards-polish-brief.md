# Polish the route-place cards (brief for Codex)

Written 21 October 2026 by Claude. The 300 route-place cards (`src/data/route-place-briefings.json`, from your
`codex/route-place-cards` work) are merged and used in real classes. Claude's review found three things to polish.
Claude reviews the branch; the owner tests in real classes.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. No pair work, ever: speaking is
  one student at a time while the class listens. Lucide icons only, never emoji.
- Junior and A1 classes need very little reading and very easy questions.
- **Facts must be true and checkable.** When unsure, leave it out and list it in your report.

## Rules

- Branch `codex/route-cards-polish` from `origin/main`. Make one local commit per numbered item, with the message starting
  `Cards polish N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
  The target is ES5.
- **Never** run `pnpm install`.
- Edit only `src/data/route-place-briefings.json`, your builder and data in `scripts/dev/`, and their tests.

## The work

1. **A1 questions a beginner can answer.** Every A1 question must be answerable in a few easy words by a young beginner:
   yes/no, either/or, "What colour…?", "Do you like…?", "Have you seen…?", "Which do you like more: … or …?".
   - Bad: "How could a long river help trade?"
   - Good: "Do you like boats?" or "Is the river long or short?"
   - Keep each question about its card's own fact.
2. **No repeated last sentence in B1.** Many B1 details end by repeating an earlier sentence in other words, for example
   "It links inland plains with the Gulf of Thailand. The river reaches the Gulf of Thailand." Replace the repeat with a
   new, checked fact, or drop it.
3. **The basics kids expect.** For each country, the cards should cover what a child would expect to hear (only where
   true and checkable):
   - its capital;
   - a famous animal;
   - a famous food;
   - one landmark.

   For example, China should mention Beijing and pandas. Add or swap a card so they are there, keeping 4 cards at A1 and
   5 at B1.
4. **Tests.**
   - A1 questions stay short and simple: at most 8 words, no "how could" or "why might".
   - No B1 detail repeats one of its own earlier sentences (normalised, similar wording).
   - Each country's cards mention its capital.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- anything you could not do as written;
- three sample countries printed in full at both levels;
- every fact you were unsure of and left out.

Do not claim anything works in a real class.
