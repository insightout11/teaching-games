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
- Commit: `cad8986b` (`Add validated city packs batch 3`).

## Batch 4 — Istanbul, Vancouver, Toronto, Mumbai, Cape Town

- Added five packs and 25 souvenirs, each with the required reward mix.
- Clues 1–4 use generic climate, food, daily-life, and nature details; named travel-anchor places are reserved for later clues.
- `npx tsx scripts/validate-city-packs.ts --batch 4` passes: 20 / 50 cities present, 25 souvenirs in this batch, 5 packs marked `needsReview`.
- Review flags: Turkish pronunciations (Istanbul), Canadian English local wording (Vancouver and Toronto), Marathi phrases (Mumbai), and South African English expressions (Cape Town).
- Commit: `9571b53f` (`Add validated city packs batch 4`).

## Batch 5 — Rome, Mexico City, Buenos Aires, Los Angeles, Jakarta

- Added five packs and 25 souvenirs, each with the required reward mix.
- `npx tsx scripts/validate-city-packs.ts --batch 5` passes: 25 / 50 cities present, 25 souvenirs in this batch, 5 packs marked `needsReview`.
- Review flags: Italian pronunciation (Rome), Mexican Spanish pronunciation (Mexico City), Rioplatense Spanish wording (Buenos Aires), regional English expressions (Los Angeles), and Indonesian pronunciation (Jakarta).
- Commit: `be23f4d8` (`Add validated city packs batch 5`).

## Batch 6 — Lagos, Hong Kong, Amsterdam, Honolulu, Miami

- Added five packs and 25 souvenirs, each with the required reward mix.
- `npx tsx scripts/validate-city-packs.ts --batch 6` passes: 30 / 50 cities present, 25 souvenirs in this batch, 5 packs marked `needsReview`.
- Review flags: Nigerian Pidgin (Lagos), Cantonese (Hong Kong), Dutch pronunciation (Amsterdam), Hawaiian spelling/pronunciation and cultural framing (Honolulu), and Miami Spanish/local coffee terms (Miami).
- Commit: `ab9eb4a8` (`Add validated city packs batch 6`).

## Batch 7 — Bogota, Reykjavik, Nairobi, Lima, Perth

- Added five packs and 25 souvenirs, each with the required reward mix.
- `npx tsx scripts/validate-city-packs.ts --batch 7` passes: 35 / 50 cities present, 25 souvenirs in this batch, 5 packs marked `needsReview`.
- Review flags: Colombian Spanish (Bogota), Icelandic pronunciation (Reykjavik), Swahili usage/pronunciation (Nairobi), Peruvian Spanish pronunciation (Lima), and Australian English expressions (Perth).
- Commit: `43b4e051` (`Add validated city packs batch 7`).

## Batch 8 — Auckland, Suva, Ulaanbaatar, Almaty, Madrid

- Added five packs and 25 souvenirs, each with the required reward mix.
- `npx tsx scripts/validate-city-packs.ts --batch 8` passes: 40 / 50 cities present, 25 souvenirs in this batch, 5 packs marked `needsReview`.
- Review flags: Māori and New Zealand regional expressions (Auckland), Fijian vocabulary (Suva), Mongolian transliteration (Ulaanbaatar), Kazakh wording (Almaty), and Spain Spanish usage (Madrid).
- Commit: pending validation and commit.

## Batch 9 — Lisbon, Dublin, Dakar, Recife, Panama City

- Added five packs and 25 souvenirs, each with the required reward mix.
- `npx tsx scripts/validate-city-packs.ts --batch 9` passes: 45 / 50 cities present, 25 souvenirs in this batch, 5 packs marked `needsReview`.
- Review flags: European Portuguese (Lisbon), Irish English (Dublin), Wolof (Dakar), Brazilian Portuguese (Recife), and Panamanian Spanish (Panama City).
- Commit: pending validation and commit.
