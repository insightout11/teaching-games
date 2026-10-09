# Library round 27 progress

Branch: `codex/library-round-27` from `origin/main`; local task commits only.

## Task 1 — topic links

Added `topicIds` to all 110 existing Speak situations. 72 have a reviewed link to at least one matching briefing; 38 broad situations have an empty array. The checker verifies the field, uniqueness, and real briefing IDs. Course tasks remain 22/22, Junior Speak remains 30/30, and every current Speak checker count is zero.

## Task 2 — complete briefing coverage

Added 61 reviewed situations: 37 kids (A1–A2) and 24 teens (B1–B2), with 12 of the new teen rows at B2. Each new row carries its topic title as a runtime search tag and its briefing IDs; scenes that cover more than one topic name each one in the situation. The bank now has 171 situations (77 kids, 64 teens, 30 junior), and the new checker reports **150/150 age-matched briefing topics covered**, 133/171 situations linked, and every check at zero. The library validator also passes with 171 Speak situations.

## Task 3 — review the original 80

Reviewed all 80 original kids/teens situations against the Round 11 reply rules. Fixed 11 replies in 11 situations:

- Made natural replies sound like a child or teen: `speak-kids-weather-plan`, `speak-r12-kids-cinema-choice`, `speak-r12-teens-project-deadline`.
- Corrected the phone handoff to answer the caller's request: `speak-r12-kids-phone-answer`.
- Replaced too-plausible, adult-sounding distractors with clearly wrong responses: `speak-teens-weather-event`, `speak-teens-doctor-symptom`, `speak-teens-travel-delay`, `speak-teens-weekend-conflict`, `speak-r12-teens-home-energy`, `speak-r12-teens-compliment-idea`.
- Made the natural shift swap request idiomatic: `speak-r12-teens-job-shift`.

Checker totals: **171 situations** (kids 77: A1 35/A2 42; teens 64: A2 5/B1 33/B2 26; junior 30: A1 30). The 24 new teen rows split B1 12/B2 12. **150/150 briefing topics** have an age-matched situation; **80/80 originals** retained and reviewed. The Speak checker and library validator pass with every Speak check at zero.

Final checks: the library validator passes (1,388 items across 28 files); both Junior picture validators have all checks at zero (61 question sets / 610 questions; 61 stories, 51 short / 10 standard); `pnpm test src/lib` passes (88 files, 396 tests). `npx tsc --noEmit -p .` reports only the checkout's missing declared `@anthropic-ai/sdk` dependency (two TS2307 errors and one related TS7006 in `src/lib/ai/providers/anthropic.ts`); it reports no Round 27 file errors. No packages were installed.
