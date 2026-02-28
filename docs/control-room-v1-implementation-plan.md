# Control Room v1 — Implementation Plan

> Date: 2026-02-28
> Scope: post-session dashboard only. Uses existing metrics exclusively. No new analytics invented.

---

## Architecture constraints (locked)

- Control Room is **post-session only** — rendered after teacher ends session
- During-session leaderboard = personal score + Top 3 only (existing `Leaderboard` component)
- No speed metric
- No scoring weight changes
- Participation = coverage-based (requires migration 010 `prompt_index` — see `participation-feasibility.md`)
- Teacher Notes + Targets = Pro feature (separate migration)

---

## Phase 0 — Prerequisites (unblock everything else)

### 0.1 Migration 010: `scores.prompt_index`

```sql
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS prompt_index int;
CREATE INDEX IF NOT EXISTS idx_scores_prompt ON scores(session_id, prompt_index);
```

### 0.2 Populate `prompt_index` in game-shell

In `src/components/session/game-shell.tsx`, read `roundNumber` from the store and include it in both score inserts:

```ts
// handleScore (line ~120)
const { roundNumber } = useSessionStore();
const scoreData = {
  ...
  prompt_index: roundNumber,
};

// handleApprovedSubmission (line ~180)
const scoreData = {
  ...
  prompt_index: roundNumber,
};
```

**No other changes in Phase 0.**

### 0.3 Migration 011: teacher notes + targets tables

See schema section below. Create tables before building the UI that writes to them.

---

## Phase 1 — Teacher Notes + Targets schema

### Tables

```sql
-- Migration 011

CREATE TABLE public.session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, teacher_id)
);

CREATE TABLE public.session_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('class', 'student')),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,  -- null when target_type = 'class'
  metric text NOT NULL CHECK (metric IN ('accuracy', 'participation', 'points', 'streak')),
  target_value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_required_if_student_target
    CHECK (target_type = 'class' OR student_id IS NOT NULL)
);

-- RLS
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own notes" ON session_notes FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers manage own targets" ON session_targets FOR ALL
  USING (teacher_id = auth.uid());

-- Indexes
CREATE INDEX idx_session_notes_session ON session_notes(session_id);
CREATE INDEX idx_session_targets_session ON session_targets(session_id);
CREATE INDEX idx_session_targets_student ON session_targets(student_id);
```

### Design rationale

- **`session_notes`**: one row per (session, teacher) with `UNIQUE` constraint — upsert on save, no append log needed for v1.
- **`session_targets`**: `target_type` enum (class | student) avoids a separate class-targets table. `metric` enum is constrained to the 4 metrics that exist in the current schema. No free-text target descriptions in v1 — just numeric thresholds.
- `student_id` is nullable with a CHECK constraint enforcing it is set when `target_type = 'student'`.

### What this enables

| Feature | How |
|---|---|
| Teacher writes session notes | Upsert into `session_notes` |
| Teacher sets class accuracy target | INSERT session_targets (type=class, metric=accuracy, value=80) |
| Teacher sets per-student points target | INSERT session_targets (type=student, student_id=X, metric=points, value=50) |
| Control Room compares actuals to targets | JOIN session_targets with session_leaderboard |

**Pro gate**: check `teachers.subscription_status IN ('active', 'trial')` before rendering notes/targets UI. No schema change — this is an application-layer gate.

---

## Phase 2 — Control Room page + query layer

### 2.1 Route

```
src/app/(dashboard)/classes/[classId]/sessions/[sessionId]/control-room/page.tsx
```

- Server component
- Fetches all data in a single waterfall: session → scores → leaderboard → targets → notes
- No realtime subscription needed (post-session data is static)

### 2.2 Supabase queries

All queries run once on page load. No polling or realtime.

```ts
// 1. Session metadata
const { data: session } = await supabase
  .from('sessions')
  .select('started_at, ended_at, status')
  .eq('id', sessionId)
  .single();

// 2. Leaderboard (existing view)
const { data: leaderboard } = await supabase
  .from('session_leaderboard')
  .select('student_id, student_name, avatar_seed, total_points, correct_count, total_attempts, best_streak')
  .eq('session_id', sessionId)
  .order('total_points', { ascending: false });

// 3. Participation (requires migration 010)
const { data: promptData } = await supabase
  .from('scores')
  .select('student_id, client_id, display_name, prompt_index')
  .eq('session_id', sessionId)
  .not('prompt_index', 'is', null);

// 4. Raw scores for Team Race and Top Answers
const { data: scores } = await supabase
  .from('scores')
  .select('student_id, client_id, display_name, points, streak_bonus, team, is_correct, response_data, created_at')
  .eq('session_id', sessionId)
  .order('created_at', { ascending: false });

// 5. Session targets (Pro)
const { data: targets } = await supabase
  .from('session_targets')
  .select('*')
  .eq('session_id', sessionId);

// 6. Session notes (Pro)
const { data: note } = await supabase
  .from('session_notes')
  .select('content, updated_at')
  .eq('session_id', sessionId)
  .maybeSingle();
```

