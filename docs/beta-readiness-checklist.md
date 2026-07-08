# Beta Readiness Checklist — Jul 8, 2026

Master list of what's left before/around beta. Decisions baked in (owner, Jul 8):
**beta = small invite-only, weeks away · beta is free (Stripe after) · sound v1 after beta starts · onboarding = guided phone-join + teacher-screen coaching.**

Agent lanes (owner, Jul 8): **Fable** = hardest/most important coding only · **Opus** = front-end, majority of coding · **Codex** = long backend runs, anything World Flight · **Sonnet** = easy/quick/cheap.

Status legend: each item lists owner lane, size, and whether it blocks beta.

---

## A. Beta blockers (do first, in this order)

**Status (Jul 8, end of day): A1 ✅ · A2 ✅ (code) · A4 ✅ · A5 ✅ (code) — A3 is the remaining beta-blocker build.**
Open verification items (owner, ~10 min total on the deployed build):
- **A1 live check (re-run after the Jul 8 pm follow-up fix):** launch Flash Quiz, 30s timer, phone joined → 3-2-1 beat on both screens; **teacher and phone timers now agree within a tick** (the earlier ~2s teacher-trails-student gap is fixed), and the phone answer window should open at **~27–30s**, not the earlier 22s. See the A1 timer-budget note below for why.
- **A2 live check:** launch a timed teacher round with a joined phone → the phone should receive the new round by realtime push in under ~1s; poll fallback remains at 15s and should recover after a refresh/offline blip.
- **A4 live check:** create a course with description "animals" with real AI (Codex's local run had no API key) → every suggestion animal-related or blank.
- **A5(b):** subscribe to Supabase Pro **the week beta invites go out** (not needed sooner — project is active daily so no auto-pause risk yet).

**A1 timer budget (why the numbers are what they are).** Both screens now derive remaining time from the same server timestamps: the answer window runs for `timerSeconds` starting at `answersOpenAt` (= `startedAt` + a 4s grace), via one shared `computeTimerState`. Two consequences:
- **Teacher vs. student agree within a tick** — neither counts from its own local clock anymore; both use `answersOpenAt + timerSeconds − serverNow`. (The teacher's `serverNow` comes from the input-spec API echo; the student's from the poll.)
- **The grace defers the countdown instead of eating it.** The 4s grace absorbs delivery latency up to 4s, so only delivery *beyond* 4s costs answer time. Pre-A2 delivery = DB write + up to a 5s poll interval + poll route, so the residual loss is ~0–3s → students see **~27–30s** of a 30s window (the earlier 22s came from the countdown starting at `startedAt`, i.e. the grace was being eaten — now fixed). The student console logs the exact per-round delivery/loss (`[timer] round arrived …`). **A2 (realtime push, <1s delivery) removes the residual entirely** → a full 30s every time. So A1's job here is done; A2 closes the last ~0–3s and matters more for scale than for this timer.

| # | Item | Lane | Size | Notes |
|---|---|---|---|---|
| A1 | ✅ **DONE** (Jul 8, `82172895` + `79fb3219` + `d65b6e35` + pm follow-up) **Timer integrity** — `maxDuration=60` on 49 AI routes (incl. course/outline gap closure); server-stamped `startedAt`/`answersOpenAt` with `clientStartedAt` round nonce so mid-round rebroadcasts don't reset timers; `serverNow` clock-offset in student poll + `useInputTimer`; 3-2-1 grace beat on all 5 timed input types + flash-quiz teacher screen; speed bonus measures from answers-open. **Follow-up (pm):** unified both screens on one `computeTimerState` (origin = `answersOpenAt + timerSeconds`) so teacher & student agree within a tick and the grace defers the countdown; teacher timers (flash-quiz, synonym-showdown, grid-rush, listening-gap-fill, all 4 race-mode games via `useSyncedTimer`/`use-race-mode`) now read the server clock echoed by the input-spec API | **Fable** | done | Pending: owner live-flow re-check (above) |
| A2 | ✅ **DONE** (Jul 8, Codex code): **Realtime push + poll diet** — per-session inputSpec realtime broadcast; student poll 5s→15s fallback; inputSpec revision short-circuit on the poll route | **Codex** | done | Pending: owner live-flow re-check on deploy (above). Depends on A1's server-time stamping |
| A3 | **First-flight onboarding** — split into 6a + 6b (owner Jul 8). **6a ✅ SHIPPED** (`44f51517`): interactive phone-join — lobby coach strip on a teacher's first ~3 sessions (gated server-side on prior session count) nudges scanning the Join QR with their own phone, celebrates when the first passenger boards. **6b — teacher-screen stage coaching** (Captain's Flight Stage 6: dismissible one-line "what you do now" hint under the live stage header + a nudge that the cockpit exists) = NEXT. | **Opus** | 2–3 days | Covers BOTH sides: phone-join proves the student loop; coaching teaches the cockpit. Demo crew stays dead/unmarketed. Pending: owner live-check of 6a on deploy |
| A4 | ✅ **DONE** (Jul 8, Codex: `46e61b34` + `7ea6b901` + `f49a80a5`) **Course Builder source matching fix** — see status note below | **Codex** | done | Pending: live AI outline acceptance on deploy (above) |
| A5 | ✅ **DONE** (Jul 8, code pushed as `4426c93c`): `/home` credits via RPC (also fires the trickle server-side), world-flight-hero hydration fixes, mock-client rpc stub. (b) Supabase Pro = **calendar item for invite week** | **Codex/Sonnet** | done | 052 verified at schema level day of apply |

