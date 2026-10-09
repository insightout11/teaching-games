# Library round 24 progress

## Ready-course bank

- Wrote 24 courses in `src/data/ready-courses.json`: eight kids themes, eight teen themes, four skills courses and four original exam-style speaking courses. Each has five connected lessons, a shared `arcTask`, a first-lesson `baseline` and a last-lesson `compare`.
- The 120 lessons cover 10 kids and 14 teen courses. Junior-age kids courses contain no Debate or Grammar flights.
- Sources are attached where a library item fits the lesson. All five Listening course lessons use sources with listening packs; the Debate course references five existing motion IDs; the Travel course uses one World Flight source for each of Bangkok, Tokyo, Paris, Cairo and Rio. Original exam-style speaking tasks have no forced library source.
- The authored course seeds in `docs/library-round-24-course-seeds.txt` build the JSON through `scripts/validate-ready-courses.ts --build`. The resulting source objects carry the source library's exact title.

## Checker counts

- Courses: 24 (kids themes 8, teen themes 8, skills 4, exam-style 4); audience kids 10, teens 14; lessons 120.
- Flights: Speak 73, Debate 8, Listening 6, Reading 9, Grammar 2, Travel 5, Mix 17.
- Lessons with sources 54; without sources 66. Two tempting matches were removed in editorial review because their content did not directly support the lesson.
- All 13 ready-course error counters: 0.

## Checks

- `npx tsx scripts/validate-ready-courses.ts`: passed, all 13 counters 0.
- `npx tsx scripts/validate-library.ts`: passed, 1388 existing library items across 28 files.
- `npx tsx scripts/validate-junior-questions.ts`: passed, 40 sets and 400 questions; all 16 counters 0.
- `pnpm test src/lib`: passed, 85 files and 389 tests.
- Targeted TypeScript compile of the new validator: passed.
- Full `npx tsc --noEmit -p .`: blocked by this checkout's missing declared `@anthropic-ai/sdk` package (two unresolved imports in `src/lib/ai/providers/anthropic.ts` and one resulting implicit-any error). No package was installed.

The brief restricts this round to data, the checker and docs; the new bank is ready for the course builder's registration step.
