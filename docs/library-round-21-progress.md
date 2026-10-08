# Library round 21 progress

2026-10-09 · Started `codex/library-round-21` from freshly fetched `origin/main`, after reporting Round 20. Read the Round 21 brief, the Junior mode concept, the sticker matcher and all 493 sticker words. The bank will contain 40 topic sets of 10 questions each: seven objective picture choices and three opinion choices per set. The validator checks IDs, sticker membership, option and answer integrity, prompt length, spoken text, duplicate questions, answer-position balance and the opinion share.

Batch 1: 10 sets, 100 questions, 30 opinions (30.0%), 97 different sticker IDs used. The checker reports 0 in every category. Reviewed the first sets for single clear answers and replaced a packaging-dependent cereal clue.

Batch 2: 20 sets, 200 questions, 60 opinions (30.0%), 228 different sticker IDs used. The checker again reports 0 in every category. Reviewed body, clothing, seasons, home, school and toy prompts for clear picture answers and age-appropriate wording.

Batch 3: 30 sets, 300 questions, 90 opinions (30.0%), 368 different sticker IDs used. The checker reports 0 in every category. Reviewed transport, places, jobs, family activities, actions, feelings, colors, sizes, party and sport clues. Corrected missing sticker IDs and prompts that implied more than the image shows.

Batch 4: completed 40 sets and 400 questions. The checker reports 120 opinion choices (30.0%), 404 different sticker IDs used, and **0 for every check**: bank size, set structure, duplicate IDs, sticker membership, duplicate options, answer validity, prompt length, duplicate prompt and option pairs, spoken text, answer-slot balance, and opinion mix. All 493 listed sticker IDs have drawn picture IDs. The 60 proposed missing words below were checked against the bank and none is present. `pnpm test src/lib` passed (84 files, 386 tests). The new checker also passed a standalone TypeScript compile. Full `npx tsc --noEmit -p .` was run but has three existing diagnostics in `src/lib/ai/providers/anthropic.ts` because this worktree lacks the declared `@anthropic-ai/sdk` package. No packages were installed.

## Missing sticker words for Junior classes

These 60 everyday words are absent from the 493-word sticker bank. They would make picture questions or spoken prompts clearer; `sticker-words.json` was not changed.

| Topic helped | Missing words |
| --- | --- |
| At the park | bench, seesaw, climbing frame, sandbox, merry-go-round |
| At the beach | seagull, lifebuoy, sunscreen, snorkel, beach towel |
| In the garden | seed, seedling, watering can, shovel, rake, hose, wheelbarrow |
| Body and health | bandage, thermometer, tissue, comb, hairbrush, wheelchair, hearing aid |
| Getting dressed | button, zipper, shoelace, slippers, mitten |
| School things | lunchbox, pencil case, folder, stapler, school bus |
| Transport | traffic light, crosswalk, seat belt, bus stop, ferry |
| Kitchen things | chopsticks, spatula, whisk, rolling pin, napkin, straw |
| Weather | raindrop, snowflake, icicle, fog |
| Family | stroller, high chair, bib, crib |
| Sports | goalpost, racket, baseball bat, surfboard |
| Farm animals | foal, calf, chick |
