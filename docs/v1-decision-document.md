# LessonCaptain v1 Decision Document

## Context

LessonCaptain has a working runtime (games, activities, realtime sync, scoring, leaderboard, content generation, SEO landing pages) but lacks locked decisions on session state formalization, scoring clarity, degraded UX policy, monetization, and "magic" feature scope. This document locks those decisions so product, homepage, runtime, and future implementation all align.

---

## 1. Live Session State Machine

### Recommended v1 Decision

Formalize two parallel state machines — **Teacher Session** and **Student Controller** — connected by the existing InputSpec bridge. Do NOT introduce a new abstraction; codify what already works.

### Why This Is the Best v1 Choice

The current architecture already has a clean separation: teacher controls state via GameShell/ActivityShell, students poll via `GET /api/student/session`. The state machine is implicit in component state — making it explicit in documentation (not a new state library) avoids refactor risk while giving the team a shared vocabulary.

### Key Entities

- **Session** (DB): `id, class_id, status, settings, input_spec`
- **InputSpec** (ephemeral, DB-persisted): the bridge — tells students what UI to render
- **Score** (DB): the persistence layer for all scoring events
- **StudentSubmission** (DB): approval-queue path only

### State / Event Flow

**Teacher Session States:**
```
LOBBY → MODULE_ACTIVE → MODULE_COMPLETE → [repeat or] SESSION_END
```
- `LOBBY`: Session created, students joining. No InputSpec.
- `MODULE_ACTIVE`: A game or activity is running. InputSpec is set. Sub-states are game/activity-specific (IDLE → GENERATING → RUNNING → TIME_UP → EVALUATING → FINISHED for games; idle → prompting → revealing → summary for activities).
- `MODULE_COMPLETE`: Game/activity finished. InputSpec cleared. Teacher sees results, picks next or ends.
- `SESSION_END`: Final summary screen. Full leaderboard shown.

**Transition Triggers:**
- LOBBY → MODULE_ACTIVE: Teacher selects game/activity (manual) or Flight Plan auto-advance
- MODULE_ACTIVE → MODULE_COMPLETE: Game reaches FINISHED / activity reaches summary+idle
- MODULE_COMPLETE → MODULE_ACTIVE: Teacher selects next module
- MODULE_COMPLETE → SESSION_END: Teacher clicks "End Session"

**Student Controller States:**
```
WAITING → INPUT_ACTIVE → SUBMITTED → [repeat per prompt]
```
- `WAITING`: Polling, no InputSpec. Shows "Waiting for teacher..."
- `INPUT_ACTIVE`: InputSpec received, DynamicInput rendered
- `SUBMITTED`: Response sent, awaiting next prompt or new InputSpec

**Synchronization Model (unchanged):**
1. Teacher component calls `onSetInputSpec(spec)` → POST to DB (service role)
2. Student polls `GET /api/student/session` every ~2s → receives InputSpec
3. Student submits → `POST /api/student/submit` → score (direct) or submission (approval queue)
4. Teacher receives score via Supabase realtime subscription
5. Game/activity processes score, updates UI

### UI Implications

- **Teacher**: No change. GameShell/ActivityShell already manage these states. The "Back to selection" button is the MODULE_COMPLETE → MODULE_ACTIVE transition.
- **Student**: No change. Student controller already shows waiting/input/submitted states.

### Explicitly Out of Scope for v1

- Formal state machine library (XState, etc.) — component state is sufficient
- Teacher-to-teacher session handoff
- Mid-module student join (students who join late wait for next module)
- Pause/resume session across browser sessions

### Open Risks

- Student poll interval (2s) creates latency. Acceptable for v1; WebSocket upgrade is v1.x.
- No formal "session expired" handling if teacher closes browser mid-session.

---

## 2. Baseline AI Scoring Rubric + Event Model

### Recommended v1 Decision

Keep the current two-path scoring model. Standardize the ScoreResult shape and define exactly what gets persisted. Do NOT introduce an event bus or event sourcing.

### Why This Is the Best v1 Choice

The system already has clean scoring: games call `onScore(studentId, { isCorrect, points, responseData })`, GameShell persists to `scores` table with streak/modifier math. Activities call `onScore` with `isCorrect: null` for participation. Adding complexity here would slow shipping.

### Key Entities

```
ScoreResult {
  isCorrect: boolean | null   // null = participation (activities)
  points: number              // base points before modifiers
  responseData?: object       // game-specific payload
}
```

Persisted Score row:
```
scores {
  id, session_id, student_id, client_id, display_name,
  points (after modifiers), streak_count, streak_bonus,
  is_correct, prompt_index, team, response_data, created_at
}
```

### Scoring Rubric (v1 Baseline)

