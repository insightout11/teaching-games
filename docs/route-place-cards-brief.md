# Ready fact cards for the places along real routes (brief for Codex)

Written 20 October 2026 by Claude. Claude reviews the branch; the owner tests it in real classes.

## Why

During a flight the class taps the places they pass and these become the topic:
- the "Below us" line (a country, a region like "the Balkans", a range, a nearby city);
- "Look outside" moments (landmarks, named features and regions near the route);
- countries crossed, and the destination city.

The shared screen then shows the **facts board**: 4 or 5 fact cards revealed one at a time. Each card opens to a few
more sentences, two discussion questions and a free photo (`src/lib/live-room/fact-cards.ts`,
`src/components/session/live-room/facts-board.tsx`). Today every one of these taps calls the AI live, which is slow and
uneven. These places come up again and again, so they should open instantly with checked, ready-made cards, the way the
150 ready-made topics in `src/data/topic-briefings.json` already do.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), on one shared screen. Never show answers or private
  information on it. No pair work, ever: speaking is one student at a time while the class listens.
- Lucide icons only, never emoji. Short, plain wording. Junior classes are never ranked and need very little reading.
- **Facts must be true and checkable.** No invented numbers; when you are unsure, leave the fact out and list it in your
  report. Calm and respectful about wars, disasters and religion.

## Rules

- Branch `codex/route-place-cards` from `origin/main`. Make one local commit per numbered item, with the message
  starting `Route cards N:`. No push, no merge.
- Stage only the files you changed (`git add <file>`), never `git add -A`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
  The target is ES5: no `/u` regex, and no iterating a `Set` or `Map` directly.
- **Never** run `pnpm install`.
- **Do not edit** `src/components/live-room/`, `src/components/session/live-room/` or `src/lib/live-room/` (Claude is
  working there). You may read and import from them.
- You may add new files and edit only these: the focus route `src/app/api/session/[sessionId]/focus/route.ts` (only
  where it turns a ready-made topic into cards), `src/app/api/live-room/moment/route.ts` and `src/lib/topic-briefings.ts`.

## The work

1. **Which places come up, and how often.** Write `scripts/dev/route-places.ts`, modelled on
   `scripts/dev/route-landmarks.ts`.
   - Cover every pair of `WORLD_DESTINATIONS`.
   - Collect the names a class can tap:
     - the moments from `planMoments` in `src/lib/live-room/moments.ts`, minus events;
     - the countries crossed (`countryAt` in `src/lib/live-room/places-below.ts`, sampled along the route);
     - the named features and regions under the route (`featureNear` and `namedRegionAt`, sampled the same way);
     - the destination cities themselves.
   - Write `docs/route-places.md`: each place with its kind and the number of routes it appears on, ranked.
2. **Cards for the most-used places.** Add a data file in the same shape as `topic-briefings.json` (`id`, `title`,
   `aliases`, `category`, `levels`), with `cards` on each level in the `FactCard` shape (`headline`, `detail`,
   `questions`, `picture`).
   - **Which places:** every place on 3 or more routes, plus every destination city and every country crossed. Stop at
     about 300 places, taking them in ranked order, and say where you stopped.
   - **Levels:** `A1` and `B1` only.
     - A1: 4 cards. Headline at most 8 easy words, 2 very short sentences, 2 very easy questions.
     - B1: 5 cards. Headline at most 14 words, a 3-sentence detail with real names and numbers, 2 open questions.
   - **Order:** from the basics (where it is, what it is) to the most surprising.
   - **Photo search:** 2 to 5 words that name the place, must find a real child-safe photo of exactly that place, and
     must never give away an answer.
   - **Aliases:** include the forms the app uses, for example "the Balkans", "Balkans", "the Dinaric Alps".
3. **Use them.** When a topic or moment matches one of these places exactly (title or alias, ignoring case and a
   leading "the"), use the ready cards with no AI call:
   - in the focus route, the topic's level-matched cards (A1 for A1 classes, B1 for everything else);
   - in `/api/live-room/moment`, return the B1 card headlines as its `facts`, plus a picture from the first card's photo
     search, through the existing picture lookup.

   Places that don't match keep today's live AI behaviour. Never substitute a "close enough" place.
4. **Tests.**
   - Every entry has both levels, within the limits above (counts, word limits, two questions, a picture string).
   - Aliases don't collide across entries.
   - The focus and moment routes return ready cards for a matching place without calling the AI (mock as the existing
     focus tests do), and still call the AI for a place that isn't in the data.
   - Avoid exact-count assertions that break when places are added.

## Report back

For each item, give:
- the commit and the files changed;
- anything you could not do as written;
- the top 30 places from `docs/route-places.md`;
- where you stopped in the ranked list;
- every fact you were unsure of and left out.

Do not claim anything works in a real class.