A2 status note (Jul 8, Codex): teacher inputSpec writes now compute a stable `inputSpecRevision`, echo server time, and broadcast `{ spec, inputSpecRevision, serverNow }` on `session-input-spec:<sessionId>` after the DB write succeeds. Student clients subscribe to that per-session channel for near-immediate round delivery, keep the 15s poll as fallback, and pass their last revision to `/api/student/session`; the route returns a cheap `{ unchanged: true }` payload while active when the spec has not changed, avoiding participant/poll/board/score reads. Files: `src/lib/input-spec.ts`, `src/app/api/session/input-spec/route.ts`, `src/app/api/student/session/route.ts`, `src/components/student/student-controller.tsx`, `src/stores/session-store.ts`, `src/lib/mock/client.ts`, `src/__tests__/lib/input-spec-stamp.test.ts`, `src/__tests__/api/student-session-realtime.test.ts`. Evidence: A2-focused Vitest tests pass, focused lint passes, `pnpm exec tsc --noEmit --pretty false` passes; full `pnpm test` is blocked by the pre-existing aggregate timeout in `src/lib/world-flight/expeditions.test.ts`, which passes in isolation.

A4 status note (Jul 8, Codex): outline lessons now require 2-4 concrete `keywords`; Course Builder matches on those keywords plus the course theme as domain context; source matching uses whole-word/guarded-prefix token hits with tag/title weighting and a minimum score that returns `suggestedSource: null` below the bar. Follow-up hardening after screenshot acceptance: object inputs with empty keywords no longer fall back to full topic text, generic lesson-action keywords are ignored, cross-domain keywords such as human body language/growth mindset no longer beat the course theme, Business English interview tags now cover STAR answers/interviewer questions/mock interviews/difficult questions/resumes/cover letters, and Travel English transportation tags now cover local transport, bus tickets, train stations/journeys, taxis, planning, and directions. Added `scripts/enrich-library-topic-tags.ts` for local JSON tag enrichment without runtime transcript fetches, and enriched the animal-heavy NatGeo/TED-Ed entries needed for the "animals" repro. Files: `src/app/api/course/outline/route.ts`, `src/lib/source-library.ts`, `src/lib/course.ts`, `src/lib/source-library.test.ts`, `src/__tests__/api/course-outline.test.ts`, `scripts/enrich-library-topic-tags.ts`, `src/data/natgeo-library.json`, `src/data/teded-library.json`, `src/data/business-english-library.json`, `src/data/travel-english-library.json`, `package.json`. Evidence: focused Vitest matcher/API tests pass; deterministic acceptance maps screenshot-style animal lessons only to animal-related sources/null, screenshot-style "job interviews" lessons to Business English, and "transportation" Easy/8 lessons to public transport or directions. Live AI outline acceptance is blocked locally because no Gemini/Groq/OpenAI API key is configured.

## B. Strongly recommended before beta (not strictly blocking)

