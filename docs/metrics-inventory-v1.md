# Metrics Inventory v1

> Audit date: 2026-02-28
> Scope: every metric computed or stored in the LessonCaptain codebase — no invented metrics.

---

## 1. Summary

LessonCaptain stores raw scoring events in the `scores` table and derives leaderboard aggregations from the `session_leaderboard` view; no speed/timing metric is persisted, and AI sub-scores are buried in a game-specific JSONB column rather than in normalised columns.

---

## 2. Stored Metrics Table

These fields exist in the database and are written at game-play time.

| Metric | Column / Table | Written by | Consumers |
|---|---|---|---|
| Points (raw) | `scores.points` | `src/components/session/game-shell.tsx` | leaderboard, end-summary, Control Room |
| Streak count | `scores.streak_count` | `src/components/session/game-shell.tsx` (via session-store streak logic) | leaderboard (`best_streak`), hot-streak alert |
| Streak bonus | `scores.streak_bonus` | `src/components/session/game-shell.tsx` (via `calculateStreakBonus`) | total_points derivation |
| Is correct | `scores.is_correct` | `src/components/session/game-shell.tsx` | correct_count, accuracy |
| Response data (JSONB) | `scores.response_data` | game `onScore` calls | Top Answers Feed, per-game AI breakdown |
| Team | `scores.team` | `src/components/session/game-shell.tsx` | Team Race Bar |
| Display name | `scores.display_name` | `src/components/session/game-shell.tsx` | leaderboard, Top Answers Feed |
| Client ID | `scores.client_id` | `src/components/session/game-shell.tsx` | per-student grouping |
| Score timestamp | `scores.created_at` | Supabase auto (`DEFAULT now()`) | ordering, realtime feed |
| Session start | `sessions.started_at` | session creation | Session Clock elapsed time |
| Session end | `sessions.ended_at` | session close | session duration |
| Question upvotes | `question_votes` (row count per question) | `POST /api/class-questions/vote` | ClassQuestionsWidget sort |
| Content use count | `generated_content.used_count` | `increment_content_used_count` RPC | cache hit analytics |
| Submission status | `student_submissions.status` | teacher approve/reject actions | Class Questions workflow |

---

## 3. Derived Metrics Table

These metrics do not have their own columns — they are computed at query or render time from the stored fields above.

| Metric | Formula | Computed in | Displayed in |
|---|---|---|---|
| `total_points` | `SUM(points + streak_bonus)` | `session_leaderboard` view (migration 001) | `src/components/session/leaderboard.tsx` |
| `correct_count` | `COUNT(*) WHERE is_correct = true` | `session_leaderboard` view (migration 001) | `src/components/session/leaderboard.tsx` |
| `total_attempts` | `COUNT(*)` | `session_leaderboard` view (migration 001) | `src/components/session/end-session-summary.tsx` |
| `accuracy` | `correct_count / total_attempts × 100` | `src/components/session/end-session-summary.tsx` | End-session summary screen |
| `best_streak` | `MAX(streak_count)` | `session_leaderboard` view (migration 001) | `src/components/session/leaderboard.tsx` |
| Session elapsed | `NOW() - sessions.started_at` | client-side in Session Clock component | Control Room (recommended) |
| Class accuracy | `SUM(correct_count) / SUM(total_attempts)` | not yet computed; derivable from `session_leaderboard` | Control Room (recommended) |
| Team score | `SUM(points + streak_bonus) WHERE team = ?` | not yet computed; derivable from `scores` | Control Room (recommended) |
| Participation rate | `COUNT(DISTINCT client_id) / roster size` | not yet computed; derivable from `scores` + `students` | Control Room (recommended) |

---

## 4. AI Evaluation Scores

Each AI-scoring game calls `onScore(studentId, { isCorrect, points, responseData })`. The numeric `points` value is written to `scores.points`. AI sub-scores are additionally stored inside `scores.response_data` (JSONB) with game-specific keys — there is no standardised column for them.

| Game | AI scoring method | `scores.points` formula | `response_data` key(s) |
|---|---|---|---|
| Vocab Sprint | 1–10 AI score | raw AI score | `score` |
| Synonym Showdown | 1–10 AI score | raw AI score | `score` |
| Grammar Boss | avg(grammarScore, fluencyScore) / 2 | averaged sub-scores | `grammarScore`, `fluencyScore` |
| Word Chain | 1–10 AI × bonusMult | AI score × bonus | `score`, `bonusMultiplier` |
| Dialogue Detective | weighted avg (35/30/35 weights + creativity) | weighted result | `comprehensionScore`, `languageScore`, `communicationScore`, `creativityBonus` |
| Story Sprint | avg of 5 AI sub-scores / 10 | averaged sub-scores | `creativity`, `grammar`, `vocabulary`, `coherence`, `development` |
| Error Hunter | found/total/false-positive formula | derived correctness | `foundCount`, `totalErrors`, `falsePositives` |

Games without AI scoring:

| Game | Scoring method | Notes |
|---|---|---|
| Sentence Scramble | Position-based: 1st=10, 2nd=8, 3rd=6, rest=3 | Simultaneous mode only |
| Connections | Groups-found logic + lives remaining | Deterministic formula |

Sources: `src/games/*/game.tsx` — each game's `onScore` call site.

---

## 5. In-Memory-Only Metrics

These values exist at runtime but are **never written to the database**.

| Metric | Location | Reset behaviour |
|---|---|---|
| `callCounts` (fair-picker turn counter) | `src/stores/session-store.ts:56` | Reset on session end |
| `timeRemaining` (countdown timer) | `src/hooks/use-race-mode.ts:18` | Resets each round; client-side only |

---

## 6. Speed Metric Verdict

**No speed metric exists in this codebase.**

A search across all TypeScript/TSX source files for `speed`, `timeToAnswer`, `response_time`, `elapsed`, and `startTime` returns zero results in `src/`. The timer (`timeRemaining`) is a client-side React state variable used only for UI countdown display; it is never captured at answer submission time and never written to any database table.

If response-time data is needed in future, a `started_at` timestamp on the InputSpec or a `time_taken_ms` column on `scores` would be required.

---

## 7. Timestamps Available

These timestamps exist today and could be used for time-based analytics without schema changes.

| Timestamp | Table.column | Meaning |
|---|---|---|
| Answer submitted | `scores.created_at` | When a score row was inserted (auto, server-side) |
| Session opened | `sessions.started_at` | When teacher started the session |
| Session closed | `sessions.ended_at` | When teacher ended the session (nullable until closed) |
| Question published | `student_submissions.published_at` | When teacher published a class question |
| Question answered | `student_submissions.answered_at` | When teacher marked question answered |

`scores.created_at` is the closest proxy to "when a student answered", but it reflects the server insert time, not the precise moment the student tapped Submit.
