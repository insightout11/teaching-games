# Library round 24 brief (for Codex): 24 more ready courses

_Written Oct 9 2026. Owner: LessonCaptain. Executor: Codex. Start after round 23 (finish that first). Same rules as
rounds 18–23. Use your strongest writing model. Background: `docs/course-builder-review.md`._

## Context
Teachers can start a course from a ready-made one (`src/lib/course-presets.ts`: 8 theme courses + 14 reading courses
built from `src/data/book-library.json`). We need more, especially for kids and for skills. The course builder is
being upgraded so each lesson has a **lesson type** (a flight) chosen directly.

## Task: `src/data/ready-courses.json`
**24 courses**, each 5–6 lessons:
```json
{ "id": "kids-space", "title": "Space Explorers", "audience": "kids", "level": "Easy",
  "blurb": "Six lessons from the Moon to Mars: planets, astronauts and living in space.",
  "theme": "Space for young learners",
  "lessons": [
    { "title": "Hello, Moon", "topic": "The Moon: what it is and how it changes",
      "keywords": ["moon", "night", "astronaut"], "flight": "speak-60",
      "source": { "sourceType": "kids", "id": "<library id>", "title": "<library title>" } }
  ] }
```
- **Courses**:
  - Kids themes (8, `audience: "kids"`, level `Beginner` or `Easy`): My family and me, Animals around the world, Food
    we love, Seasons and weather, Space explorers, Dinosaurs, At school, Helpers in our town.
  - Teen themes (8, `audience: "teens"`, `Intermediate` or `Advanced`): Social media and me, Future jobs, Sport,
    Music, Film and series, Mysteries and the unexplained, Money and spending, Our planet's future.
  - Skills (4): Listening (built from `src/data/listening-library.json` packs), Debate (from
    `src/data/debate-motions.json`), Travel (five World Flight cities), Speaking confidence.
  - Exam-style speaking (4): Cambridge Young Learners Movers, Flyers, A2 Key, B1 Preliminary speaking practice. Our
    own tasks in the exam's style (describe a picture, answer personal questions, discuss options). Never copy exam
    material or use exam names as if official; titles like "A2 Key-style speaking practice".
- **flight** (lesson type), one of: `speak-60`, `debate-60`, `listening-60`, `reading-60`, `grammar-60`,
  `travel-60`, `all-around-flight-60`. Mix them sensibly within a course (a kids theme course might be Speak,
  Reading, Speak, Mix, Speak, Mix; the Listening course is all `listening-60`). Junior-age kids courses avoid
  `debate-60` and `grammar-60`.
- **source**: a real item from our libraries (`src/data/*-library.json`, exact `id` and `title`, its file's
  `sourceType`) that fits the lesson; omit `source` when nothing fits rather than forcing one. Prefer kids libraries
  (`kids`, `storyweaver`, `picture-books`, `stories`) for kids courses. Listening lessons use `listening` packs;
  reading lessons use `books`, `stories` or `picture-books`.
- **Connected arc**: lessons build on each other, and the **first and last lessons repeat one simple task** (e.g.
  "say three things about space") so the class sees its progress. Mark them with `"arc": "baseline"` and
  `"arc": "compare"` on those two lessons.
- Kid-safe, culturally neutral, evergreen.

## Validator: `scripts/validate-ready-courses.ts` (fail on any)
- 24 courses, unique ids and titles; 5–6 lessons; every `flight` in the allowed list; no debate/grammar in Junior-age
  kids courses; every `source` id exists in the named library file with that title; exactly one baseline and one
  compare lesson per course (first and last); topics unique within a course.
- Report counts by audience, flight mix, lessons with/without sources, and all checks at 0.

## Rules
- Branch `codex/library-round-24` off `origin/main`. Commit your own files task by task; don't push or merge; report.
- Run the new validator, the existing validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/ready-courses.json`, the new validator in `scripts/`, and `docs/`.
