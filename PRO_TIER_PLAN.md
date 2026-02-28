# LessonCaptain Pro Tier Strategy v2

## Context

LessonCaptain is pre-monetization with Stripe fields and `subscription_status` already in the DB schema but no feature gates enforced. The goal is a growth-oriented freemium model: individual teachers convert themselves via a genuine free tier that feels like a real product, then hit natural upgrade pressure as usage grows. Schools are the upsell target.

**Core philosophy**: Free tier must never break mid-class. Caps are checked at the **start** of a round or session, never during. Free accounts feel usable in real classrooms but hit ceilings over time — ceilings that reset weekly so teachers never feel permanently locked out.

---

## Part 1: Pro Feature Criteria (Revised)

**C1 — AI calls scale per-student or per-submission (unbounded cost)**
If every student answer or every student submission triggers an AI call (Story Sprint eval, Hot Take counter-arguments), the feature is Pro. Fixed one-shot generation per round is acceptable on free with a global budget backstop.

**C2 — Bulk generation fans out 3+ concurrent API calls per teacher action**
Lesson Planner parallel generation is the stated biggest cost concern. Full multi-item plans (2+ items) → Pro. Single-item preview → free.

**C3 — Feature requires multiple sessions before its value is understood**
Saving lesson plans, session analytics — teachers only appreciate these after 3+ sessions. Gate at Pro; the wall hits naturally after habit is built.

**C4 — Gamification amplifier with zero AI cost but high lock-in**
Spinner Mode (shields, multiplier wheel) has no AI cost but creates deep habit. Gate after 3 sessions so teachers discover and fall for it, then hit the paywall the next time they want it.

**C5 — Zero marginal cost → always free, no caps**
Word Chain, student picker modes, basic timers, basic scoring, streaks. Never gate zero-cost features; it creates resentment without saving money.

**C6 — Feature signals professional/committed use, separates serious teachers from casual users**
Custom topic override, Race Mode, advanced difficulty, professional tones. These are primary upgrade motivators — visible with a Pro badge but require subscription to use.

**Global Backstop**
All free accounts share a global AI call budget: **40 AI calls/week** (rolling 7-day window). This protects against heavy free users regardless of individual feature caps. Budget is checked at round/session START only — never mid-game. When the budget is exhausted, the teacher sees a gentle end-of-round message, not a hard wall during class.

---

## Part 2: Free Usage Limits Model

### Global AI Budget
- **40 AI calls/week** (rolling 7-day window) per free account
- Checked at the start of each round or game session, not mid-round
- When budget < calls needed for next round, show soft prompt: "You've used your free AI for this week — upgrade for unlimited, or your budget resets [date]"
- Budget resets every 7 days from first use (not calendar week)

### Per-Feature Weekly Caps

| Feature | Weekly Cap (Free) |
|---------|-------------------|
| Twenty Questions | 2 complete games/week |
| Connections | 2 puzzles/week |
| Would You Rather | 3 sessions/week |
| Two Truths & A Fabrication | 3 sessions/week |
| Fact Detective | 3 sessions/week |

### Per-Session Round Caps

| Feature | Rounds/Session (Free) |
|---------|----------------------|
| Vocab Sprint | 4 rounds |
| Synonym Showdown | 4 rounds |
| Sentence Scramble | 4 rounds |
| Grammar Boss | 4 rounds |
| Dialogue Detective | 4 rounds |
| Error Hunter | 4 rounds |

### What Never Caps
- Word Chain (no AI)
- Student picker modes
- Timers
- Basic scoring, streaks, leaderboard
- Dropdown topic selection
- Difficulty (A1–B2)
- Tones (Neutral, Casual, Kid-friendly)

---

## Part 3: Feature Classification

### Games

| Feature | Tier | Reason |
|---------|------|--------|
| Word Chain | **Free — unlimited** | C5: zero AI cost |
| Vocab Sprint | **Free — 4 rounds/session** | Round cap covers full class |
| Synonym Showdown | **Free — 4 rounds/session** | Same |
| Sentence Scramble | **Free — 4 rounds/session** | Same |
| Grammar Boss | **Free — 4 rounds/session** | Same |
| Dialogue Detective | **Free — 4 rounds/session** | Same |
| Error Hunter | **Free — 4 rounds/session** | Same |
| Connections | **Free — 2 puzzles/week** | High-delight quality demo |
| Twenty Questions | **Free — 2 games/week** | C1: continuous AI per question |
| Story Sprint | **Pro** | C1: 1 eval call per student sentence |

### Activities

| Feature | Tier | Reason |
|---------|------|--------|
| Would You Rather | **Free — 3/week** | Best aha-moment demo |
| Two Truths & A Fabrication | **Free — 3/week** | Single generation; fun freebie |
| Fact Detective | **Free — 3/week** | Single generation; weekly cap |
| Hot Take Arena | **Pro** | C1: real-time AI counter-argument per student argument |
| Expert Panel | **Pro** | C1: continuous follow-up facilitation |
| Scenario Simulator | **Pro** | C1: branching narrative follow-ups |
| Rank It | **Pro** | C1: `/api/activity/continue` after each reveal step |

