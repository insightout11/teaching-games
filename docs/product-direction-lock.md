# Product Direction Lock (LessonCaptain)

Status: **LOCKED** — confirmed decisions only. No speculation.

## Niche (locked)
- Primary target: **live online ESL teachers** running **synchronous** classes.
- Platform-agnostic: works with Zoom/Meet/ClassIn/etc. (still synchronous).

## Core framing (locked)
- Core trade-off: **energy vs structure**.
- LessonCaptain removes the trade-off.
- Primary emotional outcome: **“fun and structured at the same time.”**

## Product identity (locked)
- LessonCaptain is a **Live Classroom Operating System**.
- It is **not**:
  - a game site
  - a worksheet tool
  - an AI gimmick
- AI is the engine (scoring/feedback/support), not the headline.

## Flight Plan (Pro) (locked)
- Flight Plan is the structured lesson builder/launcher.
- Minimal required inputs:
  - Goal
  - Level
  - Topic
  - Time
- Optional advanced input:
  - Grammar focus (`Auto` / `None` / `Custom`)
- Output: structured **PPP** lesson sequence using:
  - Take-Off → Core Modules → Landing

## Response Boost (Pro) (locked)
- Student-side assistance for **activities only** (unscored).
- Manual trigger (Button B).
- Output: **ONE** suggested response.
- Tone selector: `Direct` / `Friendly` / `Formal` / `Confident`.
- Teacher board displays a **Boosted** badge on responses generated via Response Boost.
- No student-to-student indicator beyond the teacher board badge.
- No scoring impact.

## Control Room (Pro) v1.1 scope (locked)
- Control Room is **post-session** (not a live dashboard).
- V1.1 scope is **notes-only** plus reporting from existing metrics:
  - participation coverage
  - accuracy
  - streaks
  - session notes
- Targets are deferred (see architecture locks).

## Pedagogy stance (locked)
- Pedagogy spine: **PPP** by default.
- PPP is **not branded as UI jargon** during live sessions.
- PPP **may be used in marketing** for credibility.
- Goal-adaptive behavior exists as **weighting/selection only** (v1/v1.1).
- Exam-focused structure: **conceptual only** (roadmap item). Must not be oversold.

## What is explicitly NOT in scope (locked)
- Multi-mode pedagogy system / mode selector UI
- Adaptive pacing / AI orchestration logic
- Speed/timing analytics
- Suite labels (e.g., Boost/Stabilize) without defined UI/functional purpose
- “Chaos” framing as the core marketing narrative
- “Autopilot” terminology

## Conceptual vs implemented (lock)
Implemented / locked for v1/v1.1:
- Flight Plan inputs and PPP sequence structure (Take-Off/Core/Landing)
- Leaderboard visibility rules (see architecture lock)
- Response Boost behavior (one output + tone selector + Boosted badge)
- Post-session Control Room positioning

Conceptual / roadmap-only (do not claim as shipped):
- Exam-optimized lesson flow
- Advanced goal-weighted pedagogy tuning beyond simple weighting
