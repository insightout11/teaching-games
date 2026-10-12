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
