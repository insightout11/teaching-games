# Library Round 34 progress

Branch: `codex/library-round-34`, off `origin/main` at `60d8d17764a5e0f622c43fc5be1c41cde6c13fc2`. Scope: the game-deck data, its validator, and this log.

The work completes Part B of the updated Round 33 brief: neighbouring Imposter situations, category hints, familiar Hot Seat targets, and distinct concrete Twenty Questions secrets. The original crew riddles are also rewritten where they cannot yield overlapping natural answers. Target words and approved descriptions are preserved where suitable.

The new validator uses word-level edit distance (insertions, deletions, substitutions) and requires at least three edits per question pair. It reports the 20 most similar reviewed pairs. It requires nine single-word Hot Seat targets per deck and excludes Taboo/Hot Seat targets and abstract activities from Twenty Questions. `--round34-count=N` checks the first N completed topics against the new rules while retaining all existing checks across all decks; the final run uses no review limit.

## Batch 1: cats through whales

- Rewrote all 90 imposter prompts and their crew prompts, and varied all 90 category hints. Questions now ask about neighboring situations with overlapping short answers rather than dictionary riddles.
- Rebuilt the 15 Hot Seat and Twenty Questions lists; every Hot Seat list has 14 single words, and no secret repeats its own deck's Taboo or Hot Seat targets.
- Preserved every previous checker rule. Added word-level edit distance (minimum 3), the single-word minimum, and secret separation. `--round34-count=15` checks these new rules on the authored prefix while retaining all older checks across all 150 decks. Final validation uses no prefix flag.
- `npx tsx scripts/validate-topic-game-decks.ts --round34-count=15`: all 19 error counts **0**. Global target cap and deck overlap pass.
- Editorial overlap examples: pet-tray cleaning / sandy-doorway cleaning (brush, bag, bucket); pony-ride clothing / chilly cycling clothing (boots, gloves, helmet); winter shelter / cold-night tent (blanket, bedding, heater). These are examples of possible spoken answers, not fixed answer keys.

## Batch 2: sharks through earthquakes

- Rewrote 90 more crew/imposter pairs and hints; replaced phrase-heavy Hot Seat lists and separated all 120 secrets from their decks' targets.
- Overlap examples: telescope viewing / outdoor photography (clear sky, steady hands, light); fossil tools / shell collecting (brush, bag, magnifying glass); earthquake falling objects / bumped-table objects (cup, books, lamp).
- `npx tsx scripts/validate-topic-game-decks.ts --round34-count=30`: all 19 error counts **0**, including the four-topic cap across the full bank.

## Batch 3: mountains through plant growth

- Rewrote all 90 pairs and hints; checked each as a standalone question. Examples of overlapping answers: mountain peak / city tower views (roads, buildings, hills); rainy street / street-cleaning truck (pavement, cars, shoes); seed planting / garden bulb placement (pot, garden bed, soil).
- Kept established phrases such as mountain goat, pine tree and hair dryer; replaced ad hoc modifiers and added single-word targets. All 120 secrets are separated from their own decks' Taboo/Hot Seat lists.
- The first `--round34-count=45` run had one remaining `lowestLevel` error in Rainforests. It was committed before that result was checked; the follow-up replaces pod with accessible A1 seed and reruns the checker. No history rewrite.
`--round34-count=45` after the correction: all 19 error counts 0.

## Batch 4: cooking through jobs people do

Rewrote 90 pairs and hints; reviewed 210 Hot Seat targets and separated 120 secrets. Overlap examples: lunchbox / picnic basket (sandwich, fruit, drink); cupcake / ice cream toppings (chocolate, fruit, sprinkles); doctor / nurse supplies (bandage, thermometer, notes). Checker with --round34-count=60: all 19 error counts 0.

## Batch 5: soccer through airplanes

Rewrote 90 pairs and hints, reviewed 210 Hot Seat targets, and separated 120 secrets. Examples: platform / bus stop activities (read, wait, talk); goalkeeper / muddy-match clothes (gloves, boots, shirt); board game / jigsaw nearby objects (box, table, chair). Checker with --round34-count=75: all 19 error counts 0.

## Batch 6: boats through robots and automation

Rewrote 90 pairs and category hints, reviewed 210 Hot Seat targets, and separated 120 secrets. Overlap examples: streamer / podcast equipment (headset, microphone, camera); recipe / AI prompt instructions (steps, quantities, desired result); ferry / bus waiting (read, talk, check time). Checker with --round34-count=90: all 19 error counts 0.

## Batch 7: virtual reality through personal style

Rewrote 90 pairs and hints, reviewed 210 Hot Seat targets and separated 120 secrets. Examples: film script / play notes (dialogue, actions, scene); VR controller / gamepad comfort (grip, size, weight); music genre / film style descriptions (fast, calm, dramatic). Checker with --round34-count=105: all 19 error counts 0.

