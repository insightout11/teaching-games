# Home Screen Redesign — Audit & Design Plan

> Status: **Design discussion only** (no implementation). June 2026.
> Scope: the logged-in teacher Home (`/home`, "Departure Lounge"). Hierarchy, visual
> system, card taxonomy, section ordering, and an onboarding → personalization vision.

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
  Only Captain's Flight is live. The "Full Flights" lane gets re-populated as each is remade.
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

## 7. Open forks (need a call)

1. **Presets section shape** — a horizontal carousel of all 10, or a categorized block
   ("By skill" / "By situation") so Travel/Job English don't get lost next to Grammar Clinic?
2. **Onboarding timing** — mandatory at sign-up (best personalization, more friction) vs. a
   skippable / progressive prompt that personalizes as they go?
