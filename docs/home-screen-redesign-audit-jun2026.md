# Home Screen Redesign — Audit & Design Plan

> Status: **Design + early cleanup.** June 2026.
> Scope: the logged-in teacher Home (`/home`, "Departure Lounge"). Hierarchy, visual
> system, card taxonomy, section ordering, and an onboarding → personalization vision.
>
> **Done (shipped to `main`, commit `8c6993b`):** archived the 10 old presets → only
> Captain's Flight is live; removed the preset-level dev gate; fixed the 402 leak.
> **Defined (this doc, §8):** the new preset template — flexible-arc journey + boarding-pass
> card, as one spec every new preset follows.
> **Next up (deferred — needs real thought, not started):** design a **new set of presets
> from scratch** — NOT a rebuild of the old 10, and NOT necessarily 10 of them. The archived
> presets are reference/inspiration only. Open questions: how many, which jobs they cover, and
> their names. When resuming, also do the §6 code generalization (parametrize
> `FeaturedFlightHero`, add card-metadata fields to `FlightPlanPreset`).

---

## 1. What's on the home screen today

- **One hero**: Captain's Flight boarding pass (`all-around-flight-60`, still `isDeveloper: true`).
- **6 "teacher-job" shelves** of single modules, all rendered as identical horizontal rails
  of identical-tone cards:
  - Get them speaking · End with a game · Short class moments · Bring a video/article ·
    Vocabulary builders · Starter favorites.
- **2 destination cards**: Activity Catalog + Source Library.

Source files: `src/lib/discovery-shelves.ts`, `src/components/discovery/TeacherHomeClient.tsx`,
`src/lib/flight-plan-presets.ts`.

### The key gap

There are **11 full-lesson presets** already built:

> Captain's Flight · Game Day · Debate Ready · Vocab Blitz · Speaking Circle ·
> Grammar Clinic · Think Tank · Travel English · Job English · Creative Sprint · First Day

**Ten of them never appear on the home screen.** The page over-weights single activities
(6 shelves) and hides the whole-lesson lane (1 hero, 10 hidden). The "Speak / Grammar /
Debate" presets we want already exist — they're just buried.

### Core diagnosis

**The page doesn't reflect the three different jobs a teacher arrives with**, and a
60-minute lesson looks like the same card, in the same kind of rail, as a 5-minute game.
That visual flatness is the problem.

---

## 2. The three teacher intents (this drives everything)

When a teacher opens the app, they're in one of three modes:

| Intent | Commitment | Surfaces | Metaphor |
|---|---|---|---|
| **"I need a whole lesson"** | High — planning | Presets, Courses | A flight / journey (boarding pass) |
| **"I need one thing right now"** | Low — in the moment | Games, activities, icebreakers, end-games | A single ticket / chip |
| **"Make it easy / surprise me"** | Wants a strong default | Recommended, Special Features, the hero | One-tap launch |

The current visual system doesn't separate these. Card **size** and **structure** should
make the intent legible at a glance.

---

## 3. Answers to the specific design questions

### Card size variety — yes

A page of equal cards reads as a *catalog*, not a *home*. Use editorial hierarchy: one
hero, a few large "featured tickets," then dense rails of small cards. Drop a large
featured ticket between rails (every 2–3 shelves) to break monotony and signal "this one's
worth a look." Make **size mean commitment**: big = a whole lesson, small = a quick module.

### Captain's Flight — hero, not carousel

It's the flagship; a carousel would demote it to one-of-many. Keep it as the singular hero.
The **other 10 presets are peers of each other**, so *they* form the carousel/section — a
"Full Flights" lane (Speak, Grammar, Debate, Vocab, Travel, Job…). Answer: **Captain's
Flight = hero; the rest = their own presets section below.** Don't mix the flagship with its
siblings.

### Different card designs by type — highest-leverage change

Card design should encode *what it is* and *what you bring*:

