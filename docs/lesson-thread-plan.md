# Lesson Thread + Scene Igniter + Rank It: Proposals

> Status: **proposal for owner review**, Sep 30 2026. Based on `docs/catalogue-audit-sep2026.md`.
> Nothing here is built yet.

---

## 1. Connecting lessons end to end

### What the audit found
- Only one thing really threads through a lesson today: the **Language Toolkit word list** (`sourceVocab`), and only when a preset has a Toolkit stage.
- **Speak has no Toolkit stage**, so nothing threads through it.
- Review games get the **topic**, not the lesson's words.
- Stage pairs that *should* talk to each other don't:
  - Scene Igniter → Conversation Rounds: separate scenarios.
  - Quick Pulse → Opinion Shift: no baseline.
  - Grammar Check-in → Grammar Boss: Grammar Boss can drift from the lesson's target.
- **What students say or answer isn't kept**, so later stages and the landing can't build on it.

### The fix: one Lesson Kit, generated first, handed to every stage
Before any stage content is generated, the lesson builds a **Lesson Kit**, a single object that every stage generator receives:

| In the kit | Made from | Used by |
|---|---|---|
| **Topic + source** | The teacher's choice | Every stage (as now) |
| **Key phrases** (6–8 words/chunks) | The source (the Toolkit's list today) | Toolkit teaches them; scene, conversation, review game and landing reuse them |
| **The situation** (Speak/Travel): place, characters, goal | The scenario picker | Scene Igniter, Conversation Rounds, Travel stops |
| **Grammar target** | The check-in | Every grammar stage (fixes Boss drift) |
| **The question/motion** (Captain's/Debate) | The source | Pulse, Decision Council / Team Debate, landing |

Then at **runtime**, a small **Lesson Thread** record collects what happened, for later stages to use:
- takeoff answers (predictions, stances, check-in results);
- the class's votes and rankings;
- the phrases that were practised;
- the landing results.

It lives in the session store (the way Prediction Round → Read Aloud already works) and is saved with the session. That gives us the logbook entry and the **course carry-over** ("next lesson starts with…").

### The explicit stage pairs (each one a small wiring job)

| Pair | Today | Connected |
|---|---|---|
| **Scene Igniter → Conversation Rounds** | Separate scenarios | The conversation *continues the scene*: same characters and place, same goal, now without a script. The scene's key lines become the conversation's target phrases. |
| **Toolkit → review game** | Review gets the topic | The review game is built from the kit's phrases (VocabSprint/Synonym already do this; add Flash Quiz, Connections, Imposter, Taboo). |
| **Prediction → source → landing** | Prediction → Read Aloud works | The landing reveals predictions vs reality (the before/after). |
| **Quick Pulse → Opinion Shift** | No baseline | Pulse answers are the "before", and Opinion Shift shows how many moved. |
| **Check-in → Boss → Proof** | Boss can drift | All three use the kit's target; Proof compares with the check-in. |
| **Speak** | No Toolkit | Add a short Toolkit stage (the scene's key phrases), so Speak has a thread too. |
| **Lesson → next lesson (courses)** | Nothing carries | The thread saves the phrases and results; the next lesson's kit includes 2–3 carry-over phrases for the warm-up. |

### Build order
1. The Lesson Kit object, passed to every generator (a server-side change in the lesson generator).
2. Scene Igniter → Conversation Rounds, and Toolkit → review games (the most visible gains).
3. The runtime Lesson Thread + Quick Pulse → Opinion Shift + Grammar target fix.
4. Landing before/afters (Flight Presets v2) + course carry-over.

---

## 2. Scene Igniter: "You're in a movie"

**The original intent:** students act a movie scene from a script. Today it's A/B/C/D letters, the full script on the shared screen (so everyone reads ahead), and no phone flow.

### The redesign
- **A real cast, not letters.** Each character has a name, a one-line role and a *want* ("Maya, the tired pilot, wants to go home"). The scene card has a title, a setting, a genre mood (comedy / mystery / drama) and a "previously…" line.
- **Casting.** The class is auto-cast. Each actor's phone shows **their script**:
  - their own lines, highlighted;
  - the **cue line** before each of theirs, so they know when to come in;
  - a stage direction ("whispering", "angry").
- **The shared screen is the stage, not the script.**
  - It shows the set, who's on stage, and the current speaker's name, character and direction, with big "ACTION!" and "CUT!" clapperboard moments.
  - The audience *listens* rather than reads ahead.
  - Optional **subtitles** for lower levels (each line appears only after it's spoken).
- **The actor passes the cue.** When the actor finishes their line, they tap "Line done" on their phone and the next actor lights up. The teacher doesn't have to drive every line.
- **Take 1 → Director's notes → Take 2.**
  - After a read-through, the teacher taps quick notes onto an actor's phone ("more feeling!", "slower", "louder"), and the class runs Take 2.
  - Take 2 is where the acting happens.
- **The improv finale: "The scene continues…"**
  - A twist card appears.
  - The actors continue *without a script*, with a phone cheat card of 3 key phrases from the scene.
  - This is the bridge into Conversation Rounds (section 1).
- **Class size:**
  - Scenes have 2–4 parts.
  - Larger classes get a second cast (the same scene or its sibling), so everyone acts.
  - Students not on stage get an **audience job**: listen for a phrase, or vote for the best take.

### What it reuses
- The scene generator (just add character names, wants and a genre).
- The phone panel pattern.
- Take 2 and the improv cheat card come straight from the kit's key phrases.

---

## 3. Rank It: "Defend your #1"

The audit says it's worth keeping: class aggregation plus a second round make it more than a poll. It needs more talking and a clearer reveal.

- **Two explicit kinds of ranking:**
  - **Fact ranking** (there *is* an answer): the reveal is a satisfying "how close was the class?" ladder.
  - **Opinion ranking** (no answer): no answer key, and the spotlight is on disagreement.

  The generator marks which kind it is. Today it's implicit.
- **"Defend your #1":** after everyone ranks, the screen calls two students whose top picks are furthest apart to argue for 30 seconds each, spoken, like Hear both sides.
- **New evidence:** hidden facts arrive one at a time as evidence cards, not all at once. Then comes a re-rank.
- **The Shift:** the second ranking animates against the first (items climb or fall on a ladder), and the screen shows "5 of you changed your #1". This is the before/after in miniature.
- **Visual:** the class order as a big ladder/podium with movement, instead of a list.

---

## Questions for you

1. **Lesson Kit:** agree that it's the backbone, built first?
2. **Scene Igniter:**
   - Should subtitles be off by default (listening) or on (reading support)?
   - "Actor taps Line done", or should the teacher advance?
3. **Scene Igniter → Conversation Rounds:** should the conversation continue the *same* scene (same characters), or a new situation using the same phrases?
4. **Rank It:** is "Defend your #1" with 30-second turns right, or should it be open discussion?
