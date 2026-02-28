# Risk Analysis — LessonCaptain v1.1

> Date: 2026-02-28
> Covers: participation coverage, teacher notes/targets, Control Room v1

---

## 1. Architectural risks

### R1 — `prompt_index` is client-state sourced (HIGH concern, LOW likelihood of blocking)

**Risk:** `roundNumber` in the session store is client-side only. If the teacher's browser reloads mid-session, it resets to 1. `prompt_index` values would restart from 1, creating a corrupted sequence in the scores table for that session.

**Likelihood:** Low in normal use; teachers rarely reload during a live session.

**Impact:** Participation rates for that session would overcount prompts answered in the first segment and reset to 0 for the post-reload segment. `MAX(prompt_index)` would undercount total prompts.

**Mitigation:** Accept this for v1.1 — document it as a known limitation. For v2, activating the `rounds` table with server-side round creation eliminates this risk entirely.

---

### R2 — `session_leaderboard` view is not indexed on `session_id` (MEDIUM)

**Risk:** The `session_leaderboard` view is a `SELECT … GROUP BY` across `scores` joined to `students`. It has no materialised form and no dedicated index. For sessions with many scores (e.g. 30 students × 20 turns = 600 rows), query time is fine. For larger or historical queries this could be slow.

**Current index:** `idx_scores_session ON scores(session_id)` exists and will be used by the view. For v1 class sizes (10–35 students) this is safe.

**Mitigation:** No action required for v1. If aggregate queries become slow, add a materialised view or a snapshot table on session-end in v2.

---

### R3 — `EndSessionSummary` is store-coupled (MEDIUM)

**Risk:** `EndSessionSummary` reads from Zustand (`students`, `scores`). After `reset()` is called, the store clears. The Control Room page fetches from the DB directly, so it works correctly. But if `reset()` is called before navigation completes, the user could see a blank summary.

**Current behaviour:** `reset()` is called via the "Back to Class" button `onClick`. The Control Room link does not call `reset()` — so this is only a risk if the user navigates via "Back to Class" first then tries to visit the Control Room URL directly. That path works correctly (DB fetch, no store dependency).

**Mitigation:** Ensure the Control Room page never reads from the Zustand store — which the implementation plan already specifies (server component + direct DB queries).

---

### R4 — `session_notes` upsert race condition (LOW)

**Risk:** `SessionNotesEditor` autosaves. If two browser tabs have the same session open and both autosave simultaneously, the later write wins due to `UNIQUE(session_id, teacher_id)` + `ON CONFLICT DO UPDATE`. This is the correct behaviour — last write wins — and is acceptable for a single-teacher notes field.

**Mitigation:** None needed for v1.

---

### R5 — `session_targets` metric enum is hard-coded (LOW, future-proofing note)

**Risk:** `metric` is constrained to `('accuracy', 'participation', 'points', 'streak')` at the DB level. Adding a new metric requires a migration. This is intentional for v1 to prevent garbage data, but will require attention if new metrics are introduced.

**Mitigation:** Document the constraint. Any future metric addition requires migration + application code update.

---

## 2. Performance risks

### P1 — Control Room has no realtime (intentional, no risk)

Post-session is static data. No Supabase realtime channel is opened. The 6 queries run sequentially on page load. For typical session sizes, total round-trip time is well under 500ms. **No performance risk.**

---

### P2 — `prompt_index` index on a large scores table (NEGLIGIBLE)

Adding a non-unique index on `(session_id, prompt_index)` is an additive DDL operation with no downtime on the current database size. `CREATE INDEX IF NOT EXISTS` is safe to run at any time.

---

### P3 — During-session realtime subscription load (OUT OF SCOPE for Control Room v1, but noted)

The game-shell already subscribes to `scores` realtime for remote votes. During session, the sidebar `Leaderboard` re-renders on every score insert. For a 30-student simultaneous game, this could trigger ~30 rapid re-renders. This is a pre-existing condition, not introduced by v1.1.

**Control Room v1 adds zero new realtime subscriptions.** The risk does not worsen.

---

## 3. Schema risks

### S1 — `scores.prompt_index` cannot be backfilled (ACCEPTED)

Existing score rows will have `prompt_index = NULL`. Participation coverage will only be computable for sessions run after migration 010 is deployed. Historical sessions will show "N/A" for participation.

**This is expected and acceptable.** Document it in the UI.

---

### S2 — `session_targets.student_id` FK on cascade delete (LOW)

If a student is deleted from the class, their target rows cascade-delete. This is the correct behaviour (target is meaningless without the student), but means the Control Room will not show deleted students' targets in historical views. For v1 this is fine.

---

### S3 — No migration for `session_notes.updated_at` auto-update trigger (LOW)

`updated_at` on `session_notes` is set only at INSERT time in the schema above. An upsert (`ON CONFLICT DO UPDATE SET content = EXCLUDED.content, updated_at = now()`) will update it correctly from the application. However, direct DB edits would not auto-update it without a trigger.

**Mitigation for v1:** The application-level upsert explicitly sets `updated_at = now()`. A trigger is not required for v1.

---

## 4. Debate section

### D1 — Challenge: is post-session the right location for the Control Room?

**Current decision:** Control Room is post-session only.

**Challenge:** Teachers often want at-a-glance class health during the session — not just at the end. A post-session dashboard serves reflection, not intervention. The value of seeing "only 6/20 students have answered" is highest while there is still time to do something about it.

**Counter-argument for keeping the decision:** During-session, the teacher's primary screen real estate is the game. Adding a full dashboard panel risks visual overload and distraction. The existing sidebar leaderboard + streak indicator is a deliberate minimal-intervention choice. Post-session reflection is a distinct, lower-pressure use case.

**Verdict:** Decision stands for v1.1. If teacher feedback indicates "I needed to see this live," the same queries work realtime — the architecture does not prevent upgrading to a live Control Room in v2.

---

### D2 — Simplification: collapse session_notes and session_targets into `sessions.metadata` JSONB

**Current proposal:** Two new tables (`session_notes`, `session_targets`).

**Simplification:** Add a `metadata jsonb` column to `sessions` and store both notes and targets as `{ notes: "...", targets: [...] }`.

**Why it's tempting:** Zero new tables, one column migration, no RLS policies to add.

**Why it fails here:**
- `session_targets` needs to be queryable by `student_id` for per-student comparison. JSONB arrays cannot be efficiently filtered or joined.
- Schema validation (metric enum, `target_type` check) cannot be enforced inside a JSONB column.
- Adding structured targets to a JSONB blob is a classic schema smell that becomes painful to query at scale.

**Verdict:** Keep separate tables. The two-table approach is minimal and correct. This is not overengineering — it is the minimum to make per-student targets queryable.

---

### D3 — Simplification: drop `session_targets` from v1 entirely

**Challenge:** Target tracking requires a new table, new UI, and a comparison layer in the Control Room. Teachers may not use it.

**Simplification:** Ship v1 Control Room with notes only. Add targets in v1.2 when there is evidence of demand.

**Arguments for:** Reduces scope of migration 011 to a single table. Notes are high-value and low-complexity. Targets require teachers to set them up before the session, which is friction.

**Arguments against:** The schema is trivial (20 lines). Building targets later requires a separate migration and a separate UI release.

**Verdict: this is a valid simplification.** If the goal is the fastest path to a useful Control Room, ship notes in v1.1 and targets in v1.2. The schema above is designed so targets can be added as a standalone migration without touching the notes table. The decision is product-level, not architectural.