| Context | Points | isCorrect |
|---------|--------|-----------|
| Game correct answer | 10 | true |
| Game wrong answer | 0 | false |
| Race position (simultaneous) | 10/8/6/3 | true |
| Activity participation | 1 | null |
| Streak bonus | +1 per consecutive correct (cap +5) | — |
| Spin wheel modifier | multiplier (1x/2x/3x) or +5 bonus | — |
| Shield (spin wheel) | preserves streak on wrong answer | — |

### Event Model (What Gets Persisted)

v1 has **one event type**: score insertion. No formal event bus.

| "Event" | Trigger | Persisted To |
|---------|---------|-------------|
| Score created (direct) | Student submits choice/binary/text to game | `scores` table, `response_data.type = 'remote_vote'` |
| Score created (approved) | Teacher approves submission | `scores` table, `response_data.type = 'remote_submission'` |
| Score created (participation) | Activity records participation | `scores` table, `response_data.type = 'activity_participation'` |
| Submission created | Student submits text for approval | `student_submissions` table, `status = 'pending'` |

### Leaderboard Update

- Computed client-side from Zustand store (all scores in memory)
- Realtime: Supabase postgres_changes subscription on `scores` table → `recordScore()` → recompute
- During session: Top 3 + own entry only (locked invariant)
- End session: Full sorted list

### What Updates the Leaderboard

Every `scores` INSERT triggers a realtime event → GameShell/ActivityShell `recordScore()` → Zustand store update → leaderboard recompute via `useMemo`.

### Explicitly Out of Scope for v1

- Per-game scoring rubrics (all games use the same 10/0 + streak model)
- AI-evaluated scoring (rubric-based grading of free text)
- Score disputes or corrections
- Event sourcing / replay
- Analytics pipeline from scores

### Open Risks

- `prompt_index` is only set for teacher-initiated scores, not remote votes. Participation coverage formula may undercount.
- No deduplication guard if realtime delivers same score twice (currently handled by Zustand identity check, but not formally).

---

## 3. Fallback UX / Degraded States

### Recommended v1 Decision

Codify a **three-tier fallback strategy**: (1) cache hit, (2) AI generation with error catch → minimal valid content, (3) teacher manual selection. No session should ever hard-crash or show an error screen to students.

### Why This Is the Best v1 Choice

The system already implements this pattern — generators catch errors and return fallback objects, content cache reduces generation, and manual selection is always available. The decision is to lock this as policy, not build new infrastructure.

### Trigger Conditions & Fallback Logic

| Trigger | What Teacher Sees | What Students See | Fallback Content |
|---------|------------------|-------------------|-----------------|
| **AI generation fails** | "Content unavailable, try again" toast + manual selection grid | "Waiting for teacher..." | Generator returns minimal valid object (e.g., 3 generic prompts) |
| **Weak/generic topic** | Normal UI — AI generates best-effort content from vague topic | Normal game/activity UI | AI handles gracefully; "General English" default quality is acceptable |
| **Teacher skips Takeoff (mission mode)** | Flight Plan proceeds without personal missions | Students see activities without personal mission context | Activities work without mission data; mission-dependent features show generic prompts |
| **Student submits gibberish** | Appears in approval queue (text) or as remote vote (choice) | Normal submitted state | Teacher rejects in queue; choice votes are just counted |
| **Network interruption (student)** | Missing votes in real-time feed | "Failed to submit, try again" with retry | Student controller shows error state, allows retry |
| **Network interruption (teacher)** | Realtime subscription drops | Students can still submit (DB writes succeed) | Teacher refreshes to reconnect; scores are in DB |

### Default Content Hierarchy

1. **Content cache** → use previously generated content for same game+topic+difficulty
2. **AI generation** → fresh content with try-catch returning fallback objects
3. **Fallback objects** → hardcoded minimal valid content (e.g., Prediction Round has 3 generic True/False questions)
4. **Manual mode** → teacher picks from grid, games generate on-demand via their own `/api/[game]/generate` routes

### How to Degrade Gracefully Without Breaking Trust

- **Never show "Error" to students.** Students see "Waiting for teacher..." or normal game UI.
- **Never block the teacher.** If one module fails, the selection grid is always available.
- **Padding to minimums.** If AI returns fewer items than needed, pad with generic content (already implemented: Lightning Round pads to 3 prompts).

### Explicitly Out of Scope for v1

- Automatic retry with exponential backoff on AI failures
- Offline mode
- Content quality scoring (detecting "weak" AI output automatically)
- Student-facing error details

### Open Risks

- If ALL AI providers fail simultaneously, every generation returns fallback objects. Session quality degrades significantly but doesn't break.
- No React Error Boundaries exist. A rendering crash in a game component currently shows React's white screen. **Recommendation: add one Error Boundary around GameShell/ActivityShell as a v1 safety net.**

---

## 4. Credit Exhaustion + Pro Paywall Transition