### Session Customization

| Feature | Tier | Reason |
|---------|------|--------|
| Topics (all 14 dropdown) | **Free — unlimited** | C5 |
| Custom topic override | **Pro** | C6: #1 upgrade motivator |
| Difficulty: A1–B2 | **Free — unlimited** | C5 |
| Difficulty: C1–C2 (Advanced/Expert) | **Pro** | C6: professional ESL signal |
| Tones: Neutral, Casual, Kid-friendly | **Free — unlimited** | C5 |
| Tones: Formal, Professional, Humorous | **Pro** | C6: professional context signal |
| Timers | **Free — unlimited** | C5 |
| Picker modes (Fair/Random) | **Free — unlimited** | C5 |
| Spinner Mode (wheel, shields, multipliers) | **Pro (unlocked after 3 sessions)** | C4: high lock-in, zero AI cost |

### Game Modes

| Feature | Tier | Reason |
|---------|------|--------|
| Turn-based mode | **Free — unlimited** | Never gate the baseline |
| Simultaneous Race Mode | **Pro** | C6: visual upgrade moment |

### Lesson Planner

| Feature | Tier | Reason |
|---------|------|--------|
| 1-item generation (preview) | **Free** | C2: single call; quality demo |
| 2–5 item lesson plans | **Pro** | C2: 3+ concurrent API calls |
| Save/persist plans to DB | **Pro** | C3: only valuable after multiple sessions |

---

## Part 4: Conversion Funnel

### Phase 1 — Genuine Value (Week 1–2, Free)
Teacher runs 2–3 sessions. Gets Would You Rather, 4 rounds of Vocab Sprint, Connections once or twice. Experience feels complete. No artificial limits hit.

### Phase 2 — First Walls Appear (Week 3–4)
- Connections blocked at session start: "2/2 used this week. Resets [date] or upgrade."
- Custom topic field disabled with Pro tooltip
- Race Mode tracker visible with Pro badge, turn-based still works
- Story Sprint card shows Pro badge in the selection grid

All walls hit **at the start** of a session or round — never mid-class.

### Phase 3 — Trial Conversion
At the wall:
- Specific callout: "Unlimited Connections, custom topics, Race Mode, full lesson plans"
- 14-day free trial, no credit card required (`subscription_status: 'trial'`)
- After trial: $12/month individual, $8/teacher/month for school (5+ seats)

### Phase 4 — Renewal Lock-in
After 30 days Pro: saved lesson plans, custom topics, students expecting Race Mode and Spinner. Churning means returning to generic topics and weekly limits.

---

## Part 5: Implementation Plan

### Database Changes

Add to `teachers` table:
```sql
ALTER TABLE teachers
  ADD COLUMN ai_calls_this_week integer NOT NULL DEFAULT 0,
  ADD COLUMN ai_week_start_at timestamptz,
  ADD COLUMN weekly_usage jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN session_round_counts jsonb NOT NULL DEFAULT '{}';
```

### New Files

**`src/lib/subscription.ts`**
```ts
export type SubscriptionTier = 'free' | 'trial' | 'active' | 'cancelled';

export const PRO_FEATURES = {
  storySprint, hotTakeArena, expertPanel, scenarioSimulator, rankIt,
  raceMode, spinnerMode, customTopic, advancedDifficulty, professionalTones,
  lessonPlannerFull, lessonPlannerSave,
} as const;

export const FREE_WEEKLY_CAPS: Record<string, number> = {
  'twenty-questions': 2,
  'connections': 2,
  'would-you-rather': 3,
  'two-truths': 3,
  'fact-detective': 3,
};

export const FREE_ROUNDS_PER_SESSION: Record<string, number> = {
  'vocab-sprint': 4, 'synonym-showdown': 4, 'sentence-scramble': 4,
  'grammar-boss': 4, 'dialogue-detective': 4, 'error-hunter': 4,
};

export const FREE_AI_BUDGET_PER_WEEK = 40;

export function canAccess(tier: SubscriptionTier, feature: keyof typeof PRO_FEATURES): boolean {
  return tier === 'active' || tier === 'trial';
}
```

**`src/lib/ai-budget.ts`** — Server-side budget/cap functions:
```ts
// Check + decrement global weekly AI budget
export async function checkAndDecrementBudget(
  teacherId: string, callsNeeded: number
): Promise<{ allowed: boolean; remaining: number; resetsAt: Date }>

// Check weekly feature cap (connections, twenty-questions, etc.)
export async function checkWeeklyFeatureCap(
  teacherId: string, featureKey: string
): Promise<{ allowed: boolean; used: number; cap: number; resetsAt: Date }>

// Increment weekly usage for a capped feature
export async function incrementWeeklyFeature(
  teacherId: string, featureKey: string
): Promise<void>
```

