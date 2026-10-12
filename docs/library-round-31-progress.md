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

- Batch 9: 15 school, money, work and speaking topics (Exams through Career Skills), 125 topics total / 5,500 cards. Partial checker: all errors 0; kids A1 1,880, A2 1,640; teens B1 1,300, B2 680; 290 unique sticker matches, 872 target/decoy occurrences.

- Batch 10: 15 climate, transport, space and invention topics (Climate Change through Water Conservation), 140 topics total / 6,160 cards. Partial checker: all errors 0; kids A1 1,880, A2 1,640; teens B1 1,722, B2 918; 293 unique sticker matches, 878 target/decoy occurrences.

## Complete-bank check and report samples

- Final full validator: all checks 0; 150/150 decks; 80 kids, 70 teens.
- Cards by level: A1 1,880; A2 1,640; B1 2,056; B2 1,024 (6,600 total).
- Sticker matches: 293 unique words, 878 target/decoy occurrences.
- Maximum target overlap: 22.86% (Giraffes / Zebras).
- Six full sample decks follow. The final two are general-interest topic examples; the schema assigns all topics to kids or teens.

### Kids sample 1: topic-kids-cats

```json
{
  "topicId": "topic-kids-cats",
  "ageBand": "kids",
  "taboo": [
    {
      "word": "cat",
      "forbidden": [
        "animal",
        "pet",
        "sleep",
        "mouse"
      ],
      "level": "A1"
    },
    {
      "word": "kitten",
      "forbidden": [
        "baby",
        "small",
        "soft",
        "play"
      ],
      "level": "A1"
    },
    {
      "word": "cat treat",
      "forbidden": [
        "food",
        "small",
        "pet",
        "give"
      ],
      "level": "A1"
    },
    {
      "word": "box",
      "forbidden": [
        "open",
        "inside",
        "hide",
        "paper"
      ],
      "level": "A1"
    },
    {
      "word": "sofa",
      "forbidden": [
        "seat",
        "home",
        "soft",
        "sit"
      ],
      "level": "A1"
    },
    {
      "word": "purr",
      "forbidden": [
        "sound",
        "quiet",
        "happy",
        "pet"
      ],
      "level": "A2"
    },
    {
      "word": "whiskers",
      "forbidden": [
        "hair",
        "face",
        "nose",
        "long"
      ],
      "level": "A2"
    },
    {
      "word": "claw",
      "forbidden": [
        "sharp",
        "nail",
        "scratch",
        "foot"
      ],
      "level": "A2"
    },
    {
      "word": "fur",
      "forbidden": [
        "hair",
        "soft",
        "coat",
        "animal"
      ],
      "level": "A2"
    },
    {
      "word": "cat flap",
      "forbidden": [
        "door",
        "outside",
        "inside",
        "pet"
      ],
      "level": "A2"
    },
    {
      "word": "scratching post",
      "forbidden": [
        "claw",
        "wood",
        "tall",
        "pet"
      ],
      "level": "A2"
    },
    {
      "word": "mouse toy",
      "forbidden": [
        "play",
        "catch",
        "small",
        "pet"
      ],
      "level": "A1"
    },
    {
      "word": "litter tray",
      "forbidden": [
        "toilet",
        "sand",
        "clean",
        "pet"
      ],
      "level": "A2"
    },
    {
      "word": "yarn",
      "forbidden": [
        "string",
        "ball",
        "wool",
        "play"
      ],
      "level": "A2"
    }
  ],
  "hotSeat": [
    {
      "word": "nap",
      "level": "A1"
    },
    {
      "word": "sunny window",
      "level": "A1"
    },
    {
      "word": "soft blanket",
      "level": "A1"
    },
    {
      "word": "basket",
      "level": "A1"
    },
    {
      "word": "paw",
      "level": "A2"
    },
    {
      "word": "collar",
      "level": "A1"
    },
    {
      "word": "tail",
      "level": "A1"
    },
    {
      "word": "tongue",
      "level": "A2"
    },
    {
      "word": "cat carrier",
      "level": "A2"
    },
    {
      "word": "chasing",
      "level": "A2"
    },
    {
      "word": "stretching",
      "level": "A2"
    },
    {
      "word": "brushing",
      "level": "A2"
    },
    {
      "word": "pet carer",
      "level": "A2"
    },
    {
      "word": "hiding",
      "level": "A1"
    }
  ],
  "imposter": [
    {
      "word": "cat",
      "decoy": "kitten",
      "level": "A1"
    },
    {
      "word": "purr",
      "decoy": "meow",
      "level": "A2"
    },
    {
      "word": "claw",
      "decoy": "paw",
      "level": "A2"
    },
    {
      "word": "fur",
      "decoy": "whiskers",
      "level": "A2"
    },
    {
      "word": "cat carrier",
      "decoy": "cat bed",
      "level": "A2"
    },
    {
      "word": "scratch",
      "decoy": "rub",
      "level": "A2"
    },
    {
      "word": "mouse toy",
      "decoy": "ball",
      "level": "A1"
    },
    {
      "word": "litter tray",
      "decoy": "food bowl",
      "level": "A2"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "cat",
      "kind": "animal",
      "level": "A1"
    },
    {
      "secret": "kitten",
      "kind": "animal",
      "level": "A1"
    },
    {
      "secret": "cat treat",
      "kind": "food",
      "level": "A1"
    },
    {
      "secret": "cat carrier",
      "kind": "thing",
      "level": "A2"
    },
    {
      "secret": "scratching post",
      "kind": "thing",
      "level": "A2"
    },
    {
      "secret": "sofa",
      "kind": "thing",
      "level": "A1"
    },
    {
      "secret": "cat bed",
      "kind": "thing",
      "level": "A1"
    },
    {
      "secret": "chasing",
      "kind": "activity",
      "level": "A2"
    }
  ]
}
```

