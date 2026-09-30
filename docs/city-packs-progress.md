# City packs progress

## Batch 1 — Bangkok, Tokyo, Paris, Cairo, Rio de Janeiro

- Added five packs and 25 souvenirs: exactly one land item, one mode item, two distinct challenges, and one rare item per city.
- Clues 1–4 avoid named travel-anchor attractions and famous named geographic features; Paris clue 4 and Cairo clue 3 were revised after owner review.
- `npx tsx scripts/validate-city-packs.ts --batch 1` passes: 5 / 50 cities present, 25 souvenirs, 4 packs marked `needsReview`.
- Review flags: Thai pronunciations (Bangkok), French pronunciations (Paris), Egyptian Arabic words and pronunciations (Cairo), and Rio Portuguese pronunciation (Rio de Janeiro). Tokyo's Japanese phrases are unflagged.
- Owner approved the tone with the two revisions above; batch 1 is ready and authorized to commit.
- Commit: `8d4e1567` (`Add validated city packs batch 1`).

## Batch 2 — Seoul, Singapore, London, New York, Dubai

- Added five packs and 25 souvenirs, with the required 1 land, 1 mode, 2 distinct challenges, and 1 rare reward per city.
- `npx tsx scripts/validate-city-packs.ts --batch 2` passes: 10 / 50 cities present, 25 souvenirs in this batch, 3 packs marked `needsReview`.
- Review flags: Korean phrase pronunciation (Seoul), Singapore English/Singlish usage (Singapore), and Arabic wording/pronunciation in Emirati usage (Dubai). London and New York wording is unflagged.
- Commit: `733717b2` (`Add validated city packs batch 2`).

## Batch 3 — Sydney, Beijing, Shanghai, Berlin, Moscow

- Added five packs and 25 souvenirs, each with the required reward mix.
- `npx tsx scripts/validate-city-packs.ts --batch 3` passes: 15 / 50 cities present, 25 souvenirs in this batch, 5 packs marked `needsReview`.
- Review flags: Australian English local expressions (Sydney), Mandarin tones/pronunciation (Beijing and Shanghai), and German (Berlin) and Russian (Moscow) pronunciation/wording.
- Commit: pending validation and commit.
