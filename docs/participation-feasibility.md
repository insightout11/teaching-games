# Participation Coverage — Feasibility Analysis

> Date: 2026-02-28
> Decision constraint: no speed metric, no scoring weight changes. Participation = coverage-based (attempts / total prompts).

---

## 1. What "participation coverage" means in v1.1

```
participation_rate = attempts_by_student / total_prompts_in_session
```

- **`attempts_by_student`** — how many times a given student submitted an answer (scored or not)
- **`total_prompts`** — how many distinct prompts (turns / rounds) the teacher ran in the session

---

## 2. `attempts_by_student` — feasibility: READY

This is `COUNT(*) FROM scores WHERE session_id = :id AND (student_id = :sid OR client_id = :cid)`.
It is already surfaced as `total_attempts` in the `session_leaderboard` view.

**No schema change required.**

---

## 3. `total_prompts` — feasibility: SCHEMA GAP

### What exists in schema

The `rounds` table was defined in migration 001:

```sql
create table public.rounds (
  id uuid primary key,
  session_id uuid not null references sessions(id),
  game_type text not null,
  game_config jsonb default '{}',
  round_number int not null,
  created_at timestamptz not null default now()
);
```

`scores.round_id` references `rounds(id)` and is nullable.

### What actually happens at runtime

A search across all non-mock TypeScript/TSX source confirms:

- **No INSERT into `rounds` is made anywhere in production code.**
- `scores.round_id` is always `null` in production rows (confirmed by `src/lib/mock/data.ts:174` which seeds it as null even in tests).
- `session-store.ts::nextRound()` increments a client-side counter (`roundNumber`) only — it does not write to the DB.
- `game-shell.tsx::handleScore` does not include `round_id` in its insert payload.

**Result: the `rounds` table is empty in production. `total_prompts` cannot be derived from it.**

### What we have instead

| Field | Value | Reliable? |
|---|---|---|
| `scores.session_id` | groups all answers | Yes |
| `session-store::roundNumber` | client-side counter | No (lost on reload) |
| `rounds` table rows | always 0 in production | No |

---

## 4. Gap: no reliable prompt/round identifier

There is no field that identifies "this score belongs to prompt #N of the session." Without that, we cannot compute a denominator for coverage-based participation.

Two paths exist:

### Option A — Simplest: write `round_number` on the score row (recommended)

Add a nullable `prompt_index int` column to `scores` and populate it from `session-store::roundNumber` at score-insert time in `game-shell.tsx`.

```sql
-- Migration 010
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS prompt_index int;
```

**No new table required.** Game-shell passes `roundNumber` from the store into the insert payload. The session store already tracks this client-side — it just doesn't persist it.

Participation formula:

```
total_prompts  = MAX(prompt_index) per session
student_rate   = COUNT(*) WHERE prompt_index IS NOT NULL GROUP BY student / total_prompts
class_rate     = COUNT(DISTINCT student_id|client_id with ≥1 score per prompt) / (students × total_prompts)
```

**Caveats:**
- `prompt_index` is sourced from client-side state. If the teacher reloads mid-session, it resets to 1. This is acceptable for a v1 metric — it reflects the actual observable state of the session.
- Turns skipped (no answer) will simply be absent from `scores`; the gap between `MAX(prompt_index)` and expected sequential values is the absence signal.

### Option B — Full: activate the existing `rounds` table

Insert a `rounds` row on each `nextRound()` call, FK-link scores to it, and use `COUNT(DISTINCT round_id)` as the denominator.

**Cost:** requires inserting into `rounds` from the game-shell (or a new API route), updating the score insert to include `round_id`, and backfilling existing sessions (impossible for historical data). This is the "right" architecture but significant scope for a v1 metric.

**Recommendation: Option A for v1.1, Option B for v2.**

---

## 5. Participation formula (v1.1, post-Option A)

```
total_prompts      = MAX(prompt_index) FROM scores WHERE session_id = :id
attempts_per_student = COUNT(*) FROM scores WHERE session_id = :id GROUP BY student_id|client_id
coverage_rate      = attempts_per_student / total_prompts × 100
class_coverage     = AVG(coverage_rate) across all students
```

For students with zero scores (present on roster but never answered), `attempts_per_student = 0`, `coverage_rate = 0%`. This is the correct representation.

---

## 6. Schema change required (minimal)

```sql
-- Migration 010 (add to existing migration file or new one)
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS prompt_index int;
CREATE INDEX IF NOT EXISTS idx_scores_prompt ON scores(session_id, prompt_index);
```

**No new table. No view change required for v1.1.** The `session_leaderboard` view can remain unchanged; participation can be computed ad-hoc from `scores`.

---

## 7. Implementation touchpoints (Option A)

| File | Change |
|---|---|
| `supabase/migrations/010_*.sql` | ADD COLUMN prompt_index int to scores |
| `src/components/session/game-shell.tsx` | Add `prompt_index: roundNumber` to `scoreData` in `handleScore` and `handleApprovedSubmission` |
| `src/stores/session-store.ts` | No change — `roundNumber` already exists and is read by game-shell |
| `src/components/session/end-session-summary.tsx` | Optionally show per-student coverage rate using MAX(prompt_index) |

**Total: 2 files changed + 1 migration.** No AI involvement. No new API routes.