### Kids sample 2: topic-kids-rainbows

```json
{
  "topicId": "topic-kids-rainbows",
  "ageBand": "kids",
  "taboo": [
    {
      "word": "rainbow",
      "forbidden": [
        "colour",
        "sky",
        "drizzle",
        "arc"
      ],
      "level": "A1"
    },
    {
      "word": "prism",
      "forbidden": [
        "glass",
        "light",
        "colour",
        "triangle"
      ],
      "level": "A2"
    },
    {
      "word": "raindrop",
      "forbidden": [
        "water",
        "fall",
        "wet",
        "cloud"
      ],
      "level": "A1"
    },
    {
      "word": "sunbeam",
      "forbidden": [
        "light",
        "warm",
        "bright",
        "sky"
      ],
      "level": "A1"
    },
    {
      "word": "red",
      "forbidden": [
        "colour",
        "apple",
        "stop",
        "fire"
      ],
      "level": "A1"
    },
    {
      "word": "orange",
      "forbidden": [
        "colour",
        "fruit",
        "carrot",
        "red"
      ],
      "level": "A1"
    },
    {
      "word": "yellow",
      "forbidden": [
        "colour",
        "banana",
        "sun",
        "bright"
      ],
      "level": "A1"
    },
    {
      "word": "green",
      "forbidden": [
        "colour",
        "grass",
        "leaf",
        "blue"
      ],
      "level": "A1"
    },
    {
      "word": "blue",
      "forbidden": [
        "colour",
        "sky",
        "water",
        "green"
      ],
      "level": "A1"
    },
    {
      "word": "violet",
      "forbidden": [
        "purple",
        "colour",
        "flower",
        "blue"
      ],
      "level": "A2"
    },
    {
      "word": "reflection",
      "forbidden": [
        "mirror",
        "light",
        "see",
        "water"
      ],
      "level": "A2"
    },
    {
      "word": "waterfall mist",
      "forbidden": [
        "spray",
        "sprinkler",
        "white",
        "cool"
      ],
      "level": "A2"
    },
    {
      "word": "arc",
      "forbidden": [
        "shape",
        "curve",
        "bridge",
        "circle"
      ],
      "level": "A2"
    },
    {
      "word": "colour band",
      "forbidden": [
        "line",
        "red",
        "blue",
        "light"
      ],
      "level": "A2"
    }
  ],
  "hotSeat": [
    {
      "word": "indigo",
      "level": "A2"
    },
    {
      "word": "spectrum",
      "level": "A2"
    },
    {
      "word": "sun shower",
      "level": "A2"
    },
    {
      "word": "soap bubble",
      "level": "A1"
    },
    {
      "word": "glass prism",
      "level": "A2"
    },
    {
      "word": "garden hose",
      "level": "A1"
    },
    {
      "word": "sprinkler",
      "level": "A1"
    },
    {
      "word": "water spray",
      "level": "A1"
    },
    {
      "word": "mirror",
      "level": "A1"
    },
    {
      "word": "colour wheel",
      "level": "A2"
    },
    {
      "word": "sunlight",
      "level": "A1"
    },
    {
      "word": "rainbow trout",
      "level": "A2"
    },
    {
      "word": "colouring pencil",
      "level": "A1"
    },
    {
      "word": "light ray",
      "level": "A2"
    }
  ],
  "imposter": [
    {
      "word": "prism",
      "decoy": "mirror",
      "level": "A1"
    },
    {
      "word": "rainbow",
      "decoy": "colour wheel",
      "level": "A2"
    },
    {
      "word": "red",
      "decoy": "orange",
      "level": "A1"
    },
    {
      "word": "sunbeam",
      "decoy": "lightning",
      "level": "A1"
    },
    {
      "word": "mist",
      "decoy": "spray",
      "level": "A1"
    },
    {
      "word": "reflection",
      "decoy": "shadow",
      "level": "A2"
    },
    {
      "word": "arc",
      "decoy": "circle",
      "level": "A1"
    },
    {
      "word": "spectrum",
      "decoy": "rainbow arc",
      "level": "A2"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "soap bubble",
      "kind": "thing",
      "level": "A1"
    },
    {
      "secret": "prism",
      "kind": "thing",
      "level": "A2"
    },
    {
      "secret": "sprinkler",
      "kind": "thing",
      "level": "A1"
    },
    {
      "secret": "mirror",
      "kind": "thing",
      "level": "A1"
    },
    {
      "secret": "colouring pencil",
      "kind": "thing",
      "level": "A1"
    },
    {
      "secret": "sunlight",
      "kind": "thing",
      "level": "A1"
    },
    {
      "secret": "rainbow trout",
      "kind": "animal",
      "level": "A2"
    },
    {
      "secret": "waterfall mist",
      "kind": "thing",
      "level": "A2"
    }
  ]
}
```