| Object | Card style | Reads as |
|---|---|---|
| **Preset lesson** | Boarding pass w/ route timeline (already built for hero) | "a full journey, ~60 min" |
| **Game** | Compact arcade chip, energy meter, "fast rounds" | "quick + competitive" |
| **Activity** | Standard rail card | "one moment" |
| **Source activity** | Card with a "bring a video/reading" slot | "needs your material" |
| **Special feature** (Cabin Mystery, pre-themed) | Illustrated "feature ticket," one-tap, topic pre-set | "zero setup, just launch" |
| **Course** (future) | Stacked / multi-leg pass | "several lessons" |

The `getCardFamily` / `getCardTone` system already gives tone-per-family — extend it from
*color variation* to *structural variation*.

### Special Features section — yes

The "make it easy" lane: modules pre-loaded with a topic so it's one tap to start (Cabin
Mystery is the model — a themed, self-contained experience). Their whole value prop is "no
setup," so they deserve illustrated feature tickets, not a generic rail.

---

## 4. Proposed hierarchy (top → bottom)

Ordered by *descending commitment* and *personalization first*:

1. **Hero** — Captain's Flight (post-onboarding: "Today's recommended flight for [class]")
2. **Recommended for you** — personalized rail (needs onboarding; until then, "Starter favorites")
3. **Jump back in** — recent flights (already there, keep)
4. **Full Flights** — the 10 preset lessons (the "plan a class" lane) ← *currently missing*
5. **Start of class** — icebreakers / warmups
6. **Quick games & activities** — the "I need one thing" lane (current job-shelves collapse here)
7. **End with a game**
8. **Special Features** — Cabin Mystery & pre-themed one-tap launches ← *new*
9. **Courses** — multi-lesson; good for ongoing / large classes (future)
10. **Browse everything** — Catalog + Library (already there, keep at the bottom)

> "Good for large class / good for 1–2 students" is **not** its own section — it's a
> *personalization facet* (a chip + a filter), best expressed as a *"Great for your class
> size"* rail once onboarding tells us the setup.

---

## 5. Onboarding → personalization (the vision that ties it together)

The ordering above is generic *until* we know the teacher. The codebase already anticipates
this — `getClassSizeChip()` has a reserved `profile` slot. A short sign-up flow (4–5 taps)
drives the personalization:

| Question | Drives |
|---|---|
| **Who do you teach?** (1-on-1 / small group / classroom / mixed) | class-size chips, "Great for your class" rail, which presets surface |
| **Level?** (A1–C2 / mixed) | default difficulty |
| **Main focus?** (speaking / grammar / vocab / exam / business / kids) | which shelves & presets lead; hero swap |
| **Age group?** (kids / teens / adults) | tone, content |
| **Online or in-person?** | Zoom-mode default |

Output: hero swaps to the best-fit preset, "Recommended for you" fills with matching
modules, shelf order re-ranks, and difficulty/topic defaults pre-fill. The home screen turns
from a catalog into "here's your class, set up."

---

## 6. Decisions made (Jun 5)

- **Archive all current presets except Captain's Flight; rebuild the rest in the new style.**
  Done: the 10 old presets (Game Day, Debate Ready, Vocab Blitz, Speaking Circle, Grammar
  Clinic, Think Tank, Travel English, Job English, Creative Sprint, First Day) moved to
  `ARCHIVED_PRESETS` in `flight-plan-presets.ts` — fully hidden, preserved in code, revivable.
  Only Captain's Flight is live. The "Full Flights" lane gets populated by a NEW set of presets
  designed from scratch (see §8 note) — not by reviving these archived ones.
- **Developer mode removed (preset-level).** Done: dropped the preset `isDeveloper?` flag and
  the `mission-setup-screen.tsx` dev-gate filter. Visibility is now controlled by what's in the
  live array, not a dev gate. NOTE: the teacher-account `is_developer` billing bypass is a
  separate concern and was intentionally left in place.

### Still to resolve before further build

- **402 risk on the public hero — RESOLVED (preset-level).** Investigation showed every
  default module in Captain's Flight is free-tier, and `read-aloud` degrades to a generated
  topic brief when no source is attached (no break, no 402). The only Pro leak was
  `fact-detective` sitting in the accuracy-check micro-event pool — removed. The preset and
  all its curated alternatives are now 100% free-tier safe. NOTE: a teacher can still manually
  swap in a Pro module via the replace-drawer and hit a hard 402 mid-session — a general
  graceful-gate (preview/upsell instead of hard fail) was deferred, not built.
