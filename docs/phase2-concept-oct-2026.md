# Phase 2 concept: class types and onboarding

_Written Oct 19 2026 for the owner to review before building. Covers Phase 2 of `docs/design-direction-plan-v4.md`
(items 2.1, 2.2, 2.3). The decisions already made in the plan and owner notes are not repeated as questions; this doc
turns them into screens, and asks only what is still open._

Phase 2 has three parts:
- **A. Class types and settings:** each class says how it usually runs, and the room opens set up for it.
- **B. "Can this class do this?":** every way of launching an activity tells the truth about phones and class size.
- **C. Onboarding:** a new teacher sets up their first class and tries a guided test flight.

Each part has **what you'd see**, **how it works**, and **questions for you** (my recommendation first).

---

## A. Class types and settings

### What you'd see

**1. Setting up a class** (new class, or "Class settings" on an existing class). One short page, top to bottom:

```
 Name           [ Friday 2                        ]

 Who            Age  ( Kids · Teens · Adults )     Level [ B2 Advanced ▾ ]
                [ ] Junior class (young children: pictures, no rankings)

 What kind of class is it?
 ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
 │ [map]              │ │ [joystick]         │ │ [speech bubbles]   │ │ [compass]          │
 │ Structured class   │ │ Game time          │ │ Conversation +     │ │ Free talk          │
 │ Each lesson        │ │ You teach your     │ │ games              │ │ Open conversation; │
 │ follows a plan     │ │ way; we run the    │ │ Talking is the     │ │ we bring ideas,    │
 │ with clear aims.   │ │ last 15–20 min.    │ │ goal; games keep   │ │ pictures and       │
 │                    │ │                    │ │ it going.          │ │ questions.         │
 │ e.g. a coursebook  │ │ e.g. textbook,     │ │ e.g. teens who     │ │ e.g. advanced      │
 │ group              │ │ then a quiz        │ │ like to chat       │ │ teens              │
 └────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘

 Do students have a second screen?   ( All of them · Some · None )
 Where do you teach this class?      ( Online · In a classroom )
 Usual lesson length                  [ 60 min ▾ ]

                                                        [ Save class ]
```

- Icons are Lucide, no emoji. One student on the class list switches on **1-on-1** by itself (shown as a note, with an
  "Off" link).
- Game time adds one more switch: **Students vote on the game** (off by default).

**2. In the room**, the corner shows what the room is set up for, with a one-tap change for this lesson only:

```
 Free talk · change for today ▾          Today: Travel to Cairo  (only when a flight plan is chosen)
```

**3. What changes per type** (nothing is ever removed; "All tools" always shows everything):

| | Structured | Game time | Conversation + games | Free talk |
|---|---|---|---|---|
| Room opens on | The lesson plan | The game shelf | Talk, picker ready | Talk, with Where next? and pictures |
| Quick bar (6) | Plan stages, Flash Quiz, Grammar Spotlight, Read Aloud, Radio Check | Class favourites (Flash Quiz, Imposter, Mystery Flight, Taboo, Hot Seat, Sector Strike) | Scene Igniter, Conversation Rounds, Mystery Flight, Pass the Line, Taboo, Tag-team Debate | Pick a student, pictures, Where next?, Deep dive, Spinner, Word Cloud |
| Flight plans shown first | All, Captain's Flight first | None | Speak, Travel, Debate | None |
| Scores | Right answers count | Competitive, podium | Taking part counts | Off (no leaderboard) |
| Flight lasts | The class | The 15–20 game minutes | The class | The class |

- **Your own favourites always come first** in the quick bar (the per-class favourites already shipped), then the
  type's suggestions.
- **Game time's flight** uses the new flight clock: the class length becomes the game minutes (20 by default), so the plane
  takes off when the game part starts and lands when it ends.
- **Free talk's "Scores: off"** hides the leaderboard and podiums; activities still run, nobody is ranked.

### How it works (for Codex and me)
- One new column on `classes`: `class_profile` (jsonb), holding the type, age, answering (all/some/none), where
  (online/classroom), usual length, game-vote switch and the quick bar. Migration 067, with the column grants migration 064
  needs. Junior stays its own column (it exists).
- Existing classes have no profile: they keep working exactly as today until the teacher picks a type (no surprises on
  Friday).
