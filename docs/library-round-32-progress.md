# Library Round 32 progress

Branch: `codex/library-round-32`, created from `origin/main`.

## Batch 1 — Cats through Koalas (10 topics)

Added learner-friendly meanings to Taboo and Hot Seat, replaced hard-to-guess clues, and added six spoken Imposter rounds per deck. Partial checks pass. The validator listed 49 two-word Hot Seat / Twenty Questions entries for a manual skim.

## Batch 2 — Kangaroos through Whales (5 topics)

Completed five kids' animal decks. Partial checks pass for all 15 updated decks; the validator listed 105 two-word Hot Seat / Twenty Questions entries.

## Batch 3 — Sharks through Earthquakes (15 topics)

Completed Sharks, Sea Turtles, Frogs, Butterflies, Bees, Dinosaurs, Fossils, The Moon, The Sun, Planets, Stars, Rockets, Astronauts, Volcanoes, and Earthquakes. Partial checks pass for 30 updated decks. Cumulative changes from `origin/main`: 158 Hot Seat targets and 18 Twenty Questions secrets.

## Batch 4 — Mountains through Plant Growth (15 topics)

Completed Mountains, Rivers, Oceans, Coral Reefs, Rainforests, Deserts, Forests, Seasons, Rain, Snow, Wind, Clouds, Rainbows, Water Cycle, and Plant Growth. Partial checks pass for 45 updated decks. Cumulative changes: 178 Hot Seat and 19 Twenty Questions entries.

## Batch 5 — Cooking through Jobs People Do (15 topics)

Completed Cooking, Baking, Fruits, Vegetables, Breakfast, School Lunch, Caring for Pets, School Day, Classroom Rules, Making Friends, Family Traditions, Birthday Parties, Festivals Around the World, Holidays, and Jobs People Do. Partial checks pass for 60 updated decks. Cumulative changes: 191 Hot Seat and 22 Twenty Questions entries.

## Batch 6 — Soccer through Airplanes (15 topics)

Completed Soccer, Basketball, Swimming, Cycling, Running, Dancing, Board Games, Puzzles, Building Blocks, Kites, Playgrounds, Superheroes, Robots, Trains, and Airplanes. Partial checks pass for 75 updated decks. Cumulative changes: 220 Hot Seat and 25 Twenty Questions entries.

## Batch 7 — Boats through Robots and Automation (15 topics)

Completed Boats, Musical Instruments, Drawing, Painting, The Five Senses, Video Games, Game Design, Esports, Social Media, Online Privacy, Screen Time, Digital Footprints, Internet Memes, Artificial Intelligence, and Robots and Automation. Partial checks pass for 90 updated decks. This batch changed 21 Hot Seat and 5 Twenty Questions entries; cumulative changes: 241 and 30.

## Batch 8 — Virtual Reality through Personal Style (15 topics)

Completed Virtual Reality, Coding, Cybersecurity, Online Learning, Digital Art, Friendship, Peer Pressure, Teamwork, Music Genres, Live Music, Songwriting, Film Genres, Film Making, Fashion, and Personal Style. Partial checks pass for 105 updated decks. This batch changed 11 Hot Seat and 8 Twenty Questions entries; cumulative changes: 252 and 38.

## Batch 9 — Food Culture through Public Speaking (15 topics)

Completed Food Culture, Cooking Skills, Language Learning, Travel Etiquette, Local Traditions, Exams, Homework, School Clubs, Part-Time Jobs, Future Jobs, Entrepreneurship, Money and Saving, Budgeting, Volunteering, and Public Speaking. Partial checks pass for 120 updated decks. This batch changed 5 Hot Seat and 3 Twenty Questions entries; cumulative changes: 257 and 41.

The validator checks card counts and levels, descriptions and target-word forms, forbidden-word overlap, duplicate Taboo/Hot Seat cards, six Imposter fields and question quality, phrase lengths, overused targets, and similar decks. Imposter questions must use WH starters and end in `?`. Partial checks report zero failures across the 120 updated decks. Final counts and four complete sample decks will be added once all 150 decks are complete.

## Batch 10 — Study Habits through Satellites (15 topics)

Completed Study Habits, Sleep and Learning, Choosing Subjects, Gap Years, Career Skills, Climate Change, Renewable Energy, Plastic Waste, Wildlife Conservation, Urban Nature, Public Transport, Cities of the Future, Space Exploration, Mars Missions, and Satellites. Partial checks pass for 135 updated decks. Batch and cumulative replacement counts will be entered from the comparison with `origin/main`.