### Teens sample 1: topic-teens-video-games

```json
{
  "topicId": "topic-teens-video-games",
  "ageBand": "teens",
  "taboo": [
    {
      "word": "avatar",
      "forbidden": [
        "player",
        "character",
        "screen",
        "choose"
      ],
      "level": "B1"
    },
    {
      "word": "level",
      "forbidden": [
        "stage",
        "harder",
        "progress",
        "up"
      ],
      "level": "B1"
    },
    {
      "word": "controller",
      "forbidden": [
        "buttons",
        "console",
        "hold",
        "play"
      ],
      "level": "B1"
    },
    {
      "word": "multiplayer",
      "forbidden": [
        "friends",
        "online",
        "together",
        "team"
      ],
      "level": "B1"
    },
    {
      "word": "quest",
      "forbidden": [
        "task",
        "mission",
        "complete",
        "game"
      ],
      "level": "B2"
    },
    {
      "word": "save point",
      "forbidden": [
        "pause",
        "progress",
        "return",
        "place"
      ],
      "level": "B2"
    },
    {
      "word": "open world",
      "forbidden": [
        "map",
        "explore",
        "free",
        "game"
      ],
      "level": "B2"
    },
    {
      "word": "power-up",
      "forbidden": [
        "extra",
        "ability",
        "collect",
        "boost"
      ],
      "level": "B1"
    },
    {
      "word": "respawn",
      "forbidden": [
        "again",
        "after",
        "lose",
        "return"
      ],
      "level": "B2"
    },
    {
      "word": "cutscene",
      "forbidden": [
        "story",
        "watch",
        "play",
        "video"
      ],
      "level": "B2"
    },
    {
      "word": "scoreboard",
      "forbidden": [
        "points",
        "rank",
        "players",
        "show"
      ],
      "level": "B1"
    },
    {
      "word": "boss fight",
      "forbidden": [
        "final",
        "enemy",
        "hard",
        "beat"
      ],
      "level": "B1"
    },
    {
      "word": "download",
      "forbidden": [
        "internet",
        "install",
        "file",
        "game"
      ],
      "level": "B1"
    },
    {
      "word": "gaming session",
      "forbidden": [
        "time",
        "play",
        "group",
        "online"
      ],
      "level": "B1"
    }
  ],
  "hotSeat": [
    {
      "word": "headset mic",
      "level": "B1"
    },
    {
      "word": "game menu",
      "level": "B1"
    },
    {
      "word": "loading screen",
      "level": "B1"
    },
    {
      "word": "multiplayer lobby",
      "level": "B2"
    },
    {
      "word": "health bar",
      "level": "B1"
    },
    {
      "word": "checkpoint",
      "level": "B1"
    },
    {
      "word": "game server",
      "level": "B2"
    },
    {
      "word": "controller cable",
      "level": "B1"
    },
    {
      "word": "voice chat",
      "level": "B1"
    },
    {
      "word": "ranked match",
      "level": "B2"
    },
    {
      "word": "game update",
      "level": "B1"
    },
    {
      "word": "pixel art",
      "level": "B1"
    },
    {
      "word": "game soundtrack",
      "level": "B1"
    },
    {
      "word": "player profile",
      "level": "B1"
    }
  ],
  "imposter": [
    {
      "word": "avatar",
      "decoy": "player skin",
      "level": "B1"
    },
    {
      "word": "quest",
      "decoy": "mission",
      "level": "B1"
    },
    {
      "word": "multiplayer",
      "decoy": "co-op",
      "level": "B2"
    },
    {
      "word": "open world",
      "decoy": "sandbox game",
      "level": "B2"
    },
    {
      "word": "power-up",
      "decoy": "bonus item",
      "level": "B1"
    },
    {
      "word": "respawn",
      "decoy": "reload",
      "level": "B2"
    },
    {
      "word": "boss fight",
      "decoy": "final level",
      "level": "B1"
    },
    {
      "word": "checkpoint",
      "decoy": "save point",
      "level": "B1"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "game controller",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "gaming headset",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "health bar",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "game server",
      "kind": "thing",
      "level": "B2"
    },
    {
      "secret": "game menu",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "player profile",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "ranked match",
      "kind": "activity",
      "level": "B2"
    },
    {
      "secret": "game soundtrack",
      "kind": "thing",
      "level": "B1"
    }
  ]
}
```

