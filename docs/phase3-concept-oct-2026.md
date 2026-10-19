# Phase 3 concept: the flight experience

_Written Oct 19 2026 for the owner to review before building. Covers Phase 3 of `docs/design-direction-plan-v4.md`
(items 3.1 to 3.5). The decisions already in the plan and owner notes (§7) are not asked again; this doc turns them into
a lesson storyboard and screens, and asks only what is still open._

**The idea in one line:** every flight becomes a real journey that lasts the class, with a real start (the vote), things
to see on the way, a descent you can feel, and an arrival worth landing for. Calm and real-world; storybook drawings,
not photos. Nothing ever interrupts the teacher's lesson.

**Already built that this uses:** the flight clock (every flight lands 5 minutes before the end), seats and boarding, live
weather, the corner tracker map with Today's route, the "Below us" line, arrival scenes with skylines, souvenirs and
postcards.

---

## The lesson, start to finish (storyboard)

```
 Room opens ──► Boarding + where-next vote ──► Take-off ──► Cruise (moments, landmarks) ──► Descent ──► Arrival
                students arrive and vote        vote closes   the lesson happens here       T−10→T−5    last 5 min
```

1. **Boarding (students arriving):** the where-next vote is on the big screen; boarding and voting happen together.
2. **Take-off:** when you close the vote (or press Take off), the winning city is the destination.
3. **Cruise:** your lesson. The window shows the real world below; small things happen by themselves; anything with a
   picture, a question or a sound waits for your tap.
4. **Descent (5 minutes before arrival, so 10 minutes before the end):** chime, "Cabin crew, prepare for landing", the
   ground comes closer, the skyline rises. Also a quiet wrap-up cue for you.
5. **Arrival (last 5 minutes):** "Welcome to Cairo", local time and live weather, three cards to choose from, the stamp
   and souvenir.

You can still land early or late (the ±5 buttons and Land are unchanged).

---

## 3.1 The where-next vote (at the start)

### What you'd see
- **On the big screen while students board:** every city in range as a card.

```
 ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
 │ [picture of Cairo]        │  │ [picture of Rome]         │  │ [picture of Istanbul]     │
 │ Cairo, Egypt   NEW STAMP  │  │ Rome, Italy   BEEN HERE   │  │ Istanbul, Türkiye NEW     │
 │ On the way: the Alps,     │  │ On the way: the Alps      │  │ On the way: the Black Sea │
 │ the Mediterranean         │  │                           │  │                           │
 │ Souvenir: Pyramid model   │  │ Souvenir: 2 left to find  │  │ Souvenir: Tea glass       │
 │ (rare)                    │  │                           │  │                           │
 │ Stop 3 of 5 on your       │  │                           │  │ Gets you closer to Tokyo  │
 │ expedition                │  │                           │  │                           │
 │ ●●●●○  4 votes            │  │ ●○○○○  1 vote             │  │ ○○○○○                     │
 └───────────────────────────┘  └───────────────────────────┘  └───────────────────────────┘
```
- **No flight time** on the cards (every flight lasts the class).
- **Phones:** tap a city, optionally type why ("Because I want to see the pyramids").
- **Students without a device:** you vote for them through their seat (already built).
- **When you close the vote:** the reasons appear on screen, and you ask two or three students to explain theirs (a
  natural persuasive-language moment). Then take-off.
- **Optional:** 30-second team pitches (one card per team), and a term goal (a dream destination the class works toward).

### Built on
- The existing "Let the class vote" and polls; city pictures from Wikimedia (free, already built); "on the way" from
  Today's route; souvenirs and expedition data from World Flight.

---

## 3.2 Descent and arrival

### Descent (about 5 minutes)
- Starts by itself at the descent point; the teacher sees "Descending · arrival in 5 min" on the tracker.
- **Sound:** the seatbelt chime and "Cabin crew, prepare for landing" (once, quiet).
- **Window:** the camera slowly lowers (today the cruise height is one fixed number, so this is one contained change):
  fields and roads grow, clouds pass at eye level, mountains loom, city lights spread at night. The city's skyline and
  landmark rise on the horizon in the last minute (arrival scenes already draw them), then the existing touchdown.
- **Never during an activity:** if an activity is running, the descent waits quietly on the tracker until it ends (or
  you press Land).

### Arrival (last 5 minutes)

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │  Welcome to Cairo                     4:20 pm local · 31°C · sunny   │
 │  [big picture of Cairo]                                              │
 │                                                                      │
 │   ┌──────────┐   ┌──────────┐   ┌───────────────┐                    │
 │   │  Food    │   │  Sights  │   │  Local words  │   class picks one │
 │   └──────────┘   └──────────┘   └───────────────┘   (2–3 minutes)    │
 │                                                                      │
 │  [stamp]  [souvenir: Pyramid model]                                  │
 └──────────────────────────────────────────────────────────────────────┘