**`src/hooks/use-subscription.ts`** — Client hook: `isPro`, `can(feature)`, `weeklyUsage`, `weeklyBudgetRemaining`

**`src/components/ui/upgrade-prompt.tsx`** — Reusable modal: shows what's blocked, remaining weekly caps, reset date, trial CTA. Never appears mid-round.

**`src/app/api/webhooks/stripe/route.ts`** — Handles `checkout.session.completed`, `customer.subscription.updated/deleted` → updates `teachers.subscription_status`

### Files to Modify

**Registry types:**
- `src/games/types.ts` — Add `proOnly?: boolean` to `GamePlugin`
- `src/activities/types.ts` — Add `proOnly?: boolean` to `ActivityPlugin`

**Plugin files — set `proOnly: true`:**
- `src/games/story-sprint/index.ts`
- `src/activities/hot-take-arena/index.ts`
- `src/activities/expert-panel/index.ts`
- `src/activities/scenario-simulator/index.ts`
- `src/activities/rank-it/index.ts`

**API Guards** (check at request start, never mid-stream):

```ts
// Pattern for Pro-only routes (story-sprint/*)
const tier = await getTeacherSubscriptionTier(teacherId);
if (!canAccess(tier, 'storySprint'))
  return NextResponse.json({ error: 'Pro feature', upgrade: true }, { status: 402 });

// Pattern for weekly-capped routes (twenty-questions, connections, activity/continue for free features)
const cap = await checkWeeklyFeatureCap(teacherId, 'twenty-questions');
if (!cap.allowed)
  return NextResponse.json({ error: 'Weekly cap reached', resetsAt: cap.resetsAt }, { status: 429 });

// Global budget on all free AI calls
const budget = await checkAndDecrementBudget(teacherId, 1);
if (!budget.allowed)
  return NextResponse.json({ error: 'Weekly AI budget reached', resetsAt: budget.resetsAt }, { status: 429 });
```

Routes to guard:
- `src/app/api/story-sprint/analyze/route.ts` — Pro only
- `src/app/api/story-sprint/starter/route.ts` — Pro only
- `src/app/api/story-sprint/evaluate/route.ts` — Pro only
- `src/app/api/activity/continue/route.ts` — Pro-only for hot-take/expert-panel/scenario/rank-it; weekly cap for wyr/two-truths/fact-detective
- `src/app/api/twenty-questions/answer/route.ts` — Weekly cap + global budget
- `src/app/api/lesson-plan/generate/route.ts` — Gate when total items > 1 for free tier
- All game generate routes (vocab-sprint, grammar-boss, etc.) — Decrement global weekly budget for free accounts

**UI Enforcement:**
- `src/components/session/session-view.tsx` — Pro badge + lock overlay on Pro items; weekly usage counter on capped items; check session round cap before entering game
- `src/components/session/session-settings-bar.tsx` — Disable custom topic (Pro tooltip), C1/C2 difficulty, Formal/Professional/Humorous tones
- `src/app/(dashboard)/lesson-planner/page.tsx` — Show upgrade prompt when free user tries to generate >1 item
- `src/app/(dashboard)/layout.tsx` — Fetch teacher subscription_status and weekly usage; pass via context
- `src/components/ui/sidebar.tsx` — Subscription status chip; weekly budget indicator ("32 AI calls left this week"); upgrade CTA

---

## Part 6: Verification Checklist

1. **Free tier usability**: 4 rounds of Vocab Sprint work fine; 5th round blocked at round start with upgrade prompt
2. **Weekly cap — Twenty Questions**: 3rd game blocked with "2/2 used this week, resets [date]"
3. **Global AI budget**: 40th call works; 41st blocked at session start with reset date
4. **No mid-class interruption**: Budget exhaustion at round 3 of 4 — round 3 completes; block only at round 4 start
5. **Pro gate — Story Sprint**: Free user sees Pro badge, disabled click, upgrade modal; Pro user gets full access
6. **Custom topic gate**: Free user gets disabled field with tooltip; Pro user gets live AI on custom topic
7. **Race Mode**: Free user with 4+ students sees Pro badge but turn-based still works; Pro gets Race Mode
8. **Lesson Planner**: Free + 1 item works; Free + 2 items → upgrade prompt before any generation; Pro → full 5-item plan saves to DB
9. **Weekly caps reset**: `ai_week_start_at` set to 8 days ago → usage resets
10. **Trial flow**: `subscription_status: 'trial'` → all Pro features accessible, all caps removed
11. **Stripe webhook**: `customer.subscription.updated` with `status: 'active'` → `teachers.subscription_status` updates, teacher gets Pro access immediately
