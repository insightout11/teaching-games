# Library round 30 progress

Original material for the 66 unsourced ready-course lessons. Branch: `codex/library-round-30`, based on `origin/main` on Oct 12 2026. Course levels map Beginner/Easy/Intermediate/Advanced to A1/A2/B1/B2.

## Course commits

Texts are written individually for each lesson's topic and flight. Opening and closing lessons introduce and revisit the course task. Course-scoped validation checks each completed course before its local commit; the final run checks all 66 lessons and cross-course similarity.
- kids-family: 4 A1 texts; course checker passes.
- kids-animals: 1 texts; course checker passes.
- kids-food: 2 texts; course checker passes.
- kids-weather: 2 texts; course checker passes.
- kids-space: 2 A2 texts; course checker passes. The word counter ignores punctuation-only tokens in dialogue.
- kids-dinosaurs: 3 A2 texts; course checker passes.
- kids-school: 3 texts; course checker passes.
- kids-helpers: 2 texts; course checker passes.
- teens-social-media: 3 texts; course checker passes.
- teens-future-jobs: 3 texts; course checker passes.
- teens-sport: 3 texts; course checker passes.
- teens-music: 2 texts; course checker passes.
- teens-film: 2 texts; course checker passes.
- teens-mysteries: 2 texts; course checker passes.
- teens-money: 2 texts; course checker passes.
- teens-planet: 2 texts; course checker passes.
- skills-debate: 5 texts; course checker passes.
- skills-speaking: 3 texts; course checker passes.
- exam-movers-style: 5 texts; course checker passes.
- exam-flyers-style: 5 texts; course checker passes.
- exam-a2-style: 5 texts; course checker passes.
- exam-b1-style: 5 texts; course checker passes.

## Final checker counts

- **66/66** unsourced lessons covered; **0** entries for sourced lessons.
- Levels: **A1 12**, **A2 25**, **B1 27**, **B2 2**.
- **330** vocabulary entries, **198** comprehension questions and **132** talk questions.
- Every check reports **0**: coverage, invalidLesson, sourcedLesson, duplicateEntry, title, level, wordCount, sentenceLength, vocabulary, questions, talk, repeatedText, similarText.
- Maximum shared text: **34.67%**, between kids-school lessons 0 and 4; the failure threshold is 60%. Similarity uses normalized-token longest common subsequence divided by the shorter text length.

| Course | Texts |
| --- | ---: |
| kids-family | 4 |
| kids-animals | 1 |
| kids-food | 2 |
| kids-weather | 2 |
| kids-space | 2 |
| kids-dinosaurs | 3 |
| kids-school | 3 |
| kids-helpers | 2 |
| teens-social-media | 3 |
| teens-future-jobs | 3 |
| teens-sport | 3 |
| teens-music | 2 |
| teens-film | 2 |
| teens-mysteries | 2 |
| teens-money | 2 |
| teens-planet | 2 |
| skills-listening | 0 |
| skills-debate | 5 |
| skills-travel | 0 |
| skills-speaking | 3 |
| exam-movers-style | 5 |
| exam-flyers-style | 5 |
| exam-a2-style | 5 |
| exam-b1-style | 5 |

The two courses with zero new texts already have material for every lesson.

## Required checks

- `npx tsx scripts/validate-course-texts.ts` — passed with the counts above.
- `npx tsx scripts/validate-library.ts` — passed: 1,388 items across 28 existing library files.
- `npx tsx scripts/validate-ready-courses.ts` — passed: 24 courses, 120 lessons, all checks zero.
- `pnpm test src/lib` — passed: 88 files, 399 tests.
- `npx tsc --noEmit -p .` — reports the three existing errors in src/lib/ai/providers/anthropic.ts: missing @anthropic-ai/sdk at lines 1 and 32, plus the related implicit-any error at line 53; no errors in Round 30 files.

## Six original text drafts for review

### Home Routines — Kids, A1

`kids-family`, lesson 1; 74 words.

In the morning, Jo opens the curtains. His uncle makes breakfast. “Please pass the cups,” says his uncle. Jo puts two cups on the table. Then they eat and talk. In the evening, their jobs change. Jo washes the cups. His uncle dries them with a towel. “What comes next?” asks Jo. “Our book,” says his uncle. They sit on the sofa and read. Some days are busy, but they keep this quiet time.

