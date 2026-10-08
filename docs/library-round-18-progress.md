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

Batch 3 (10 weather and nature topics): added separate briefing material, subject vocabulary, and student speech. Remaining audit counts: 245/237/39/20/245/0; all 45 rewritten topics pass their individual checks.

Batch 4 (15 everyday topics): rewrote food, school, family, festivals and jobs. Remaining audit counts: 200/204/37/15/200/0; all 60 rewritten topics pass their individual checks.

Batch 5 (20 play and creativity topics): rewrote sports, games, transport and arts. All 80 kids' topics now have new copy. Remaining counts are 140/144/17/11/142/0. Two rewritten levels still trigger the 80%-fact speech check; I will locate and fix those in final editorial QA.

Batch 6 (15 digital life topics): wrote distinct B1 and B2 briefings and student speech for games, online life, technology and digital art. Remaining counts: 110/116/2/9/112/0.

Batch 7 (15 culture and relationships topics): rewrote friendship, music, film, style, food and travel customs. Remaining counts: 80/86/0/8/82/0. I replaced a time-sensitive word in the local traditions example before committing.

Batch 8 (15 school and work topics): rewrote study, work, money, volunteering and career material. Remaining writing audit counts: 50/62/0/6/52/0. The separate time-sensitive wording warnings were corrected in the authoring source.

Batch 9 (15 science and environment topics): rewrote climate, energy, transport, space and resource topics. Remaining writing audit counts: 20/32/0/4/22/0.
