# Preset Consistency Fix Plan — Captain's Flight · Speak · Debate · Travel · Grammar

**Source:** full preset audit, July 2026 (appendix below). **Owner decisions locked in** (also below).
**Executor:** a fixing agent working in STAGES. **Read the ground rules first.**

---

## Ground rules for the fixing agent (non-negotiable)

1. **Ask before every stage.** Present the stage's plan + its ASK-FIRST questions to the owner and wait for approval before writing code. One stage per approval. Do not batch stages without being told to.
2. **Never lighten a designed activity.** Line-by-line scaffolding, student role assignment, student participation, and device inputs ARE the design. Fixing one thing must never simplify another. (This rule exists because it was violated before, expensively.)
3. **Students always join via the lobby.** Only explicit `directLaunch` skips it. Never reintroduce "pre-generated content skips lobby".
4. **Teacher screen is projected.** Never show answers/secrets on it. Teacher-private info goes in the cockpit (`/sessions/[id]/cockpit`) — see `find-your-way-aid.tsx` for the pattern.
5. **Git hygiene:** stage only your own files (`git status` first — the tree has concurrent WIP), commit straight to main when told to push, `pnpm exec tsc --noEmit` + `pnpm next lint --file <changed>` + relevant vitest before every push.
6. **Deploy-verify each stage** with the owner before starting the next.
7. `class-size-metadata.test.ts` hard-codes the registry count — bump it if you register a new module.
8. AI-generated content must have deterministic fallbacks and structural validation. A blank or garbage screen in class is never acceptable (see the Scene Igniter fallback disaster).

---

## Owner decisions (locked — do not re-ask)

- **All live presets get micro-events, including Travel.** Travel's micro = Find Your Way (see Stage D).
- **Travel gets a review game**: a 5-question Flash Quiz grounded on the trip's own content (Stage F).
- **Travel's scripted stops get AI-generated LINES inside the deterministic engine** (structure/roles/blanks/tiers enforced; scripts as fallback). Hotel stays conversation-rounds. (Stage G)
- **Trip Recap = purpose-built landing activity** fed by the trip log + trip vocab (Stage E).
- **Grounding whenever possible** — cache/source correctness fixes approved (Stage B).
- **Naming convention = Option B**: themed stage names per preset, consistent style (1–2 words, Title Case, themed bookends allowed) (Stage C).
- **Travel gets a "Boarding Call" takeoff** replacing character-cards (Speak keeps character-cards). Prompts must be about the DESTINATION ahead — the whole class flies together from the same origin in World Flight (Stage H).
- **Pacing**: FYW becomes a one-round micro-event; roleplay stops cap traveller turns with fair rotation across stops (Stage D).
- Cleanups + stability items pre-approved (Stage A).

---

## Stages

### Stage A — Cleanups & stability (pre-approved; no ASK-FIRST)
1. **Cockpit stage labels**: `cockpit-view.tsx:31-41` builds `STAGE_BY_GAMEKEY` from `all-around-flight-60` only → other presets show raw keys (`trip-meal`, `team-debate`). Read the active session's `flightConfig` (it's in the lesson payload / can be derived from `flightPresetId`) with the current lookup as fallback.
2. **Delete dead code**: `use-lesson-session.ts:231,308` — `flightPresetId === 'travel-60' → taskRoleplay` (conversation-rounds is no longer in Travel).
3. **Prune Captain's `stageByKey` drift** (`flight-plan-presets.ts` ~398–402): remove `'fact-detective': 'accuracy-check'` and `'password': 'end-game'` (not in those pools; fact-detective is semantically wrong as an accuracy check).
4. **Class-fit chip on preset pickers** ("Best with 2+") using existing plugin metadata (`minStudents`/`idealStudents` — `getClassSizeMetadata`). Travel/Speak contain 2+-student stages; solo classes currently get no warning.

### Stage B — Grounding & cache correctness
**Problem:** `/api/landing/generate` caches by `(activityKey, topic, difficulty)` — no source/mission → Debate's opinion-shift can serve a close cached from an unrelated lesson. Activity cache generally (e.g. character-cards, `generate/route.ts:1928`) ignores `sourceContext` → source-grounded lessons can receive ungrounded cached content, and identical cached content repeats forever per (topic, difficulty).
**Approach:** add a source dimension — either skip cache when a source is attached, or use the existing `variant` mechanism (`content-cache.ts` already supports `variant`; grammar-boss uses it). Prefer smallest-risk change.
**ASK FIRST:** skip-cache-when-source vs variant-keying (cost tradeoff: skipping cache = more AI spend on grounded lessons); whether character-cards should also cache-bust per source.

