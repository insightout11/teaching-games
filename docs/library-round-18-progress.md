# Library round 18 progress

2026-10-07 · Started `codex/library-round-18` from `origin/main` after reading the Round 18 brief and the Live Room Focus route. No runtime route changes are in scope.

Task 1: selected 150 evergreen topics: 80 for kids and 70 for teens. The bank includes animals, habitats, Earth and space, weather, food, school, play, music, sport, digital life, relationships, jobs, culture, environment, wellbeing, and travel. Each entry has a stable ID, category, age band, and teacher-typed aliases. Briefings follow in Task 2.

Task 1 committed as `162618db` (150 topics and 596 distinct aliases).

Task 2: wrote reviewed source facts and discussion questions for every topic, then built each required Focus shape: 3–4 briefing sentences, four facts, three discussion questions, seven vocabulary cards, and six expression stems. The first three topic vocabulary words are sourced from its fact sentences. Kids have A1/A2/B1 versions; teens have B1/B2 versions. B2 joins related facts into longer sentence structures. Added the topic bank to `scripts/validate-library.ts`, with exact counts, duplicate checks, field checks, A1/A2 word limits, vocabulary presence, and time-sensitive wording checks. The validator passes with 150 topics (80 kids, 70 teens) and 380 levels (A1 80, A2 80, B1 150, B2 70). `pnpm test src/lib` passed 374 tests in 78 files. TypeScript passes.

Editorial follow-up: replaced two shared category vocabulary cards per A2–B2 briefing with facts-based terms specific to that topic. Those levels now have the title term, five topic terms, and one category term among their seven cards. A1 retains simpler discussion words. Added a validator check against repeated words within one level's vocabulary list.

## Round 19 rework

The Round 19 brief on `origin/main` rejected the writing quality while retaining the topic list and structure. I added failing checks before rewriting. Baseline counts: briefing/fact overlap 380 levels; title or alias vocabulary 378 cards; blocklisted generic vocabulary 87 cards; vocabulary used in more than four topics 32 words; expression/fact overlap 380 levels; identical fact or briefing sentences across topics 0. All six counts must be zero before handoff.

Batch 1 (20 animal topics): rewrote the three kids levels with new briefing material, seven subject words, and student speech examples rather than fact recitations. Corrected the shark discussion prompt. Remaining audit counts: 320/318/87/28/320/0 in the order above; the 20 rewritten topics pass their individual field and sentence checks.

Batch 2 (15 Earth and space topics): added independent briefing details, subject vocabulary and student speech. Simplified the dinosaur and volcano prompts. Remaining audit counts: 275/267/39/23/275/0; all 35 rewritten topics pass their individual checks.
