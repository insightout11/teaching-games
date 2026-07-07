# Captain's Flight Improvements — Flagship Preset Upgrade Plan

**Source:** deep review of `all-around-flight-60` (July 2026) — the flagship, most-used, first-touched preset.
**Executor:** a fixing agent working in STAGES, ask-first.
**Status: NOTHING in this doc is owner-approved yet.** Unlike `docs/preset-consistency-fixplan.md` (which had locked decisions), every stage here must be pitched to the owner — including whether to do it at all — before any code. The priority scores are the reviewer's recommendation, not decisions.

---

## Ground rules (same as the preset-consistency plan — non-negotiable)

1. **Ask before every stage.** Pitch the stage + its ASK-FIRST questions, wait for approval. One stage per approval.
2. **Never lighten a designed activity.** Scaffolding, student roles, participation, and device inputs ARE the design.
3. **Students always join via the lobby**; only explicit `directLaunch` skips it.
4. **Teacher screen is projected** — no answers/secrets on it; teacher-private info goes in the cockpit.
5. **Pacing = defaults, not limits.** Never hard-cap rounds/turns; the teacher can always extend.
6. **Git hygiene:** stage only your own files; `pnpm exec tsc --noEmit` + `pnpm next lint --file <changed>` + relevant vitest before every push; commit straight to main when told to push.
7. **Deploy-verify each stage** with the owner before the next.
8. AI content needs deterministic fallbacks + structural validation; `class-size-metadata.test.ts` hard-codes the registry count (bump on new modules).

---

## Context — what Captain's Flight is today (verified, don't re-derive)

Sequence: `prediction-round` (takeoff "Warm-up") → `read-aloud`/`video-player` (Briefing) → Opinion Pulse micro (`would-you-rather`/`rank-it`) → `language-toolkit` → Accuracy Check micro (`error-hunter`/`sentence-scramble`/`synonym-showdown`/`vocab-sprint`) → `decision-council` (Main Discussion: proposal-collect → signal-pass → challenge → voting) → Navigation Check micro (`radar-fix`, **worldFlightOnly**) → Review Game (`flash-quiz`/`imposter`/`connections`, all source-grounded ✓) → `final-word` (landing).

**Verified strengths (leave alone):** briefing has reading turns + comprehension quiz + discussion prompt; the entire end-game pool grounds on the source; Decision Council's phase structure is strong; leveled briefing text per difficulty exists.

**The systemic weakness: the beats don't talk to each other.** Specific verified gaps:
- Prediction Round reveals each answer immediately AT TAKEOFF (`prediction-round/activity.tsx`, phases prompting→revealing per question) — predictions never connect to the briefing.
- `FinalWordContent` = `{ prompt }` only (`activities/types.ts:951`) — one generated sentence; no keywords, no callbacks. The thinnest module in the arc is the lesson's last impression.
- The canonical toolkit vocab (`sourceVocab`, generated once via `needsSourceVocab`) is NOT passed to the Accuracy Check games: `generateVocabSprint(customTopic, diff, undefined, sourceCtx)` — `keyVocabWords` is `undefined` (route ~3012); `generateSynonymShowdown` takes no word list at all. The class is taught 5–6 words, then drills different ones.
- Decision Council ends at the vote tallies — no verdict ceremony, and nothing downstream references the outcome.
- Travel has a trip log + recap; Captain's has no lesson memory at all.

---

## Stages (reviewer's priority order; themes noted)

> Theme A = "connective tissue" (Stages 1, 2, 4, 8) · Theme B = vocab spine (3) · Theme C = variety/energy (5, 7) · Theme D = onboarding (6)

