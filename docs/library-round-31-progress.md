# Library round 31 progress

Topic-by-topic spoken-game decks, written on `codex/library-round-31` from `origin/main`, Oct 12 2026. Each deck has 14 Taboo cards, 14 distinct Hot Seat cards, eight Imposter pairs and eight Twenty Questions secrets. Kids use A1/A2; teens use B1/B2.

## Batches

Cards are authored individually. A serialization helper only formats the explicitly written words, forbidden lists, pairs, secrets, kinds and level tags; it supplies no card content. The partial checker validates completed decks while allowing the next topics to be absent.
- Batch 1: 15 animal topics (Cats through Whales), 660 cards. Partial checker: all errors 0; A1 280, A2 380; 70 unique sticker matches, 202 occurrences. Beginner forbidden lists use simple familiar words.
- Batch 2: Sharks through Earthquakes, 30 topics total / 1,320 cards. Partial checker: all errors 0; A1 541, A2 779. Simplified technical forbidden clues and kept lunar dust specific to its topic.

- Batch 3: 15 nature and plant topics (Deserts through Plant Growth), 45 topics total / 1,980 cards. Partial checker: all errors 0; A1 849, A2 1,131; 182 unique sticker matches, 626 target/decoy occurrences. The fifth-topic reuse check passed after replacing generic foliage, rain gear and water-side targets.

- Batch 4: 15 food, school and community topics (Cooking through Jobs People Do), 60 topics total / 2,640 cards. Partial checker: all errors 0; kids A1 1,284, A2 1,356; 253 unique sticker matches, 773 target/decoy occurrences.

- Batch 5: 20 sports, play, transport and creative topics (Soccer through The Five Senses), 80 topics total / 3,520 cards. Partial checker: all errors 0; kids A1 1,880, A2 1,640; 286 unique sticker matches, 858 target/decoy occurrences. Targets remain below 40% deck overlap; the highest observed overlap is 22.86%.

- Batch 6: 15 digital-life topics (Video Games through Robots and Automation), 95 topics total / 4,180 cards. Partial checker: all errors 0; kids A1 1,880, A2 1,640; teens B1 257, B2 183; 286 unique sticker matches, 859 target/decoy occurrences.

- Batch 7: Virtual Reality through Digital Art complete. Total 95 topics / 4,180 cards; partial checker: all errors 0; teens B1 387 and B2 273. Progress count correction: Batch 6 added 10 topics (Video Games through Robots and Automation), taking the total to 90; Batch 7 added five more.

- Batch 8: 15 culture, music and language topics (Friendship through Local Traditions), 110 topics total / 4,840 cards. Partial checker: all errors 0; kids A1 1,880, A2 1,640; teens B1 814, B2 506; 288 unique sticker matches, 866 target/decoy occurrences.