### Teens sample 2: topic-teens-healthy-eating

```json
{
  "topicId": "topic-teens-healthy-eating",
  "ageBand": "teens",
  "taboo": [
    {
      "word": "balanced meal",
      "forbidden": [
        "food",
        "plate",
        "groups",
        "healthy"
      ],
      "level": "B1"
    },
    {
      "word": "whole grain",
      "forbidden": [
        "bread",
        "cereal",
        "fibre",
        "brown"
      ],
      "level": "B1"
    },
    {
      "word": "portion size",
      "forbidden": [
        "amount",
        "serve",
        "plate",
        "how much"
      ],
      "level": "B1"
    },
    {
      "word": "protein source",
      "forbidden": [
        "beans",
        "fish",
        "eggs",
        "nutrient"
      ],
      "level": "B1"
    },
    {
      "word": "food label",
      "forbidden": [
        "package",
        "read",
        "ingredients",
        "information"
      ],
      "level": "B1"
    },
    {
      "word": "added sugar",
      "forbidden": [
        "sweet",
        "extra",
        "drink",
        "ingredient"
      ],
      "level": "B1"
    },
    {
      "word": "hydration",
      "forbidden": [
        "water",
        "drink",
        "body",
        "fluid"
      ],
      "level": "B1"
    },
    {
      "word": "meal routine",
      "forbidden": [
        "time",
        "regular",
        "eat",
        "day"
      ],
      "level": "B1"
    },
    {
      "word": "nutrient",
      "forbidden": [
        "food",
        "body",
        "vitamin",
        "need"
      ],
      "level": "B1"
    },
    {
      "word": "fibre",
      "forbidden": [
        "digest",
        "whole grain",
        "plants",
        "food"
      ],
      "level": "B2"
    },
    {
      "word": "food variety",
      "forbidden": [
        "different",
        "colour",
        "groups",
        "choose"
      ],
      "level": "B1"
    },
    {
      "word": "mindful eating",
      "forbidden": [
        "slow",
        "notice",
        "hunger",
        "taste"
      ],
      "level": "B2"
    },
    {
      "word": "snack choice",
      "forbidden": [
        "between meals",
        "food",
        "select",
        "small"
      ],
      "level": "B1"
    },
    {
      "word": "nutrition guideline",
      "forbidden": [
        "advice",
        "food",
        "health",
        "official"
      ],
      "level": "B2"
    }
  ],
  "hotSeat": [
    {
      "word": "lunch plate",
      "level": "B1"
    },
    {
      "word": "ingredient list",
      "level": "B1"
    },
    {
      "word": "water glass",
      "level": "B1"
    },
    {
      "word": "fruit bowl",
      "level": "B1"
    },
    {
      "word": "portion scoop",
      "level": "B1"
    },
    {
      "word": "food pyramid",
      "level": "B1"
    },
    {
      "word": "meal planner",
      "level": "B1"
    },
    {
      "word": "nutrition chart",
      "level": "B2"
    },
    {
      "word": "wholegrain loaf",
      "level": "B1"
    },
    {
      "word": "snack box",
      "level": "B1"
    },
    {
      "word": "salad bowl",
      "level": "B1"
    },
    {
      "word": "measuring cup",
      "level": "B1"
    },
    {
      "word": "food diary",
      "level": "B1"
    },
    {
      "word": "grocery basket",
      "level": "B1"
    }
  ],
  "imposter": [
    {
      "word": "balanced meal",
      "decoy": "complete meal",
      "level": "B1"
    },
    {
      "word": "whole grain",
      "decoy": "whole wheat",
      "level": "B1"
    },
    {
      "word": "protein source",
      "decoy": "protein food",
      "level": "B1"
    },
    {
      "word": "added sugar",
      "decoy": "natural sugar",
      "level": "B2"
    },
    {
      "word": "nutrient",
      "decoy": "vitamin",
      "level": "B1"
    },
    {
      "word": "fibre",
      "decoy": "roughage",
      "level": "B2"
    },
    {
      "word": "food variety",
      "decoy": "diet diversity",
      "level": "B2"
    },
    {
      "word": "mindful eating",
      "decoy": "intuitive eating",
      "level": "B2"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "lunch plate",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "ingredient list",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "water glass",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "fruit bowl",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "food pyramid",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "meal planner",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "nutrition chart",
      "kind": "thing",
      "level": "B2"
    },
    {
      "secret": "grocery basket",
      "kind": "thing",
      "level": "B1"
    }
  ]
}
```