| # | Item | Lane | Size | Notes |
|---|---|---|---|---|
| B1 | **Perceived speed** — perf plan Phase 3: shared aviation `GenerationLoader` replacing 38 bare spinners (self-skips <~400ms; hosts `degraded` messaging); generate-on-selection prefetch + round N+1 prefetch | **Opus** | 2–3 days | First-impression work; matters more now that trials include custom topics + sources (cache-skipping = 2–8s dead time) |
| B2 | **One-to-one leftovers** (one-to-one-audit recs 3–6): bluff-definition explicit 2+ gate; solo-aware sidebar (personal panel vs leaderboard); conversation-rounds self-pairing gate/variant; n=1 copy softening | **Sonnet** (3, 6) / **Opus** (4, 5) | ~1 day total | Do IF beta recruits include online 1:1 tutors (growth doc says yes). Recs 1–2 already shipped via class-fit work |

## C. During/after beta

| # | Item | Lane | Size | Notes |
|---|---|---|---|---|
| C1 | **Sound v1** — 3 SFX (brand resolve, takeoff, touchdown) + global mute + `/dev/sounds` board + **resolve legacy dings** (7 games play unmuted `correct/wrong.mp3` on the teacher screen — delete or fold under mute, default off) | **Opus** (code) + owner/Codex (Ableton assets) | afternoon once files exist | Doc updated Jul 8: `docs/sound-design.md`. Assets are the long pole |
| C2 | **Stripe go-live** — products ($79/yr, $8/mo), env vars, mount `ProCta`, webhook endpoint, Vercel Pro, honor founding-price deadline decision | **Sonnet** (mount/config) + owner (Stripe dashboard) | half day | `docs/billing-setup.md` — steps already updated for $8 |
| C3 | **Marketing Agent OS wiring** — Phase 0 repo (`~/Documents/lessoncaptain-marketing`) is SHIPPED (playbook, 5 charters, ops scaffolding). Remaining: MiniPC agents live (Max dispatcher + Telegram gateway, Hermes research schedules), weekly rhythm running | **Codex** (MiniPC/OpenClaw/Nous side) | multi-day | Parallel track — doesn't touch product repo |
| C4 | **Classes/browse uplift** — `docs/classes-browse-uplift-plan.md`, entirely unimplemented (C1–C3 living class cards + hub, B1–B4 browse redesign) | **Opus** | 3–4 days | Owner-rated weakest pages; promote to pre-beta only if testers will live in /classes |
| C5 | **Library expansion** — NOT a priority as bulk expansion (owner, Jun). The A4 tag-enrichment pass covers quality. When prioritized: automate candidate discovery (topic → <7min captioned candidates → existing free pipeline), human keeps appropriateness sign-off | **Codex** | scriptable | Revisit when beta content gaps show up in requests |
| C6 | **Course Builder v1.1** — source-briefing grounding (reuse planner source panel / extract+briefing); vocab carry-forward; template course seeds (needs owner theme picks) | **Codex** | 2–3 days | After A4 proves matching |
| C7 | **Performance Phase 4** — model tuning: pull a week of `ai_call` logs first; Groq-first experiment for evaluation/game-logic; per-task-class model field; merged auth RPC; prewarm cron; bundle audit | **Codex** | measure-first | Explicitly data-gated — don't start before beta traffic exists |
| C8 | **SEO remainder** — Phase 3 long tail + Phase 4 (`docs/seo-page-template.md` doesn't exist yet) | **Sonnet** | ~1 day | Long-game; not beta-relevant |
| C9 | **Travel directions-game v2** (pair info-gap) + **Captain's Flight Stage 7** (mid-lesson beat parity outside World Flight) | **Codex** (World Flight lane) | 1–2 days each | Codex owns World Flight per owner |

## D. Parked (post-beta, needs product decisions first)

- **Flight Cards** — Scoring V2 dependency is now met (V2 SHIPPED May 2026 — migration 031, `score-engine.ts`, profiles on all plugins; the "parked" label was a stale index entry). Still parked on product design, not tech.
- **End-of-session celebration + teams** (session-level aggregation) · **Student results retention/share** (debrief_token) · **Class Logbook** (locked framing) · **Video Series tab** (curate toward, don't build) · **Lesson composition NL vision** (North Star) · **Turbulence live wiring** (pending owner approval of feel) · **New preset set design** (beyond the 5 shipped).

---

## Suggested sequencing (weeks-away beta)

~~Week 1: A1 · A2 · A4 · A5~~ — **code completed Jul 8** (A2 pending owner live-flow re-check).
Next up: **A3 (Opus)** · then B1 (Opus, after A3) · B2 (Sonnet/Opus fillers).
Then: recruit testers. C-items run during beta; C1 whenever Ableton assets exist; C2 when conversion starts.
Owner verification queue: A1 + A4 live checks on the deployed build (see top of section A); Supabase Pro at invite week.