### Recommended v1 Decision

**Simple credit model**: every teacher gets N free "session generations" (not token-based). One generation = one call to `POST /api/lesson-plan/generate` or one on-demand game content generation. Credits are session-scoped (generating content for a session costs 1 credit regardless of how many games/activities).

### Why This Is the Best v1 Choice

Token-based billing is confusing for teachers and hard to predict. Session-based credits are simple: "You have 5 free sessions. Each session generates fresh content." Teachers understand this immediately.

### Credit Logic

| Tier | Credits | How Earned |
|------|---------|-----------|
| **Unverified** | 2 session generations | Account creation (Google OAuth) |
| **Email-verified** | +3 session generations (5 total) | Verify email address |
| **Pro** | Unlimited | Stripe subscription active |

### Key Data Model

```sql
-- Add to teachers table
ALTER TABLE teachers ADD COLUMN generation_credits int NOT NULL DEFAULT 2;
ALTER TABLE teachers ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE teachers ADD COLUMN total_generations int NOT NULL DEFAULT 0;
```

No separate credits table. Credit count lives on the teacher row. `total_generations` is an audit counter.

### State Transitions

```
UNVERIFIED (2 credits) → [verify email] → VERIFIED (5 credits) → [exhaust] → EXHAUSTED → [subscribe] → PRO (unlimited)
```

### Teacher-Facing UX Moments

| Moment | What Happens |
|--------|-------------|
| **Dashboard** | Credit count badge: "3 sessions remaining" or "Pro" |
| **Lesson Plan generation** | If credits > 0: generate, decrement. If 0: show paywall modal |
| **On-demand game generation** | Same check. One generation per game per session (cached after first) |
| **Paywall modal** | "You've used all free sessions. Verify email for 3 more, or upgrade to Pro for unlimited." |
| **During live session** | NEVER interrupt. If teacher started a session, all generation within that session is allowed (even if credits hit 0 mid-session). Credit check happens at session creation / lesson plan generation. |
| **Settings page** | Show usage: "5 of 5 free sessions used. Upgrade to Pro." |

### What Happens When Credits Are Exhausted

- **Lesson planning**: Paywall modal. Cannot generate new content.
- **Live session (already started)**: Unaffected. Content cache + already-generated content keeps session running.
- **Manual game selection (no lesson plan)**: Each game's on-demand generation checks credits. If 0, paywall.
- **Content cache hits**: FREE. Cached content never costs credits.

### Implementation Order

1. Add `generation_credits`, `email_verified`, `total_generations` to teachers table
2. Add credit check middleware to generation routes
3. Add credit decrement on successful generation
4. Build paywall modal component
5. Add email verification flow (send verification email, callback route)
6. Stripe integration (checkout, webhook, subscription management)

### Explicitly Out of Scope for v1

- Per-AI-call token tracking
- Usage analytics dashboard for teachers
- Team/school billing
- Refunds or credit transfers
- Free tier with ads

### Open Risks

- "Session generation" granularity needs definition: does re-generating a single game's content within a session cost a credit? **Recommendation: No. First generation per session costs 1 credit; all re-generations within that session are free.**
- Email verification adds auth complexity. Google OAuth users already have verified emails — could auto-grant verified credits.

---

## 5. "Magic" Features: Response Boost + Instant Activity Swap

### 5a. Response Boost

### Decision: v1.x (not v1 launch, but soon after)

**What it would do:** When a student is stuck (no submission after N seconds), the teacher can tap "Boost" to send a contextual hint to that student's device.

**Technical constraints:**
- Requires per-student InputSpec targeting (`perStudentData` field already exists in InputSpec)
- Hint content must be generated or pre-cached alongside game content
- Needs a "boost requested" state on teacher UI per student

**Required data model:**
- No new tables. Use `perStudentData` in InputSpec to deliver per-student hints.
- Hints generated alongside game content (already done for Problem Solvers, Scene Igniter).

**Session/runtime risks:**
- AI latency for on-demand hint generation could be 2-5s, awkward in live session
- Pre-generating hints for all possible stuck points is expensive

**Recommendation:** Ship v1 with the existing teacher-controlled hints (Problem Solvers toggle, Scene Igniter inline hints, sentence starters). Add "Boost" button in v1.1 using pre-generated hint banks, not real-time AI generation.

### 5b. Instant Activity Swap

### Decision: v1 (already works — formalize and name it)

**The feature already exists.** Teachers can:
1. Click "Back to selection" during any game/activity
2. Pick a different game/activity from the grid
3. New module starts fresh with shared session state (leaderboard, settings, streaks preserved)

In Flight Plan mode, teachers can also skip slots or go back.

**How it preserves coherence:**

