# Library round 18 progress

2026-10-07 · Started `codex/library-round-18` from `origin/main` after reading the Round 18 brief and the Live Room Focus route. No runtime route changes are in scope.

Task 1: selected 150 evergreen topics: 80 for kids and 70 for teens. The bank includes animals, habitats, Earth and space, weather, food, school, play, music, sport, digital life, relationships, jobs, culture, environment, wellbeing, and travel. Each entry has a stable ID, category, age band, and teacher-typed aliases. Briefings follow in Task 2.

Task 1 committed as `162618db` (150 topics and 596 distinct aliases).

Task 2: wrote reviewed source facts and discussion questions for every topic, then built each required Focus shape: 3–4 briefing sentences, four facts, three discussion questions, seven vocabulary cards, and six expression stems. The first three topic vocabulary words are sourced from its fact sentences. Kids have A1/A2/B1 versions; teens have B1/B2 versions. B2 joins related facts into longer sentence structures. Added the topic bank to `scripts/validate-library.ts`, with exact counts, duplicate checks, field checks, A1/A2 word limits, vocabulary presence, and time-sensitive wording checks. The validator passes with 150 topics (80 kids, 70 teens) and 380 levels (A1 80, A2 80, B1 150, B2 70). `pnpm test src/lib` passed 374 tests in 78 files. TypeScript passes.

Editorial follow-up: replaced two shared category vocabulary cards per A2–B2 briefing with facts-based terms specific to that topic. Those levels now have the title term, five topic terms, and one category term among their seven cards. A1 retains simpler discussion words. Added a validator check against repeated words within one level's vocabulary list.
