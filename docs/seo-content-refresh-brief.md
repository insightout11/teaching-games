# Codex brief: refresh the public activity/game pages after the Sep 2026 upgrades

## Why
Many games and activities were rebuilt this week. Their public SEO pages (`src/content/games/*.json`, `src/content/activities/*.json`, rendered at /classroom-games and /classroom-activities) still describe the old versions. Some now say the wrong thing: Taboo Sprint's page says the secret word is "shown on the teacher's screen", which is the exact bug we fixed. Hot Seat is new and has no page.

## Source of truth
Read each game's CURRENT code before writing: the component file and its `index.ts` (name, description, minStudents/idealStudents). Also read the commit messages from Sep 30 2026 onward (`git log --since=2026-09-29 --format='%h %s%n%b'`), which summarise every change. Never describe a feature the code doesn't have.

## Tasks
1. **Create `src/content/activities/hot-seat.json`.** Hot Seat: one student in the hot seat can't see the word; every other phone shows it; classmates take turns giving one spoken clue each; the teacher taps Got it/Pass; 60s turns; min 3 students. Register it in `src/lib/content-landing.ts` (ACTIVITY_CONTENT) the same way as the others.
2. **Rewrite the pages for everything upgraded**, keeping each file's existing schema and slug:
   - **Activities:** taboo-sprint, hot-take-arena (now has Full debate / Quick take / Wild card modes; Wild card replaces Defend the Indefensible), conversation-rounds, quick-pulse, fact-detective (now includes a "Spot the fib" mode), bluff-definition, imposter.
   - **Games:** vocab-sprint, sentence-scramble, error-hunter, connections, twenty-questions (Speak it mode), grid-rush, flash-quiz, synonym-showdown, grammar-boss, sector-strike.
   - **Two Truths & a Lie:** there's no page yet (its content file is missing). Create `two-truths-and-a-lie.json` and register it. Do NOT revive the retired `two-truths` (Spot the Fib) page.
3. **Retired modules** (see `src/lib/retired-plugins.ts`): leave their JSON files in place; they are already filtered out of the site. Remove links TO them from other pages (e.g. `word-chain` mentioned inside vocab-sprint.json or grid-rush.json, `password` or `defend-it` mentioned anywhere). Point to live alternatives instead (Hot Seat, Hot Take Arena, Taboo Sprint, Fact Detective).

## Writing rules
- Audience: ESL/EFL teachers, often teaching online over Zoom. Lead with speaking: most activities now have a spoken beat ("Ask why", "Hear both sides", "Read it aloud", "Say it right"). Say so.
- Mention that secret or private info stays on phones, never the shared screen, where that's true (Taboo, Hot Seat, Imposter, Conversation Rounds, 20 Questions keeper).
- No emoji. No invented statistics or testimonials. British/US spelling consistent with existing files.
- Keep headlines under 70 chars; keep the FAQ answers factual.

## Rules
- Branch `codex/seo-content-refresh`; commit per few files; do not push or merge. Claude reviews and merges.
- Touch only `src/content/**`, `src/lib/content-landing.ts` (registration only), and this brief's progress notes. Do not touch game/activity code.
- Run `npx tsx src/scripts/validate-content.ts` (or the repo's validate-content script) and `npx tsc --noEmit -p .` before reporting. If `node_modules` is missing in your checkout, say so instead of installing.
- Report: files changed, anything in the code that contradicted an old page, and anything you were unsure about.
