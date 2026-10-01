# Grammar Flight v2: Concept

> Status: **concept, direction approved by owner (Oct 1 2026).** Part of Flight Presets v2
> (`docs/flight-presets-concept-v2.md`) and the lesson thread (`docs/lesson-thread-plan.md`).

## The idea

A teacher who wants grammar wants a **specific** grammar point. They pick it, and the whole flight configures itself around that point's **family**:
- how it's presented;
- which speaking game practises it;
- what the Class Board looks like;
- what the Wings check tests.

Every stage hands its material to the next, so the lesson is one connected journey from the takeoff check to the landing proof.

## The flight

| # | Stage | What it does | Connected how |
|---|---|---|---|
| 1 | **Check-in** (takeoff) | Judge 3 sentences on phones | The "before" for the Wings check (built) |
| 2 | **Presentation** | Watch it / Discover it / Explain it (below) | Builds the Class Board anchor chart |
| 3 | **Fix the Captain** | The captain's announcements each hide one mistake; the class says the fix aloud | Its mistakes come from the presentation's "common mistake"; misses go to the struggles record |
| 4 | **The family's speaking game** | Spoken production in the right frame (below) | Uses the lesson's scene/source and the board's examples |
| 5 | **Review game** | A quick game built from the class's struggles | Brings back what the class got wrong |
| 6 | **Wings + Proof** (landing) | 3 new judge-it sentences, then write your own | Before → after: "Wings earned 4 → 10 of 12" (built) |

**Running through the whole lesson:**
- **Grammar Hunt.** After the presentation, every phone gets a secret mission ("use the past simple twice") that runs through every later stage, including speaking activities. Students stamp it when they manage it (self-reported, like the phrasebook's "I used it!"). The landing shows the class's stamps.
- **The Class Board.** It stays open as the lesson's reference, and it's the takeaway that goes into the logbook.

## Presentation: the teacher chooses, with a smart default

| Mode | What happens | Default when… |
|---|---|---|
| **Discover it** | Sentences using the structure are pulled from the lesson's own source and shown first. The class spots the pattern, *then* the rule is revealed (guided discovery). | …the lesson has a source that contains the structure |
| **Watch it** | The matching **Grammar Gameshow** clip (28 in the library, matched by target). A "catch it" step asks students to tap whenever they hear the structure. | …there's no source but a matching clip exists |
| **Explain it** | The rule card first: form, examples, when to use, common mistake (today's Grammar Clarify). | …otherwise |

The teacher sees one switch (Discover / Watch / Explain) on the Grammar setup. All three end the same way: the rule and examples land on the Class Board.

## Families

The teacher's grammar point maps to a family. Each family has a **speaking frame** and a **board template**.

| Family | Speaking frame | Board template | Build |
|---|---|---|---|
| **Tenses** | **Tense Time Machine**: the plane flies to the past, present or future (cockpit time dial); the class retells the same scene in that tense, one sentence each, with starters on phones ("Yesterday…", "Right now…", "Next year…") | Past \| Present \| Future | **First** |
| **Comparisons** | **Compare It**: two places/things from the lesson (or two cities on the map): "Tokyo is bigger than Paris", "the most…" | Bigger/smaller… \| The most… | **First** |
| **Questions** | **Answer First**: the screen shows an answer ("At 7 o'clock."); the class asks the question that fits | Question word \| Question \| Answer | **First** |
| Modals | Captain's Rules: rules and advice for the flight (must / mustn't / should / can) | Must \| Should \| Can | Later |
| Conditionals | What If chain: "If I…, I would…" passed around the class | If… \| then… | Later |
| Passive | Headline Desk: active news becomes passive headlines | Active \| Passive | Later |
| Reported speech | Cabin Gossip: "She said that…" relay | They said… \| She said that… | Later |
| Prepositions | Where's the…?: a picture or map scene | Picture \| Sentences | Later |

**One engine, many frames:**
- The speaking frames share one engine: turn order, phone starters, teacher-paced, spoken. Only the frame changes, so quality stays consistent and new families are cheap to add.
- **Fix the Captain, Grammar Hunt, Sentence Scramble and Wings** work for every family.

**Needed underneath:**
- The grammar target list (`src/lib/grammar.ts`) grows from tenses + 4 structures to include modals, comparisons, questions and prepositions.
- Each target is tagged with its family and its matching Gameshow clip.

## The Class Board's role
- **A family template** gives the board its structure before anything is posted.
- **Presentation fills it** with the rule and examples.
- **Students post their own sentences.** "Polish" shows gentle corrections (teacher toggle), and dot voting picks the class's best.
- **It stays open as the anchor chart** and is saved as the lesson's takeaway (logbook).

## Build order
1. **Kit everywhere:** the Lesson Kit (phrases, scene, target) reaches the games that generate their own content.
2. **Families + targets:** expand the target list, tag families and clips.
3. **Fix the Captain.**
4. **Speaking engine + Tense Time Machine**, then **Compare It** and **Answer First**.
5. **Presentation modes:** Discover it (source sentences → board) and Watch it (matched clip + catch it).
6. **Grammar Hunt** (phone mission + stamps; landing count).
7. **Struggles record → review game**, and the new Grammar flight order.

## Open questions
- Should Grammar Hunt run in **every** preset when a grammar target is set (e.g. a Speak lesson with a target), or only in the Grammar flight?
- Should **Error Hunter** stay as an option alongside Fix the Captain, or be replaced by it in this flight?