### General-interest sample 1: topic-teens-cooking-skills

```json
{
  "topicId": "topic-teens-cooking-skills",
  "ageBand": "teens",
  "taboo": [
    {
      "word": "knife skills",
      "forbidden": [
        "cut",
        "blade",
        "chop",
        "safe"
      ],
      "level": "B1"
    },
    {
      "word": "mise en place",
      "forbidden": [
        "prepare",
        "ingredients",
        "station",
        "before"
      ],
      "level": "B2"
    },
    {
      "word": "sauté",
      "forbidden": [
        "pan",
        "oil",
        "quick",
        "stir"
      ],
      "level": "B2"
    },
    {
      "word": "seasoning",
      "forbidden": [
        "salt",
        "pepper",
        "flavour",
        "add"
      ],
      "level": "B1"
    },
    {
      "word": "food safety",
      "forbidden": [
        "clean",
        "temperature",
        "raw",
        "protect"
      ],
      "level": "B1"
    },
    {
      "word": "temperature",
      "forbidden": [
        "heat",
        "degree",
        "measure",
        "hot"
      ],
      "level": "B1"
    },
    {
      "word": "portion",
      "forbidden": [
        "amount",
        "plate",
        "serve",
        "size"
      ],
      "level": "B1"
    },
    {
      "word": "emulsify",
      "forbidden": [
        "mix",
        "oil",
        "water",
        "sauce"
      ],
      "level": "B2"
    },
    {
      "word": "reduce",
      "forbidden": [
        "sauce",
        "boil",
        "thicken",
        "less"
      ],
      "level": "B2"
    },
    {
      "word": "cross-contamination",
      "forbidden": [
        "raw",
        "clean",
        "food",
        "transfer"
      ],
      "level": "B2"
    },
    {
      "word": "substitute",
      "forbidden": [
        "replace",
        "ingredient",
        "change",
        "recipe"
      ],
      "level": "B1"
    },
    {
      "word": "mise en place bowl",
      "forbidden": [
        "measure",
        "prepare",
        "ingredients",
        "small"
      ],
      "level": "B2"
    },
    {
      "word": "garnish",
      "forbidden": [
        "top",
        "decorate",
        "herbs",
        "finish"
      ],
      "level": "B1"
    },
    {
      "word": "texture",
      "forbidden": [
        "crunch",
        "soft",
        "feel",
        "mouth"
      ],
      "level": "B1"
    }
  ],
  "hotSeat": [
    {
      "word": "chef's knife",
      "level": "B1"
    },
    {
      "word": "chopping board",
      "level": "B1"
    },
    {
      "word": "kitchen scale",
      "level": "B1"
    },
    {
      "word": "meat thermometer",
      "level": "B2"
    },
    {
      "word": "mixing spoon",
      "level": "B1"
    },
    {
      "word": "paring knife",
      "level": "B2"
    },
    {
      "word": "measuring jug",
      "level": "B1"
    },
    {
      "word": "prep station",
      "level": "B2"
    },
    {
      "word": "ingredient list",
      "level": "B1"
    },
    {
      "word": "pantry shelf",
      "level": "B1"
    },
    {
      "word": "oven timer",
      "level": "B1"
    },
    {
      "word": "food processor",
      "level": "B1"
    },
    {
      "word": "saucepan lid",
      "level": "B1"
    },
    {
      "word": "serving plate",
      "level": "B1"
    }
  ],
  "imposter": [
    {
      "word": "sauté",
      "decoy": "fry",
      "level": "B2"
    },
    {
      "word": "seasoning",
      "decoy": "spice",
      "level": "B1"
    },
    {
      "word": "emulsify",
      "decoy": "blend",
      "level": "B2"
    },
    {
      "word": "reduce",
      "decoy": "thicken",
      "level": "B2"
    },
    {
      "word": "garnish",
      "decoy": "plating",
      "level": "B2"
    },
    {
      "word": "knife skills",
      "decoy": "cutting technique",
      "level": "B1"
    },
    {
      "word": "portion",
      "decoy": "serving",
      "level": "B1"
    },
    {
      "word": "food safety",
      "decoy": "kitchen hygiene",
      "level": "B2"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "chef's knife",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "chopping board",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "kitchen scale",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "meat thermometer",
      "kind": "thing",
      "level": "B2"
    },
    {
      "secret": "prep station",
      "kind": "place",
      "level": "B2"
    },
    {
      "secret": "ingredient list",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "food processor",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "saucepan lid",
      "kind": "thing",
      "level": "B1"
    }
  ]
}
```

