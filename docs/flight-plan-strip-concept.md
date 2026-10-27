# The flight plan strip: a cockpit panel that runs the lesson (concept)

Written 27 October 2026 by Claude for Matt. **Concept for discussion, not a build plan.**

## The problem

A lesson now has many timed beats: boarding and check-in, the prediction, the lesson itself, moments outside, the World
Quiz "Our flight", the city stop on the way down, landing (stamp, souvenir, best discovery), postcards after class.
Today each one is a separate pop-up or button that appears when its time comes. The teacher has to remember the order
and watch the clock, and on a busy flight the pop-ups compete.

## The idea

One **instrument strip along the bottom of the cockpit** (decision 27 Oct: "instrument panel = bottom strip") that
shows the lesson as a flight plan: a row of waypoints from take-off to landing, with a marker for "now".

```
 TAKE-OFF ── Lesson ─────────── ◆ Quiz ── ◆ City stop ── LANDING
    10:05        you are here ▲      10:47      10:52        11:00
```

- Each waypoint lights up when its time comes; tapping it starts it (quiz, stop vote). Nothing pops up uninvited.
- Waypoints can be skipped or dragged; the plan fits the time left (a short class drops the quiz first).
- The strip replaces the scattered prompts: "Coming up", the stop card, the quiz nudge.
- It is the same on every screen (the projected screen shows it too), so it shows nothing private: no answers, no
  scores, only what comes next. Teacher-only controls stay on the teacher's phone later ("pilot phone").

## Different for each class type

The class type (already on the class profile and "change for today") picks the default waypoints:

| Class type | Default flight plan |
|---|---|
| **Structured** | Lesson block → practice game → World Quiz → city stop → landing |
| **Game time** | Games (2–3) → World Quiz → city stop → landing |
| **Conversation** | Talk topics (moments outside feed these) → city stop (role-play) → landing |
| **Free talk** | Open cruise, moments only → landing (quiz and stop off by default, one tap to add) |

Class length (already remembered) scales the plan: 60 min fits everything, 30 min keeps one closing beat.

## Questions for Matt

1. Is this the cockpit UI you meant, or did you picture something different (e.g. a side panel, or per-type layouts
   of the whole screen)?
2. Should waypoints **start themselves** at their time (with a short countdown and Skip), or only light up and wait
   for your tap?
3. Do the four default plans above match how you teach each type?
4. Before or after Friday? My suggestion: **after**. Friday uses the pop-ups that exist now; the strip is a bigger
   change that deserves its own test.
