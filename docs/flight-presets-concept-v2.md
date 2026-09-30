# Flight Presets v2: Concept Doc

> Status: **concept for discussion, not a build plan.** Nothing here is decided.
> Written Sep 30 2026 after auditing the five live presets. Earlier design: `docs/world-flight-presets-direction.md`.

## What presets are for

Presets are for teachers who want structure: one click gets them a whole, well-ordered lesson. They are also the building block for **courses**: a course repeats a preset's shape each week with new content. The games are the ingredients; presets are the recipes and the teaching method.

## What already works (keep it)

- **Tested in real classes.** The pacing works.
- **Every preset is built on a source** and **lands in a city** (World Flight), with a **logbook entry** at the end.
- **Language Toolkit** gives every lesson its words. They are already passed on to VocabSprint and Synonym Showdown.
- Each preset has a clear lesson job. Grammar (notice, fix, produce) and Debate (evidence, side, debate, shift) are already strong.
- **Time is adjustable** and the modules can be swapped.

## Where it could be much better

1. **Captain's Flight and Speak feel alike.** Both run: warm-up → source → opinion pulse → talk → review game → Final Word. The difference lives only in the middle, and a teacher can't tell them apart from the cards.
2. **The thread breaks halfway.** Toolkit words reach the vocabulary games, but nothing else carries through:
   - the phrases students actually said;
   - their best ideas;
   - the mistakes they made.

   The review game and the wrap-up don't know what happened in the lesson.
3. **Few preset-specific signature moments.** Debate has the vote shift and Travel has the trip checklist. Captain's, Speak and Grammar end the same way: a review game, a city, a logbook entry.
4. **Each lesson is a one-off.** In a course, lesson 4 doesn't know what lesson 3 taught. (`course_lessons.lesson_memory` exists in the database but is unused.)
5. **Every landing feels the same.** The class arrives in a city, but the lesson itself doesn't show up in the arrival.

## Three creative directions

These can be combined. My recommendation is at the end.

### A. Five different missions

Give each preset its own **identity and signature moment**, so teachers pick by the experience students get, not by a list of modules.

| Preset | Identity | Signature moment |
|---|---|---|
| **Captain's Flight** | *The Briefing*: investigate a source | **The Verdict.** The class commits to a conclusion about the source, and the landing reveals how the class split. |
| **Speak** | *The Crew*: people and their stories | **The Hot Seat finale.** One student is interviewed about their own life, using the lesson's topic. The lesson is about the students, not the source. |
| **Grammar** | *Flight School*: earn your wings | **Wings check.** The check-in and the proof show the same structure, with a visible before and after for the class ("12 of 14 now fly it"). |
| **Debate** | *The Summit*: a motion on trial | **The Shift.** It already exists. Make it bigger: show who moved, and why. |
| **Travel** | *The Trip*: survive a real city | **Stamps.** Every completed task earns a stamp, and the city at the end is the one they "survived". |

This mostly fixes the Captain's-vs-Speak blur: one is **about the source**, the other is **about the people**.

### B. The thread: the Pocket Phrasebook becomes the lesson's spine

The phones already have a Pocket Phrasebook ("I used it!" stamps, and "mastered" once a phrase is used in two classes). Make it **the thing that runs through every preset**:

1. **Load.** The Language Toolkit fills each student's phrasebook with the lesson's 5–6 phrases, as it does now.
2. **Use.** During the talk stages, the phrases show on the teacher's screen as a bar that fills up as they're used: "used 9 times by the class". Students stamp phrases on their phones, so it stays spoken-first.
3. **Catch.** The teacher (from the phone cockpit, which is private) can "catch" a great line a student said. It becomes the class's own phrase, in the green captain ribbon.
4. **Review.** The review game is built from the phrasebook, including the caught lines, not just the topic.
5. **Land.** The wrap-up shows "Today's phrasebook" (the most-used phrases and the caught lines), and that goes into the logbook with the city.
6. **Carry forward (courses).** The next lesson's warm-up brings back two or three phrases that were seen but never used: "still in your bag from last time". This is spaced practice without any extra work for the teacher.

This fixes the broken thread and the one-off problem together. It makes every preset feel **built** rather than assembled, and it's the heart of what makes a course work.

### C. The landing is earned

Every flight lands in a city, so make the **lesson's content show up in the arrival**: the city's welcome board shows the class's caught lines, the Verdict or Shift result, the stamps and the wings. The logbook entry is then a real souvenir of *this* lesson, not only of the city. This is mostly presentation, and it builds on A and B.

## Recommendation

**B is the foundation, A gives each preset its character, and C is the finishing touch.**

- B is the thing courses need, and it reuses what's already built (Toolkit, Phrasebook, logbook). It works for all presets at once.
- A is where the creative design lives. It's mostly re-sequencing and one signature beat per preset, and it uses the modules we just upgraded (Hot Seat, Fact Detective, Final Answer, Conversation Rounds, Team Debate, Mystery Flight).
- C is cheap once A and B exist.

## Sketch: presets under A + B (for discussion)

- **Captain's Flight:** Prediction → watch or read the source → Fact Detective / Final Answer (comprehension) → Toolkit (load) → Hot Take or Decision Council (use) → review from the phrasebook → **Verdict** landing.
- **Speak:** Two Truths / Would You Rather → source as a conversation starter → Toolkit → Conversation Rounds (use) → **Hot Seat finale** → phrasebook landing.
- **Grammar:** as now, plus a spoken production step (Story Chain using the target structure) → **Wings check** landing.
- **Debate:** as now → **bigger Shift** landing, with the class's caught arguments.
- **Travel:** as now, with **stamps**. The teacher picks which stops to fly.

## Questions for you

1. Does "Captain's = about the source, Speak = about the people" match how you actually use them?
2. **"Catch a line"**: would you use it mid-class from the phone cockpit, or is that one thing too many while teaching?
3. For courses: should the carry-forward phrases come back automatically, or should the teacher see and choose them?
4. Is there a preset you'd **add** or **drop**? (A Game Day reward flight is the one I'd consider.)
5. Should any preset have a second, shorter shape (a 30-minute "short haul"), or is adjusting the time enough?