### Stage 1 — "Listen for it" predictions (9/10, Theme A)
Takeoff predictions become predictions ABOUT the source, with reveals DEFERRED until after the briefing ("the answer is in what you're about to read — listen for it"). Students consume the source with a stake; the reveal doubles as a comprehension payoff.
Approach: `generatePredictionRound` prompt gains a source-anchored instruction (only when `sourceCtx` present); activity gains a deferred-reveal mode — predictions collected at takeoff, reveal beat runs after read-aloud/video-player completes (likely a small "reveal predictions" step the teacher triggers, or a re-entry surface — design needed).
**ASK FIRST:** where does the reveal live (a button on the briefing's complete screen? a mini-beat between briefing and Opinion Pulse?), and what happens on non-source lessons (keep current instant-reveal behavior — confirm).

### Stage 2 — Flight Log + a real Final Word debrief (9/10, Theme A)
Generalize the Travel trip-log mechanism (`session-store.tripLog`, `TripLogEntry`) into a lesson-wide "flight log". Captain's beats write to it: prediction results (right/wrong count), Opinion Pulse split, toolkit words, Council verdict + vote split. `final-word` becomes a debrief: generated prompt + toolkit vocab chips + callbacks ("the council voted 60/40 — do you stand by it?"). The end-session arrival beat already renders trip logs — carries over free.
Watch: the trip log currently gates the flash-quiz "trip mode" (`tripLog.length > 0`) — if Captain's starts writing log entries, that gate MUST become preset/stage-aware or Captain's review quizzes will flip into 5-question trip mode. **This is the main hazard of the stage.**
**ASK FIRST:** confirm renaming/generalizing tripLog vs a parallel log; confirm the flash-quiz gate fix approach; confirm what Final Word shows (chips + which callbacks).

### Stage 3 — Vocab spine: toolkit words into the Accuracy Check (8/10, Theme B)
Thread `sourceVocab` into the accuracy-pool games: pass terms as `keyVocabWords` to `generateVocabSprint`; extend `generateSynonymShowdown` (and evaluate error-hunter/sentence-scramble — those are sentence-level, may only need the words woven into sentences). Optionally bias the end-game (imposter/connections) toward the same words. Teach → drill → produce with the SAME words.
Watch: content-cache — word-list-specific content must not be served from/poison the generic cache (use the grounding variant mechanism from the consistency plan's Stage B).
**ASK FIRST:** which games get the treatment (all four, or vocab-sprint + synonym-showdown first); whether end-game biasing is wanted.

### Stage 4 — Council Verdict + minority report (7/10, Theme A)
After voting, a verdict ceremony: verdict card (winning proposal, proposer, vote split, stamped), then an optional 30-second "minority report" — one dissenting student says why the class got it wrong. Verdict written to the flight log (depends on Stage 2 for the log; the ceremony itself doesn't).
**ASK FIRST:** minority report — teacher-picked dissenter or volunteer? Is the stamp/ceremony visual worth building this round?

### Stage 5 — Takeoff variety for repeat classes (7/10, Theme C)
The same class runs this preset weekly and always opens with the identical 3-binary-question format. Give the takeoff a pool like the micros: `[prediction-round, quick-pulse, wonder-board]`. prediction-round stays default (first-run experience + Stage 1). Note: takeoffs are a preset field (`takeoff: 'prediction-round'`), not a moduleSequence slot — pool support for takeoffs is new plumbing.
**ASK FIRST:** pool contents; rotation mechanism (per-class memory vs teacher pick at launch vs random).

### Stage 6 — First-run stage coaching (7/10, Theme D)
A dismissible one-line "what you do now" hint under the stage header for a teacher's first few runs (e.g. Decision Council signal-pass: "Students send signals to back proposals — pick the top 2–3"). Projected-safe wording only. Plus a lobby nudge that the cockpit exists (CaptainSuggestionsPanel is built; new teachers don't know about it).
**ASK FIRST:** where the "first N runs" state lives (localStorage per teacher?); hint copy review; whether the cockpit nudge is a lobby card or a header hint.

### Stage 7 — Mid-lesson beat parity outside World Flight (6/10, Theme C)
`radar-fix` Navigation Check is `worldFlightOnly` — standard lessons get no game moment between toolkit and end-game. Add an inverted-context fallback micro in that slot (single World Lens round, or a 60-second vocab-micro) so non-WF lessons keep the energy spike. Needs a "non-WF only" slot flag (mirror of `worldFlightOnly`).
**ASK FIRST:** which micro fills the slot; confirm the inverted flag approach.

### Stage 8 — Opinion Pulse steers the Council (6/10, Theme A)
Pass the Opinion Pulse outcome (which option won, the split) into Decision Council generation/`supports` route as context, so the council question presses on the class's actual split ("Most of you chose X — now the council must decide…"). Zero new UI; pure grounding. Note: council content may be PRE-generated before the pulse runs — this likely applies to the on-the-fly `supports` route and/or a light content regeneration hook; investigate the timing before pitching.
**ASK FIRST:** confirm the injection point after investigating generation timing; confirm the phrasing pattern.

---

## Suggested order

1 → 2 → 3 (the core: connective tissue + vocab spine), then 4/5, then 6/7/8. Stage 2's flash-quiz gate hazard is the one place this plan can break another preset — treat it with Travel regression checks.

---

## Status (Jul 2026)

- **1** "Listen for it" predictions — **SHIPPED** (`2f54ccec`). Source lessons: predictions collected at takeoff, answers deferred to a reveal panel on the read-aloud/video-player complete screen. Separate `predictionResults` store slice (not tripLog). Reveal location = button on briefing complete screen (owner picked A); non-source lessons keep instant per-question reveal.
- **2** Flight Log + Final Word debrief — **SHIPPED** (batch). Parallel `flightLog` slice + `flightPresetId`, Captain's-scoped via a self-guarding `addFlightLogEntry` (one place). Writers: prediction / would-you-rather / rank-it / language-toolkit. Final Word renders callbacks + vocab chips; end-session shows "The flight log" (gated `flightLog>0 && tripLog===0`). **Flash-quiz gate hazard neutralized structurally** — tripLog untouched, so Travel review quiz stays 5-q trip mode.
- **3** Vocab spine — **SHIPPED** (batch). `generateVocabSprint` fed the toolkit's `sourceVocab` terms as `keyVocabWords` (was `undefined`); `generateSynonymShowdown` biased to a taught word. Self-gates on `sourceVocab.length > 0`; not preset-gated. Neither generator is cached, so no poisoning. error-hunter/sentence-scramble left sentence-level; end-game biasing deferred (owner's call).
- **4** Council Verdict — **SHIPPED** (batch), trimmed. Stamped "CARRIED" verdict + proposer credit + one-line "Not unanimous — N dissented" (no names). **Live minority report CUT** (owner: it's a wrap-up, not a re-debate — the challenge phase already carries dissent; reconsideration lands per-student at the Final Word via the flight-log callback). Writes a `'council'` flight-log entry.
- **5** Takeoff variety — **DEFERRED** (owner). Lowest ROI; benefits only repeat classes; real new plumbing (launch-time per-class rotation) + wonder-board too slow / Word Cloud is a widget needing an activity wrapper. Word Cloud already exists as an ad-hoc cockpit warm-up — revisit variety only if repeat-class monotony surfaces; a discoverability nudge is the cheap first move.
- **6** First-run stage coaching — not started.
- **7** Mid-lesson beat parity outside World Flight — not started.
- **8** Opinion Pulse steers the Council — **SHIPPED** (batch). Pure grounding, zero UI. The `councilQuestion` is baked pre-lesson (can't use the pulse); the live `supports` route is fed the Opinion Pulse split from the Stage 2 flight log (`classPulse`) so the discussion notes press on whether the class's leaning holds. Captain's-only (flightLog-scoped); graceful when absent.