```
- The three cards come from the city packs (food, sights, local words already exist per city).
- The stamp and souvenir are the existing landing rewards, now at the end of the arrival instead of straight away.

---

## 3.3 "Look outside" moments

### The rules (from your notes)
- **By themselves, window only, no sound:** weather changes, terrain, sunset, a quiet caption ("Below us: the Sahara"), a
  distant plane.
- **Waits for your tap:** anything with a picture card, a question or a sound. A small icon appears on the corner tracker
  ahead of time ("Alps in 3 min"), so you can build anticipation or ignore it.
- **Never during an activity.**

### What a moment looks like
- Tracker icon → tap → a card on the big screen: picture, 2–3 facts, one question for the class, and "Make it the topic".

### Where moments come from
- **Landmarks** (3.4).
- **Country facts when crossing a border:** flag, language, currency, how to say hello.
- **NASA live natural events (EONET):** a wildfire, an eruption, a storm or an iceberg near the route, today.
- **Wikipedia "what's near here":** facts for the tap card only (never moving pictures).
- Later, low priority: where the Space Station is right now.

---

## 3.4 Landmarks

### What you'd see
- **Drawn landmarks, bigger than life**, in the same storybook style as the arrival scenes:
  - mountains in their real shape: Everest (with its snow plume), the Matterhorn, Fuji, Kilimanjaro;
  - sights: the Pyramids of Giza, Stonehenge, the Great Wall, Niagara Falls (with its mist).
- **Side view:** when the route passes within about 300 km, the landmark rises on the horizon on the correct side, with a
  caption "On your left: the Matterhorn". **Look left / Look right** turns the view. No detour: route, distance and range
  stay the same.
- **Camera view:** for small or far landmarks, a "camera" picture-in-picture like a seat-back screen (zoomed outside
  camera).
- **Real weather decides:** clear sky = the window; cloudy = "Under the clouds today, switching to the camera".
- **Tap card:** picture, 2–3 facts, a question.

### First eight
Everest, the Matterhorn, Fuji, Kilimanjaro, the Pyramids of Giza, Stonehenge, the Great Wall, Niagara Falls (all already in
the app's place list).

### Visuals first
Before any landmark is built I'll draw the first two (the Matterhorn in the side view, the Pyramids in the camera view) as
stills for you to approve, the same way the arrival scenes were approved.

---

## 3.5 More terrain

- **Today:** 7 kinds of ground (ocean, mountains, hills, forest, desert, ice, farmland), placed by hand-drawn regions.
- **Next:** real ground from a free global land-cover map (NASA/ESA), shrunk into a small file inside the app (no live
  calls, no cost).
- **New kinds:** rainforest, savanna, tundra, wetlands and deltas, tropical islands and reefs, rice paddies, steppe,
  canyons, volcanoes, salt flats, big cities by day.
- **Names:** Natural Earth (already used for borders) names mountain ranges and deserts, so "Below us" can say "the
  Andes" or "the Sahara" more often.
- This is mostly data work, a good job for Codex with a brief.

---

## Questions for you
1. **The vote at the start:** should take-off wait for you to close the vote (recommended: yes, you decide when), or close
   by itself after a set time?
2. **Descent sound:** the chime plus a short spoken "Cabin crew, prepare for landing" (a recorded voice, like the sound
   files we already generate), or the chime only? (Recommended: chime plus voice, quiet, once.)
3. **Arrival cards:** the class picks one card, or you pick? (Recommended: the class votes on phones and seats, 15
   seconds; you can override.)
4. **Moment icons on the tracker:** how many per flight at most? (Recommended: 3, so they stay special.)
5. **Landmark stills:** happy to approve the Matterhorn and the Pyramids first, before the other six?

---

## Build order after your answers
1. **3.1 the vote at the start** (biggest change to how a lesson starts; test it with Friday 1, who loved voting).
2. **3.2 descent and arrival** (uses the timing already built).
3. **3.3 moments:** the rules and tracker icons first, then country facts, then NASA events.
4. **3.4 landmarks:** two stills for approval, then the side view, the camera view and the weather rule, then the other six.
5. **3.5 terrain:** a Codex brief for the land-cover data and names; I review and wire it in.

Each step ships on its own and is tested in a real class before the next.

**Before charging teachers (reminder from the plan):** the live weather comes from Open-Meteo, whose free plan is
non-commercial; switch to their low-cost paid plan then.
