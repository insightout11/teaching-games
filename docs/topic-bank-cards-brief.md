# Fact cards for the ready-made topic bank — brief for Codex

Written 20 October 2026 by Claude. Claude reviews the branch; the owner tests in real classes.

## Why

When a teacher sets a topic, the shared screen first presents it as a **facts board**: 4-6 big fact cards revealed one
at a time, each opening to a few more sentences and two discussion questions, with a free photo
(`src/lib/live-room/fact-cards.ts`, `src/components/session/live-room/facts-board.tsx`). For any typed topic the AI
writes the cards. The **150 ready-made topics** in `src/data/topic-briefings.json` open instantly with no AI call, but
they only have plain `facts`, so their cards have no extra sentences, no questions of their own and no photo search.
This task gives every bank topic proper cards, at every level it has.

## How the owner teaches (read first)

- Live English classes for kids and teens, mostly online (Zoom), one shared screen. Never answers or private
  information on it. No pair work, ever: speaking is one student at a time, the class listening.
- Lucide icons only, never emoji. Short, plain wording. Junior classes are never ranked and need very little reading.

## Rules

- Branch `codex/topic-bank-cards` from `origin/main`. One local commit per numbered item, message starting
  `Bank cards N:`. No push, no merge.
- Stage only files you changed (`git add <file>`), never `git add -A`.
- Before each commit: `npx tsc --noEmit -p .` (only allowed error: `src/lib/sources/extractor.ts` missing
  `@mozilla/readability`), `pnpm next lint --file <each changed file>`, `pnpm test` (only allowed failing file:
  `src/__tests__/sources/source-extractor.test.ts`). ES5 target: no `/u` regex, no iterating a `Set`/`Map` directly.
- **Never** run `pnpm install`. **Do not touch** `src/components/live-room/`, `src/components/session/live-room/`,
  `src/lib/live-room/` (Claude is working there). You may edit `src/data/topic-briefings.json`,
  `src/lib/topic-briefings.ts` and the focus route `src/app/api/session/[sessionId]/focus/route.ts` (only where it turns
  a bank topic into cards).
- **Facts must be true and checkable.** Simple English at the level's CEFR band (see `src/lib/difficulty.ts`). No
  invented numbers; when unsure, leave the fact out.

## The work

1. **Card fields on every level of every bank topic**: add `cards` to `TopicBriefingLevel`, the same shape as
   `FactCard` (`headline`, `detail`, `questions`, `picture`). Rules, as in `factCardsPrompt` in
   `src/lib/live-room/fact-cards.ts`: 5 cards at A2-B2 (headline at most 14 words, 3-sentence detail with real names and
   numbers, 2 open questions, a 2-5 word photo search that names the topic); 4 cards at A1 (headline at most 8 easy words,
   2 very short sentences, 2 very easy questions). Order from the basics to the most surprising. The photo search must
   never give away an answer and must find a real, child-safe photo of exactly that thing (`""` when nothing can be
   photographed).
2. **Use them**: in the focus route, a bank topic's response uses its level's `cards` when present (falling back to
   `cardsFromFacts` only when a level has none). Keep the bank topic instant: no AI call.
3. **Tests**: every bank topic has cards at every level it defines, within the limits above (counts, word limits, two
   questions, picture string), and the focus route returns them for a bank topic without calling the AI (mock as the
   existing focus tests do). Avoid exact-count assertions that break when topics are added.

## Report back

For each item: the commit, the files changed, and anything you could not do as written. List any facts you were unsure
of and left out. Do not claim anything works in a real class.