### 2.3 Derived computations (client-side, no new queries)

```ts
// Session duration
const duration = session.ended_at && session.started_at
  ? differenceInMinutes(new Date(session.ended_at), new Date(session.started_at))
  : null;

// Class accuracy
const classAccuracy = leaderboard.reduce((sum, e) => sum + e.correct_count, 0)
  / leaderboard.reduce((sum, e) => sum + e.total_attempts, 0);

// Total prompts (Option A)
const totalPrompts = Math.max(...promptData.map(r => r.prompt_index ?? 0), 0);

// Per-student participation
const participationMap = new Map<string, number>();
promptData.forEach(r => {
  const key = r.student_id ?? r.client_id;
  participationMap.set(key, (participationMap.get(key) ?? 0) + 1);
});

// Team totals
const teamTotals = scores.reduce((acc, s) => {
  if (!s.team) return acc;
  acc[s.team] = (acc[s.team] ?? 0) + s.points + s.streak_bonus;
  return acc;
}, {} as Record<string, number>);
```

---

## Phase 3 — Components

### 3.1 Reuse existing components

| Component | File | Reuse as-is? | Notes |
|---|---|---|---|
| `Leaderboard` | `src/components/session/leaderboard.tsx` | Partial | Currently reads from Zustand store; Control Room needs to accept static data as props or duplicate |
| `TeamTotals` | `src/components/session/team-totals.tsx` | Partial | Same issue — store-coupled |
| `EndSessionSummary` | `src/components/session/end-session-summary.tsx` | Extend | Current summary panel; Control Room replaces/extends this |

**Note:** Both `Leaderboard` and `TeamTotals` read from Zustand store. Post-session, the store may be cleared. The safest approach for v1 is to accept `entries` as props and keep store-reading as the default. This avoids a full refactor.

### 3.2 New components required

| Component | Location | Description |
|---|---|---|
| `ControlRoomPage` | `app/.../control-room/page.tsx` | Server component shell, fetches all data |
| `SessionMetaSummary` | `src/components/control-room/session-meta.tsx` | Duration, game count, session date |
| `ClassAccuracyGauge` | `src/components/control-room/accuracy-gauge.tsx` | Single number + colour band (0–100%) |
| `ParticipationGrid` | `src/components/control-room/participation-grid.tsx` | Per-student coverage bars (requires migration 010) |
| `TopAnswersFeed` | `src/components/control-room/top-answers-feed.tsx` | Filtered correct answers from `scores.response_data` |
| `TargetComparisonRow` | `src/components/control-room/target-row.tsx` | Actual vs target per metric, Pro-gated |
| `SessionNotesEditor` | `src/components/control-room/notes-editor.tsx` | Textarea + autosave upsert, Pro-gated |

**Total new components: 7.** All are presentational except `SessionNotesEditor` (has a write).

### 3.3 Control Room layout

```
┌─────────────────────────────────────────────────────────────┐
│  Session: [Class Name] · [Date] · [Duration]                │
├─────────────────┬───────────────────┬───────────────────────┤
│  Leaderboard    │  Class Accuracy   │  Participation Grid   │
│  (all students, │  Gauge            │  (per-student bars,   │
│  final points)  │  XX%              │  requires m010)       │
├─────────────────┴───────────────────┤                       │
│  Team Race (if teams used)          ├───────────────────────┤
├─────────────────────────────────────┤  Top Answers Feed     │
│  [PRO] Targets vs Actuals           │  (correct answers)    │
├─────────────────────────────────────┤                       │
│  [PRO] Session Notes                │                       │
└─────────────────────────────────────┴───────────────────────┘
```

---

## Phase 4 — Entry point

Add a "View Control Room" button to `EndSessionSummary` that navigates to `/classes/[classId]/sessions/[sessionId]/control-room`.

The session ID is available in the store at session-end time.

```tsx
// In end-session-summary.tsx, alongside existing "Back to Class" button
<Link href={`/classes/${classId}/sessions/${sessionId}/control-room`}>
  <Button>View Control Room</Button>
</Link>
```

`sessionId` needs to be threaded into `EndSessionSummary` props (currently it only receives `classId` and `className`).

---

## Implementation order summary

| Step | Work | Risk |
|---|---|---|
| 1 | Migration 010 (`prompt_index`) | Low — additive only |
| 2 | Populate `prompt_index` in game-shell | Low — one-line addition to two inserts |
| 3 | Migration 011 (notes + targets tables) | Low — new tables, no existing table changes |
| 4 | Control Room page route + queries | Medium — new page, no realtime complexity |
| 5 | New components (7) | Medium — all presentational except notes editor |
| 6 | Thread `sessionId` into `EndSessionSummary` | Low — prop addition |
| 7 | Pro gate on notes + targets UI | Low — single subscription check |

---

## What is explicitly out of scope for v1

- Realtime subscriptions in Control Room (post-session data is static)
- Cross-session historical aggregation
- Per-game AI sub-score breakdown panels
- Speed / response time metrics
- Any new scoring or weighting logic