| Dimension | How Preserved |
|-----------|--------------|
| **Same stage** | PPP metadata on each game/activity. Teacher can filter grid by stage (presentation/practice/production) — not yet in UI but data exists. |
| **Same difficulty** | Session-level `difficulty` setting persists across swaps. New game inherits it. |
| **Same duration** | `estimatedTime` in content JSON. Teacher sees time estimate on selection card. |
| **Same lesson coherence** | Topic persists in session settings. New game generates content for same topic. |

**What's missing for a polished "Instant Swap":**
- UI: Filter selection grid by PPP stage + estimated time
- Content: Pre-generate alternative content for same topic/difficulty when building lesson plan
- Naming: Call the "Back to selection" button something more intentional like "Switch Activity"

**Technical constraints:**
- Game-specific state resets on swap (correct — fresh start)
- Streaks carry over (correct — rewards consistency)
- No way to "resume" a swapped-out game (out of scope for v1)

**Recommendation:** Rename "Back to selection" → "Switch Activity" in v1. Add PPP stage filter to selection grid. Pre-generation of alternatives is v1.x.

---

## Homepage / Product Truth Alignment

### Safe to Claim Now (implemented and working)

- "AI-generated fresh content every session" — YES, all 9 cacheable games + activities generate per topic/difficulty
- "Live leaderboard with immediate feedback" — YES, realtime via Supabase subscriptions
- "No student accounts needed" — YES, join via code/link with display name
- "Works with any class size" — YES, simultaneous mode auto-detects ≥3 students
- "Customizable difficulty and topic" — YES, A2–C1+ with topic input
- "10+ games and activities" — YES, 11 games + 11 activities registered
- "Teacher controls everything" — YES, InputSpec model gives full control
- "Switch activities mid-session" — YES, already works

### Claims That Are Ahead of Implementation

- **"Pro features" / "Upgrade to Pro"** — subscription page says "coming soon"; no Stripe integration exists. Do NOT market Pro features until billing works.
- **"Session Notes"** — gated behind Pro but Pro doesn't exist yet. Remove the gate or remove the marketing.
- **"Response Boost"** — not built. Do not mention on landing pages.
- **"AI-powered scoring rubrics"** — not built. All scoring is mechanical (correct/incorrect + points).
- **"Adaptive difficulty"** — difficulty is static per session. Do not claim "adapts to student level."
- **"Personal learning missions"** — Takeoff/mission selector exists but is one activity, not a pervasive personalization system. Claim carefully.

### Recommendation

Update landing page content to remove or soften any claims about Pro features, adaptive difficulty, or AI-powered assessment. Everything else is safe to market.

---

## V1 Lock Summary

### Decisions Now Locked

1. **Session state machine**: LOBBY → MODULE_ACTIVE → MODULE_COMPLETE → SESSION_END (teacher); WAITING → INPUT_ACTIVE → SUBMITTED (student). No new state library.
2. **Scoring model**: `ScoreResult { isCorrect, points, responseData }` persisted to `scores` table. Two paths (direct + approval queue). Streak + spin wheel modifiers. Participation = `isCorrect: null, points: 1`.
3. **Fallback strategy**: Three-tier (cache → AI with fallback object → manual selection). Never show errors to students. Never block teacher mid-session.
4. **Credit model**: Session-based credits (2 free → +3 on email verify → unlimited on Pro). Credit check at generation time, never mid-session. Content cache hits are free.
5. **Instant Activity Swap**: Already works. Rename button, add PPP filter to grid. Formalize as a feature.
6. **Response Boost**: v1.x, not v1 launch. Ship with existing hint infrastructure.
7. **Leaderboard**: Top 3 + own entry during session (locked). Full list at end.

### Top 3 Unresolved Risks

1. **No React Error Boundary** around GameShell/ActivityShell — a rendering crash shows white screen to teacher AND students see "Waiting..." forever. Add one Error Boundary as a safety net.
2. **All generation routes are unauthenticated** — anyone can call `/api/lesson-plan/generate` without logging in. Must add auth + credit check before launch.
3. **Student poll latency (2s)** — acceptable for v1 but creates visible delay. WebSocket upgrade path should be designed now even if implemented in v1.x.

### Top 3 Implementation Packets for Engineering

1. **Credit System + Auth Gating** — Add `generation_credits` to teachers table, add auth middleware to all generation routes, build paywall modal, add email verification flow (or auto-verify Google OAuth users). This unblocks monetization.

2. **Error Boundary + Fallback Polish** — Add React Error Boundary around GameShell/ActivityShell with "Something went wrong, click to retry" UI. Audit all generators for consistent fallback objects. This prevents the worst UX failure mode.

3. **Instant Swap Polish + PPP Filter** — Rename "Back to selection" → "Switch Activity". Add PPP stage badges to selection grid cards. Add filter chips (Presentation / Practice / Production) to the grid. This turns an existing feature into a marketable differentiator.
