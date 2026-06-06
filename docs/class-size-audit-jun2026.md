# Class-Size Audit — all modules (v2, reconciled with code review)

> Status: **Revised after a code-grounded review (Codex).** The v1 pass was inferred from
> metadata and had real errors; this version takes the implementation as ground truth.
> Still needs final teacher sign-off on the judgment rows.
>
> Legend: ★ shines · ○ works · – poor/impossible. **Min** = students the code needs to run.
> **Src**: `code` = verified in the implementation · `est` = teacher judgment (not code-enforced).
> Sizes: 1:1 · Small (2–6) · Class (7+). **Max ceilings dropped** — no module enforces one;
> "drags large" is noted instead.

## Games

| Module | 1:1 | Small | Class | Min | Src | Note |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Vocab Sprint | ★ | ★ | ★ | 1 | est | Individual quiz; scales freely. |
| Synonym Showdown | ★ | ★ | ★ | 1 | est | Individual quiz. |
| Word Chain | ○ | ★ | ★ | 1 | code | 1 = turn-based; 2+ = teams (2-student empty-team bug fixed in 75df5af). |
| Grid Rush | ★ | ★ | ★ | 1 | code | Individual 2-round game; not team/count-gated. (was min 2) |
| Sentence Scramble | ★ | ★ | ★ | 1 | est | Individual reorder. |
| Grammar Boss | ★ | ★ | ★ | 1 | est | Individual. |
| Error Hunter | ★ | ★ | ★ | 1 | est | Individual. |
| Story Sprint | ○ | ★ | ○ | 1 | code | Only one student writes at a time; large classes wait. (was min 2, Class ★) |
| Dialogue Detective | ★ | ★ | ★ | 1 | est | Analyze a dialogue. |
| Connections | ★ | ★ | ★ | 1 | est | Grouping puzzle. |
| Twenty Questions | – | ★ | ★ | 2 | code | Sole student becomes host but hosts can't ask/guess → 1:1 broken. |
| Flash Quiz | ★ | ★ | ★ | 1 | est | Buzzer quiz. |
| Brain Teasers | ★ | ★ | ★ | 1 | est | Puzzles. |
| Defend It | – | ★ | ★ | 2 | code | One student → opposing side empty. |
| **Sector Strike** | – | ★ | ★ | 2 | code | *Was missing.* Hard minimum 2. |
| **Zone Board** | – | ★ | ★ | 2 | code | *Was missing.* Now requires ≥2 & caps teams to students (fixed in 75df5af). |

## Activities