- **Which setting wins:** a chosen flight plan > "change for today" > the class profile > the teacher's defaults.
- **"How students answer"** reuses `student_device_mode` (devices / shared screen) and adds "some".
- The quick bar moves from this computer (today) into the class profile, so it follows you to any computer.
- Save errors show a message (today the settings card ignores them; Astra's finding).

### Questions for you
1. **Existing classes:** should I ask you to pick a type the next time you open each class (one card row, skippable)?
   (Recommended: yes, once; it takes ten seconds and your four real classes become the first real test.)
2. **Free talk quick bar:** I put Deep dive, Spinner and Word Cloud in the last three slots, because "Your turn: pick a
   place", the topic board and the ending button are Phase 4. OK, or would you rather those slots stay empty until then?
3. **Scores off in Free talk:** right for Friday 2? (Recommended: yes; Junior classes are already never ranked.)

---

## B. "Can this class do this?"

### What you'd see
- Every activity card, wherever it appears (quick bar, All tools, Explore, the Home drawer, the flight plan picker, saved
  plans, swaps, bonus votes), shows the same small marks:
  - **Needs phones**, in a class where some or none have a second screen, with **"No-phone version"** when one exists
    (for example Flash Quiz's Calm skies, or you mark answers through the seats).
  - **Needs 3+ students** (or the real number) in a smaller class; **Group game** in a 1-on-1 class.
- Marked, never hidden: you can still launch it.
- **Fewer than 3 good fits left** (e.g. Junior + Grammar, or 1-on-1 + Conversation): the quick bar fills from a short
  safe list for that combination (Picture Quiz for Junior), instead of showing empty slots.

### How it works
- One shared check (`canThisClassDo(activity, classProfile)`) used by every launch path, built on the class-size and
  device metadata every activity already has. Astra's report lists all eight launch paths; each gets a test.

### Question for you
4. **Launching a marked activity:** one tap, or a quick "Half the class has no phone. Run it anyway?" (Recommended: one
   tap, with the mark visible before you tap; no extra question in the middle of a lesson.)

---

## C. Onboarding

### What you'd see
1. **Sign in with Google** (as now).
2. **"Set up your first class"** replaces today's 5 questions about the teacher. It is the class page from part A, with
   a short line on top: "Tell us about one class. Every class can be different."
3. **Class list** (optional, encouraged): "Add names now so everyone gets a seat and an avatar. Paste a list, or add
   them later." A paste box that splits names by line or comma.
4. **The room opens set up for that class** and offers a **guided test flight** ("Try it with pretend students · 3
   minutes · Skip").
5. **A first-lesson checklist on Home**, gone once done: share the join code · try the picker · run one activity ·
   land the plane.
6. **Tips at the right moment:** at most one per lesson, each dismissible, all can be turned off (for example the first
   time a student has no device: "Tap their seat to mark an answer or vote for them").
7. **A "?" in the room** opens a one-page guide for this class's type.
8. **Screen setup tips** in the guide: online (share this tab in Zoom, Zoom layout, private window on a second monitor),
   classroom (Full screen, high contrast), 1-on-1 (share your screen).

### The guided test flight
- In the real room, one control and one sentence per step; each step waits until you try it; at most 5 steps;
  skippable and replayable from "?".
- Steps per type (from your notes):
  - **Free talk:** set a topic → see Where next? → show a picture from the private window → pick a student → land.
  - **Game time:** set the lesson to 20 minutes → launch a game from the shelf → see the scores and podium → land.
  - **Conversation + games:** vote where to fly → pick a student → board a student without a device → land.
  - **Structured:** choose a flight plan → go through its stages → land.

**Important: the pretend students.** The old Demo Class crew (pretend phones) is broken and we agreed not to rely on
it. I recommend a new approach that needs no phones at all: the test flight boards **three pretend students without
devices** (the seats you now have), so the teacher learns the seat menu, the picker and boarding for real. A teacher who
wants to see the phone side scans the QR code with their own phone; the test flight says so in one line.

### Measuring where teachers drop off (teacher side only)
Five events, counted as totals: signed up · class set up · test flight started · test flight finished · first real lesson
· second lesson within two weeks. No student analytics.

### Questions for you
5. **Pretend students without devices** for the test flight, instead of fixing the old demo crew? (Recommended: yes.)
6. **Existing teachers** (you, and anyone who signed up already): show the new setup only for new classes, never force it
   on old accounts? (Recommended: yes.)
7. **Today's 5 teacher questions** rank Home's suggestions. Once classes have types, Home can rank from the class instead.
   Retire the 5 questions completely? (Recommended: yes.)

---

## Build order after your answers
1. **A**, in two steps: the class page with types and settings (no room changes yet), then the room following the type
   (opens on, quick bar, scores, corner label, change for today). You test step 1 by setting up your four classes.
2. **B**, the shared check on every launch path, with tests.
3. **C**, the class setup as onboarding, then the guided test flight, checklist, tips and "?" guide, then the events.

Each step ships on its own. Nothing changes for an existing class until you pick its type.

**Then (from the plan):** invite the first 3–5 beta teachers, and send the classroom teachers the questions in the owner
notes §2.
