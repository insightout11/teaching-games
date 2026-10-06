# Library round 14 progress

2026-10-06 · Task 1 · Added five Static rounds to each of the 60 listening packs (300 total). Each selected sentence was checked against the locally stored captions inside its pack's `listeningWindow`; the target occurs once, the spoken text changes that word, and four phone options come from the displayed sentence. Added validator rules for count, length, single-word swap, spoken reconstruction, option membership and answer index. The authoring selections and caption verifier are in `scripts/library-round-14-static-selections.json` and `scripts/apply-library-round-14-static.ts`. Validator: 1,380 items across 28 files; 519 Flight Questions, 80 Speak situations, 60 listening packs, 180 segments, 180 gist, 60 harder, 300 words, 300 Static rounds (kids A1–A2 22, B1 22, B2 16); 60 debate motions and 120 evidence facts. `pnpm test src/lib`: 72 files, 348 tests passed. TypeScript passed after narrowing a validator value.

Tasks 2 and 3 pending.
