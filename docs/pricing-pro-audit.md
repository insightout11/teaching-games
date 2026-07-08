# Pricing / Pro Gating Audit — July 2026

> Recovered from an audit session (Jul 8, 2026). Prompt: "do an audit on what is pro-gated… I want pushback on the pro features and original ideas… does the pricing plan make sense?" No code changes were made as part of the audit.

## What the code actually gates (as of today)

**The core model** — simpler than the old `PRO_TIER_PLAN.md` and mostly good:

- **Free = 5 Test Flight credits, lifetime.** One credit is consumed per session launch (`session/create/route.ts:234`), regardless of lesson length. During a Test Flight, *everything* works — Pro modules included (`requireAuthForGeneration` lets credit-holders through, and the launch gate in `session-view.tsx:1280` matches).
- **At 0 credits: hard wall on all launches.** Paywalls in Explore, the planner review screen, the discovery drawer, and the featured-flight modal. Session grace keeps an active lesson alive (Standard modules only).
- **Anti-abuse backstop:** 200 free AI calls/week rolling window (`auth-credits.ts:179`).
- **Everything fails open** on DB errors — consistent "never block mid-lesson" philosophy. Fine, but a Supabase RPC outage means free unlimited for its duration.

**Pro-only regardless of credits** (hard `isPro` checks, credits don't unlock these):

- Custom topics (`session-settings-bar.tsx:110`)
- Source-based lessons — the whole source input panel and suggest flow (`source-input-panel.tsx:414`, `plan-source-suggest.tsx:66`)
- Course Builder + Courses home (`course-builder.tsx:118`, `courses-home.tsx:34`)
- Control Room per-student notes / progress drafts (control-room page ~line 287)

**Pro-badged modules** (`standard-topics.ts`): 10 activities (hot-take-arena, expert-panel, scenario-simulator, scene-igniter, problem-solvers, character-cards, grammar-proof, fact-detective, final-answer, lightning-round) + 2 games (grammar-boss, story-sprint), out of roughly 40 activities and 22 games.

**Pricing** (`/pro` page): $79/yr founding (struck-through $99, deadline Aug 31 2026) or $12/mo; checkout is email-only, Stripe built but not live.

## Pushback

### 1. The biggest problem is a broken funnel: trial teachers can never touch the thing being sold

The marketing OS says PLG via `/video-lesson` — source-based lessons are the differentiator and the #1 Pro selling point on the pricing page. But `source-input-panel.tsx` gates on `isPro` with no credit allowance, so during their 5 Test Flights a teacher *cannot paste a video or PDF even once*. Meanwhile the free plan card literally promises "Full Flight Plan experience." Teachers are being asked to pay $79 for a feature they've never experienced. The Pro *modules* got this right (credits unlock them); sources, Course Builder, and notes got it wrong. Cost is bounded by the 5 credits anyway — let credit-holders use sources during Test Flights. **This is the single highest-leverage change in the whole audit.**

### 2. The per-module Pro list is vestigial and now does almost nothing — kill it or commit to it

It's a leftover from the abandoned v2 plan. Walk the logic: with credits, Pro modules work (the gate is inert); with 0 credits, the *credit wall* blocks every launch anyway (the gate is redundant). The only real effect is a confusing amber "Pro" badge on modules that work fine when clicked, plus excluding those modules from session grace. And the list itself has drifted arbitrarily — the old plan had grammar-boss free at 4 rounds/session and fact-detective free 3×/week; now they're Pro, while twenty-questions (continuous per-question AI, the old plan's canonical C1 cost case) is *free*. If cost is the criterion, the list is wrong; if upsell is the criterion, the pricing page never mentions premium modules at all — you're not even selling what you gated. **Recommendation: drop module gating entirely** and let the story be dead simple — "Free: 5 full lessons, everything included. Pro: unlimited." Better pitch, less code.

### 3. This isn't freemium, it's a trial — and there's no re-engagement lever

5 lifetime credits with no reset means a teacher who burns them in week one and doesn't convert is permanently dead. The v2 plan's core philosophy — weekly-resetting ceilings so teachers "never feel permanently locked out" — was quietly abandoned. Kahoot/Blooket/Baamboozle all have perpetual free tiers; teachers talk to each other, and "it stops working after 5 lessons" travels. Conversion also usually follows *habit*, and 5 sessions is thin for habit formation. Don't rebuild weekly caps — the simplicity is worth keeping — but consider one small trickle: e.g. 1 credit/month for exhausted accounts, or a credit per referral. At gemini-2.5-flash-lite prices with the cache-first layer, a trickled session costs approximately nothing and gives lapsed teachers a reason to come back the week they actually need a lesson.

### 4. Pricing level is sane; the monthly/annual spread is not

$79/yr (~$6.60/mo effective) sits comfortably against Blooket Plus (~$36/yr), Quizlet (~$36/yr), Kahoot (~$4–8/mo) — premium but doing live AI generation, defensible. But $12/mo × 12 = $144 vs $79 is a 45% annual discount; the industry norm is ~17% (two months free). At that spread, monthly reads as a decoy, and a lot of ESL teachers — especially online tutors — budget monthly and won't commit annually to a product they've used 5 times. Either drop monthly to $8–9, or accept that annual is deliberately the only real option and monthly conversions will be near zero. Also: the Aug 31 founding deadline only builds trust if the price actually goes to $99 on Sept 1. Decide now to honor it.

### 5. Pricing-page claims vs. shipped reality — worth a pass before Stripe goes live

"Editable progress report drafts" and "Saved and reusable Flight Plans" are listed as Pro features; the planner rebuild is at Slice 1 and reports are notes-derived. Selling a $79 annual commitment on features that are partially built is how you get refund emails. Trim the list to what's true today, or ship those first. The free card's "Full Flight Plan experience" also contradicts the Pro-only source panel (see #1) — one of the two has to change.

### 6. Concrete bug: dead link

The Pro badge in `session-settings-bar.tsx:122` links to `/settings?tab=billing`, but no settings page exists anywhere under `src/app` — every other paywall links to `/pro`. A free teacher clicking the most prominent in-session upsell lands on a 404. One-line fix.

### 7. Minor: one credit = unlimited AI within the session

Credits are consumed at session create; per-round generate routes are auth-only under the 200/week cap. A single credit can fund a multi-hour marathon. Probably fine — the cap bounds abuse and "never break mid-class" is the right call — but "5 credits" is really "5 unbounded lessons," so price the free tier's AI cost accordingly.

## Bottom line

The current architecture (credits → hard wall → Pro unlimited) is *better* than the elaborate v2 plan — simpler to explain, simpler to enforce, no mid-class surprises. The three changes that matter:

1. **Unlock source-based lessons during Test Flights** — the funnel depends on it.
2. **Delete the vestigial per-module Pro list.**
3. **Add one small credit-trickle or referral lever** so exhausted free accounts aren't permanently dead.

Plus the `/settings` dead link fix (#6) and a truth-pass on the Pro feature list before checkout goes live.