### General-interest sample 2: topic-teens-travel-planning

```json
{
  "topicId": "topic-teens-travel-planning",
  "ageBand": "teens",
  "taboo": [
    {
      "word": "itinerary",
      "forbidden": [
        "trip",
        "plan",
        "days",
        "route"
      ],
      "level": "B1"
    },
    {
      "word": "travel budget",
      "forbidden": [
        "money",
        "cost",
        "spend",
        "plan"
      ],
      "level": "B1"
    },
    {
      "word": "booking confirmation",
      "forbidden": [
        "email",
        "hotel",
        "reservation",
        "proof"
      ],
      "level": "B1"
    },
    {
      "word": "departure time",
      "forbidden": [
        "leave",
        "when",
        "train",
        "flight"
      ],
      "level": "B1"
    },
    {
      "word": "connection",
      "forbidden": [
        "change",
        "transfer",
        "route",
        "wait"
      ],
      "level": "B1"
    },
    {
      "word": "travel document",
      "forbidden": [
        "passport",
        "visa",
        "identity",
        "carry"
      ],
      "level": "B1"
    },
    {
      "word": "accommodation",
      "forbidden": [
        "hotel",
        "stay",
        "room",
        "book"
      ],
      "level": "B1"
    },
    {
      "word": "travel insurance",
      "forbidden": [
        "cover",
        "pay",
        "emergency",
        "trip"
      ],
      "level": "B1"
    },
    {
      "word": "packing list",
      "forbidden": [
        "items",
        "bag",
        "check",
        "clothes"
      ],
      "level": "B1"
    },
    {
      "word": "exchange rate",
      "forbidden": [
        "currency",
        "money",
        "compare",
        "conversion"
      ],
      "level": "B2"
    },
    {
      "word": "local transport",
      "forbidden": [
        "bus",
        "train",
        "city",
        "ride"
      ],
      "level": "B1"
    },
    {
      "word": "backup plan",
      "forbidden": [
        "change",
        "problem",
        "alternative",
        "ready"
      ],
      "level": "B1"
    },
    {
      "word": "arrival time",
      "forbidden": [
        "reach",
        "when",
        "land",
        "destination"
      ],
      "level": "B1"
    },
    {
      "word": "travel advisory",
      "forbidden": [
        "warning",
        "government",
        "safety",
        "place"
      ],
      "level": "B2"
    }
  ],
  "hotSeat": [
    {
      "word": "passport holder",
      "level": "B1"
    },
    {
      "word": "train timetable",
      "level": "B1"
    },
    {
      "word": "hotel booking",
      "level": "B1"
    },
    {
      "word": "airport map",
      "level": "B1"
    },
    {
      "word": "travel adapter",
      "level": "B1"
    },
    {
      "word": "packing cube",
      "level": "B1"
    },
    {
      "word": "currency card",
      "level": "B1"
    },
    {
      "word": "route planner",
      "level": "B1"
    },
    {
      "word": "reservation number",
      "level": "B1"
    },
    {
      "word": "boarding gate",
      "level": "B1"
    },
    {
      "word": "city transit pass",
      "level": "B1"
    },
    {
      "word": "emergency contact card",
      "level": "B1"
    },
    {
      "word": "weather forecast",
      "level": "B1"
    },
    {
      "word": "day bag",
      "level": "B1"
    }
  ],
  "imposter": [
    {
      "word": "itinerary",
      "decoy": "schedule",
      "level": "B1"
    },
    {
      "word": "travel budget",
      "decoy": "trip budget",
      "level": "B1"
    },
    {
      "word": "booking confirmation",
      "decoy": "reservation email",
      "level": "B1"
    },
    {
      "word": "connection",
      "decoy": "transfer",
      "level": "B1"
    },
    {
      "word": "accommodation",
      "decoy": "lodging",
      "level": "B1"
    },
    {
      "word": "exchange rate",
      "decoy": "conversion rate",
      "level": "B2"
    },
    {
      "word": "backup plan",
      "decoy": "contingency plan",
      "level": "B2"
    },
    {
      "word": "travel advisory",
      "decoy": "safety notice",
      "level": "B2"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "passport holder",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "train timetable",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "hotel booking",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "airport map",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "travel adapter",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "packing cube",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "currency card",
      "kind": "thing",
      "level": "B1"
    },
    {
      "secret": "route planner",
      "kind": "thing",
      "level": "B1"
    }
  ]
}
```

- Batch 11: final 10 wellbeing, mystery and travel topics (Team Sports through Travel Planning), 150 topics total / 6,600 cards. Full validator: all checks 0; 80 kids, 70 teens; A1 1,880, A2 1,640, B1 2,056, B2 1,024; 293 unique sticker matches / 878 occurrences; maximum overlap 22.86%.
- Verification: `pnpm test src/lib` passed (88 files, 399 tests). `npx tsx scripts/validate-topic-game-decks.ts` passed with every reported check at 0. `npx tsc --noEmit -p .` still reports only the existing missing `@anthropic-ai/sdk` declarations and resulting implicit-any error in `src/lib/ai/providers/anthropic.ts`; the Round 31 validator itself is ES5-compatible. No dependencies were installed.
- All work is local on `codex/library-round-31`; no push or merge.
