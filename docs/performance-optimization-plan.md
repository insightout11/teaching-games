# Performance & Optimization Plan

_Audit date: 2026-07-07. Scope: generation speed, timer integrity, polling/scale, perceived performance, model tuning, infra upgrades._

## Context (findings this plan addresses)

- **Timer bug (felt daily):** students get ~20s of a 30s window. The student countdown syncs to the teacher's `Date.now()` (`startedAt` in inputSpec; `useInputTimer` in `dynamic-input.tsx`), so every second of delivery delay — DB write (~1s) + poll wait (0–5s) + heavy poll route (~1–2s) + 1.5s "Get ready" splash + device clock skew — comes out of the student's answer time. Speed scoring is skewed by the same delay.
- **Scale bottleneck:** `/api/student/session` runs up to ~9 Supabase queries per student per 5s, unconditionally. This is the cost line that grows linearly with adoption (Vercel invocations + DB load), not the AI.
- **Platform timeout risk:** no route sets `maxDuration`; the AI reliability layer's own budget (15s + 15s retry + provider fallbacks; 30s bulk) can exceed Vercel's default function limit → mystery 504s instead of graceful fallbacks.
- **Perceived speed:** 38 hand-rolled bare spinners during generation; generation starts on game mount rather than on selection; cache-skipping paths (custom topics, source-grounded, trip review) are 2–8s of dead time.
- **Model tuning:** `evaluation`/`game-logic` route OpenAI-first (`gpt-4o-mini`, mid-2024 model) — the most latency-sensitive calls in gameplay. Groq provider exists but is only in the content-gen fallback chain.

## Phase 0 — Safety fixes (ship immediately, ~1 hour)

1. **`export const maxDuration = 60`** on all AI routes: `*/generate`, `*/evaluate`, `activity/continue`, `lesson-plan/*`, `course/*`, `source/*`. Verify the project's plan allows it (see Infra section).

## Phase 1 — Timer integrity (the felt bug; ~1 day, independent of realtime)

2. **Server-authoritative clocks.** Input-spec API stamps `startedAt` with server time on write (ignore client-supplied value). `/api/student/session` response includes `serverNow`; `useInputTimer` computes remaining as `timerSeconds − (serverNow − startedAt) − (ms since response received)`. Kills clock-skew errors on both sides.
3. **Grace countdown.** Broadcast `answersOpenAt = startedAt + ~4s`. Teacher screen plays a 3-2-1 beat before answers open; student's 1.5s "Get ready" splash folds into the same window instead of eating answer time. Speed scoring measures from `answersOpenAt`. Result even without realtime: ~26–27s effective of a 30s window.

## Phase 2 — Realtime push + poll diet (~2–3 days)

4. **Broadcast inputSpec changes.** When the input-spec API writes a new spec, also broadcast it on a per-session Supabase Realtime channel (server-side broadcast). Students hold one subscription (anon realtime already proven by shuffleboard aim channel). Delivery drops to <1s; combined with Phase 1, students get 29–30s of 30.
5. **Poll becomes fallback.** Student poll interval 5s → ~15s (reconnect/missed-message safety net; also delivers non-urgent payload: feedback, cards, board items).
6. **Change-detection short-circuit.** Add a bump-on-write `version` (or `updated_at` touch) to sessions covering poll-relevant writes. Poll route checks it first and returns `{unchanged:true}` with one query when nothing moved. Also: make wonder/flight-cards sections conditional on the active inputSpec, and move per-student stats aggregation into a view/RPC instead of fetching all score rows.

## Phase 3 — Perceived speed (~2–3 days)

7. **Shared `GenerationLoader`.** One aviation-branded loading component (taxi-to-runway / staged copy: "Preparing your flight plan… Cleared for takeoff") replacing the 38 bare spinners. Skips itself entirely when the response lands fast (<~400ms cache hits). Doubles as the surface for `degraded: true` messaging. Can share DNA with the Phase 1 student countdown beat.
8. **Generate-on-selection prefetch.** Fire the generate request when the teacher selects the game (selection/confirm step), not when the game mounts. Multi-round games prefetch round N+1 during round N's reveal phase.

## Phase 4 — Model & cost tuning (background, measure-first)

9. **Pull a week of `ai_call` logs** (latency/provider/outcome already structured) before changing anything; decide on real p95s.
10. **Groq-first experiment** for `evaluation` and `game-logic` task classes (short verdict JSON; Groq's 300–1000 tok/s makes feedback feel instant). Fall back to current chain. Alternative if quality disappoints: consolidate evaluation onto `gemini-2.5-flash-lite` (temp 0.2–0.3) and drop the aging `gpt-4o-mini` dependency.
11. **Per-task-class `model` field** in `TASK_CLASS_CONFIG` so model swaps/A-Bs don't touch provider code.
12. **Merge auth+tier+usage checks** into one RPC (currently 2–3 sequential round-trips before every generation).
13. **Prewarm on a schedule** (GitHub Actions cron) + log cache-miss topics and feed the top N back into the prewarm topic list.
14. **Bundle audit.** `next build`, inspect session route first-load JS (registry statically imports all ~17 games). If >~300KB, convert registry `component` fields to `next/dynamic`.

## Infra upgrades

- **Supabase Pro ($25/mo): now**, for beta. Not for capacity — for no auto-pause on inactivity, daily backups, 500 realtime connections. A paused DB in front of a beta tester is unrecoverable optics.
- **Vercel Pro: at the first of** (a) Stripe billing go-live (Hobby prohibits commercial use), or (b) needing `maxDuration` beyond Hobby's ceiling for Phase 0.
- Scaling path beyond that is dial-turning: Supabase compute add-ons; realtime connection quota raise (~$10/1,000 peak) around ~15–20 simultaneous full classes.

## Known limits accepted

- Circuit breaker / `bulkSemaphore` are per-serverless-instance (best-effort only, not a global rate limiter) — acceptable.
- Fallback poll route stays alive forever (reconnects, locked phones) — Phase 2 item 6 keeps it cheap.
