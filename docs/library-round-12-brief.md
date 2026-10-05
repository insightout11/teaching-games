# Library round 12 brief (for Codex)

_Written Oct 5 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–11). Never rewrite history; follow-up
commits are fine. Load env from the main checkout's `.env.local` without copying it._

## Round 11 review (merged to main)
Strong round. All 40 Speak situations valid and distinct with believable learner errors; 519 unique Flight Questions with
no title copies; 30 listening packs with clean 10–20s segments and exact key lines. One flaw: in the `before` sets the
natural reply sits at index 0 in 21 of 40 situations (students could learn "pick A"). Claude shuffles at runtime, but
fix it in the data too (task 1).

## Tasks, in this order

### 1. Speak situations: balance + 40 more (to 80)
- **Balance:** across all situations, the natural reply's index should be roughly even over 0–3 in both `before` and
  `after` (no position over 35%). Reorder replies and update `natural`; don't change the text.
- **40 more** in `src/data/speak-situations.json`, same rules: topics not yet covered (directions, phone calls, invitations,
  apologies, compliments, borrowing things, school projects, sports teams, video games, social media, money, chores,
  feelings, cinema/TV, the environment at home, part-time jobs for teens). 20 kids (A1–A2), 20 teens (B1–B2, at least 8
  at B2). Validator: the existing rules + the position balance rule.

### 2. Listening packs: 30 more (to 60)
Same shape and rules as round 11 (`listeningPack.segments`, 3 segments each, 10–30s, exact `keyLine`, timing verified
against stored captions). Spread: **12 kids A1–A2** (the youngest are thinnest), 10 B1, 8 B2. Prefer `listening:dialogue`
and `listening:announcement` clips, then kids/VOA/TED-Ed. At least 10 should be dialogues (two or more speakers).

### 3. Debate motions bank (new file, 60 motions)
For the Debate flight's coming audit. New file `src/data/debate-motions.json`: an array of
`{ id, motion, topics: string[], ageBand: "kids" | "teens", cefr, forPoints: string[3], againstPoints: string[3],
evidence: Array<{ fact: string; side: "for" | "against"; source: string }> (2–4), pulse: string }`.
- `motion`: "This house believes…" style is NOT needed. Plain, short, debatable (max 12 words): "Schools should ban
  phones", "Homework should be optional", "Zoos should close".
- `forPoints` / `againstPoints`: 3 short arguments each, level-appropriate, genuinely balanced (both sides winnable).
- `evidence`: real, checkable facts with a named source (organisation or study, no URLs needed), clearly marked which
  side they help. No invented statistics.
- `pulse`: the takeoff question (e.g. "Should schools ban phones?").
- 30 kids (A2–B1, gentle topics: school, animals, food, games, rules at home), 30 teens (B1–B2). No politics, religion,
  or topics that target a group of people.
- Add a validator check (shapes, counts, unique motions).

## Rules
- Branch `codex/library-round-12` off `origin/main`. One commit per task; follow-ups are fine. Don't push or merge; report
  the validator's own counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-12-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
