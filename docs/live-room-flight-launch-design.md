# Live Room × Flights: one journey (design)

> Status: **design for owner approval**, Oct 1 2026. Nothing built yet.
> Owner decisions so far: flights launched from the Live Room **continue the class's journey from its current city**; **every time you enter the Live Room you choose where you're flying next**; courses and planned lessons need a **fast path**.

## The problem today

- **"Launch a flight" leaves the room.** It's a link to the lesson planner (`/lesson-planner?attach=…`), so the teacher sets everything up again there.
- **The flight starts from LC International** instead of where the class is.
- **There are two flights fighting each other:**
  - the room's own windscreen flight (gate → take off → cockpit cruise → land → arrival cinematic → postcard);
  - the preset's own takeoff and landing animations.

  So a lesson can feel like it takes off and lands twice.

## The model: the Live Room *is* the plane, and one class is one leg

| Moment | Where | What happens |
|---|---|---|
| **Enter the room** | The gate, in the class's **current city** | First question: **Where are we flying today?** (destinations in range, like the boarding card). Skipped if the lesson arrived with a destination already set. |
| **Set up the flight** | The gate | One panel (below): Continue course / A planned lesson / Pick a flight / Free flight. |
| **Boarding** | The gate | Students join; the room's tools work (sources, board, warm-ups). Flights with a takeoff beat (e.g. the Flight Question) run it here. |
| **Takeoff (once)** | The windscreen | The room's existing takeoff cinematic **is** the flight's takeoff. The preset's own takeoff animation is not played in the room. |
| **The flight** | The cockpit | The flight plan's stages run in the windscreen (as room launches already do); the ground below follows the real route; tools stay at hand. Stage changes use small cockpit transitions (turbulence for breaks), not new takeoffs. |
| **Landing (once)** | The destination | The last stage (e.g. the Verdict) plays on approach, then the room's existing landing + arrival cinematic + postcard. The journey moves the class to the new city (World Flight progress, hours/stars). |
| **Arrivals hall** | The new city | After landing, the room stays open as the arrivals hall: free talk, the class board, the logbook deposit, end class. **No second takeoff.** |
| **Next class** | The gate, in the new city | "Where are we flying today?" again. |

## Setting up the flight: one panel, four ways

After choosing the destination, the setup panel shows:

1. **Continue the course** (when the class has an active course): *"Lesson 4: The Missing Suitcase"*. One tap: preset, source and settings come from the course lesson.
2. **A planned lesson:** lessons saved in the planner for this class. One tap.
3. **Pick a flight:** preset cards (Captain's, Speak, Grammar, Travel, Debate, Listening…), **prefilled from the room**: the topic, the source currently on screen, the class level, the grammar focus. Only the one thing a preset genuinely needs is asked here (the grammar point for Grammar, the situation for Travel). Launch in place.
4. **Free flight:** no flight plan. Talk, sources and activities from the room, then land at the end.

### Launching from outside the room (fast path)

"Launch" on a course page, in the planner, or from home creates the session **with the lesson already loaded**. The room opens with **"Ready: Lesson 4 → Lisbon"** (destination pre-chosen if the lesson implies one, otherwise the destination question first), so the teacher boards and takes off. The setup is never repeated.

## What changes technically (rough)

- **In-room flight setup panel** replaces the `flightHref` link: the destination picker, then the four options. It reuses the planner's preset → slots building (`buildLessonSlots` / the composer) and the existing attach-plan route, without navigating away.
- **The room's flight becomes the lesson's flight:** room takeoff starts the first stage; the room landing follows the last stage. Suppress `FlightTransitionOverlay` takeoff and landing inside the room; keep the in-between cockpit transitions.
- **The destination comes from the room** (World Flight current city → chosen destination) for every launch path; course and planner launches carry their lesson but not a departure city.
- **Entry gate:** on entering the room with no leg chosen, ask "Where are we flying today?" first.

## Decisions (owner, Oct 1 2026)

- **Every class has a destination. Everything is a flight**, including grammar lessons and free talk.
- **The arrivals hall stays open** after landing (wrap-up, board, logbook) until the teacher ends class.
- **A course lesson's city is suggested, not forced.** It's offered first ("Lesson 4 is set in Tokyo: fly there?"). If it's out of the plane's range, the panel offers the nearest in-range city on the way. The lesson works anywhere; only the arrival scene changes.
- **Free flight can become a flight plan mid-air, with no second takeoff.**
  - "Launch a flight" while cruising is a *new flight plan*: a captain's announcement, then the stages start in cruise, prefilled with the topic you were discussing and the source on screen.
  - The plan is sized to the minutes left (the composer's duration resize).
  - The destination and the single landing stay the same, with the plan's last stage on approach.
- **One rule:** exactly one takeoff and one landing per class, whenever the flight plan is chosen (on the ground or in the air).

## Build order (proposed)
1. The destination gate on room entry + the in-room setup panel (Pick a flight, prefilled) launching in place: no more planner detour.
2. One flight: room takeoff starts the plan; plan stages in the windscreen; the last stage then the room landing; preset takeoff/landing overlays suppressed in the room.
3. Mid-air flight plans (from free flight), sized to the time left.
4. Fast paths: Continue the course + planned lessons in the panel; outside launches open the room with "Ready: … → city".
5. Course city suggestion + out-of-range handling.