## Batch 8: food culture through public speaking

Rewrote 90 pairs and hints, reviewed 210 Hot Seat targets and separated 120 secrets. Examples: customer / product-user feedback (price, quality, usability); fixed bills / planned household payments (rent, subscriptions, insurance); speech opening / club welcome (greeting, purpose, names). Corrected the existing broken encoding of sauté in the cooking Taboo list. Checker with --round34-count=120: all 19 error counts 0.

## Batch 9: study habits through satellites

Rewrote 90 pairs and hints, reviewed 210 Hot Seat targets, and separated 120 secrets. Examples: space station / submarine chores (clean, cook, check equipment); climate-model / past-weather records (rainfall, temperature, dates); course catalogue / school prospectus (subjects, requirements, dates). Distinct familiar targets replace generic words that exceeded the global cap. Checker with --round34-count=135: all 19 error counts 0.

## Batch 10: inventions through travel planning

- Rewrote the final 90 pairs and hints; completed all 150 decks.
- Ordinary targets replace made-up modifiers: blister, fleece, signpost, mug, helpline, gratitude and reservation. Retained fixed phrases include walking pole, sleeping bag, rain barrel and resistance band.
- Overlap examples: used clothes / donated books shopping (charity shop, market, website); witness / accident observer details (time, place, people); passport holder / travel folder papers (tickets, bookings, insurance).
- Corrected the existing Zebra calf error to foal in Taboo and Imposter; used mare in Hot Seat to preserve target separation. This is an editorial correction, not a new card.
- Removed the temporary authoring-prefix flag from the checker. New checks now apply to the whole bank on every run.
- Final `npx tsx scripts/validate-topic-game-decks.ts`: all 19 error counts **0**.

Final editorial review also replaced descriptive labels such as mother turtle, wool hat, caption box, score clock, career map and coin tray with ordinary words. Retained phrases were checked as established names, species, fixed expressions or familiar equipment.

## Final replacement counts (against origin/main)

- hotSeat: **1367 old targets replaced** with targets not previously in that deck’s list; 1647 card positions have a changed target. Moving a retained target is counted only in the second figure.
- twentyQuestions: **1192 old targets replaced** with targets not previously in that deck’s list; 1199 card positions have a changed target. Moving a retained target is counted only in the second figure.
- crewQuestion: **900/900 changed**.
- imposterQuestion: **900/900 changed**.
- hint: **900/900 changed**.
- 897 distinct category hints; the most repeated occurs three times. No “everyday objects” hint remains.

## Validation

- Full deck checker: **passed**, all 19 error counts **0**.
- Library validator: **passed**, 1,388 items across 28 files.
- `pnpm test src/lib src/data`: **422 tests passed across 95 files**; rerun after final editorial changes.
- `npx tsc --noEmit -p .`: **failed** with the existing missing `@anthropic-ai/sdk` dependency (TS2307 at `src/lib/ai/providers/anthropic.ts:1,32`) and resulting implicit-any parameter (TS7006 at line 53). No errors reported in the edited files. No dependency installation or unrelated provider edits.
- Negative checker fixtures outside the repo: a one-word-swap question, a deck with eight single-word Hot Seat entries, and a repeated secret each exit 1 with its respective new error count equal to 1. The repo bank was not modified for those fixtures.
- Only the approved three files changed. No push, merge or history rewrite.

## Checker output

```text
Topic decks: 150/150; kids 80, teens 70.
Cards by level: A1 1702, A2 1658, B1 2278, B2 662.
kids: A1 1702, A2 1658.
teens: B1 2278, B2 662.
Sticker matches: 418 unique words, 1166 target/decoy occurrences.
Round 34: imposter rounds 900; single-word Hot Seat targets 1804/2100; minimum per deck 9; separated Twenty Questions secrets 1200/1200.
Maximum target overlap: 33.33% (topic-kids-the-moon / topic-kids-planets).
Deck checks: missing 0, unknown 0, duplicateDeck 0, ageBand 0, cardCount 0, badCard 0, level 0, lowestLevel 0, forbidden 0, description 0, repeatedTabooHotSeat 0, imposter 0, longPhrase 0, singleWordHotSeat 0, repeatedSecret 0, questionDifference 0, overusedWord 0, similarDeck 0.
```

## Twenty most similar question pairs