## Batch 11 — Inventions through Travel Planning (15 topics)

Completed Inventions, Medical Technology, Food Waste, Sustainable Fashion, Water Conservation, Team Sports, Solo Sports, Fitness, Outdoor Adventures, Mysteries and Clues, Unexplained Places, Optical Illusions, Healthy Eating, Stress Management, and Travel Planning. This final batch replaced 20 Hot Seat targets and 6 Twenty Questions secrets. All 150 decks now have six Imposter rounds; the complete validator passes.

## Final validator and checks

- Decks: 150/150 (80 kids, 70 teens).
- Cards by level: A1 1,935; A2 1,425; B1 2,115; B2 825.
- Sticker matches: 276 unique words; 776 target/decoy occurrences.
- Two-word Hot Seat / Twenty Questions entries reported for review: 2,463.
- Against `origin/main`, changed 286 Hot Seat targets and 49 Twenty Questions secrets.
- Validator errors: missing 0, unknown 0, duplicate decks 0, age band 0, card count 0, bad cards 0, level 0, lowest level 0, forbidden 0, description 0, repeated Taboo/Hot Seat 0, Imposter 0, long phrase 0, overused word 0, similar deck 0.
- `pnpm test src/lib`: 92 files and 410 tests passed.
- `npx tsc --noEmit -p .`: passed.

## Complete sample decks

These complete objects show two kids' decks and two teens' decks.

