# Control Room v1 — Dashboard Recommendation

> Date: 2026-02-28
> Constraint: every panel uses only metrics confirmed to exist in the database today.
> Reference: `docs/metrics-inventory-v1.md`

---

## Guiding principle

Control Room v1 must be implementable without schema changes or new data collection. Every metric shown must be derivable from the `scores` table, the `sessions` table, and the `session_leaderboard` view that already exist.

---

## Recommended Panels

| # | Panel | Metric(s) used | Data source | Notes |
|---|---|---|---|---|
| 1 | **Session Clock** | `sessions.started_at` → elapsed seconds | `sessions` table | Computed client-side: `NOW() - started_at` |
| 2 | **Participation Rate** | `COUNT(DISTINCT client_id) / total students` | `scores` + student roster | Shows how many students have answered at least once |
| 3 | **Leaderboard** | `total_points`, `correct_count`, `total_attempts`, `best_streak` | `session_leaderboard` view | Existing view — no new query needed |
| 4 | **Class Accuracy Gauge** | `SUM(correct_count) / SUM(total_attempts) × 100` | Aggregated from `session_leaderboard` | Single gauge for whole class, 0–100% |
| 5 | **Team Race Bar** | `SUM(points + streak_bonus) GROUP BY team` | `scores.team` | Only visible when `scores.team IS NOT NULL` |
| 6 | **Hot Streak Alert** | `MAX(streak_count)` live | `scores.streak_count` via realtime | Highlights any student on a streak ≥ 3 |
| 7 | **Top Answers Feed** | `response_data`, `display_name`, `created_at` | `scores` realtime subscription | Latest correct answers, newest first |

---

## Data access pattern per panel

All panels can be driven by a single Supabase Realtime subscription on the `scores` table (filtered by `session_id`) combined with one initial query to `session_leaderboard`.

```
SUBSCRIBE scores WHERE session_id = :id
  → on INSERT: update panels 2, 3, 4, 5, 6, 7 in-memory
  → on mount: SELECT * FROM session_leaderboard WHERE session_id = :id
  → sessions.started_at: fetched once on mount, used for panel 1
```

No polling required. No new RPC functions required.

---

## Excluded from v1 (and why)

| Excluded panel | Reason |
|---|---|
| Speed / response time | `timeRemaining` is client-side only; no `time_taken_ms` stored in DB. Requires schema change. |
| Per-game AI sub-score breakdown | Sub-scores are buried in `scores.response_data` JSONB with game-specific keys (not standardised). Too heterogeneous to display generically without per-game display logic. Defer to v2. |
| Cross-session trends | No historical aggregation layer exists. A materialised view or a separate analytics store would be needed. Defer to v3+. |
| Question vote tally | Exists in `question_votes` but belongs to the Class Questions widget, not a scoring dashboard. Already shown in `ClassQuestionsWidget`. |
| Content cache hit rate | `generated_content.used_count` is an operational metric for content management, not a real-time classroom metric. |

---

## Implementation notes

- **Team Race Bar** should be hidden (not just empty) when no scores have a non-null `team`. Teams are an optional session feature.
- **Participation Rate** denominator: use the student roster count from the session store (students joined to the session), not a pre-enrolled class list, since LessonCaptain does not require pre-enrollment.
- **Hot Streak Alert** threshold: fire at `streak_count >= 3` (consistent with the existing streak-bonus threshold in `src/stores/session-store.ts`).
- **Top Answers Feed**: only show rows where `is_correct = true` and `response_data` is non-null (not all games populate response_data meaningfully for display).
- **Leaderboard** (panel 3) is already implemented in `src/components/session/leaderboard.tsx`; Control Room v1 can reuse or adapt it rather than building a new component.

---

## What v2 could add (once schema is extended)

| Future panel | What needs to change |
|---|---|
| Response time histogram | Add `time_taken_ms int` to `scores` table; capture elapsed time between InputSpec write and student submit |
| Per-game AI sub-score radar | Normalise `response_data` JSONB into typed columns or a separate `score_details` table |
| Cross-session class progress | Add session-level aggregation snapshot table populated on session end |
