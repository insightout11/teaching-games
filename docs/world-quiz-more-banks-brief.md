# World Quiz: three more question banks (brief for Codex)

Written 21 October 2026 by Claude. Your earlier World Quiz data (capitals, hello, which-is-bigger, pin drop, flags) is
merged and used in classes. Students love it. This adds three picture rounds kids ask for. Claude builds the game
modes; you prepare the data only. Claude reviews the branch; the owner tests in real classes.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. Students answer on phones.
- Junior and A1 classes need very little reading and very easy questions. No pair work, ever. Lucide icons only, never
  emoji.
- **Facts must be true and checkable.** When unsure, leave it out and list it in your report.

## Rules

- Branch `codex/world-quiz-banks` from `origin/main`. Make one local commit per numbered item, with the message starting
  `Quiz banks N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
- **Never** run `pnpm install`.
- Edit only new files in `src/data/world-quiz/`, `src/data/world-quiz/SOURCES.md`, and
  `src/data/world-quiz/world-quiz-data.test.ts`. Do not change the game, the existing banks or anything else.
- Follow the format of `src/data/world-quiz/capitals.ts`: static data, source URLs only as provenance, never fetched by
  the app.

## The work

Each question has:
- `id`, `iso2` (the answer country), `level` (1 easiest to 3);
- `prompt` (at most 8 words), four `options` (country names as in `src/lib/world-quiz/countries.ts`), `correctIndex`;
- `picture`: a 2-to-5-word search phrase that finds a clear photo of the subject itself on Wikimedia Commons (no people
  as the main subject);
- `fact`: one short sentence for the reveal, at most 14 words;
- `sourceUrl`.

Wrong options must be plausible: the same continent where possible, never the answer twice, and never a country that
could also be right (for example, no "kangaroo → Papua New Guinea" option when tree kangaroos live there).

1. **Landmarks: "Which country is this in?"** About 80 famous landmarks kids may know: buildings, statues, natural
   wonders. Level 1 = world-famous (Eiffel Tower, Statue of Liberty); level 3 = less known.
2. **Food around the world: "Where does this food come from?"** About 60 dishes strongly linked with one country
   (sushi, tacos, pizza, pho). Only dishes with a clear, widely accepted home country. Skip disputed ones and list them
   in your report (for example, ones claimed by several neighbours).
3. **Animals of the world: "Where does this animal live in the wild?"** About 60 animals that live wild in only one
   country, or are a well-known symbol of one (kiwi, koala, giant panda, lemur). The answer must be true for wild
   animals: if the animal lives wild in several countries, it may appear only when none of the other three options is
   one of them.
4. **Tests.**
   - Ids are unique.
   - `correctIndex` points at the answer, and the options are four different names that exist in the quiz country list.
   - Prompts are at most 8 words; facts are at most 14 words; pictures are 2 to 5 words.
   - Every question has a source.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- ten sample questions;
- anything you could not do as written;
- every item you left out as disputed or uncertain, with the reason.

Do not claim anything works in a real class.