| Module | 1:1 | Small | Class | Min | Src | Note |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Quick Pulse | ★ | ★ | ★ | 1 | est | Opinion vote. |
| Vocab Radar | ★ | ★ | ★ | 1 | est | Self-rate words. |
| Prediction Round | ★ | ★ | ★ | 1 | est | Predict outcomes. |
| Imposter | – | ★ | ★ | 3 | code | Hard gate `students.length >= 3`. (was min 4) |
| Scene Igniter | ★ | ★ | ○ | 1 | code | Splits after 4; no ceiling. Big class limits speaking. |
| Would You Rather | ★ | ★ | ★ | 1 | est | Opinion + talk. |
| Two Truths | ★ | ★ | ★ | 1 | code | One student can vote + unlock reveal. (was min 2) |
| Two Truths and a Lie | – | ★ | ★ | 2 | code | Featured student can't vote on own → 0 voters at 1:1. |
| Rank It | ★ | ★ | ★ | 1 | est | Rank & discuss. |
| Read Aloud | ★ | ★ | ○ | 1 | est | Round-robin reading drags large. |
| Listening Gap-Fill | ★ | ★ | ★ | 1 | est | Fill blanks from audio. |
| Fact Detective | ★ | ★ | ★ | 1 | est | True/false reasoning. |
| Expert Panel | ○ | ○ | ★ | 1 | code | One-student panel allowed (thin); audience voting optional. (was 1:1 –, min 3) |
| Scenario Simulator | ★ | ★ | ★ | 1 | est | Branching decisions. |
| Problem Solvers | ○ | ★ | ★ | 1 | code | One solution is enough to proceed. (was min 2) |
| Hot Take Arena | – | ★ | ★ | 2 | code | Start disabled unless both sides non-empty. |
| Decision Council | ○ | ★ | ★ | 1 | code | Explicit one-proposal flow exists. (was 1:1 –, min 3) |
| Final Answer | ★ | ★ | ★ | 1 | est | Closing recap. |
| Mic Drop | ★ | ★ | ★ | 1 | est | Closing one-liner. |
| Lightning Round | ★ | ★ | ★ | 1 | est | Rapid recap. |
| Mission Selector | ★ | ★ | ★ | 1 | est | Setup / mission pick. |
| Opinion Shift | ★ | ★ | ★ | 1 | est | Re-vote after lesson. |
| Conversation Rounds | – | ★ | ★ | 2 | code | Needs 2 distinct students; start disabled if same. |
| Character Cards | ★ | ★ | ★ | 1 | est | Assume a persona. (Class ★/○ unverifiable from code) |
| Grammar Check-In | ★ | ★ | ★ | 1 | est | Quick diagnostic. |
| Grammar Proof | ★ | ★ | ★ | 1 | est | Proofread/fix. |
| Final Word | ★ | ★ | ○ | 1 | code | Advances through every student sequentially; no ceiling. |
| Contribution Break | ★ | ★ | ★ | 1 | est | Submit a contribution. |
| Language Toolkit | ★ | ★ | ★ | 1 | est | Phrase-bank practice. |
| Wonder Board | ★ | ★ | ★ | 1 | est | Post questions. |
| Password | – | ★ | ★ | 4 | code | Hard gate: 4 students + 2 teams. (was 1:1 ★, min 2 — WRONG) |
| In Your Words | ★ | ★ | ★ | 1 | est | Paraphrase. |
| Bluff Definition | – | ★ | ★ | 2 | code | Voting needs ≥2 submissions. (was 1:1 ○, min 3) |
| Taboo Sprint | – | ★ | ★ | 4 | code | Hard gate: 4 students + 2 teams. (was 1:1 ★, min 2 — WRONG) |
| **Video Player** | ★ | ★ | ★ | 1 | code | *Was missing* (flight-plan-only). All sizes. |
| **Cabin Mystery** | ○ | ★ | ★ | 1 | code | *Was missing* (in-dev). Best 4+; allows fewer w/ repeated roles. |

## ✅ Bugs surfaced by the review — FIXED (commit 75df5af)

1. **Word Chain** — team-split bailed below 3 while team mode triggered at 2, leaving both
   teams empty at exactly 2 students. Aligned the split with `isTeamMode` (1-v-1 at 2).
2. **Zone Board** — round-robined students across a fixed ≥2 team count, creating empty teams
   that stalled the turn order; Start was enabled at 1 student. Capped team count to student
   count and gated Start to ≥2 students.

## Schema implications (from the review)

- **Drop `maxStudents`** — no module enforces a ceiling. "Drags large" stays a Note only.
- **`minStudents` is enough for the home chip + recommendation gating** (Password/Taboo 4,
  Imposter 3, pair/debate games 2, everything else 1).
- **But `minStudents` alone can't express composition rules** (both debate sides filled, N
  teams, the broken 2-player Word Chain path). Those matter for *in-session* warnings, not the
  home chip — so keep them out of the home schema; handle separately if/when we add live checks.
- **"Small (2–6)" is too coarse** for the 3- and 4-floor modules — the `minStudents` gate
  covers it (a 3-student class won't see Password as "Great"), so the bucket can stay.

## Remaining judgment calls (need your eye — code can't decide)

- ★ vs ○ at **Class size** for sequential speakers: Story Sprint, Read Aloud, Final Word,
  Scene Igniter, Character Cards, Two Truths and a Lie, Conversation Rounds.
- Whether **teacher-as-participant** should rescue a 1:1 rating for Twenty Questions / Defend
  It / Hot Take / Conversation Rounds (code says the *student* alone can't; a teacher playing
  the other role might). Currently marked – (in-app behavior).
