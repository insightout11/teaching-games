# Beta Readiness Checklist — Jul 8, 2026

Master list of what's left before/around beta. Decisions baked in (owner, Jul 8):
**beta = small invite-only, weeks away · beta is free (Stripe after) · sound v1 after beta starts · onboarding = guided phone-join + teacher-screen coaching.**

Agent lanes (owner, Jul 8): **Fable** = hardest/most important coding only · **Opus** = front-end, majority of coding · **Codex** = long backend runs, anything World Flight · **Sonnet** = easy/quick/cheap.

Status legend: each item lists owner lane, size, and whether it blocks beta.

---

## A. Beta blockers (do first, in this order)

| # | Item | Lane | Size | Notes |
|---|---|---|---|---|
| A1 | **Timer integrity** — perf plan Phases 0–1: `maxDuration` on AI routes; server-authoritative `startedAt` + `serverNow`; 3-2-1 grace countdown (`answersOpenAt`) | **Fable** | ~1 day | The felt bug (20s of a 30s window). Touches scoring + input-spec write path — the two most invariant-laden systems. Plan: `docs/performance-optimization-plan.md` |
| A2 | **Realtime push + poll diet** — perf plan Phase 2: broadcast inputSpec on a per-session channel; poll 5s→15s fallback; change-detection short-circuit on the poll route | **Codex** | 2–3 days | Long backend task, well-specified, testable. Depends on A1's server-time stamping. Shuffleboard aim channel already proves anon realtime |
| A3 | **First-flight onboarding** — guided "join with your own phone" QR prompt in the first Test Flight **+ teacher-screen stage coaching** (Captain's Flight plan Stage 6: one-time coach marks on cockpit widgets + lesson flow as the lesson advances) | **Opus** | 2–3 days | Covers BOTH sides: phone-join proves the student loop; coaching teaches the cockpit. Demo crew stays dead/unmarketed |
| A4 | **Course Builder source matching fix** — outline AI emits 2–4 concrete noun keywords per lesson; whole-word/prefix matching (kill `q.includes(t)` substring hits); minimum-score threshold → `suggestedSource: null`; **library tag-enrichment pass** (re-run the one-call metadata enrichment over existing library JSONs with a richer tag vocabulary so animal videos carry `animals`/`wildlife` etc.) | **Codex** | 1–2 days | Owner repro Jul 8: "animals" → narcissism/Red-Riding-Hood picks. Root causes: tag sparsity, bag-of-words filler scoring, substring garbage, no quality bar. Tag enrichment is the same pipeline as prefetch — cheap tokens, no Supadata |
| A5 | **Verify, not build:** (a) `/home` has zero placeholder content; (b) Supabase Pro is actually upgraded (no auto-pause during a tester session); (c) migration 052 behavior sane in prod (already applied+verified at schema level) | **Sonnet** (a, click-through + fixes) / owner (b) | hours | Cheap insurance |

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

Week 1: A1 (Fable) → A2 (Codex, parallel after A1's server-time lands) · A4 (Codex, independent — can start day 1) · A5 (Sonnet).
Week 2: A3 (Opus) · B1 (Opus, after A3) · B2 (Sonnet/Opus fillers).
Then: recruit testers. C-items run during beta; C1 whenever Ableton assets exist; C2 when conversion starts.
