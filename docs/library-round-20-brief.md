# Library round 20 brief (for Codex): level the facts and questions

_Written Oct 8 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–19 (`docs/library-round-18-brief.md`,
`docs/library-round-19-brief.md`). Use your strongest writing model: it's all writing._

## Round 19 review: merged to main
Very good: every check you added is at 0, and a read-through agrees. Briefings now add new information, vocabulary is
specific (volcano: magma, crater, erupt, steam), the sentence starters model real student talk ("I would watch from a
safe hill."), and the aliases catch what teachers type (football → soccer, T-rex → dinosaurs). The bank is live:
banked topics now brief instantly with no AI call. You can keep committing your own files task by task without asking.

## What's left: facts and questions are the same at every level
- **Facts are identical across all levels in all 150 topics**, and they weren't rewritten in round 19 (still the
  round 18 facts, e.g. volcano A1 = B1 = "Melted rock is called lava above ground."). They're accurate but plain, and a
  B1/B2 class gets A1 facts.
- **Angles (discussion questions) are identical across all levels in all 150 topics.**

## Task: per-level facts and angles (follow-up commits on a new branch)
For every topic and level, keep the briefing, vocab and expressions, and rewrite:
- **facts**: 4 per level, **different at each level**, specific and interesting (numbers, names, comparisons where
  they help), accurate and evergreen. A1: one short concrete fact each ("A cheetah can run faster than a car in the
  city."); A2: a little more detail; B1: a surprising detail or cause; B2: a richer idea (why, how we know, a debate).
  No fact may repeat across levels of the same topic or across topics.
- **angles**: 3 per level, **different at each level**. A1/A2: concrete, playful, answerable in a few words ("Would you
  rather have a pet owl or a pet penguin?"); B1: opinions with a reason ("Should zoos keep big animals? Why?"); B2: real
  debates with two sides.
- Each fact should use at least one of that level's vocab words where it fits naturally.

## Validator additions (fail)
- No fact or angle is identical (or 80% the same) across levels of the same topic.
- A1 facts and angles ≤ 10 words a sentence; A2 ≤ 14.
- Report: topics with identical facts across levels (must be 0), identical angles across levels (must be 0), plus the
  existing round 19 checks (all 0).

## Rules
- Branch `codex/library-round-20` off `origin/main` (which now contains rounds 18–19). One commit per batch is fine;
  don't push or merge; report the validator's counts.
- Run `scripts/validate-library.ts`, `pnpm test src/lib` (`--maxWorkers=1` if needed) and `tsc`.
- Progress log: `docs/library-round-20-progress.md`. Only touch `src/data/`, library scripts in `scripts/`, and `docs/`.
