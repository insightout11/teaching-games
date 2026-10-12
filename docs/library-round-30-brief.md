# Library round 30 brief (for Codex): short texts for the course lessons that have no material

_Written Oct 12 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–29. Use your strongest writing
model: this is original writing for children and teenagers._

## Round 29 review: merged and in use
Much better. The fits are specific and the examples carry their target (Rain: "I think it will rain after lunch." /
"If it rains, we will play inside."; Food Waste: past perfect, conditional, passive). They now show in the prepare
sheet: when a teacher prepares a Grammar lesson on a banked topic, the sheet offers that topic's 2–3 points with the
reason and the example. Thank you for redoing it properly.

## Why this round
The 24 ready courses from round 24 have 120 lessons; **66 have no library material** (`source` omitted in
`src/data/ready-courses.json`), so those lessons are built from the topic alone. A short text written for the lesson
gives the class something concrete to read, hear and talk about, and lets Reading lessons be chosen for them.

## Task: `src/data/course-lesson-texts.json`
One original text for each of the 66 unsourced lessons:
```json
{ "courseId": "kids-space", "lessonIndex": 0, "title": "Hello, Moon",
  "level": "A1",
  "text": "…",
  "words": [{ "word": "crater", "meaning": "a big round hole" }],
  "questions": [{ "q": "What is on the Moon?", "a": "craters" }],
  "talk": ["Would you like to walk on the Moon? Why?"] }
```
- `courseId` and `lessonIndex` match `ready-courses.json` (0-based lesson order); `title` = the lesson's title.
- `level`: the course's level (kids A1/A2, teens B1/B2).
- `text`: original, accurate and evergreen. Lengths: A1 60–90 words, A2 90–130, B1 150–200, B2 200–260. A1/A2
  sentences ≤ 10/14 words. A small story, a day-in-the-life, a "did you know" piece or a short dialogue, whichever
  suits the lesson's topic and lesson type (`flight`): speaking lessons get a dialogue or a situation; listening
  lessons a piece that reads well aloud; debate lessons a balanced piece with two views; grammar lessons a text rich
  in a natural grammar point for that topic.
- For the **first and last lesson** of a course (`arc: baseline/compare`), the text should set up and revisit the
  course task (`arcTask`).
- `words`: 5–7 key words from the text with a child-friendly meaning (≤ 8 words). `questions`: 3 with short answers
  found in the text. `talk`: 2 open questions.
- Kid-safe, kind, culturally neutral. No real people, brands or dated references. Exam-style courses: tasks in the
  exam's style, never copied material.

## Validator: `scripts/validate-course-texts.ts` (fail on any)
- One entry for every unsourced lesson, none for sourced ones; ids and indexes valid.
- Word counts and sentence lengths by level; every `words[].word` and every `questions[].a` appears in the text;
  5–7 words, 3 questions, 2 talk prompts.
- No text repeated or ≥ 60% the same as another.
- Report counts by course and level, and paste 6 sample texts (two kids, two teens, one skills, one exam-style) in
  the progress log.

## Rules
- Branch `codex/library-round-30` off `origin/main`. Commit course by course; don't push or merge; report.
- Run the validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/course-lesson-texts.json`, the new validator in `scripts/`, and `docs/`.