### Clues in the Ground — Kids, A2

`kids-dinosaurs`, lesson 1; 107 words.

A class visits a small display of old rocks. One rock holds a leaf shape. Another shows three footprints. “Where is the dinosaur?” asks Ada. The guide points at the footprints. “A fossil can be a mark,” she says. “It does not need to be a whole bone.” Ada studies the spaces between the prints. They show where an animal stepped long ago. She cannot learn its colour from these marks. Her friend draws the prints in a notebook. Together, they make two lists: things the rock shows and questions it cannot answer. Their best clue is small, but it tells a real part of a story.

### A Fair First Job — Teens, B1

`teens-future-jobs`, lesson 3; 161 words.

A workshop wants to offer a short learning placement to teenagers. Two students discuss whether it should be paid. Mara argues that a student's time has value, especially when the student completes useful tasks. Payment could also make the placement possible for someone who must pay for travel. Dev agrees that access matters, but worries about a small workshop's budget. Teaching a beginner can take time away from normal work. If every placement costs more than the workshop can afford, it may offer none. Mara replies that a business should not use the word “learning” to hide ordinary unpaid work. Dev suggests separating observation from work that benefits the business. They both want clear hours, safe tasks and a named adult who can answer questions. Before deciding, they ask what the placement actually includes. Their debate is no longer only about money. It is also about whether the student receives real teaching and whether people with different resources can take part.

### My Fair Solution — Teens, B2

`teens-mysteries`, lesson 4; 225 words.

Sora and Anton return to their courtyard notes after speaking with the art teacher. The class had been planning a large drawing on the paving. The chalk circle marked space for its central pattern. The teacher had left a blue cloth on the bench while washing chalk from a student's hands. That student then crossed the courtyard with wet shoes. This account connects the circle, the cloth and the print without requiring a hidden treasure.

Sora prepares her final explanation, but Anton asks whether the teacher's account is enough. A garden group could also have marked a circle for a plant pot, used a cloth during cleaning and left wet footprints after watering. Sora agrees that the original clues alone would not distinguish those stories. The teacher's description adds information from someone who was there, while a sketch of the planned drawing provides another check.

Their final talk separates those layers. First, they state the three original observations. Next, they explain how the art activity could have produced each one. Finally, they acknowledge the gardening alternative and say what makes the art explanation stronger. Sora removes the phrase “obviously a treasure hunt” from their first notes. A fair solution does not need to sound certain at every step. It needs a clear connection between evidence and explanation, plus an honest account of what remains untested.

### Two Sides of AI — Skills, B1

`skills-debate`, lesson 1; 163 words.

A class considers allowing AI tools to help plan homework. Ellis supports using a tool to list possible steps before writing. In the class's example, a large project becomes easier to start when it is divided into smaller tasks. Ellis still wants the student to choose the steps and do the actual thinking. Priya worries that a polished plan can hide mistakes. A tool might suggest checking a source that does not exist or omit a part of the assignment. She would rather students ask a teacher when instructions are unclear. Ellis replies that checking the plan could itself be a learning task, but agrees that the teacher should see how the tool was used. They propose testing one sample plan together before choosing a rule. The debate turns on a distinction: receiving a suggestion is not the same as knowing it is reliable. Each side must explain where responsibility stays with the learner, and what support would make the proposed use fair.

### Tell the Picture Story — Exam-style, A2

`exam-flyers-style`, lesson 3; 100 words.

Three imaginary pictures tell a small story. First, a child places a paper boat beside a pond. Next, wind pushes the boat into the water. The child looks worried because the boat moves away. In the last picture, a friend uses a long stick. She gently brings the boat back to the edge. The child thanks her and chooses a dry place to play. Tom tells the story in order. He says who is there and what changes in each picture. His partner asks why the child looks worried. Tom answers using the boat's movement, not an invented extra problem.

## Files touched

- `src/data/course-lesson-texts.json`
- `scripts/validate-course-texts.ts`
- `docs/library-round-30-progress.md`

No runtime registration changes were requested. The new bank is matched by course ID and zero-based lesson index for the application to consume.
Final editorial follow-ups align the family, film and B1 comparison closings with their actual opening texts, and simplify one A1 school sentence. The final course-text validator still passes all checks.
