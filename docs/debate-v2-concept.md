# Debate v2: Audit and Concept

> Status: **built (Oct 6 2026), all 4 steps.** Concept below kept as the design record.
> Part of Flight Presets v2 (`docs/flight-presets-concept-v2.md`). Rules that stay:
> - spoken-first: phones tap and vote, **nobody types**;
> - no spotlight on one student; everyone talks;
> - one window in Zoom, no breakout rooms;
> - do less, go deeper, fun breaks between stages;
> - the before → after shows only at landing (and is saved to the logbook).

## What Debate is today

Tagline: *"Two teams, one motion — make your case."*

| Stage | Activity | How it works |
|---|---|---|
| Takeoff | **Quick Pulse** | Three mini-prompts on phones; the first opinion scale becomes the "before" |
| Evidence | **Fact Detective** | True/false (or "spot the fib") claims about the topic |
| Break | **Would You Rather / Rank It** | Phone vote |
| Main event | **Team Debate** | Teams split; 5 min prep (phones show the side's angles and a **text box to type arguments**); then Opening → Rebuttal → Closing, one speaker per side per round, **90 seconds each** |
| Game | Pool | |
| Landing | **Opinion Shift** | Same question again; "X of N changed their mind"; two students say why. Saved to the logbook |

**What's strong (keep):**
- The before → after (Pulse → Shift) is the clearest "change" in any flight, and it's now saved.
- Real debate structure (opening, rebuttal, closing) and two visible sides.
- "Hear why": one student who changed and one who held firm explain, out loud.
- 60 checked debate motions now exist (`src/data/debate-motions.json`): balanced points for both sides and real, sourced
  evidence, 30 for kids and 30 for teens.

## Honest problems

1. **Most of the class never speaks in the main event.** Team Debate has 6 speaking turns (3 rounds × 2 sides) of 90
   seconds. In a class of 8, two students never speak, and six speak once. It's the least talk time of any flight.
2. **It's a spotlight format.** One student holds the floor alone for 90 seconds in front of everyone. That's hard for
   shy students and very hard for kids at A2.
3. **Phones ask students to type.** The prep screen has a text box for arguments. That breaks the spoken-first rule, and
   typing is slow on phones, so prep turns into silent writing time.
4. **The evidence stage doesn't feed the debate.** Fact Detective is true/false trivia *about the topic*, not evidence
   *for or against the motion*. Students learn facts they can't use as arguments.
5. **The "before" is often not the motion.** Quick Pulse asks three warm-up prompts; the baseline is the first opinion
   scale, which may not be the motion itself. So the Shift sometimes measures a different question.
6. **No practice answering the other side.** Rebuttal happens once, by one student. Answering an argument ("That's
   true, but…") is the core debate skill, and most students never try it.

## The idea: everyone argues, nobody alone

Same shape (pulse, evidence, debate, shift), but every stage is **many short turns**, and every student argues, answers
the other side, and, for one round, **argues the side they disagree with**.

| Phase | Stage | What happens |
|---|---|---|
| **Takeoff** | **Motion Pulse** | The motion itself on phones: "Where do you stand?" (1–5). One question, so the before measures exactly what the Shift re-asks. |
| **Climb** | **Evidence Cards** (replaces Fact Detective) | Real, sourced facts from the motions bank, one at a time. Phones: "Does this help FOR or AGAINST?" Then the class picks the strongest card for each side. Students now hold real reasons, with a source. |
| *Break* | Would You Rather (kept) | |
| **Cruise** | **Prep, by tapping** | Each phone shows its side's 3 points + the evidence cards + phrases. Students **tap to claim** the point they'll make (no typing). 2 minutes, not 5. |
| | **Tag-team Debate** (replaces the 90s speeches) | The mic alternates sides every turn, 20–30 seconds each, fair order, until everyone has spoken. **Round 1: one point each.** **Round 2: answer the last speaker** (every turn starts with a frame: "That's true, but…", "I see your point, however…"). **Round 3: closing**: each team's best reason, said by a different student. |
| | **Switch Sides** (new, short) | Teams swap and argue the *other* side for one quick round (15–20s each). It's fun, it's real critical thinking, and it often changes minds. |
| **Descent** | Game (kept) | |
| **Landing** | **Opinion Shift** (kept) | The motion again; "X of N changed their mind"; two voices explain. Plus **the strongest argument**: phones vote for the argument that made them think most (from the evidence cards and claimed points, no names). Saved to the logbook. |

That's the same number of stages, but in a class of 8 every student speaks 3–4 times instead of 0–1, always briefly,
and always as part of a team.

## What carries through
- **The motion:** Pulse → evidence → prep → debate → Switch Sides → Shift. One question all lesson.
- **Evidence cards:** sorted at the start, claimed in prep, quoted in the debate, voted on at landing.
- **Before → after:** the Shift (already saved to the logbook), now on exactly the same question.

## New pieces (none decided)
1. **Motion source:** a checked motion from the bank when the topic matches (points + evidence included), otherwise
   generated as today.
2. **Motion Pulse:** the motion as the single takeoff question (Quick Pulse stays in the catalogue).
3. **Evidence Cards:** for/against sorting + strongest-card vote, from the bank's evidence (or generated with sources).
4. **Tap-to-claim prep** replacing the text box (keeps the side's points and phrases).
5. **Tag-team Debate:** short alternating turns, fair order, frames for answering, three rounds (can reuse the turn
   engine from Pass the Line / Quick-fire).
6. **Switch Sides** round.
7. **Strongest argument** vote in the Opinion Shift landing.

## Questions for you
1. **Tag-team turns (20–30s, everyone speaks) instead of 90-second speeches?** Or keep one longer "opening speech"
   per team and make the rest tag-team?
2. **Evidence Cards instead of Fact Detective?** (Fact Detective stays in the catalogue for other lessons.)
3. **Switch Sides round:** yes, or too much for kids?
4. **Prep:** tap to claim a point (no typing), 2 minutes. OK to remove the text box from the debate prep screen?
5. **Motion:** use the 60 checked motions when the topic matches, generated otherwise, like Speak's situations?

## Decisions (owner, Oct 6 2026)
All recommendations accepted: (1) **tag-team** short turns for everyone, no 90s speeches; (2) **Evidence Cards** replace
Fact Detective in Debate; (3) **Switch Sides** round yes; (4) **tap-to-claim prep**, 2 min, text box removed; (5) **checked
motions** when the topic matches, generated otherwise.

## Build order
1. Motion source (bank match + generated fallback) and **Motion Pulse** takeoff.
2. **Evidence Cards.**
3. **Tap-to-claim prep + Tag-team Debate** (openings, answers, closing) + **Switch Sides**.
4. **Strongest argument** vote in the Opinion Shift landing + reshape the Debate preset.

## Built (Oct 6 2026)
`motion-pulse` → `evidence-cards` → break → `tag-team-debate` (tap-to-claim prep, openings, answers, closing, Switch
Sides) → game → `opinion-shift` (the Shift on the motion's own question, saved to the logbook, then the strongest-argument
vote). Motion: checked bank → generated → fallback (`src/lib/debate-motion.ts`), stored in `lessonThread.debateMotion`.
Team Debate and Fact Detective stay in the catalogue.
