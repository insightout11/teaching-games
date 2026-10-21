# Exact photos for the route-place cards (brief for Codex)

Written 21 October 2026 by Claude. Your exact quiz photos are merged and work well. The route-place cards
(`src/data/route-place-briefings.json`, built from `scripts/dev/data/route-place-editorial.tsv`) still find their
photos with a free Commons search during class, and searches drift (an owl for the Philippine eagle). Give every card
its own checked photo. Claude wires the field into the room; you prepare the data only. Claude reviews the branch; the
owner tests in real classes.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. The photo sits above the fact.
- The photo must clearly show the card's own subject (its headline), so a child can point at it.
- **Pictures must be correctly licensed and really show the subject.** When unsure, leave the field empty and list
  the card in your report.

## Rules

- Branch `codex/route-card-photos` from `origin/main`. Make one local commit per numbered item, with the message
  starting `Card photos N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
- **Never** run `pnpm install`.
- Edit only the route-place builder and its data in `scripts/dev/`, `src/data/route-place-briefings.json` (built by
  the builder, never by hand), and their tests. Keep the card prose and questions as they are (Claude fixed the
  "How do … find their food?" wording on 21 Oct; keep it).

## The work

1. **The field.** Add `pictureFile` (an exact Wikimedia Commons file name such as `File:Giant Panda Eating.jpg`) and
   `pictureLicense` to each card, in the editorial source and the built JSON. The card keeps its `picture` search
   phrase as a fallback.
2. **The photos.** For every card at both levels (cards with the same headline share one photo), choose a Commons
   photograph that:
   - shows the headline's subject itself as the main subject (the animal, the dish, the building, the river), in a
     clear, daylight view;
   - is CC0, public domain, CC BY or CC BY-SA (no NC/ND, no fair use);
   - is a photo, not a map, flag, drawing or diagram (a flag card may use the flag file itself);
   - is not reused on another card of the same place.
3. **Tests.**
   - Every `pictureFile` starts with `File:` and ends in `.jpg`, `.jpeg` or `.png`; each has an allowed licence.
   - No file is used twice within one place.
   - The builder still reproduces the JSON exactly from the editorial source.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- three sample places with every card's file;
- every card left without a photo, and why;
- anything you could not do as written.

Do not claim anything works in a real class.
