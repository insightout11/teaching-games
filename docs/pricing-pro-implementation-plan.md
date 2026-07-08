# Pricing / Pro Improvements — Implementation Plan

Source: `docs/pricing-pro-audit.md` (Jul 2026). Decisions confirmed by owner:

- Test Flight credits unlock **source-based lessons + custom topics** (NOT Course Builder or Control Room notes — those stay hard Pro).
- **Delete the per-module Pro list** entirely. Story becomes: "Free: 5 full lessons, everything included. Pro: unlimited."
- **1 credit/month trickle** for exhausted free accounts.
- Monthly price drops **$12 → $8/mo** (annual stays $79 founding / $99 after Aug 31).

Ordered by leverage; each phase is independently shippable.

---

## Phase 1 — Unlock sources + custom topics during Test Flights (highest leverage)

Key insight from the code: `requireAuthForGeneration` (`src/lib/auth-credits.ts:164`) **already** passes `is_developer || is_pro || credits > 0` for Pro-module requests, and all three `/api/source/*` routes call it with `requestHasProModules: true`. The server already admits credit-holders — only the client gates block them.

1. **`src/components/planner/source-input-panel.tsx:412-414`** — change the gate from `!isPro` to `!isPro && credits <= 0` (`useTeacherTier` already returns `credits`). Keep the upsell card for truly exhausted/anonymous users; for credit-holders show the real panel. Add a small "Test Flight" hint line so trial users know this is a Pro feature they're sampling.
2. **`src/components/planner/plan-source-suggest.tsx:66`** — same change.
3. **`src/components/session/session-settings-bar.tsx:110`** — custom-topic toggle: `isPro` → `isPro || credits > 0`.
4. **Server check for custom topics** — verify `/api/lesson-plan/generate` (uses `isValidStandardTopicId`) doesn't reject free-form topics from credit-holders. If it validates topic against the standard list for non-Pro, align it to credits-or-Pro.
5. **Verify** `/api/session/create` launch path is unaffected (credit consumed per launch as today; a source-based launch just spends a credit like any other).
6. **`/pro` page free card** — "Full Flight Plan experience" becomes true; add explicit bullet: "Source-based lessons and custom topics included in your Test Flights."

Out of scope (stays hard Pro): `course-builder.tsx:118`, `courses-home.tsx:34`, `/api/course/outline` (`requestHasProModules: true` — see Phase 2 note), Control Room notes.

## Phase 2 — Delete the per-module Pro list

Everything keyed off `PRO_ACTIVITY_KEYS` / `PRO_GAME_KEYS` / `hasProModules` in `src/lib/standard-topics.ts:55-78`:

1. **`src/lib/standard-topics.ts`** — delete both sets and `hasProModules`.
2. **`src/components/session/session-view.tsx`** — remove: launch gate at ~1309, `isProGame`/`isProActivity` badge logic at ~2309/~2376, and the `PRO_GAME_KEYS` exclusion from the end-game pool at ~1231 (Pro modules become eligible for everyone, including session grace).
3. **`src/lib/discovery-shelves.ts:59,77`** — drop `isPro` derivation; then remove the amber Pro badge rendering in `DiscoveryCard`, `DiscoveryDetailDrawer`, `ExploreClient`, `RecommendedLane`, `TeacherHomeClient`, `review-launch-screen`, `FeaturedFlightLaunchModal`, `deal-cards-panel`, `credit-badge` — wherever it keys off that flag (grep `isPro` per component; some of these use it for the credit wall, which stays).
4. **API routes** — `grammar-boss/{generate,evaluate}`, `story-sprint/{starter,evaluate,analyze}`: change `requireAuthForGeneration({ requestHasProModules: true })` → plain `requireAuthForGeneration()`. `lesson-plan/generate:2667` drops the `hasProModules(...)` computation.
   - **Keep** `requestHasProModules: true` on `/api/source/*` and `/api/course/outline` — for those it correctly means "Pro or credits" (Phase 1 relies on it). Rename the option to `requiresEntitlement` so the name stops lying after module gating dies.
5. **`src/lib/auth-credits.ts`** — session grace no longer needs the Pro-module carve-out in `requireAuthWithCredits:89`; simplify and update the entitlement-priority comment block.
6. **Tests** — update anything asserting Pro-module behavior (`billing.test.ts`, generate-route tests that pass module keys).

