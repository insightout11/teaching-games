# Lens content (brief for Codex)

Written 20 October 2026 by Claude. Read `docs/class-lens-concept.md` first: it is the approved concept. Claude builds the
room (picker, vote, chip, prompts); you prepare the content. Claude reviews the branch; the owner tests in real classes.

## The owner's decisions

- Students can vote for the lens.
- News and Politics are turned on per class by the teacher (off by default).
- A lens stays for the whole lesson by default.
- First lenses:
  - Films and TV, Music, Sport, Food;
  - News (teens, per class);
  - kid lenses: Animals, Space, Cartoons and stories, Yummy food, Sport and games.
  - Politics and society comes later, but write its brief now.
- Every class type can use a lens. Free-talk classes are offered it first.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. No pair work, ever: speaking is
  one student at a time while the class listens. Lucide icons only, never emoji. Short, plain wording.
- Junior classes are never ranked and need very little reading.
- **Care:**
  - News and Politics: neutral and factual, more than one viewpoint on anything disputed, nothing graphic, no telling
    students what to think, no jokes about living politicians.
  - Kid lenses never touch news, politics, war or disasters.
  - Facts must be true and checkable; when unsure, leave it out and list it in your report.

## Rules

- Branch `codex/lens-content` from `origin/main`. Make one local commit per numbered item, with the message starting
  `Lens N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
  The target is ES5: no `/u` regex, and no iterating a `Set` or `Map` directly.
- **Never** run `pnpm install`.
- **Do not edit** `src/components/live-room/`, `src/components/session/live-room/`, `src/lib/live-room/` or the API
  routes (Claude is working there).
- Put everything in **new** files under `src/data/lenses/` plus their tests. Claude wires them in.

## The work

1. **Lens briefs** (`src/data/lenses/briefs.ts`). For every lens in the concept (all 13 teen and adult lenses and all 8 kid
   lenses), write:
   - `id`, `label`, a Lucide icon name, `kid: boolean`, `perClass: boolean` (true for News and Politics);
   - `brief`: 3 to 5 sentences telling a writer what to look for in any topic through this lens, with what to avoid;
   - `goodExample` / `badExample`: one facts-board headline each for the topic "Japan";
   - for News and Politics: the care rules restated inside the brief.

   Kid briefs must say: short, friendly, picture-first, A1 words.
2. **Lens vocabulary** (`src/data/lenses/vocab.ts`). Per lens, 16 to 20 core words, each with:
   - a one-line definition;
   - an example sentence about a real topic;
   - 6 sentence stems for talking through the lens (Films: "My favourite scene is when…").

   Give two levels, A1 and B1. Kid lenses: A1 only, with a picture search (2 to 4 words) per word.
3. **Where-next seeds** (`src/data/lenses/where-next.ts`). Per lens, 25 good follow-on topics that work for many places,
   each with a one-line reason a class would enjoy it. Kid lenses: 15.
4. **Lens cards for the top places** (`src/data/lenses/place-cards.json`).
   - Which places and lenses: the 40 highest-ranked places in `docs/route-places.md` that are countries or cities, ×
     Films, Music, Sport, Food (B1, 4 cards each) and Animals-kid (A1, 4 cards).
   - Same card shape and rules as the route-place cards (`src/data/route-place-briefings.json`): a headline, a detail
     that adds new information, two questions about that card's own fact, and a photo search for that card's subject.
   - No templated questions. Real names: films, artists, teams, dishes, animals.
5. **Tests.**
   - Every lens has all fields.
   - Vocabulary counts and levels are within the limits.
   - Where-next seeds are distinct.
   - Place cards: shape, word limits, distinct questions and photo searches.
   - No question text on more than 3 places.
   - Avoid exact-count assertions.

## Report back

For each item, give:
- the commit and the files changed;
- anything you could not do as written;
- two sample places printed in full for every lens they have;
- every fact you were unsure of and left out.

Do not claim anything works in a real class.