- **Single launcher.** Launch logic is duplicated between `DiscoveryDetailDrawer` and
  `ExploreClient`. Before adding card types with their own launch behavior, extract a shared
  launcher — otherwise each new card type multiplies the duplication.

---

## 8. The new preset template — "what a preset is now" (Jun 5)

Decided: a new-style preset is **inseparably a rich journey AND a boarding-pass card**, defined
together as one template that every new preset follows. The journey uses a **flexible arc that
scales** (NOT one rigid shape) — one recognizable spine, stage count flexes by the preset's job.

> NOTE: the preset SET is being designed **from scratch** — we are NOT rebuilding the old 10,
> and the final count is open (likely fewer / different jobs). The archived presets are
> reference only. This §8 defines the per-preset *template*; the *set* (how many, which jobs,
> names) is the deferred design work.

### A. The journey (lesson side)
Every preset defines a `flightConfig` whose named stages map onto a common spine:

| Phase | Job | Always? | Captain's Flight stages |
|---|---|---|---|
| **Takeoff** | Warm-up / activate | ✅ mandatory bookend | Icebreaker |
| **Climb** | Input / language load | flexes (0–N) | Briefing, Language Toolkit |
| **Cruise** | Main practice + production — identity lives here; micro-events + curated pools | ✅ the core | Opinion Pulse, Mission Board, Accuracy Check, Decision Council |
| **Descent** | Consolidate / compete | flexes (0–N) | End Game |
| **Landing** | Close / reflect | ✅ mandatory bookend | Landing |

Rules: Takeoff + Landing mandatory; Cruise always present; Climb/Descent expand/collapse by
job (Speaking Circle = full Climb + rich Cruise; Game Day = "all-Cruise," thin Climb/Descent).
Stage kinds: `stage` / `micro-event` / `end-game` / `landing`. Micro-events carry a curated
pool of swappable alternatives. **Free-tier safety is a hard rule**: every default key AND
every pool member must be free (no Pro leak — see §6).

### B. The card (home-screen side)
Auto-rendered as a boarding pass (the `FeaturedFlightHero` object): themed name/color · route
strip **derived straight from `flightConfig.stages`** · stub (Duration · Class fit · Source
mode · Focus) · flight no. `LC-xx` · QR · barcode · amber "Build this lesson" CTA + Video/
Article/Topic source chips.

### C. Code generalization required when we build (not yet)
- `FeaturedFlightHero.tsx` is hardcoded to Captain's Flight (`getFeaturedPreset`, hardcoded
  stub values, `LC-60`, QR string) → **parametrize by preset**; route comes from `flightConfig`.
- `FlightPlanPreset` needs card-metadata fields: focus label, class fit, source mode
  (required/optional/none), flight number, theme color.
- See also the §6 "single launcher" cleanup — do that before multiplying card launch behavior.

---

## 7. Open forks (need a call)

1. **How many presets, and which jobs?** The new set is designed from scratch — decide the
   count and what each covers before any build. (Earlier "all 10" framing is dead.)
2. **Presets section shape** — once the set exists: a horizontal carousel, or a categorized
   block ("By skill" / "By situation") so situational presets don't get lost next to skill ones?
3. **Onboarding timing** — mandatory at sign-up (best personalization, more friction) vs. a
   skippable / progressive prompt that personalizes as they go?

## Future polish (logged, not now)

- **Horizontal scrolling for high-count lanes.** `DiscoveryShelf` used to be a horizontal
  scroll-snap rail (340px cards, partial peek, edge-fade masks, arrow paging); replaced by a
  responsive grid capped at 4 + "View all" in commit `bbc1d3f` to avoid clipped cards / tiny
  chevrons. Reconsider a horizontal rail for lanes that will hold many items (the real Full
  Flights / Ready to Teach sets once they're 8–12 cards). Old code recoverable from `bbc1d3f^`.
