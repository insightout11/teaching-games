# Exact photos for the quiz rounds (brief for Codex)

Written 21 October 2026 by Claude. Your picture banks (landmarks, food, animals) are merged and live. Today each
question finds its photo with a free Wikimedia Commons search at runtime. Searches drift: a Philippine eagle question
found an owl, and a sea-sponge card found the Grand Canyon. Claude now drops photos whose title does not match, but
then some questions show no photo at all. The fix is to name the exact photo for each question once, checked by you.
Claude wires the field into the game; you prepare the data only. Claude reviews the branch; the owner tests in real
classes.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen.
- The photo is the question: it must clearly show the subject, and nothing in it may give the answer away (no visible
  country name, flag or caption naming the place).
- **Pictures must be correctly licensed and really show the subject.** When unsure, leave the field empty and list
  the question in your report.

## Rules

- Branch `codex/exact-photos` from `origin/main`. Make one local commit per numbered item, with the message starting
  `Exact photos N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
- **Never** run `pnpm install`.
- Edit only `src/data/world-quiz/picture-question.ts`, `landmarks.ts`, `food.ts`, `animals.ts`, `SOURCES.md` and
  `world-quiz-data.test.ts`. Do not change the game or anything else.
- Nothing is downloaded or stored: you record the Commons file name only.

## The work

1. **The field.** Add an optional `pictureFile` to `PictureQuestion`: the exact Wikimedia Commons file name
   (for example `File:Koala climbing tree.jpg`), plus `pictureLicense` (for example `CC BY-SA 4.0`, `Public domain`).
2. **Landmarks.** For each landmark question, choose one Commons photo that:
   - clearly shows the whole landmark, taken in daylight, as the main subject;
   - has no readable country name, flag or caption that gives the answer;
   - is CC0, public domain, CC BY or CC BY-SA (no NC/ND, no fair use);
   - is a photograph, not a map, drawing or diagram.
3. **Food and animals.** The same rules: the dish or the animal itself, close and clear (for animals, in the wild or
   a natural setting where possible; no zoo signs visible).
4. **Tests.**
   - Every `pictureFile` starts with `File:` and ends in `.jpg`, `.jpeg` or `.png`.
   - Every question with a `pictureFile` has an allowed `pictureLicense`.
   - No two questions use the same file.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- ten sample questions with their file names;
- every question left without a photo, and why;
- anything you could not do as written.

Do not claim anything works in a real class.
