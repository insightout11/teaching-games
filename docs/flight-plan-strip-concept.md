# The flight plan strip: a cockpit panel that runs the lesson (concept)

Written 27 October 2026 by Claude for Matt. **Concept for discussion, not a build plan.**

## The problem

A lesson now has many timed beats: boarding and check-in, the prediction, the lesson itself, moments outside, the World
Quiz "Our flight", the city stop on the way down, landing (stamp, souvenir, best discovery), postcards after class.
Today each one is a separate pop-up or button that appears when its time comes. The teacher has to remember the order
and watch the clock, and on a busy flight the pop-ups compete.

## The idea (revised after Matt's feedback, 27 Oct)

**The lesson stays free conversation.** The strip does not plan the talk and does not replace "Coming up" or the
moments outside: those keep appearing as they do now and drive the conversation.

The strip is a quiet **route line along the bottom of the cockpit**: take-off, the plane's position, landing, and only
a few optional markers near the end, the closing beats that need time saved for them.

```
 TAKE-OFF ─────────────── free conversation ─────────── ◇ Quiz · ◇ City stop ── LANDING
                              ▲ now                         ~18 min    ~10 min
```

- The markers are reminders, not a schedule: they glow when their time comes; tap to start, or ignore them and keep
  talking. Nothing starts by itself.
- Nothing is planned in the middle of the flight. A game or activity the teacher starts mid-flight just appears on the
  line afterwards, as a record of the flight, not a plan.
- It shows nothing private (no answers, no scores), so it is fine on the shared screen.

## Class type sets only the closing markers

| Class type | Markers near the end (all optional) |
|---|---|
| **Free talk** | City stop only (quiz off; one tap to add) |
| **Conversation** | City stop (role-play) |
| **Game time** | World Quiz + city stop |
| **Structured** | World Quiz + city stop |

A short class (under ~40 min) shows one marker: the city stop.

## Revision 2 (27 Oct): the panel replaces the bottom toolbar

Matt: the instrument panel should replace most of today's bottom bar (the row of activity chips and the row of
widget buttons: Timer, Poll, Class Board, Spinner, Teams, Picture reveal, Word bank, Exit ticket, Messages, Boarding QR,
Copy join link, Flight map, Launch a flight, Sources), while keeping an intuitive way to add widgets. He almost always
has the small flight map in the bottom-right corner and the Class Board or a poll (or most other widgets) in the
top-left corner. The route line and time markers above stay.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [▶ Activities]  TAKE-OFF ──────── ▲ now ──────── ◇ Quiz · ◇ Stop ── LANDING 11:00   [＋ Instruments] [⚙] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Centre: the route and time** (as above): the plane's position, minutes to landing, optional closing markers, and
  the class clock (+/- 5).
- **Left: Activities.** One button opens the activity picker: the 4-6 the teacher uses most (learned from use, or
  pinned) on top, then Browse all. Replaces the row of activity chips.
- **Right: Instruments.** One button opens a small tray of widget icons. Tap one to open it. Replaces the row of widget
  buttons.
- **The cockpit remembers your layout.** Each widget opens where you last put it, and the set you keep open comes
  back next lesson: Matt's flight map bottom-right and board/poll top-left would simply be there at take-off. Two
  docking spots to start with (top-left, bottom-right), plus free placement.
- Rarely used things (Copy join link, Boarding QR, Sources, Launch a flight) move into the Instruments tray or the
  menu.

## Questions for Matt

1. Remember the layout **per class** (each class has its own setup) or **per teacher** (the same everywhere)?
2. Activities on top: **learned from what you use**, or **pinned by you**?
3. Before or after Friday? Suggestion: **after**, with a mockup page first for your approval.
