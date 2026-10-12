# Library round 31 progress

Topic-by-topic spoken-game decks, written on `codex/library-round-31` from `origin/main`, Oct 12 2026. Each deck has 14 Taboo cards, 14 distinct Hot Seat cards, eight Imposter pairs and eight Twenty Questions secrets. Kids use A1/A2; teens use B1/B2.

## Batches

Cards are authored individually. A serialization helper only formats the explicitly written words, forbidden lists, pairs, secrets, kinds and level tags; it supplies no card content. The partial checker validates completed decks while allowing the next topics to be absent.
- Batch 1: 15 animal topics (Cats through Whales), 660 cards. Partial checker: all errors 0; A1 280, A2 380; 70 unique sticker matches, 202 occurrences. Beginner forbidden lists use simple familiar words.
