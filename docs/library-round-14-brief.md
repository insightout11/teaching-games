# Library round 14 brief (for Codex)

_Written Oct 6 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–13). Never rewrite history; follow-up
commits are fine. Load env from the main checkout's `.env.local` without copying it._

## Round 13 review (merged to main)
Excellent round. Gist questions are genuinely big-picture and window-grounded, the harder questions need inference,
the key-word glosses are clear and level-appropriate, and the 54 replaced evidence facts now actually argue their side.
The Listening flight uses all of it automatically.

## Tasks, in this order

### 1. Static rounds for all 60 listening packs
**Static** (a Listening break): the screen shows a sentence, the synthetic voice reads it with **one word swapped**, and
phones tap the word that was different. Add `listeningPack.static`: **5 rounds** each, from the window's transcript
(see `listeningWindow` in `src/lib/listening-pack.ts`):
`{ sentence, spoken, target, swap, options: string[4], correctIndex }`, the same shape as `StaticRound` in
`src/activities/types.ts`:
- `sentence`: an exact, short line from the window (≤ 14 words, cleaned of filler).
- `swap`: replaces `target` with a word that sounds plausible but changes the meaning (nine → five, left → right).
- `spoken`: the sentence with `target` replaced by `swap`.
- `options`: `target` + 3 other words from the same sentence; `correctIndex` points at `target`.
Kids A1–A2: very short sentences, concrete swaps (numbers, colours, animals).

### 2. Black Box passage for all 60 packs
**Black Box**: one key passage plays twice; phones show its words plus decoys; the class rebuilds it together. Add
`listeningPack.blackBox`: `{ passage, start, end, decoys: string[6–8] }`:
- `passage`: 2–3 consecutive sentences, **exactly as in the captions**, 15–35 words (kids: 10–20), inside the window and
  ideally around one segment's key line.
- `start`, `end`: caption-verified seconds for the passage.
- `decoys`: plausible words that are **not** in the passage (same topic, similar sound or meaning).
Check the existing `BlackBoxContent` type in `src/activities/types.ts`; match it where you can and note any difference.

### 3. Debate motions: 60 more (to 120)
Debate v2 uses a checked motion whenever the lesson's topic matches, so coverage matters. Add 60 to
`src/data/debate-motions.json`, same rules and validator (balanced points, 2–4 real sourced evidence facts that each
support their side, no politics/religion/group targeting):
- **30 kids at A2** (the thinnest level): school life, animals and pets, food, games and screens, sport, family rules,
  holidays, nature, superheroes and stories, space.
- **30 teens** (B1 ×15, B2 ×15): topics not yet covered (check existing `topics` first).
- No motion may duplicate or near-duplicate an existing one.

## Rules
- Branch `codex/library-round-14` off `origin/main`. One commit per task; follow-ups are fine. Don't push or merge; report
  the validator's own counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-14-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