```text
topic-kids-dolphins.imposter[4]: 40.0% similar; 6 word edits; crew: What shapes might you add to a dolphin drawing? / imposter: Which shapes would you use to make a paper boat?
topic-kids-horses.imposter[1]: 40.0% similar; 6 word edits; crew: What might you notice about a young foal? / imposter: What would you tell a friend about a newborn puppy?
topic-kids-rockets.imposter[0]: 40.0% similar; 6 word edits; crew: What would you check before a rocket launch? / imposter: Which things would you inspect before a long airplane flight?
topic-teens-esports.imposter[4]: 40.0% similar; 6 word edits; crew: What advice could a coach give before a match? / imposter: Which reminders might a club leader give before a show?
topic-teens-part-time-jobs.imposter[3]: 40.0% similar; 6 word edits; crew: What advice might a supervisor give a new worker? / imposter: Which reminders could a club organizer give a new member?
topic-kids-cats.imposter[1]: 37.5% similar; 5 word edits; crew: What helps you feel calm with a pet? / imposter: What makes you comfortable before a nap?
topic-kids-clouds.imposter[0]: 37.5% similar; 5 word edits; crew: What shapes could you see in clouds? / imposter: Which shapes might you spot in crumpled paper?
topic-kids-cycling.imposter[1]: 37.5% similar; 5 word edits; crew: What might you attach to a handlebar? / imposter: Which objects could you fix to a scooter?
topic-kids-making-friends.imposter[5]: 37.5% similar; 5 word edits; crew: What would you take to a playdate? / imposter: Which items might you bring to a sleepover?
topic-kids-basketball.imposter[4]: 33.3% similar; 6 word edits; crew: What might you check before a basketball game? / imposter: Which things would you inspect before a volleyball match?
topic-kids-cats.imposter[5]: 33.3% similar; 6 word edits; crew: What could you make from colorful yarn? / imposter: What gift could you create with strips of paper?
topic-kids-dogs.imposter[5]: 33.3% similar; 6 word edits; crew: When might you offer a dog a treat? / imposter: What occasions make you give a friend a reward?
topic-kids-festivals-around-the-world.imposter[0]: 33.3% similar; 6 word edits; crew: What would you bring to an outdoor festival? / imposter: Which items would you take to a crowded concert?
topic-kids-festivals-around-the-world.imposter[5]: 33.3% similar; 6 word edits; crew: What might you buy at a food stall? / imposter: Which snacks could you find at a picnic market?
topic-kids-painting.imposter[0]: 33.3% similar; 6 word edits; crew: What might you clean after using a paintbrush? / imposter: Which objects would you wash after decorating a cake?
topic-kids-snow.imposter[3]: 33.3% similar; 6 word edits; crew: What would you check before a sled ride? / imposter: Which checks would you make before using a scooter?
topic-kids-snow.imposter[5]: 33.3% similar; 6 word edits; crew: When would you wear a scarf outdoors? / imposter: Which weather would make you bring a warm hat?
topic-teens-internet-memes.imposter[0]: 33.3% similar; 6 word edits; crew: What might make a meme funny to friends? / imposter: Which details could make a cartoon entertaining to classmates?
topic-teens-part-time-jobs.imposter[1]: 33.3% similar; 6 word edits; crew: What would you check on a pay slip? / imposter: Which figures might you compare on a bank statement?
topic-teens-songwriting.imposter[0]: 33.3% similar; 6 word edits; crew: What story could you tell in a verse? / imposter: Which moments might you describe in a diary entry?
```

## Four full target-list samples

### topic-kids-cats

- Hot Seat: nap, window, blanket, basket, paw, collar, tail, tongue, carrier, chasing, stretching, brushing, owner, hiding.
- Twenty Questions: tuna, hamster, milk, cushion, bedroom, pet shop, curtain, vet.

### topic-kids-mountains

- Hot Seat: hat, backpack, tent, walking, map, mountain goat, ledge, pine tree, cliff, hill, village, altitude, summit, snowshoe.
- Twenty Questions: cable car, eagle, marmot, ibex, ski lift, hostel, walking stick, thermos.

### topic-teens-entrepreneurship

- Hot Seat: pitch deck, sample, mentor, market stall, logo, survey, price list, online shop, budget, business card, order, storefront, meeting, package.
- Twenty Questions: shop, warehouse, till, receipt, van, entrepreneur, barcode, product.

### topic-teens-outdoor-adventures

- Hot Seat: walking pole, dry bag, lantern, blister, sock, fleece, signpost, mug, rock pool, viewpoint, insect repellent, head torch, campground, orienteering.
- Twenty Questions: canyon, sleeping bag, hammock, pine, campsite, guide, campfire, kayak.

## Files changed

- `src/data/topic-game-decks.json`: question pairs, category hints, targets, matching descriptions and two factual/encoding corrections.
- `scripts/validate-topic-game-decks.ts`: mandatory question edit distance, single-word minimum, secret separation and report metrics.
- `docs/library-round-34-progress.md`: batch results, replacement counts, checks and samples.
