# Library round 29 progress

Based on the Round 29 brief on `origin/main`, Oct 12 2026. Work on `codex/library-round-29`; local category commits only.

## Category rewrites

Each fit is authored for its topic. The examples are new classroom utterances, rather than copies of discussion angles. Kids' conditionals use the first conditional.

- Rewrote **animals**: 20 topics, 40 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **earth and space**: 15 topics, 30 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **weather and nature**: 10 topics, 20 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **everyday life**: 15 topics, 30 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **play and creativity**: 20 topics, 40 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **digital life**: 15 topics, 45 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **culture and relationships**: 15 topics, 45 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **school and work**: 15 topics, 45 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **science and environment**: 15 topics, 45 individually authored fits. Existing library checks passed before the category commit.

- Rewrote **wellbeing and adventure**: 10 topics, 30 individually authored fits. Existing library checks passed before the category commit.

## Final checker counts

- Topics: **150/150**; fits: **370** (kids **160**, teens **210**).
- Present simple: **21/150 (14%)**, below 35%; question forms: **8/150 (5.33%)**, below 20%.
- Targets used on at least eight topics: **15**, above the required ten.
- Repeated reasons: **0**; repeated examples: **0**; form errors: **0**; kids target/conditional errors: **0**. The library validator reports no errors.

| Target | Kids | Teens | Total |
| --- | ---: | ---: | ---: |
| comparatives & superlatives | 28 | 11 | 39 |
| conditional | 17 | 35 | 52 |
| future (going to) | 20 | 4 | 24 |
| future (will) | 11 | 1 | 12 |
| future continuous | 0 | 5 | 5 |
| passive voice | 0 | 31 | 31 |
| past continuous | 0 | 11 | 11 |
| past perfect | 0 | 13 | 13 |
| past simple | 27 | 6 | 33 |
| present continuous | 29 | 0 | 29 |
| present perfect | 0 | 37 | 37 |
| present perfect continuous | 0 | 11 | 11 |
| present simple | 21 | 0 | 21 |
| question forms | 7 | 1 | 8 |
| relative clause | 0 | 23 | 23 |
| reported speech | 0 | 21 | 21 |

## Validation

- `npx tsx scripts/validate-library.ts`: passed, **1,388** items across **28** library files, plus the Round 29 counts above.
- `npx tsx scripts/validate-grammar-fits-regressions.ts`: passed. Rejects 16 invalid form fixtures, repeated reasons/examples, invalid kids conditional, both frequency caps, and insufficient target diversity. Includes the reviewed fossil sentence and the old sunrise/sunset preference prompt.
- `pnpm test src/lib`: **88** files and **397** tests passed.
- `npx tsc --noEmit -p .`: three unchanged errors in `src/lib/ai/providers/anthropic.ts`: unresolved `@anthropic-ai/sdk` imports at lines 1 and 32 (TS2307), and the resulting implicit `any` at line 53 (TS7006). No errors in the Round 29 files; no packages installed.

## Ten sample topics

### 1. Cats (kids)

- **present simple** — Tell a partner about a pet cat's daily habits. Example: “My cat sleeps on the sofa every afternoon.”
- **present continuous** — Describe what a cat is doing in a picture. Example: “The cat is hiding under the chair.”

### 2. Fossils (kids)

- **past simple** — Explain how you discovered a fossil. Example: “I found a small fossil beside the river.”
- **question forms** — Interview someone about a fossil discovery. Example: “Where did you find this fossil?”

### 3. Rain (kids)

- **future (will)** — Make a simple weather prediction from clouds. Example: “I think it will rain after lunch.”
- **conditional** — Connect rain with a plan for outdoor play. Example: “If it rains, we will play inside.”

### 4. Classroom Rules (kids)

- **conditional** — Explain the consequence of a classroom choice. Example: “If everyone talks together, we will miss the instructions.”
- **past simple** — Describe how the class agreed on a rule. Example: “We agreed to put our books away after reading.”

### 5. Musical Instruments (kids)

- **present continuous** — Describe who is playing each instrument in a band. Example: “Sam is playing the drum and I am playing the flute.”
- **comparatives & superlatives** — Compare the sounds of two instruments. Example: “The drum is louder than the flute.”

### 6. Artificial Intelligence (teens)

- **reported speech** — Report an AI claim before checking its source. Example: “The tool said the book was written in Japan.”
- **passive voice** — Explain how examples become an AI tool's training material. Example: “The model is trained on many examples of text.”
- **conditional** — Discuss when you would reject an AI answer. Example: “If the answer had no source, I would check it elsewhere.”

### 7. Friendship (teens)

- **present perfect** — Describe promises kept or broken in a friendship. Example: “I have kept every promise I made to my friend.”
- **reported speech** — Relay a friend's explanation after a misunderstanding. Example: “Aisha said she felt left out of our plans.”
- **conditional** — Explain what you would do to rebuild a friendship. Example: “If my friend felt ignored, I would invite her to talk.”

### 8. Future Jobs (teens)

- **future continuous** — Imagine tasks people will be doing in a future workplace. Example: “In ten years, nurses will be using different tools at work.”
- **conditional** — Discuss how automation might change a career choice. Example: “If machines handled routine tasks, I would focus on helping people.”
- **relative clause** — Describe a future job through the skills it requires. Example: “A job that needs human judgment may change without disappearing.”

### 9. Inventions (teens)

- **past simple** — Tell how an invention solved an earlier problem. Example: “The inventor built a tool that helped people carry water.”
- **passive voice** — Explain an invention's materials or production process. Example: “The handle is made from recycled plastic.”
- **relative clause** — Specify an invention through the problem it solves. Example: “An invention that saves water could help this garden.”

### 10. Mysteries and Clues (teens)

- **past perfect** — Place an earlier event on a mystery timeline. Example: “The visitor had left before the window broke.”
- **reported speech** — Compare a witness's account with other evidence. Example: “The witness said she had seen a red coat.”
- **past continuous** — Explain what someone was doing at the key moment. Example: “I was reading upstairs when I heard the crash.”

## Files changed

- `src/data/topic-briefings.json`
- `scripts/library-topic-briefings-validator.ts`
- `scripts/library-grammar-fits-validator.ts`
- `scripts/validate-grammar-fits-regressions.ts`
- `scripts/validate-library.ts`
- `docs/library-round-29-progress.md`
