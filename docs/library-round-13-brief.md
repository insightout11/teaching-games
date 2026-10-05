# Library round 13 brief (for Codex)

_Written Oct 6 2026. Owner: LessonCaptain. Executor: Codex. Same schema, licences, safety rules, validator and transcript
pipeline as the earlier briefs (`docs/library-expansion-brief.md` and rounds 2–12). Never rewrite history; follow-up
commits are fine. Load env from the main checkout's `.env.local` without copying it._

## Round 12 review (merged to main)
Strong round: 80 balanced Speak situations, 60 valid listening packs, 60 distinct, balanced debate motions with named
sources. One weakness: some `evidence` facts don't actually help their side (e.g. a teens motion where both UNICEF facts
are general statements and the "against" fact doesn't argue against the motion). Fixed in task 3.

## Tasks, in this order

### 1. Gist questions for all 60 listening packs
The Listening Flight opens and closes with the class hearing a **listening window** of the clip, then answering **gist**
questions (the big picture), and Radio Check teaches the details in between. Window rule (see
`src/lib/listening-pack.ts`, `listeningWindow`): from 8s before the first pack segment to 8s after the last, capped at
**90s for kids (A1–A2)** and **180s otherwise**.
- Add `listeningPack.gist`: exactly **3** questions `{ q, options: string[3], correctIndex }` about the WHOLE window:
  the topic, the main point, the speaker's attitude/feeling, or the purpose. **Not** answerable from one detail line,
  and **not** the same as any segment question.
- Add `listeningPack.harder`: **1** question `{ q, options: string[3–4], correctIndex }` that needs inference across the
  window (why, what next, what does the speaker really mean).
- Everything must be answerable from the transcript **inside the window**. Options plausible, one correct; level-
  appropriate language (A1 kids: very short).
- Validator: shapes, counts, options distinct, no gist identical to a segment question.

### 2. Words you'll hear (all 60 packs)
Add `listeningPack.words`: **5** key words or short phrases spoken inside the window `{ word, meaning, at }` (`at` =
seconds where it's said, from the captions; `meaning` = a short, level-appropriate gloss). Pick words that matter for
understanding, not names. Validator: 5 each, `at` inside the window.

### 3. Debate evidence: each fact must help its side
Review all 120 `evidence` entries in `src/data/debate-motions.json`. Each `fact` must, on its own, support its `side`
for that specific motion (a student could quote it as a reason). Replace any general or neutral facts with real, checkable
ones from named sources (no invented statistics). Report how many you replaced.

## Rules
- Branch `codex/library-round-13` off `origin/main`. One commit per task; follow-ups are fine. Don't push or merge; report
  the validator's own counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` and `tsc` (ES5: no `/u` regex, no direct Set/Map iteration).
- Progress log: `docs/library-round-13-progress.md`.
- Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