## Phase 3 — Monthly price $12 → $8 + dead-link fix (small, do together)

1. **Dead link (audit #6)** — `session-settings-bar.tsx:122`: `/settings?tab=billing` → `/pro`. (After Phase 1 this link only shows to 0-credit users, but fix it regardless.)
2. **Price copy** — `$12/month` → `$8/month` in:
   - `src/app/(public)/pro/page.tsx:108`
   - `src/components/billing/pro-cta.tsx:94` ("Or $8/month")
   - `src/components/homepage/PricingSection.tsx:137`
   - `docs/billing-setup.md` go-live steps
3. **Stripe** — when creating live prices at go-live, monthly price object = $8. `STRIPE_PRICE_MONTHLY` env var just points at it; no code change. If a $12 test price exists in Stripe test mode, create a new $8 price (Stripe prices are immutable).

## Phase 4 — Credit trickle (1/month for exhausted accounts)

Design: **lazy top-up, no cron.** Non-cumulative — an exhausted account holds at most 1 trickled credit; unused trickle does not stack.

1. **Migration `0XX_credit_trickle.sql`** (⚠️ manual apply per project convention — Management API token; verify live schema first):
   - `ALTER TABLE teachers ADD COLUMN last_trickle_at timestamptz;`
   - Update `get_teacher_credits` RPC: if `NOT is_pro AND NOT is_developer AND generation_credits = 0 AND (last_trickle_at IS NULL AND <account is credit-exhausted, i.e. ever consumed> OR last_trickle_at < NOW() - INTERVAL '30 days')` → set `generation_credits = 1`, `last_trickle_at = NOW()`, return the topped-up value. Doing it inside the read RPC means every entry point (launch gate, tier hook, session create) sees it with zero new call sites.
   - Guard: only trickle to accounts that have consumed ≥5 lifetime credits (i.e. genuinely exhausted onboarding, not fresh accounts) — track via existing consumption or a `credits_granted_total` column if needed.
2. **Client** — `use-teacher-tier.ts` reads `generation_credits` directly from `teachers`; the trickle happens in the RPC, so either point the hook at the RPC or accept that the badge updates on next server-touching action. Prefer switching the hook to the RPC for consistency.
3. **Paywall copy** — Explore / planner review / drawer / featured-modal paywalls: add one line, "You get 1 free Test Flight credit each month — or go unlimited with Pro." Update `/pro` FAQ ("What counts as a Test Flight?") to mention the monthly credit.
4. **Tests** — RPC-level behavior via a route test on `/api/session/create` with a mocked exhausted teacher; assert single grant + 30-day gate.

## Phase 5 — Truth-pass on /pro claims (before Stripe go-live)

`src/app/(public)/pro/page.tsx` `PRO_FEATURES` (lines 19–27), reword to what's shipped:

- "Saved and reusable Flight Plans" → planner rebuild is at Slice 1; reword to "Flight Plan presets for every lesson type" or ship saved plans first. **Owner call at implementation time.**
- "Editable progress report drafts from your notes and session history" → reports are notes-derived; reword to "Per-student notes and progress drafts in the Control Room" (matches what `control-room` actually does). Also fix the same claim in the FAQ (line 36).
- Add "Course Builder" as a listed Pro feature — it's genuinely Pro-gated and currently unmentioned (the page sells nothing that Phase 2 keeps gated except sources/topics, which trials now sample — Course Builder becomes a real differentiator line).
- Homepage `PricingSection.tsx` — sync any equivalent claims.

## Sequencing & verification

- Order: Phase 1 → 3 → 2 → 5 → 4 (trickle last; it has the migration dependency. Phase 3 is trivial and can ride along with anything).
- Each phase: `pnpm test`, `pnpm next lint --file <changed>`, typecheck, then verify on the deployed build (no local dev server) — specifically: a credit-holding non-Pro account can paste a YouTube URL in the planner and set a custom topic; a 0-credit account still hits the wall; no amber Pro badges remain anywhere; `/pro` renders $8/month.
- Commits straight to main, one phase per commit, staging only the files each phase touches.

## Explicitly deferred

- Referral credits (revisit after Stripe go-live data).
- Any weekly-cap / metered freemium redesign — the credits → wall → Pro model stays.
- Founding-price expiry handling ($99 on Sept 1) — calendar decision, not code; honor it when the date comes.
