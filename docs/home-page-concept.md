# Home page concept (signed-in teachers)

_Oct 6 2026. Roadmap Phase 1 #3. Concept for owner review; nothing built. Mockups: claude.ai artifact "Home Page
Mockups"._

## The job of the page
Every lesson now starts in the Live Room. So Home has one main job: **get the teacher from sign-in to a live class,
with the students joining, in as few clicks as possible**. Everything else (planning ahead, browsing, history) is
secondary and must not get in the way.

## Today
- `/home` is a discovery page: a featured-flight hero, recent lessons, then shelves of flights, activities, World
  Flight, special features, Explore and Library.
- **Starting a class isn't on it.** The path is Home → Classes → "Start Session" → the session page.
- **The Live Room is still switched on per browser** (`?liveroom=on`) or by the `NEXT_PUBLIC_LIVE_ROOM` setting;
  teachers who haven't turned it on get the old session screen. Turning it on for everyone is a prerequisite.
- A brand-new teacher has to create a class first before anything can start.

## The idea: Home is the gate
The page opens on the teacher's **classes as departure gates**. Each class card shows what happens next and has one
button: **Board** (opens the Live Room for that class; the join code is already on screen for students).

```
GOOD EVENING, CAPTAIN
┌───────────────────────────────────────────────┐
│ Tuesday Kids · 6 students · Junior            │
│ Next: Reading · Alice, lesson 4    [ Board ]  │
│ Last: Oct 4 · Speak · 5 of 6 improved         │
├───────────────────────────────────────────────┤
│ Teens B2 · 4 students                         │
│ Next: free choice in the room      [ Board ]  │
├───────────────────────────────────────────────┤
│ + New class                                   │
└───────────────────────────────────────────────┘
Prepare ahead · Courses · Explore flights · Library
```

- **One click to a live class** (Board). Choosing the flight happens inside the room ("where are we flying next?",
  already built), so Home never asks.
- **"Next"** is the class's next course lesson (if it follows a course) or nothing: the room suggests flights.
  Tapping "Next" is the one-tap fast path the owner asked for: the room opens with that lesson ready.
- **"Last"** is one line from the class logbook (the flight result, class counts only).
- **The class the teacher used last is first**, and if they teach at a regular time, the class due now is first.
- **First visit, no classes:** the page shows one button, **Start your first class**. It creates a class called
  "My class" and opens the room; the teacher can rename it and add students later (students can join by code
  without a roster). Zero setup before the first lesson.
- **Below the gates**, quietly: Prepare ahead (the planner), Courses, Explore flights, Library, World Flight map. The
  discovery shelves move to Explore, where browsing belongs.

## Options for the owner (mockups in the artifact)
- **A. Gate list** (above): classes as rows, Board on each. Simple, scales to many classes.
- **B. Departures board**: the same information styled as the airport split-flap board (the brand's design
  direction): class, next flight, gate, status (Boarding / On time). More character, slightly more to read.
- **C. Today first**: if the teacher's schedule is known, a "Today" strip (14:00 Tuesday Kids · 16:00 Teens B2) with
  Board on the next one, then all classes below. Needs class times (not stored today).

Recommendation: **B's look on A's structure**: rows (easy to scan and tap) styled as a departures board, with the
board-style status ("Boarding" when a session is live, so the teacher can rejoin it).

## Details that remove friction
- A **live session** shows "Live now · Rejoin" on its card instead of Board (never start a second session by
  mistake).
- **Keyboard**: Enter boards the first class.
- **Phones**: Home works on a phone (teachers check it on the go), but the room itself is a laptop screen.
- **Junior mode** (roadmap #6) shows as a tag on the class and is set in class settings, not on Home.
- **No upsell walls on Home.** Free-plan limits show only when starting a lesson would go over them.

## What moves where
| Today on Home | Goes to |
|---|---|
| Featured flight hero, flight shelves, special features, "Recommended" | Explore |
| World Flight hero | A small World Flight map link under the gates (and the room's journey) |
| Recent lessons strip | The "Last" line on each class card; full history on the class page |
| Explore / Library cards | The quiet links under the gates |

## Build steps (after approval)
1. Turn the Live Room on for everyone (setting + remove the per-browser switch), after the test round.
2. Gate list: class cards with Board / Rejoin, "Next" (course lesson) and "Last" (logbook line).
3. First-class path: "Start your first class" creates a class and boards.
4. Move the discovery shelves to Explore; quiet links under the gates.
5. Board-style look (if B is chosen) and the "due now" ordering.

## Decisions for the owner
1. Option A, B, C, or the recommended B-on-A?
2. Should Home remember class times (for "due now" ordering and option C)? It's a small addition to class settings.
3. Is "Board" the right word on the button, or "Start class"?
4. Anything from today's Home that must stay on it?
