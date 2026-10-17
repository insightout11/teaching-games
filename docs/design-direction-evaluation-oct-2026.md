# Design direction notes: evaluation and plan (Oct 2026)

_Written Oct 17 2026. Evaluates the owner's "LessonCaptain — Design Direction Notes" against the code and the
current roadmap (`docs/roadmap-oct-2026.md`), then turns the ideas worth doing into a plan._

## Verdict in one paragraph
The central idea, **"the system adapts to the class, not the class to the system"**, is right and is the best
answer yet to the competitor report: content generation is a commodity, but a cockpit that becomes *this class's*
cockpit is not. Most of the classroom ideas (class setup, class modes, device levels, phoneless students, students
designing their own class) are worth doing and are cheap because the parts already exist. The flight-visual ideas are
worth doing in a smaller form, later. The funnel ideas split: a free teacher-style quiz is a good, cheap marketing
tool; **student discovery, matching and scheduling are a different business** (a marketplace) and should be parked.

## Scorecard

| # | Idea | Fit | Value | Cost | Call |
|---|---|---|---|---|---|
| 1 | Cockpit: narrow the tools to each class | Core | Very high | Medium | **Do (spine of the plan)** |
| 2 | Teaching-background story | Strong | High (marketing) | Tiny | **Do** (landing page, About) |
| 3 | Teacher onboarding (deep) | Partial | Medium | Low | **Extend the existing 5 taps, don't add a long quiz** |
| 4 | "Design your class" student lesson | Excellent | Very high | Low | **Do first** |
| 5 | Run it per existing class | Excellent | Very high (research) | Owner time | **Do first** |
| 6 | Several modes per class | Strong | High | Low | **Do** |
| 7–9 | Device spectrum, mixed devices, device choice in onboarding | Strong | High | Medium | **Do** |
| 10 | Teach students UX framing | Unclear | Low–medium | Tiny | **Optional, adults/business only; test once** |
| 11–12 | Better calm flight | Good | Medium | Medium | **Later (roadmap #17)** |
| 13–15 | Curated routes + live conditions | Good | Medium–high | Medium | **Later, small: 8–12 routes on the current engine** |
| 16 | Live aircraft data | Weak | Low | High (APIs, licences) | **Skip** |
| 17–18 | Stylised world, own visual identity | Good | Medium | Medium | **Fold into the art-style work (roadmap #5, #14)** |
| 19 | Three.js | Weak now | Low | Very high | **Don't rewrite.** Current canvas + MapLibre engine is enough |
| 20 | Routes as unlocks | Good | Medium | Low once #12 exists | **Fold into class rewards (roadmap #12)** |
| 21–22 | Free teacher-style tool, top of funnel | Good | Medium–high | Low | **Do, after the class setup exists** |
| 23–27 | Student discovery, matching, scheduling, class formation | Off-niche | Unknown | Very high | **Park.** Revisit only via the Departures Board |
| 28–29 | Collect design data through lessons | Excellent | Very high | Low | **Do (same as #4)** |
| 30 | YouTube team-battle mode | Interesting | Medium | Medium | **Prototype later as a class mode** |
| 31 | Layers (teacher, student, class, session, device, world) | Right model | — | — | **Use as the data model, but build only class + session + device now** |

## Why the strong ideas are strong

**1. It solves the product's biggest UX problem.** LessonCaptain has a very large catalogue of flights, activities
and games. A new teacher sees all of it. Narrowing it per class is the difference between "powerful" and
"overwhelming". It also strengthens the Live Room positioning ("the cockpit for live teaching") rather than
competing on content.

**4/5/28. "Design your class" is three things in one:**
- a **real English lesson** (giving opinions, comparing, would-you-rather, explaining why: all speaking goals the
  product already serves);
- **user research** with real students, which the roadmap says is the top priority ("nothing new is trusted until
  it's been taught with");
- **ownership**: students who chose the format buy into it. That is a retention story for private teachers.

It needs almost nothing new: live polls, Would You Rather and the phone banner already exist.

**6. Modes, not one profile.** A class is a "quiz day" class one week and a "relaxed chat" class the next. A small
set of saved modes per class (3–5) is easier to understand than a big settings page, and it is the natural
container for the narrowed toolset.

**7–9. Devices are a real constraint teachers hit.** Phones banned in school, half the class without data, a 1-on-1
on Zoom where the phone is the laptop. A class-level device setting plus "seats without phones" removes a reason
teachers abandon the product mid-lesson. Junior mode already sets the precedent for a per-class switch.

## Why the weak ideas are weak (for now)

**Matching, scheduling, class formation (23–27).** This is a two-sided marketplace: it needs many teachers and many
students in the same place at the same time (cold start), safety and moderation for minors (the privacy review is
still open), payments, and scheduling across time zones. Each of those is a company. The roadmap already has a
narrower version of this, the **Departures Board** (trial class → paid group lessons with *your* teacher). Grow that
first; if it works, matching is its natural extension.

**Three.js and open-world flight (19).** The current engine (canvas windscreen, terrain textures, MapLibre map, live
weather in `src/lib/live-room/live-weather.ts`) already does most of what the notes ask. The complaint from students
is "nothing happens", which is a **pacing/event** problem, not a renderer problem. Authored moments fix it at a
fraction of the cost.

**Live aircraft (16).** Paid APIs, licensing and rate limits for something that looks like a dot. Fake traffic
("a plane passes on the left") gives 90% of the effect for free.

## The plan

The plan keeps the roadmap's rule: test with real classes first. It makes "Design your class" *the* test lesson, so
the testing phase produces design data and a lesson at the same time.

### Phase A: "Design your class" in real classes (2–3 weeks, mostly owner time)
Goal: learn what each existing class wants, using lessons that are good English lessons on their own.

1. **Build one ready lesson, "Design your class"** (teacher-led, works with or without phones):
   - Warm-up: "What makes a class fun? What makes it boring?" (discussion, board).
   - **Show, don't ask**: 6–8 picture cards of real formats ("Two teams fight for the next YouTube video",
     "Imposter", "Quiz battle", "Roleplay at the airport", "No games, just good conversation"). Students vote
     love / maybe / no, then explain why (the speaking practice).
   - **Ultimate end-of-class game**: teams combine or change two cards into their dream game and pitch it.
   - **Devices question**: "How much should phones control this class?" (not at all / sometimes / a lot).
   - Close: the class's top 3 formats appear as "Your class plan", saved to the class.
2. **Pre-build options per class.** The owner knows each class; pick the 6–8 cards most likely to split that group.
3. **Record the results** in the class (votes, top picks, device choice, owner notes). Keep it a simple JSON field
   for now; no new system.
4. **Optional UX framing** for one adult/business class only: two minutes on "you are the users designing the
   product". Keep it if they enjoy it.

Success: run in every current class; each produces a top-3 and a device level; the owner rates it as a lesson
worth repeating (≥ 4/5). This also completes the roadmap's Phase 0 "Live Room in a real class" test.

### Phase B: Class setup and class modes (3–4 weeks of build)
Goal: every class has its own cockpit.

1. **Class setup** (one screen per class, extends the Junior-mode switch):
   - **Devices**: None · Light (votes and quick answers) · Full.
   - **Modes**: pick 3–5 from a fixed list: Conversation, Quiz battle, Team battle, Roleplay, Video, Relaxed chat,
     Junior. Each mode is a named shortlist of flights/activities that suit it.
   - **Flight view**: Calm · Eventful (Eventful arrives in Phase D; until then only Calm).
   - Prefilled from the Phase A results when they exist.
2. **Session start**: "What kind of class today?" shows only this class's modes, then only that mode's tools. The
   full catalogue stays one tap away ("All tools").
3. **Device-aware tools**: every flight/activity is tagged `devices: none | light | full`. A "None" class never
   sees a tool that needs phones; a "Light" class gets the phone-free version where one exists.
4. **Teacher onboarding**: add two taps to the existing 5 (`src/lib/teacher-profile.ts`): device level and
   "How structured do you like lessons?". Use them to prefill the first class's setup. Do not build a long quiz.

Success: time from opening a class to the first activity drops (PostHog); ≥ 70% of sessions start from a class mode
rather than the full catalogue; fewer abandoned sessions in phone-free classes.

### Phase C: Phoneless students, fair scoring (2–3 weeks)
Goal: a student without a phone is a full member of the class.

1. **Seats without phones**: the teacher adds a name to the roster; it gets a seat, a crew avatar, a team.
2. **Teacher scoring for them**: on any phone step, phoneless students appear as tap targets on the teacher screen
   (correct / tried / not yet); spoken answers count.
3. **Fairness rule**: points come from taking part and being right, never from speed of tapping; phone-only bonuses
   are off when the class is mixed. (The scoring already moved this way: Next speaker counts as taking part.)
4. **Phone-free versions** of the five most used phone steps (vote by hands, teacher records the count).

Success: a mixed class runs a full lesson with no student left out; phoneless students' scores land in the same
range as phone users'.

### Phase D: Flight that feels alive (after Phases A–C; joins roadmap #12–17)
Goal: something happens during the flight, without a renderer rewrite.

1. **Keep Calm mode** and improve it: when choosing scenery along the route, prefer interesting terrain (coast,
   mountains, cities) within a set distance of the real path (start at 150 km; tune by eye).
2. **Curated route network: 8–12 routes** chosen for visual moments (e.g. over the Himalayas, along the Alps, the
   Norwegian coast, the Rockies, the Nile). Each route has 3–5 **authored moments** placed along it: a landmark
   pass, a mountain range, a coastline, a city at night, a storm.
3. **Live conditions** on top: real weather (already fetched), local time, sun and moon. A real storm on the route
   becomes a moment ("Captain: turbulence ahead!"). Fake passing aircraft instead of live data.
4. **Eventful mode**: moments trigger small class events tied to the lesson (a quick question when you pass a
   landmark, a photo stop). Routes become things a class **unlocks and revisits**, through the class reward system
   (roadmap #12).
5. **Visual identity**: use the "Paper-cut" / "Sticker" house styles already chosen for art, so the world, the
   cities and the activities look like one product. Ask students for their pick in a Phase A-style lesson.

Success: students react to flights in class (owner observation); flight screens no longer named as "flat" in tests.

### Phase E: Free teacher-style tool, top of the funnel (after Phase B, alongside the landing page)
Goal: a useful free thing that brings teachers in.

1. **"What kind of teacher are you?"**: a 2-minute interactive quiz with no sign-up. Results: a named style (e.g.
   "The Conversation Pilot", "The Game Captain"), strengths, 3 class formats that suit you, and a "try this class
   mode free" button that opens LessonCaptain with that mode preselected.
2. **Shareable result card** for social posts and teacher groups.
3. **The owner's story** (many countries, kids to business schools, online and in person, "there is no best
   classroom") on the landing page and the quiz result page. This story is the positioning: true, specific,
   hard to copy.

Success: quiz completion rate; share rate; % of quiz takers who start a class.

### Parked (revisit with evidence)
- **Student discovery, matching, scheduling, class formation.** Revisit when the Departures Board has paying
  classes and there are enough teachers for matching to mean anything.
- **YouTube team-battle class.** Good candidate for the first "new class mode" after Phase B, if Phase A votes ask
  for it.
- **Three.js.** Only if Phase D's authored moments hit a wall the current engine can't pass.
- **Live aircraft.** Not worth it.

## Where this fits the current roadmap
- Phase A **is** Phase 0's "Live Room in a real class" test, with design data as a bonus.
- Phase B/C come before the home page rebuild (#3), because the home page should open on *your classes and their
  modes*, not on a catalogue. Junior mode (#6) becomes one class mode.
- Phase D joins Phase 3 of the roadmap (#12–17).
- Phase E joins the landing page (#7) and marketing (#11).
- Pricing (#1): class modes and device settings are free (they make the product usable); Pro stays where AI cost
  is. A possible Pro hook: "Eventful" flights and unlocked routes.

## Answers to the open questions (recommendations)
| Question | Recommendation |
|---|---|
| Questionnaire vs interactive? | Teachers: 7 taps. Students: interactive lesson only. |
| One configuration or several modes? | Several (3–5) modes per class. |
| How do preferences evolve? | Re-run a short "redesign" lesson each term; the teacher edits any time. |
| Teacher override? | The teacher always has the final say; student votes prefill, never lock. |
| Scoring in mixed classes? | Points for taking part and correctness; no speed-of-tap points when mixed. |
| What do phone users get extra? | Private answers and richer input, not more points. |
| Literal route or approximate? | Approximate, within ~150 km of the real path. |
| How many routes first? | 8–12. |
| Live aircraft? | No. |
| Three.js? | Not now. |
| Matching / scheduling? | Not now; via the Departures Board later. |
| What does the free tool produce? | A named teaching style, 3 class formats, a "try this mode" link. |
| Where does monetisation start? | Unchanged (AI cost, pricing option B); possibly Eventful flights. |
| Build now vs long term? | Now: A, B, C. Next: E. Later: D. Parked: matching. |