### topic-kids-cats

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
      "level": "A1",
      "description": "a small pet that purrs beside people"
    },
    {
      "word": "kitten",
      "forbidden": [
        "baby",
        "small",
        "soft",
        "play"
      ],
      "level": "A1",
      "description": "a very young animal with tiny paws"
    },
    {
      "word": "cat treat",
      "forbidden": [
        "food",
        "small",
        "pet",
        "give"
      ],
      "level": "A1",
      "description": "a little snack you give to a pet"
    },
    {
      "word": "box",
      "forbidden": [
        "open",
        "inside",
        "hide",
        "paper"
      ],
      "level": "A1",
      "description": "a square container with an open top"
    },
    {
      "word": "sofa",
      "forbidden": [
        "seat",
        "home",
        "soft",
        "sit"
      ],
      "level": "A1",
      "description": "a soft seat that fits several people"
    },
    {
      "word": "purr",
      "forbidden": [
        "sound",
        "quiet",
        "happy",
        "pet"
      ],
      "level": "A2",
      "description": "a low happy sound made in the throat"
    },
    {
      "word": "whiskers",
      "forbidden": [
        "hair",
        "face",
        "nose",
        "long"
      ],
      "level": "A2",
      "description": "long hairs growing beside an animal's nose"
    },
    {
      "word": "claw",
      "forbidden": [
        "sharp",
        "nail",
        "scratch",
        "foot"
      ],
      "level": "A2",
      "description": "a sharp curved nail on a foot"
    },
    {
      "word": "fur",
      "forbidden": [
        "hair",
        "soft",
        "coat",
        "animal"
      ],
      "level": "A2",
      "description": "a soft coat covering an animal's body"
    },
    {
      "word": "cat flap",
      "forbidden": [
        "door",
        "outside",
        "inside",
        "pet"
      ],
      "level": "A2",
      "description": "a small door pets push through"
    },
    {
      "word": "scratching post",
      "forbidden": [
        "claw",
        "wood",
        "tall",
        "pet"
      ],
      "level": "A2",
      "description": "a tall surface pets rake with claws"
    },
    {
      "word": "mouse toy",
      "forbidden": [
        "play",
        "catch",
        "small",
        "pet"
      ],
      "level": "A1",
      "description": "a tiny plaything shaped like a rodent"
    },
    {
      "word": "litter tray",
      "forbidden": [
        "toilet",
        "sand",
        "clean",
        "pet"
      ],
      "level": "A2",
      "description": "a shallow pan kept for a pet"
    },
    {
      "word": "yarn",
      "forbidden": [
        "string",
        "ball",
        "wool",
        "play"
      ],
      "level": "A2",
      "description": "long soft thread wound into a ball"
    }
  ],
  "hotSeat": [
    {
      "word": "nap",
      "level": "A1",
      "description": "a short rest taken during daytime"
    },
    {
      "word": "sunny window",
      "level": "A1",
      "description": "glass opening where warm light comes in"
    },
    {
      "word": "soft blanket",
      "level": "A1",
      "description": "a warm cover you can wrap around yourself"
    },
    {
      "word": "basket",
      "level": "A1",
      "description": "an open container woven from strips"
    },
    {
      "word": "paw",
      "level": "A2",
      "description": "the soft foot at the end of a leg"
    },
    {
      "word": "collar",
      "level": "A1",
      "description": "a band that fits around an animal's neck"
    },
    {
      "word": "tail",
      "level": "A1",
      "description": "the long part extending behind an animal"
    },
    {
      "word": "tongue",
      "level": "A2",
      "description": "a muscle in your mouth used to taste"
    },
    {
      "word": "cat carrier",
      "level": "A2",
      "description": "a travel box that safely holds a pet"
    },
    {
      "word": "chasing",
      "level": "A2",
      "description": "running after something that moves away"
    },
    {
      "word": "stretching",
      "level": "A2",
      "description": "reaching limbs to make your body feel loose"
    },
    {
      "word": "brushing",
      "level": "A2",
      "description": "using a comb to smooth an animal's coat"
    },
    {
      "word": "pet sitter",
      "level": "A2",
      "description": "someone who feeds your animal while you are away"
    },
    {
      "word": "hiding",
      "level": "A1",
      "description": "staying where others cannot easily see you"
    }
  ],
  "imposter": [
    {
      "word": "kitten",
      "level": "A1",
      "description": "a very young animal that needs gentle care",
      "hint": "a young pet",
      "crewQuestion": "What young animal drinks milk from its mother?",
      "imposterQuestion": "What young animal follows a mare across a field?"
    },
    {
      "word": "purr",
      "level": "A2",
      "description": "a soft rumbling sound made when content",
      "hint": "a happy sound",
      "crewQuestion": "What sound might a relaxed pet make beside you?",
      "imposterQuestion": "What sound might a dog make when greeting you?"
    },
    {
      "word": "mouse toy",
      "level": "A1",
      "description": "a small plaything shaped like a little rodent",
      "hint": "a pet toy",
      "crewQuestion": "What small thing might a house pet chase across a floor?",
      "imposterQuestion": "What small thing might a dog race to bring back?"
    },
    {
      "word": "cat flap",
      "level": "A2",
      "description": "a little door fitted into a larger door",
      "hint": "a home feature",
      "crewQuestion": "What opening lets a small pet come inside?",
      "imposterQuestion": "What opening might a dog use to enter a yard?"
    },
    {
      "word": "litter tray",
      "level": "A2",
      "description": "a shallow indoor pan kept for a household pet",
      "hint": "a pet item",
      "crewQuestion": "What pan might you clean for an indoor animal?",
      "imposterQuestion": "What bed might you prepare for an indoor animal?"
    },
    {
      "word": "yarn",
      "level": "A2",
      "description": "long soft thread wound into a round bundle",
      "hint": "a craft material",
      "crewQuestion": "What soft material might a pet bat across the room?",
      "imposterQuestion": "What soft material might someone use to knit a scarf?"
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
      "secret": "cat toy",
      "kind": "thing",
      "level": "A2"
    }
  ]
}
```

### topic-kids-zebras

```json
{
  "topicId": "topic-kids-zebras",
  "ageBand": "kids",
  "taboo": [
    {
      "word": "zebra",
      "forbidden": [
        "animal",
        "black",
        "white",
        "horse"
      ],
      "level": "A1",
      "description": "an animal with a striped coat"
    },
    {
      "word": "stripes",
      "forbidden": [
        "lines",
        "skin",
        "pattern",
        "coat"
      ],
      "level": "A2",
      "description": "long dark lines across a lighter surface"
    },
    {
      "word": "herd",
      "forbidden": [
        "group",
        "together",
        "animals",
        "walk"
      ],
      "level": "A2",
      "description": "a group of animals that travel together"
    },
    {
      "word": "grass",
      "forbidden": [
        "green",
        "plant",
        "eat",
        "field"
      ],
      "level": "A1",
      "description": "green plants growing across open ground"
    },
    {
      "word": "hoof",
      "forbidden": [
        "foot",
        "hard",
        "ground",
        "step"
      ],
      "level": "A2",
      "description": "a hard foot at the end of a leg"
    },
    {
      "word": "mane",
      "forbidden": [
        "hair",
        "neck",
        "back",
        "brush"
      ],
      "level": "A2",
      "description": "long hair growing along an animal's neck"
    },
    {
      "word": "dust",
      "forbidden": [
        "dry",
        "soil",
        "air",
        "brown"
      ],
      "level": "A1",
      "description": "fine dry earth blown through the air"
    },
    {
      "word": "river",
      "forbidden": [
        "water",
        "cross",
        "bank",
        "flow"
      ],
      "level": "A1",
      "description": "a long stream of water crossing land"
    },
    {
      "word": "grazing",
      "forbidden": [
        "eat",
        "plants",
        "head",
        "down"
      ],
      "level": "A2",
      "description": "eating plants while walking in a field"
    },
    {
      "word": "crossing",
      "forbidden": [
        "river",
        "other",
        "side",
        "walk"
      ],
      "level": "A2",
      "description": "a marked place where animals pass safely"
    },
    {
      "word": "calf",
      "forbidden": [
        "baby",
        "young",
        "mother",
        "small"
      ],
      "level": "A2",
      "description": "a young animal that stays near its mother"
    },
    {
      "word": "watering hole",
      "forbidden": [
        "drink",
        "pool",
        "animals",
        "dry"
      ],
      "level": "A2",
      "description": "a pool where wild animals come to drink"
    },
    {
      "word": "long face",
      "forbidden": [
        "nose",
        "head",
        "eyes",
        "shape"
      ],
      "level": "A1",
      "description": "a shape with a stretched muzzle"
    },
    {
      "word": "wild horse",
      "forbidden": [
        "ride",
        "stripes",
        "field",
        "animal"
      ],
      "level": "A2",
      "description": "a horse that lives freely outdoors"
    }
  ],
  "hotSeat": [
    {
      "word": "grassland",
      "level": "A2",
      "description": "a wide open place covered with grass"
    },
    {
      "word": "foal",
      "level": "A2",
      "description": "a young horse that stays near its mother"
    },
    {
      "word": "belly",
      "level": "A1",
      "description": "the soft underside of an animalâ€™s body"
    },
    {
      "word": "mother",
      "level": "A1",
      "description": "a female parent who cares for young"
    },
    {
      "word": "family",
      "level": "A2",
      "description": "parents and young animals that stay close"
    },
    {
      "word": "ears",
      "level": "A1",
      "description": "body parts that catch sounds"
    },
    {
      "word": "mud",
      "level": "A1",
      "description": "soft wet earth found after rain"
    },
    {
      "word": "field",
      "level": "A1",
      "description": "an open area of land with grass"
    },
    {
      "word": "shade",
      "level": "A1",
      "description": "a cool dark place away from sunlight"
    },
    {
      "word": "snort",
      "level": "A2",
      "description": "a short loud breath through the nose"
    },
    {
      "word": "waterhole",
      "level": "A2",
      "description": "a pool where animals gather to drink"
    },
    {
      "word": "leg",
      "level": "A2",
      "description": "the long part between a body and foot"
    },
    {
      "word": "runner",
      "level": "A1",
      "description": "a person or animal moving at speed"
    },
    {
      "word": "galloping",
      "level": "A2",
      "description": "moving quickly with a strong bouncing pace"
    }
  ],
  "imposter": [
    {
      "word": "zebra",
      "level": "A1",
      "description": "a wild animal with a coat of stripes",
      "hint": "a wild animal",
      "crewQuestion": "Which animal has black and white stripes?",
      "imposterQuestion": "Which animal has black and white spots?"
    },
    {
      "word": "stripes",
      "level": "A2",
      "description": "long dark lines across a lighter surface",
      "hint": "a coat pattern",
      "crewQuestion": "What pattern has long dark lines across fur?",
      "imposterQuestion": "What pattern has small round marks across fur?"
    },
    {
      "word": "herd",
      "level": "A2",
      "description": "a group of animals travelling and feeding together",
      "hint": "an animal group",
      "crewQuestion": "What do you call several zebras travelling together?",
      "imposterQuestion": "What do you call several sheep travelling together?"
    },
    {
      "word": "hoof",
      "level": "A2",
      "description": "a hard covering on the end of a leg",
      "hint": "an animal foot",
      "crewQuestion": "What hard part does a farrier trim on a horse?",
      "imposterQuestion": "What hard part might a blacksmith fit under a horse?"
    },
    {
      "word": "grazing",
      "level": "A2",
      "description": "feeding on plants while standing in a field",
      "hint": "an animal activity",
      "crewQuestion": "What do cattle do while eating plants outdoors?",
      "imposterQuestion": "What do birds do while finding seeds on the ground?"
    },
    {
      "word": "calf",
      "level": "A2",
      "description": "a young animal that stays near its mother",
      "hint": "a young animal",
      "crewQuestion": "What is a young zebra called?",
      "imposterQuestion": "What is a young cow called?"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "zebra",
      "kind": "animal",
      "level": "A1"
    },
    {
      "secret": "horse",
      "kind": "animal",
      "level": "A1"
    },
    {
      "secret": "river",
      "kind": "place",
      "level": "A1"
    },
    {
      "secret": "grass",
      "kind": "food",
      "level": "A1"
    },
    {
      "secret": "hoof",
      "kind": "thing",
      "level": "A2"
    },
    {
      "secret": "shade",
      "kind": "place",
      "level": "A1"
    },
    {
      "secret": "watering hole",
      "kind": "place",
      "level": "A2"
    },
    {
      "secret": "foal",
      "kind": "animal",
      "level": "A2"
    }
  ]
}
```

### topic-teens-video-games

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
      "level": "B1",
      "description": "a player’s character shown on screen"
    },
    {
      "word": "level",
      "forbidden": [
        "stage",
        "harder",
        "progress",
        "up"
      ],
      "level": "B1",
      "description": "a stage or section of a game"
    },
    {
      "word": "controller",
      "forbidden": [
        "buttons",
        "console",
        "hold",
        "play"
      ],
      "level": "B1",
      "description": "a handheld device used to control play"
    },
    {
      "word": "multiplayer",
      "forbidden": [
        "friends",
        "online",
        "together",
        "team"
      ],
      "level": "B1",
      "description": "a game mode for several players together"
    },
    {
      "word": "quest",
      "forbidden": [
        "task",
        "mission",
        "complete",
        "game"
      ],
      "level": "B2",
      "description": "a task or journey the player must complete"
    },
    {
      "word": "save point",
      "forbidden": [
        "pause",
        "progress",
        "return",
        "place"
      ],
      "level": "B2",
      "description": "a place where progress can be recorded"
    },
    {
      "word": "open world",
      "forbidden": [
        "map",
        "explore",
        "free",
        "game"
      ],
      "level": "B2",
      "description": "a large area the player can explore freely"
    },
    {
      "word": "power-up",
      "forbidden": [
        "extra",
        "ability",
        "collect",
        "boost"
      ],
      "level": "B1",
      "description": "a special ability that makes a character stronger"
    },
    {
      "word": "respawn",
      "forbidden": [
        "again",
        "after",
        "lose",
        "return"
      ],
      "level": "B2",
      "description": "returning to play after being removed"
    },
    {
      "word": "cutscene",
      "forbidden": [
        "story",
        "watch",
        "play",
        "video"
      ],
      "level": "B2",
      "description": "a short movie shown between play sections"
    },
    {
      "word": "scoreboard",
      "forbidden": [
        "points",
        "rank",
        "players",
        "show"
      ],
      "level": "B1",
      "description": "a display showing points and progress"
    },
    {
      "word": "boss fight",
      "forbidden": [
        "final",
        "enemy",
        "hard",
        "beat"
      ],
      "level": "B1",
      "description": "a difficult battle against a strong enemy"
    },
    {
      "word": "download",
      "forbidden": [
        "internet",
        "install",
        "file",
        "game"
      ],
      "level": "B1",
      "description": "moving a game onto a device from online"
    },
    {
      "word": "gaming session",
      "forbidden": [
        "time",
        "play",
        "group",
        "online"
      ],
      "level": "B1",
      "description": "time spent playing a game in one sitting"
    }
  ],
  "hotSeat": [
    {
      "word": "headset mic",
      "level": "B1",
      "description": "a small microphone worn near the mouth"
    },
    {
      "word": "game menu",
      "level": "B1",
      "description": "a screen listing choices before play"
    },
    {
      "word": "loading screen",
      "level": "B1",
      "description": "a picture shown while a game opens"
    },
    {
      "word": "game lobby",
      "level": "B2",
      "description": "a waiting area before players join a match"
    },
    {
      "word": "health bar",
      "level": "B1",
      "description": "a line showing how much strength remains"
    },
    {
      "word": "checkpoint",
      "level": "B1",
      "description": "a marked place where progress is saved"
    },
    {
      "word": "game server",
      "level": "B2",
      "description": "a computer connecting players online"
    },
    {
      "word": "controller cable",
      "level": "B1",
      "description": "a wire linking a gamepad to a device"
    },
    {
      "word": "voice chat",
      "level": "B1",
      "description": "spoken conversation shared through a game"
    },
    {
      "word": "ranked match",
      "level": "B2",
      "description": "a contest that changes a player’s position"
    },
    {
      "word": "game update",
      "level": "B1",
      "description": "new software changes added to a title"
    },
    {
      "word": "pixel art",
      "level": "B1",
      "description": "pictures made from small square dots"
    },
    {
      "word": "game music",
      "level": "B1",
      "description": "sounds written to play during a title"
    },
    {
      "word": "player profile",
      "level": "B1",
      "description": "a page showing one gamer’s details"
    }
  ],
  "imposter": [
    {
      "word": "avatar",
      "level": "B1",
      "description": "a player’s character shown on the screen",
      "hint": "game character",
      "crewQuestion": "Who can a player guide through a game world?",
      "imposterQuestion": "Who can a player guide through a film scene?"
    },
    {
      "word": "controller",
      "level": "B1",
      "description": "a handheld device used to control a game",
      "hint": "game equipment",
      "crewQuestion": "What can someone hold to move a character?",
      "imposterQuestion": "What can someone hold to move a camera?"
    },
    {
      "word": "quest",
      "level": "B2",
      "description": "a task or journey a player needs to complete",
      "hint": "game task",
      "crewQuestion": "What might lead a character through several challenges?",
      "imposterQuestion": "What might lead a traveller through several cities?"
    },
    {
      "word": "checkpoint",
      "level": "B1",
      "description": "a marked place where progress is saved",
      "hint": "game feature",
      "crewQuestion": "Where can someone return after losing a round?",
      "imposterQuestion": "Where can someone return after finishing a round?"
    },
    {
      "word": "boss fight",
      "level": "B1",
      "description": "a difficult battle against a strong enemy",
      "hint": "game event",
      "crewQuestion": "What may appear near the end of a game level?",
      "imposterQuestion": "What may appear near the end of a film?"
    },
    {
      "word": "multiplayer",
      "level": "B1",
      "description": "a game mode for several people together",
      "hint": "game mode",
      "crewQuestion": "How can friends play on the same team online?",
      "imposterQuestion": "How can friends watch on the same team online?"
    }
  ],
  "twentyQuestions": [
    {
      "secret": "controller",
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

### topic-teens-travel-planning

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
      "level": "B1",
      "description": "a day-by-day outline of a journey"
    },
    {
      "word": "travel budget",
      "forbidden": [
        "money",
        "cost",
        "spend",
        "plan"
      ],
      "level": "B1",
      "description": "an amount set aside to pay for a trip"
    },
    {
      "word": "booking confirmation",
      "forbidden": [
        "email",
        "hotel",
        "reservation",
        "proof"
      ],
      "level": "B1",
      "description": "a message proving a room or seat was reserved"
    },
    {
      "word": "departure time",
      "forbidden": [
        "leave",
        "when",
        "train",
        "flight"
      ],
      "level": "B1",
      "description": "the scheduled moment a vehicle begins its journey"
    },
    {
      "word": "connection",
      "forbidden": [
        "change",
        "transfer",
        "route",
        "wait"
      ],
      "level": "B1",
      "description": "a change between services during one journey"
    },
    {
      "word": "travel document",
      "forbidden": [
        "passport",
        "visa",
        "identity",
        "carry"
      ],
      "level": "B1",
      "description": "an official paper needed to cross a border"
    },
    {
      "word": "accommodation",
      "forbidden": [
        "hotel",
        "stay",
        "room",
        "book"
      ],
      "level": "B1",
      "description": "a place arranged for sleeping during a journey"
    },
    {
      "word": "travel insurance",
      "forbidden": [
        "cover",
        "pay",
        "emergency",
        "trip"
      ],
      "level": "B1",
      "description": "a policy helping with unexpected travel costs"
    },
    {
      "word": "packing list",
      "forbidden": [
        "items",
        "bag",
        "check",
        "clothes"
      ],
      "level": "B1",
      "description": "a note of belongings to take on a journey"
    },
    {
      "word": "exchange rate",
      "forbidden": [
        "currency",
        "money",
        "compare",
        "conversion"
      ],
      "level": "B2",
      "description": "the value of one currency compared with another"
    },
    {
      "word": "local transport",
      "forbidden": [
        "bus",
        "train",
        "city",
        "ride"
      ],
      "level": "B1",
      "description": "buses or trains serving people in an area"
    },
    {
      "word": "backup plan",
      "forbidden": [
        "change",
        "problem",
        "alternative",
        "ready"
      ],
      "level": "B1",
      "description": "another arrangement ready if the first one fails"
    },
    {
      "word": "arrival time",
      "forbidden": [
        "reach",
        "when",
        "land",
        "destination"
      ],
      "level": "B1",
      "description": "the scheduled moment someone reaches a place"
    },
    {
      "word": "travel advisory",
      "forbidden": [
        "warning",
        "government",
        "safety",
        "place"
      ],
      "level": "B2",
      "description": "official advice about conditions or safety at a place"
    }
  ],
  "hotSeat": [
    {
      "word": "passport holder",
      "level": "B1",
      "description": "a cover that keeps travel papers together"
    },
    {
      "word": "train timetable",
      "level": "B1",
      "description": "a printed chart of train departure times"
    },
    {
      "word": "hotel booking",
      "level": "B1",
      "description": "a confirmed arrangement for a room"
    },
    {
      "word": "airport map",
      "level": "B1",
      "description": "a drawing showing airport areas and routes"
    },
    {
      "word": "travel adapter",
      "level": "B1",
      "description": "a plug converter for using electronics abroad"
    },
    {
      "word": "packing cube",
      "level": "B1",
      "description": "a small pouch that organizes clothing in luggage"
    },
    {
      "word": "currency card",
      "level": "B1",
      "description": "a payment card holding money in another currency"
    },
    {
      "word": "route planner",
      "level": "B1",
      "description": "a tool suggesting a path between places"
    },
    {
      "word": "reservation number",
      "level": "B1",
      "description": "a code used to find a particular reservation"
    },
    {
      "word": "boarding gate",
      "level": "B1",
      "description": "a numbered place where passengers board a plane"
    },
    {
      "word": "transit pass",
      "level": "B1",
      "description": "a ticket allowing rides on buses or trains"
    },
    {
      "word": "contact card",
      "level": "B1",
      "description": "a note listing whom to contact in an emergency"
    },
    {
      "word": "weather forecast",
      "level": "B1",
      "description": "a report predicting conditions outdoors"
    },
    {
      "word": "day bag",
      "level": "B1",
      "description": "a small carry bag for items needed during the day"
    }
  ],
  "imposter": [
    {
      "word": "passport holder",
      "level": "B1",
      "description": "a cover for travel papers",
      "hint": "everyday objects",
      "crewQuestion": "What can keep important travel papers together?",
      "imposterQuestion": "What can show when a train is scheduled?"
    },
    {
      "word": "hotel booking",
      "level": "B1",
      "description": "a confirmed room arrangement",
      "hint": "everyday objects",
      "crewQuestion": "What confirms that a room has been reserved?",
      "imposterQuestion": "What can help a passenger find a gate?"
    },
    {
      "word": "travel adapter",
      "level": "B1",
      "description": "an item used for a plug converter",
      "hint": "everyday objects",
      "crewQuestion": "What can help a plug fit a different wall socket?",
      "imposterQuestion": "What can keep clothes organized inside a bag?"
    },
    {
      "word": "currency card",
      "level": "B1",
      "description": "a card for foreign payments",
      "hint": "everyday objects",
      "crewQuestion": "What can hold money in another currency?",
      "imposterQuestion": "What can help choose a path between places?"
    },
    {
      "word": "reservation number",
      "level": "B1",
      "description": "a code for a booking",
      "hint": "everyday objects",
      "crewQuestion": "What code can staff use to find a booking?",
      "imposterQuestion": "Where do passengers wait before getting on a plane?"
    },
    {
      "word": "weather forecast",
      "level": "B1",
      "description": "a report about future weather",
      "hint": "everyday objects",
      "crewQuestion": "What can predict rain or sunshine for a trip?",
      "imposterQuestion": "What can carry things needed during one day?"
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
