# City packs progress

## Batch 1 — Bangkok, Tokyo, Paris, Cairo, Rio de Janeiro

- Added five packs and 25 souvenirs: exactly one land item, one mode item, two distinct challenges, and one rare item per city.
- Clues 1–4 avoid named travel-anchor attractions and famous named geographic features; Paris clue 4 and Cairo clue 3 were revised after owner review.
- `npx tsx scripts/validate-city-packs.ts --batch 1` passes: 5 / 50 cities present, 25 souvenirs, 4 packs marked `needsReview`.
- Review flags: Thai pronunciations (Bangkok), French pronunciations (Paris), Egyptian Arabic words and pronunciations (Cairo), and Rio Portuguese pronunciation (Rio de Janeiro). Tokyo's Japanese phrases are unflagged.
- Owner approved the tone with the two revisions above; batch 1 is ready and authorized to commit.
