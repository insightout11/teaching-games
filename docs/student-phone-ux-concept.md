# The student phone as one experience (concept)

Written 27 October 2026 by Claude for Matt. **Concept for discussion, not a build plan.** Reviewed from the code (the
phone does not run in the local preview) and Matt's screenshots from real phones.

## What the phone does today

During class the phone stacks independent blocks, top to bottom, each added by its own feature:

1. Header (name, seat, status, leave)
2. Window selfie (face picker, souvenir picker, mascot toggle, the snap button), when a landmark is in view
3. Check-in desk card, when it is your turn
4. Onboarding tips
5. Seat picker
6. Mascot + class shelf card
7. Grammar hunt / phrase strip
8. The current task: a vote, an answer, a pick (city research, accessory, mascot, prediction, best discovery…)
9. Timer pill
10. Action bar: message the captain, phrasebook

After class: the arrival card (topic, seat, points, words you keep), then the postcard, then Back.

## The problems

- **No single "what do I do now?"** The task the teacher just started (a vote, a question) can sit below the selfie,
  the mascot card and the phrase strip. Students scroll to find it, or miss it.
- **Nice extras compete with the task.** Mascot, shelf, selfie options and onboarding are all on the main screen.
- **Idle time is empty.** When nothing is asked, the phone shows a list of extras rather than the flight.
- **The end screen is long and partly wrong:** the topic said "General", points showed 0 in a free-talk class, the
  word list is long, and the postcard sat beside the card (fixed 27 Oct: now one column).

## The idea: one card in front, the trip behind it

```
┌──────────────────────────┐
│ Matt · Seat 1D · ✈ 12 min │   compact header: who, where, minutes to landing
├──────────────────────────┤
│                          │
│     NOW  (one card)       │   the one thing to do: vote / answer / check-in /
│                          │   take your selfie / pick an accessory.
│                          │   When nothing is asked: "Look outside" – where we
│                          │   are, what's below, the next moment coming up.
├──────────────────────────┤
│  My trip  ·  Phrasebook  ·  Message   │   bottom bar
└──────────────────────────┘
```

- **Now** shows exactly one thing, the most important first: the teacher's task > check-in > a selfie chance > a pick.
  Anything else waits (a small "1 more" chip), like the cockpit's one place for cards.
- **Idle = the window.** With nothing to do, the phone shows the flight: what's below, a small map, the next moment.
  Students stay connected to the journey instead of a list of widgets.
- **My trip** (a drawer from the bottom bar) holds the personal, collectible things: boarding pass and seat, the
  class mascot, the shelf, my accessories, my selfies, my postcard stamps. Visited when there's time, not in the way.
- **Phrasebook** and **Message the captain** stay one tap away in the bar (as now).
- **After class: one landing card**, short: "You landed in Cairo", what you earned today (stamp, souvenir, selfie),
  3-5 words to keep (the rest behind "More words"), then the optional postcard. Topic shows the real topic or the
  city, never "General"; points hidden in free-talk classes and junior classes.
- **The same look throughout:** the boarding-pass paper and travel-poster style for big moments (landing, postcard,
  selfie), the dark cabin for the rest.

## Questions for Matt

1. Does "one card in front, the trip behind it" match what you want?
2. Idle screen: **the window** (what's below + map) or something else (e.g. the current topic and words)?
3. Should points show on the phone at all, or only in game-time classes?
4. Before or after Friday? Suggestion: **after**; the overflow fix is already in for Friday.
