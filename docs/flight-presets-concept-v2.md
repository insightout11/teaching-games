# Flight Presets v2: Concept Doc

> Status: **concept for discussion, not a build plan.** Rewritten Sep 30 2026 after owner feedback.
> Earlier design: `docs/world-flight-presets-direction.md`.

## The idea in one line

**Every flight has a before and an after.** A preset takes off with a quick check on phones and lands with the matching check. The difference between the two is what the lesson achieved, and the class sees it when they land in the city.

## Why presets matter

Presets are for teachers who want structure: one click gets them a whole lesson with a real teaching method behind it. They are also the building block of **courses**, where the same shape repeats each week with new content. A course needs every lesson to *show progress*. That is what this concept adds.

## Ground rules (from owner feedback)

- **Whole class, any size.** It must work for 3 students or 15. No spotlight on one student's story.
- **No listening duty.** The teacher never has to catch, track or judge speech mid-class.
- **One teaching window.** It runs from the session screen and Live Room, with no second teacher device.
- **Phones only for taps.** Speaking happens out loud; the phones just answer the two checks.
- **Anonymous results.** The shared screen shows class results, never individual low scores.

## What stays

- Every preset is built on a source, lands in a city and gets a logbook entry.
- Language Toolkit gives each lesson its words and phrases.
- The tested pacing and the middle stages (with the upgraded modules swapped in over time).
- The time stays adjustable.

## The five flights

Each preset measures a **different kind of change**. That becomes its identity.

| Preset | It changes… | Takeoff check | Landing check | Arrival shows |
|---|---|---|---|---|
| **Grammar** | accuracy | 4–5 quick items on the target structure | Matching items (new sentences, same structure) | **Wings earned**: "11 of 14 now fly it", class accuracy before → after |
| **Debate** | opinion | Where do you stand on the motion? (scale) | Same question after the debate | **The Shift**: how the room moved, and how many changed their mind |
| **Captain's Flight** | understanding | Predict: what will the source say or show? | What did it actually say? (comprehension) | **Prediction vs reality**: what the class expected vs what they learned |
| **Speak** | expression | A real situation from the topic: "Which reply would you use?" + "How confident are you?" | The same situation, after the lesson | **Better answers**: the class's choice shifting toward natural replies, and confidence rising |
| **Travel** | can-do | "Could you do this in the city?" for each trip task | The same tasks, ticked off after each stop | **Can-do stamps**: tasks the class can now handle |

### How it plays in the lesson

1. **Takeoff:** the check runs during boarding, so it fits the Live Room's "activities while students join". It takes about a minute.
2. **Middle:** the preset's stages *earn* the change (the rule and practice for Grammar, the debate for Debate, the source and discussion for Captain's).
3. **Landing:** the same check, then the reveal as the plane lands. The "after" is the arrival moment, shown over the city scene.
4. **Logbook:** the before → after goes into the class logbook with the city ("Lisbon · Past simple · 55% → 86%").

### Honest weak spots

- **Speak is the hardest to measure.** Fluency doesn't fit a tap, so the check measures *choice* (picking the natural reply) and *confidence*. Confidence is self-reported, but that's still meaningful for a speaking lesson. This needs the most design work.
- **Memory effects.** The same items twice can test memory, not learning. So Grammar uses matching *new* items, and Captain's checks different things before and after by design.
- **Small classes.** "3 of 4" is still a fine story. Percentages alone look odd with 3 students, so show counts.

## Courses

- A course becomes **a row of before-and-afters**: the progress story of the term, lesson by lesson.
- The next lesson's takeoff can include one item from the last lesson, a quick "still flying?" check. This is spaced review with no extra teacher work.
- `course_lessons.lesson_memory` (in the database, unused) is the natural home for each lesson's before and after.

## What it reuses

- **Existing openers and closers** become matching pairs:
  - Prediction Round → Final Word;
  - Grammar Check-in → Grammar Proof;
  - Quick Pulse → Opinion Shift;
  - Boarding Call → Trip Recap.
- The **arrival scene** and **logbook deposit** already exist; the result is layered on top.
- Scoring doesn't change. The checks are about the class's progress, not points.

## Questions for you

1. Do the five "kinds of change" (accuracy, opinion, understanding, expression, can-do) feel right for each preset?
2. Speak: are "which reply would you use" plus "how confident are you" good enough measures, or is there a better one from your classes?
3. Should the result be shown **only at landing** (a big reveal), or also as a hint at the midpoint?
4. For courses: include the "still flying?" item from last lesson automatically?
