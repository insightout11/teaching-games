# Architecture & Feature Invariants Lock (LessonCaptain)

Status: **LOCKED** — invariants only. No roadmap.

## Scoring model (locked)
- Scoring model is **unchanged**.
- Numeric display remains **0–100**.
- No new scoring logic, no goal-based scoring weighting.

## Universal round tracking (locked)
- `prompt_index` is the universal per-session round tracker.

## Participation coverage (locked)
- Student Coverage = `attempts / total_prompts`
- `total_prompts` is derived from `max(prompt_index)` for the session (or equivalent code-confirmed method).
- Class Participation Rate = **MEAN** of student coverages (v1.1).

## Accuracy highlight threshold (locked)
- Any “Top Accuracy” / “Most Accurate” highlight requires **min 3 attempts** in that session to qualify.

## Leaderboard visibility (locked)
- During session:
  - students see **their own points only**
  - main board shows **Top 3 only**
  - no full ranking list live
- At landing:
  - full leaderboard is revealed

## Control Room persistence (locked)
- Control Room is **post-session**.
- V1.1 ships `session_notes` only.
- `session_targets` deferred to v1.2.

## Response Boost rules (locked)
- Activities only (unscored)
- One output only
- Tone selector options: `Direct` / `Friendly` / `Formal` / `Confident`
- Student selects tone on their own device before generating
- Teacher board shows **Boosted** badge on the response row
- No additional student-to-student indicator beyond teacher board badge
- No scoring impact

## Pedagogy tagging (locked)
- PPP is internal structure; not UI jargon.
- PPP may be referenced in marketing.
- PPP stage tagging is **internal metadata only** (Presentation/Practice/Production), not UI-exposed. Schema implementation is to be proposed by Claude (do not overbuild now).

## Module requirements (locked)
Modules must:
- produce measurable output
- feed Control Room data
- align with Goal weighting/selection
- fit clearly into PPP stage (Presentation/Practice/Production) internally

## Kill switch rule (locked)
- If a module fails both:
  - Measurable Output **and**
  - UI Simplicity

→ treat as **rebuild**, not tweak.