### Stage C — Naming & card-style pass (Option B)
One style rule across all live presets:
- Stage labels: 1–2 words, Title Case, themed bookends allowed (Travel's "Departures/Trip Recap", Grammar's "Check-In", Debate's "Reflection" all stay).
- Micro-events named as a "Check/Pulse" (`Opinion Pulse`, `Comms Check`, `Navigation Check`; Debate's "Take a Side" → consider "Stance Check" for consistency — ASK).
- Card copy: `tagline` = "X — Y" pattern; `description` = one sentence walking the journey. Normalize the five live presets' descriptions to the same voice.
**ASK FIRST:** show the owner the full before/after label + copy table for approval before editing.

### Stage D — Travel pacing: FYW micro-event + turn caps
1. **Find Your Way → micro-event**: mark the slot `isMicroEvent: true`, stage kind `micro-event` (label stays "Find Your Way" or "Navigation Check" — ASK). Activity honors `isMicroEvent` → exactly ONE round (one guide, one destination; same pattern as radar-fix `requestedRoundCount = isMicroEvent ? 1 : …`). Keep check-in.
2. **Turn caps in `PerformedExchange`**: cap traveller turns per stop (default ~3) and pick travellers by fair rotation ACROSS stops (session-store fair-picker `callCounts` pattern) so everyone speaks 1–2× across the trip and no stop drags. All students keep device scaffolding + can speak chorally; the cap is on featured turns.
   Budget target: takeoff 6 + arrival 8 + getting-there 8 + FYW 5 + hotel 10 + attraction 10 + meal 8 + review 5 + recap 5 ≈ 65 min.
**ASK FIRST:** exact cap (3?), whether cap scales with class size, FYW micro label.

### Stage E — Trip Recap (purpose-built landing)
New `trip-recap` activity replacing `in-your-words` as Travel's landing (which currently generates `words: []` — a hollow screen, confirmed bug):
- Shows the **trip log** (already in session-store: arrival, transport, attraction+moment, dishes) as the retell scaffold.
- Trip vocab chips from the real anchors (dish names, transport mode, attraction).
- Each student gives a spoken highlight ("The best part was ___ because ___"), teacher steps through students (fair rotation), participation scoring.
- Data-seeded (no AI needed), difficulty-tiered sentence frames.
**ASK FIRST:** confirm the beat structure + whether a device input (one-line "postcard sentence") is wanted or spoken-only.

### Stage F — Travel review game (5-question Flash Quiz on the trip)
- End-game stage before the landing; **flash-quiz grounded on the trip**: questions built from trip log + anchors ("What is coddle?", "Which bridge did we start at?", "How much was the Airlink?").
- 5 questions, ~4–5 min; the teacher can skip past it when running long.
- Needs a generation path that receives the trip log + anchors (flash-quiz is currently a self-generating game — likely a small purpose-built content injection like the other trip stops, or a grounded generate call).
**ASK FIRST:** pool vs fixed flash-quiz (owner leans fixed 5-q flash quiz; confirm no end-game vote for Travel), and question mix (facts vs vocabulary).

### Stage G — AI-varied lines for the scripted stops
Arrival, Getting There, Meal keep the `PerformedExchange` engine exactly as-is; the LINES become AI-generated per lesson:
- Generation grounded on the stage source + real anchors (chosen dish/transport woven in), difficulty tier passed in.
- **Structural validation**: parsed lines must alternate speakers sensibly, contain the required blanks/slots, respect length caps — otherwise fall back to the current deterministic scripts (which stay in the code permanently).
- Do NOT cache identical scripts back (caching would reintroduce the sameness this stage exists to fix) — either skip cache or store multiple variants.
- Hotel unchanged (conversation-rounds, by design).
**ASK FIRST:** confirm regeneration-per-lesson cost is acceptable vs a rotating pool of ~5 cached variants per city/stop/tier.

### Stage H — "Boarding Call" takeoff for Travel
Replaces character-cards as Travel's takeoff (Speak keeps character-cards — duplication solved). The class flies TOGETHER from a shared origin, so prompts are about the destination ahead, not personal origins:
- Three quick device prompts, quick-pulse mechanics: e.g. "What are you packing for {city}?" (climate-aware — weather model exists), "What are you most excited to see?", "One worry about the trip?"
- Presentation stage, participation scoring, data-seeded + optionally AI-flavoured with fallback.
**ASK FIRST:** the exact 3 prompts + whether answers should feed the Trip Recap ("you said you were worried about ___ — how did it go?" would be a lovely callback).

### Stage I (optional) — Grammar preset micro-event
Owner said "all presets get micro-events"; Grammar currently has zero. It's a deliberately tight clinic, so this may be fine as-is.
**ASK FIRST:** does Grammar get one (e.g. vocab-micro "Comms Check" after Rebuild), or is it exempt?

---

## Appendix — Full audit findings (July 2026)

### Confirmed bugs
1. **Travel landing hollow**: `in-your-words` case (`generate/route.ts:~2976`) emits `words: []`; ignores stage source and trip log. → Stage E.
2. **Cockpit labels hard-coded to Captain's** (`cockpit-view.tsx:31-41`). → Stage A.
3. **Landing cache unfit**: `/api/landing/generate` cache key has no source/mission. → Stage B.
4. **Activity cache ignores grounding** (character-cards et al.: cache key = topic+difficulty only; also serves identical content forever per key). → Stage B.
5. **Dead `travel-60` taskRoleplay condition** (`use-lesson-session.ts:231,308`). → Stage A.
6. **Captain's stageByKey drift** (fact-detective→accuracy-check, password→end-game). → Stage A.

### Inconsistencies
- Travel swapped-in modules ground on the *arrival/immigration* source (session-wide source = itinerary.arrival; only trip keys have stage sources).
- Hotel is the only AI-generated, non-line-by-line stop inside Travel (accepted: texture variety; stays).
- Beat budgets: Captain's ~6+3 micro, Speak ~5+2, Debate ~4+1, Travel 8+0 (≈75–80 min of content) → Stage D.
- Travel lacked end-game/review ritual → Stage F.
- character-cards opened both Speak and Travel → Stage H.
- No preset-level class-size warning despite 2+-student stages → Stage A(4).
- Stage-label and card-copy styles vary across presets → Stage C.

### Verified clean (don't re-audit)
- All preset module keys resolve to registered plugins + generation paths; pools map to stageByKey; `worldFlightOnly` filtering works; Speak's scene→conversation chaining grounds correctly; adaptive scene casts receive roster `studentCount` via prefetch; end-game vote resolves pool keys across both registries.
