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
