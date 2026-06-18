# Flight Plan Presets — Direction Doc

> Status: **direction / not yet a build plan.** Captures the decisions from the
> June 2026 discussion on expanding World Flight beyond the single Captain's Flight
> preset.

## Context

Today World Flight only ever launches **one** flight plan — "Captain's Flight"
(`all-around-flight-60`). The architecture already supports multiple presets
(`src/lib/flight-plan-presets.ts` has ~10 archived ones), but they're old-style
3-module sequences with no `flightConfig` and aren't surfaced anywhere live.

The goal of this direction: design a small set of **fundamentally distinct** flight
plans (not topic reskins), make every launch path able to choose one, lean into
"grounded in a source" as the product identity, and resolve how the flight metaphor
(takeoff/landing animations) works outside World Flight.

Hard rule from the owner: **do not revive the old archived presets as-is.** Each
preset must be deliberately designed — activities/games chosen and justified. New
activities can be built or old ones improved where needed.

## Core model decisions

1. **Every flight has a briefing/presentation stage** (input before output — the "P"
   in PPP). This is universal. What varies is the *form* of the briefing and whether
   it's externally sourced.
2. **"Grounded" = the normal, desired state.** A flight is *Grounded* when its
   briefing is anchored to a real attached source (article/video). A generated-from-
   topic briefing is the *floor*, not the goal. Grounded is a badge / quality tier,
   NOT a mode name (in aviation "grounded" = can't fly — never use it as a headline).
3. **Source wherever it can be.** Almost every preset can take a real source; even a
   reading-to-open in a Speak lesson counts (reading aloud is speaking practice).
4. **The flight metaphor belongs to the lesson system, not to the map.** World Flight
   is the richest *skin* (real cities, bespoke arrival scenes), not a requirement to
   fly. Standalone flights already work — see "Animations" below.
5. **Presets differ in the Cruise, not the briefing.** Every preset opens with a
   briefing; they diverge in what students *do* after: discuss / clash / talk / drill
   / roleplay / build.

## The preset set

**5 grounded core presets + Design as a capstone** (Design is a different tier, not a
peer). Phases are universal: Takeoff → Climb → Cruise → Descent → Landing. The 3
micro-events ride along in Cruise by default (uniform + toggleable). All keys below
are real registry entries.

Locked lineups (Takeoff → Climb → Cruise → end-game vote → Landing). The 3 (soon 4)
micro-events ride along in Cruise, toggleable. The **end-game is a class vote** among 3
games that fit the preset — only one plays, so the pool can hold similar crowd-pleasers.

**Captain's Flight** *(keep, default)* — comprehend a source, then discuss it.
- `prediction-round` → `read-aloud`/`video-player` (auto-routed by source) + `language-toolkit`
  → **`decision-council`** → end-game vote → `final-word`
- End-game vote: `imposter` · `flash-quiz` · `connections`

**Debate** — take a side, clash, resolve. Most source-dependent. Centered on the new
**Team Debate** activity (prep + structured team debate), which makes it more coherent than
stringing clash games together.
- `quick-pulse` → `read-aloud`/`video-player` + `fact-detective` (gather ammo)
  → **Team Debate (new — prep stage → structured debate)** → end-game vote → `opinion-shift`
- `defend-it` demotes to an optional warm-up / end-game pool option.
- `hot-take-arena` is a *different, lighter* debate format (AI devil's advocate) — keep / rebuild
  / retire as a **separate decision** (open question), not part of this build.
- End-game vote: `twenty-questions` · `connections` · `brain-teasers`

**Speak** — students talk *with each other*, scenario-driven, turn-based (the class is the
audience). `scene-igniter` (scripted, supported) → `conversation-rounds` (improvised) is the
speaking engine — a real scaffold, not a compromise. No new game needed.
- `character-cards` → `scene-igniter` → **`conversation-rounds`** → end-game vote → `final-word`
- End-game vote: `imposter` · `taboo-sprint` · `word-chain`

**Grammar** — form and accuracy. Strongest existing game set; no new game.
- `grammar-check-in` (revive) → optional grammar video/reading
  → **`error-hunter` (notice) → `sentence-scramble` (build) → `grammar-boss` (produce, spoken)**
  → end-game vote → `grammar-proof`
- End-game vote: `tone-transformer` · `grid-rush` · `flash-quiz`

**Travel** — functional/transactional roleplay; shines in World Flight. Runs on the **same
speaking engine as Speak**, fed *travel scenarios* grounded in the city (travel-context
generation, see below). No new game; differentiated from Speak by a **task checklist** (see
"Scenario engine" below).
- `vocab-radar` → `read-aloud`/`video-player` → `dialogue-detective` → **`conversation-rounds`**
  → `[navigation-check micro = radar-fix]` → end-game vote → `in-your-words`
- End-game vote: `vocab-sprint` · `connections` · `word-chain`

**Design** *(capstone, World-Flight-only)* — the class builds ONE shared artifact through
votes. Single `design-studio` module, no takeoff/landing, no end-game vote.

### Names (LOCKED — Direction A: clarity-forward)
Plain skill labels; the flagship is the only themed name (it has no single skill). The flight
theme lives in the surrounding system (takeoff/landing, route, boarding pass), not the labels.

| Name | Card subtitle |
|---|---|
| **Captain's Flight** | The all-rounder — source → discuss, the complete lesson |
| **Debate** | Take a side, clash, resolve |
| **Speak** | Maximum talk time — fluency over accuracy |
| **Grammar** | Notice, correct, produce accurately |
| **Travel** | Real-world English for real places |
| **Design** | The class builds one thing together |

**Level scaling** is carried by **scenario / content difficulty** (scripted + concrete for
beginners, abstract + open for advanced), driven by the existing `difficultyDescriptions`
(`src/lib/difficulty.ts`). Every new game must bake in the same CEFR scaling.

### Scenario engine (Speak + Travel)
Both run on `scene-igniter` (scripted, supported) → `conversation-rounds` (improvised). The
one bit that distinguishes them is **a goal flag** — which is exactly the line between fluency
practice and functional/task-based practice:
- **Speak = goal-free.** Just keep the conversation alive (fluency).
- **Travel = task checklist.** The scenario card lists ~3 things to accomplish ("ask the
  price", "request non-smoking", "confirm the dates"); after the roleplay the **teacher/class
  checks which were hit** — human-adjudicated, no speech capture. The checklist doubles as
  scaffolding for beginners; for advanced, add complications ("the room's fully booked — now
  what?"). This is Travel's differentiator, not a nice-to-have. Implement as a reusable
  `scenarioGoal?` flag on the speaking engine.

### Decisions baked in
- **Cut Wonder Board from Captain's Flight.** It's the only 10-slot preset and
  Wonder Board's "explore curiosities" job is already covered by `prediction-round`
  (takeoff) and `decision-council` (discussion). Frees Wonder Board to anchor a
  possible future **Explore/Inquiry** preset.
- **"Read" is dropped / merged into Captain's Flight.** Once every flight has a
  briefing, a separate reading-comprehension preset only splits hairs with Captain's.
- **Vocabulary is dropped** as a standalone preset — it's a *phase* of a lesson
  (lives in `language-toolkit` / vocab micro-events), not a whole unit.
- **Design is a capstone, not a peer preset.** Its "source" is *previous lessons*
  (accumulated investigations/field notes), so its natural home is a **World Flight
  special mission**. For v1, keep it World-Flight-only (don't force a synthetic
  briefing onto a synthesis activity). Revisit a standalone generated-brief version
  later if teachers ask.

### What needs building / improving
After an honest gap audit, only **two genuinely new games** are needed — everything else
is existing games that truly fit + the content mechanics below. We deliberately rejected a
"simultaneous speaking" game: real speaking classes are turn-based and students talk *with
each other*, so the existing `scene-igniter` → `conversation-rounds` engine is correct.

- **NEW — Team Debate** (Debate centerpiece): structured two-team debate with a prep stage,
  recorded points, assigned speaker roles (opening → body → rebuttal → closing), and explicit
  structure-teaching. The **biggest build in the project** — full spec in "New activity specs".
  (Replaces the earlier "Argument Builder" idea, which was too close to existing activities.)
- **NEW — Vocabulary micro ("Comms Check")** (4th micro-event): a quick "which word fits"
  cloze; completes the skill set (opinion · navigation · accuracy · vocab). Near-clone of
  `accuracy-micro` — low cost. Full spec in "New activity specs".
- **FUTURE — Opinion micro variety**: the Opinion Pulse pool is thin (`would-you-rather` +
  `rank-it` only — `two-truths`/`defend-it` removed as non-opinion). Add a purpose-built
  quick-opinion micro (single dilemma, vote, discuss) for variety. (`opinion-micro` exists in
  code but isn't wired into the standard session resolver — getAllActivities doesn't include it.)

Plus the non-new-game work:
- New `flightConfig` (stages + phases + `stageByKey`) authored for each preset — the
  archived presets lack this; it's the main authoring work.
- `grammar-check-in` is currently vaulted — revive it for Grammar's takeoff.
- Travel's World Flight generation mechanic (see "Travel-in-World-Flight generation").

## New activity specs

Two genuinely new activities (both live in `src/activities`, use `ActivityProps`).

### Team Debate (the Debate centerpiece — biggest build)
Structured two-team debate with a prep stage, recorded points, assigned speaker roles, and
explicit structure-teaching. Distinct from `defend-it` (improvised) / `hot-take-arena`
(AI free-for-all) / `decision-council` (propose+vote).

**Breakout-room reality:** the app can't create/control breakout rooms on *any* platform
(not the video tool; Zoom/Teams ✅, free Google Meet ❌, in-person = split the room). So we do
**not** build on breakouts. The app provides each team's **device-based prep workspace**;
breakouts (when present) are just where they talk. Works with breakouts, without them
(in-person huddle / main call), or with silent on-board prep.

**Phases:**
1. **Teams + motion** — auto-split For / Against (reuse `sector-strike`'s 2-team pattern;
   teacher rebalances). Motion + framing generated from topic + source.
2. **Prep (planning stage)** — each team gets a **private, shared, device-based board**
   (NEVER the projected screen — it's shared and would leak to the other team; projected
   screen shows neutral "Teams preparing… 5:00"). Two halves:
   - **Points list:** any teammate types points; syncs realtime across the team; optional
     within-team upvote to prioritize.
   - **Structure skeleton + speaking order:** fixed frame scaled to team size —
     **Opening → Constructive point(s) → Rebuttal → Closing.** Each slot assigned to a member
     (self-claim by tap, or auto-distribute, swappable); each speaker attaches the points
     they'll carry. The skeleton is how it teaches structure.
3. **Debate** — app drives alternating order (Opening A → Opening B → … → Closing A →
   Closing B); per-turn timer; projected screen shows whose turn / role / countdown; active
   speaker's device shows their points. Teacher facilitates/advances.
4. **Verdict + reflect** — class/teacher votes stronger team (reuse `RouteChoicePanel`
   pattern) for stakes; lands into `opinion-shift`.

**Level scaling:** beginner = pre-filled skeleton + per-slot sentence stems + suggested points
bank, fewer slots; intermediate = skeleton + prompts, own points; advanced = blank structure
to self-organize + mandatory rebuttal + tighter timers.

**Scoring:** participation — each student who speaks in their role gets credit
(`isCorrect: null`); team verdict is flavour/stakes, not individual right/wrong.

**New vs reused:**
- NEW: **collaborative team-scoped prep board** — realtime *shared editable* list per team
  (beyond the existing one-way broadcast-vote/submission patterns → new realtime infra:
  team-scoped channel + points store). This is the hard part.
- NEW: two-team structured turn-sequencer (roles + per-slot timers + current-speaker display).
- REUSE: 2-team assignment (`sector-strike`), verdict vote (`RouteChoicePanel`), participation
  scoring (`onScore`), source-grounded generation (cache + `resolveSourceContext`).

**Open questions:** reusable teams primitive vs ad-hoc assignment (check `sector-strike`);
the collaborative prep board's realtime pattern; self-claim vs auto-assign roles (default auto,
allow swap); default phase/slot timings.

### Vocabulary micro — "Comms Check" (4th micro-event)
Near-clone of `accuracy-micro`: single round, `flightPlanOnly: true`, `isMicroEvent`,
`category: 'practice'`, ends after one round.

- **Mechanic:** "Which word fits?" — one sentence with a gap, 3–4 word options; students vote
  once, teacher reveals answer + one-line meaning/example. (Cloze reinforces usage, matching
  `language-toolkit`. *Odd-one-out* = optional pooled variant.)
- **Content:** `{ activityKey: 'vocab-micro', sentence, options[], correctIndex, word,
  explanation, example? }`.
- **Generation:** `POST /api/vocab-micro/generate` — source-grounded (word from the lesson's
  vocab/source), cache-first, topic-aware fallback.
- **Scoring:** has a right answer → `isCorrect: true/false`, points for correct; single round,
  dedup per `clientId`; input type `choice` (already exists). Exactly the `accuracy-micro` path.
- **Transition beat — "Comms Check":** new cockpit beat alongside Turbulence / Radar Scope /
  Instrument Check — a radio/frequency tune-in (dial sweep, signal lock, readback): words =
  communication = radio chatter. Completes a clean 4-beat set.
- **Level scaling:** beginner = common words, obvious distractors, concrete sentence; advanced
  = near-synonyms with collocation/register distinctions, abstract context.
- **Build cost:** low — `accuracy-micro` plumbing + vocab content + the Comms Check beat.

## World Flight preset picker (UX direction)

The preset choice in World Flight is **structural, not cosmetic** — the flight plan decides
what "content" even means: Captain's/Speak/Debate consume a **focus** (a city reading/video);
**Travel** ignores focuses and generates a scenario from a **situation** + the city; **Design**
is a capstone drawing on prior lessons. And teachers enter from two directions: **topic-first**
("I like this content — how do I teach it?") vs **goal-first** ("I'm doing speaking — what
content fits?"). So the picker must be **bidirectional**, with a **topic-first emphasis** (the
map is a browse surface).

**Design — the city sidebar becomes a two-part builder, cross-linked by the fit rating:**
- **① What to teach (content)** — on top / default (topic-first). The city's 6 focuses, each
  with a "Best as: …" fit badge.
- **② Flight plan (how to run it)** — the WF-eligible presets; the best fit for the selected
  focus is marked "recommended."
- **Cross-link:** selecting a focus re-ranks ② (recommends a preset); selecting a preset
  re-sorts ① by fit. Either entry point works.
- **Travel reshapes ①:** picking Travel in ② swaps ① from the focus list to a **situation
  picker** (airport/hotel/restaurant/directions) with a note that Travel writes its own scenario
  from the city. Switch back → focuses return. So Travel is first-class *inside* the picker, not
  exiled — ① is context-sensitive to ②.
- **Design** stays its own capstone "mission" entry (needs prior lessons), not in this picker.

**Fit rating** drives the badges/recommendations and must be **bidirectional** (focus → best
presets; preset/goal → best focuses). Feasible because WF content is a **finite curated set** —
pre-tag each focus once (editorial or AI-at-ingest).

**Build phasing:** build the two-part builder now with **Captain's as the default** and no
badges; the fit-tagging lights up the recommendations later (graceful degradation). Common case
stays one decision + launch (pick content → accept recommendation → go).

## World Flight menu ≠ home menu

Offer each preset where its source needs are actually met.

- **Captain's / Speak / Debate** → use the existing 3 readings + 3 videos per city
  as-is (informational/cultural sources fit). Debate benefits from the source-fit
  rating flagging debatable city focuses.
- **Travel** → do NOT reuse the cultural readings (wrong type) and do NOT hand-author
  travel content for 54 cities. **Generate a functional scenario grounded in the real
  city's data** (place names, landmarks, districts — e.g. "ordering ramen in Shibuya",
  "directions to Senso-ji"). Grounded generation: the destination supplies the real
  anchors, the AI supplies the functional dialogue; the existing reading can ride
  along as cultural color. This is Travel's killer feature in World Flight.
- **Grammar** → place adds nothing to a grammar lesson. **Keep Grammar a home lesson**
  (grammar video/reading from the library, or generated). If allowed in World Flight
  at all, extract grammar from the existing city reading, but it's not its home.
- **Design** → World Flight capstone.

So World Flight headlines: **Captain's, Speak, Debate, Travel + Design.** Home
headlines all 5 core presets (Grammar included).

## Micro-events

- **Available across all plans + teacher toggles** to turn any/all off. Framed as
  *flight events* (pacing/delight), not lesson content. Home for the toggles:
  `SessionSettings` (follow the `timerSeconds`/`scoringMode` pattern in
  `src/stores/session-store.ts`).
- 3 today + a planned 4th:
  - **Opinion Pulse** — `would-you-rather` + pool, turbulence beat
  - **Navigation Check** — `radar-fix`, radar-scope beat
  - **Accuracy Check** — `error-hunter` + pool, instrument-check beat
  - **Vocabulary check (NEW, 4th)** — quick "which word fits / odd one out"; completes
    one micro per core skill (opinion · navigation · accuracy · vocab)
- **Defaults are context-aware** (like the preset menu — World Flight vs home differ),
  driven by three principles:
  - **Density:** a ~60-min lesson only absorbs **1–2** micro-events, not all 4 — more makes
    it choppy. Defaults pick the fitting 1–2; the rest stay available to toggle.
  - **Overlap rule:** a micro-event defaults **OFF** in any preset whose cruise already uses
    a game from that micro's pool (no same game twice). Catches Accuracy Check OFF in Grammar
    (`error-hunter`/`sentence-scramble` are cruise drills) and Opinion Pulse OFF in Debate
    (`defend-it` is in both the pool and the cruise). *Refinement option:* instead of off,
    filter the micro's pool to drop the colliding game.
  - **Contrast makes the better break:** an off-theme micro relieves intensity better than
    piling on (a Vocab/Navigation break beats more grammar mid grammar-drill).
- **World Flight: Navigation Check is ON for all flying presets** — the signature beat of
  "we flew to a real place." Doesn't break the overlap rule (`radar-fix` only collides in
  Travel, where it's already the nav micro). Design is exempt (single module, no micros).
- **Home defaults (per preset):**

  | Preset | Default micro-events ON |
  |---|---|
  | Captain's | Navigation + Opinion Pulse (Accuracy optional 3rd) |
  | Debate | Vocab (Navigation optional) — Opinion OFF (overlap) |
  | Speak | Opinion Pulse + Vocab — Accuracy OFF (contradicts fluency) |
  | Grammar | Vocab + Navigation — Accuracy OFF (cruise overlap) |
  | Travel | Navigation + Vocab |

  Note: Accuracy Check's best home is actually **Captain's** (no grammar game in its cruise
  to collide with), not Grammar.
- **Route SVG: show generic event pips** — small unlabeled checkpoint dots so the
  teacher reads pacing/shape, but the specific event stays a surprise. (Currently
  shown as named 56px checkpoints in `src/components/ui/flight-plan.tsx`.)

## Animations outside World Flight (already built)

`src/components/session/flight-transition-overlay.tsx` already has two modes:
- **Generic mode** (no city scene): `SidewaysRunway` + generic `SkylineHorizon` +
  `SkyBackground` (clouds, altitude parallax) + plane sprite doing real
  takeoff/cruise/touchdown. Corner label shows `from → to` text.
- **City mode** (World Flight): plane flies into/out of the real city's bespoke
  `DestinationArrivalScene`.

So standalone flights already fly. The only open decision is the `from`/`to` **label**
(topic-as-destination, e.g. "Departure → The Future of Work" — a one-line choice, not
a build). The bespoke-scene-per-topic idea is dropped.

### Branded home base (separate track)
Instead of the anonymous generic runway, build ONE branded, reusable **Lesson Captain
home base** (airfield/city) used in both the launch lobby and the in-flight
takeoff/landing transitions. "You always depart from / return to home base; World
Flight is flying out to a real city and back." Reuse the lobby airfield
(`src/components/ui/airfield-scene.tsx` + `lobby-airfield-scene*.tsx`) and ideally
build it INTO the arrival-scene system so it reuses the cinematic departure/arrival
path. **This is being designed/built in a separate conversation** — a context prompt
was handed off for it.

## Cross-cutting: library source → preset fit

Add a classification step at source ingest (`source_extractions` pipeline): an LLM
scores each source's fit for each preset (0–3) based on what it *is* (opinion piece →
Debate; how-to → Grammar; travelogue → Travel/Speak; expository → Captain's). Two-way
UX: badges on source cards ("Best for: Debate") + filter the library from a chosen
preset. Matters most for source-dependent presets (Captain's, Debate, Travel). Ties
directly to the "Grounded" badge.

## Launch / teacher segmentation

Unresolved and shouldn't be forced now: do teachers run **one** class type or
**many**? Design to be robust to both — **per-launch preset choice** (always
available) + a **remembered default/favorite** (so a specialist isn't re-choosing
every time). Let usage data decide. Argues for **shipping 2–3 presets first**
(Captain's + Debate + Speak likely cover the bulk), watching usage, then adding.

## Travel-in-World-Flight generation (spec)

The happy finding: this is **mostly an adapter, not new generation infrastructure.**
The existing functional routes already ground on a `SourceMaterial`:
`src/app/api/dialogue-detective/generate/route.ts` takes `sourceMaterial`, runs it
through `resolveSourceContext()` (`src/lib/source-context.ts`), and "sets the
conversation in a context drawn from the source material, using its situations and
vocabulary" (cache is skipped when a source is attached). `scenario-simulator` and
`vocab-radar` follow the same pattern.

So Travel-in-World-Flight = **build a travel-flavored `SourceMaterial` from the
destination, then feed the existing activity routes.** No new game/activity needed.

**Real anchors available on a `DestinationPack`** (`src/lib/world-flight/types.ts`):
`city`, `country`, `region`, `lat`/`lng`, `primaryAirport`, `airports[]`, and each
`focusOptions[]` has `title`/`subtitle`, `image.caption`, `evidence`
(`keyIdea`/`tradeoff`/`designUse`), and a full `sourceMaterial.summary`. These are the
grounding facts — real airport codes, real districts/landmarks named in the focus
titles + reading text.

**The mechanic:**
1. In World Flight, teacher picks **Travel** for a destination + a **travel situation**
   (the preset's scenario chips: airport check-in, hotel, restaurant, directions,
   getting around, problem/help).
2. A small adapter/route (proposed `POST /api/world-flight/travel-context`, taking
   `destinationId` + `situation`) builds a `SourceMaterial` whose `summary` /
   `briefingText` is a **functional scenario grounded in the city's real anchors**
   (real airport for "airport check-in"; real districts/landmarks pulled from the
   city's focus content for "directions"). The destination supplies the real names;
   the AI writes the functional dialogue/context around them.
3. That `SourceMaterial` is passed unchanged into the existing `dialogue-detective`,
   `scenario-simulator`/`conversation-rounds`, and `vocab-radar` routes — which
   already know how to ground on it.

**Layering the existing reading:** the city's chosen focus reading rides along as
*cultural color* (its `sourceMaterial.summary` can be concatenated into the travel
context), so the scenario feels rooted in the real place, not generic.

**Why not the other options:** reusing the cultural readings alone fails (wrong type —
a piece on earthquake resilience doesn't teach hotel check-in); hand-authoring travel
content for 54 cities doesn't scale; pure ungrounded generation loses the real-place
magic. The adapter gets real anchors + scale + the existing routes.

## Build-readiness findings (scoring · picker · end-game vote)

Verified against the code (June 2026):

**Scoring mode per preset.** `ScoringMode = participation | accuracy | competitive`
(`src/stores/session-store.ts`); presets either set `scoringMode` explicitly or inherit
`goalToScoringMode(goal)`. Most derive correctly — the one bug is Travel:

| Preset | Goal | Derived | Action |
|---|---|---|---|
| Captain's | speaking-fluency | participation | ✓ keep (no override) |
| Debate | discussion-debate | participation | ✓ (competitive if you want a "winner") |
| Speak | speaking-fluency | participation | ✓ |
| Grammar | grammar-reinforcement | accuracy | ✓ |
| Travel | functional-english | **competitive (WRONG)** | **set `scoringMode: 'participation'`** — `functional-english` isn't in `goalToScoringMode`, so it falls through to competitive. Fix the preset (explicit override) and/or add `functional-english` to the participation list. |
| Design | — | participation (explicit) | ✓ |

When **Scoring V2** lands (outcome/accuracy split, leaderboard flags, display modes), revisit —
the 3 current modes are enough to ship.

**Preset picker — the lever exists, two call sites hardcode it.**
`plannerStore.loadPreset(preset)` already builds modules and sets `overrideScoringMode` from
`preset.scoringMode`, so a picker just calls it with the chosen preset. Two places to wire:
- `world-flight-page.tsx::launchSelectedFocus()` — hardcodes `all-around-flight-60`.
- `FeaturedFlightLaunchModal` (home) — only launches Captain's.
Add the chooser + a remembered default/favorite to both.

**End-game vote — mechanism EXISTS but the trio is hardcoded.** `RouteChoicePanel`
(`src/components/session/route-choice-panel.tsx`) is the class vote: broadcasts a `route-choice`
inputSpec, tallies realtime votes over a 20s countdown, reveals the winner, ties → first option.
But `END_GAME_OPTIONS` is a **global hardcoded trio** (flash-quiz/connections/password) — it
ignores the preset. To get per-preset trios, pass the preset's end-game pool into
`RouteChoicePanel` instead of the constant. Also swap its emoji (⚡🔗🔑) for Lucide per project
convention while in there. (`flash-quiz` confirmed registered: `src/games/flash-quiz/index.tsx`.)

## Open questions / next moves

1. ~~Travel-in-World-Flight generation~~ — **spec'd above.** Remaining detail: exact
   prompt shape for the travel-context adapter, and whether `situation` chips live on
   the Travel preset or are derived per-city.
2. ~~Micro-event defaults~~ / ~~Travel goal layer~~ — **resolved** (see Micro-events +
   Scenario engine).
3. ~~Scoring mode per preset~~ / ~~Picker wiring~~ / ~~End-game vote mechanism~~ —
   **resolved** (see "Build-readiness findings"). Only true fix surfaced: Travel's
   `scoringMode` must be set to `participation` explicitly.
4. ~~Preset naming~~ — **resolved** (Direction A, clarity-forward; see "Names (LOCKED)").
5. ~~Design standalone?~~ — **resolved: World-Flight-only for v1.** It's a capstone that
   feeds on prior lessons; a synthetic briefing undercuts it. Add standalone later only if asked.
6. ~~`from`/`to` label for home flights~~ — **resolved: topic-as-destination**
   ("Departure → *<topic>*"), generic fallback ("Now boarding") when no topic yet.
7. ~~Sequencing~~ — **resolved** (re-sequenced by build size after Team Debate replaced
   Argument Builder):
   - **Wave 1 — no new games:** Captain's (done) + **Speak** (reuses the speaking engine) +
     **Grammar** (revive `grammar-check-in`) + the small **Vocab micro** (low cost, enhances
     all presets). Covers all-rounder + fluency + accuracy.
   - **Wave 2:** **Travel** (travel-context adapter + task checklist).
   - **Wave 3:** **Debate** (build **Team Debate** — the biggest build) + the hot-take-arena
     decision + Design polish.
8. **hot-take-arena** (NEW open) — keep as a lighter debate format, rebuild, or retire?
   Separate from the Team Debate build.

**Design status: LOCKED; both new activities spec'd** (Team Debate + Vocab micro — see "New
activity specs"). Remaining work is **implementation** (see "Build-readiness findings" + "What
needs building / improving"). Team Debate's own open questions live in its spec.
