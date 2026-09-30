# City packs brief (for Codex)

_Written Sep 30 2026. Owner: LessonCaptain. Executor: Codex (the batch loop is mechanical enough for a
smaller model once batch 1 is reviewed)._

## Why this matters now

Launch adds two things that run on per-city content we don't have yet:

- **Mystery Flight**: the destination is hidden; clues unlock one by one on the big screen and the class
  argues and votes on where they're landing.
- **Souvenirs**: every city has **several** collectibles (not one), each earned a different way, so
  classes have a reason to fly back. The cabin shelf shows collected ones plus shaded silhouettes of the
  missing ones ("Bangkok 2/5").

Plus two smaller uses: **postcard prompts** (the class's landing postcard) and **local words** (a few
words in the local language, which also feed the Pocket Phrasebook).

The app code (Mystery Flight, the souvenir shelf) is built separately by Claude. **Your job is the data
only**, in the exact shape below, validated, for all 50 current destinations. Do not add new cities.

## The 50 destinations (use these ids exactly)

bangkok, tokyo, seoul, singapore, paris, london, new-york, cairo, dubai, sydney, beijing, shanghai,
berlin, moscow, istanbul, vancouver, toronto, mumbai, cape-town, rome, rio-de-janeiro, mexico-city,
buenos-aires, los-angeles, jakarta, lagos, hong-kong, amsterdam, honolulu, miami, bogota, reykjavik,
nairobi, lima, perth, auckland, suva, ulaanbaatar, almaty, madrid, lisbon, dublin, dakar, recife,
panama-city, santiago, addis-ababa, delhi, manila, ho-chi-minh-city

Source of truth: `src/data/world-flight/destinations.ts` (city, country, `travelAnchors` with real
attractions, dishes, transport). Reuse facts from there where they fit; stay consistent with it.

## Output

One file: **`src/data/world-flight/city-packs.json`**, an object keyed by destination id:

```jsonc
{
  "bangkok": {
    "id": "bangkok",
    "mysteryClues": [
      // exactly 6, ordered HARDEST (1) → EASIEST (6)
      { "order": 1, "kind": "weather",  "text": "It's hot almost all year, and heavy rain comes from May to October." },
      { "order": 2, "kind": "food",     "text": "People here eat sticky rice with sweet mango." },
      { "order": 3, "kind": "language", "text": "People greet each other with “sawasdee” and a small bow with their hands together." },
      { "order": 4, "kind": "nature",   "text": "A big river runs through the city, and boats are like buses." },
      { "order": 5, "kind": "landmark", "text": "A temple here holds a huge golden statue lying on its side." },
      { "order": 6, "kind": "giveaway", "text": "This city is the capital of Thailand." }
    ],
    "souvenirs": [
      // 4–6 per city; exactly one "land", at least one "mode", at least one "challenge", at most one "rare"
      {
        "id": "bangkok-tuk-tuk",
        "name": "Tuk-tuk keychain",
        "description": "A tiny three-wheeled taxi, the noisy, colourful way to zip through Bangkok traffic.",
        "earn": { "type": "land" },
        "icon": "car",
        "artPrompt": "sticker-style tuk-tuk, bright pink and green, white outline"
      },
      {
        "id": "bangkok-lantern",
        "name": "Floating lantern",
        "description": "Paper lanterns float into the sky at festival time.",
        "earn": { "type": "mode", "mode": "mystery" },
        "icon": "lamp",
        "artPrompt": "sticker-style paper sky lantern glowing orange"
      },
      {
        "id": "bangkok-golden-elephant",
        "name": "Golden elephant",
        "description": "Elephants are a national symbol of Thailand.",
        "earn": { "type": "challenge", "challenge": "words-3" },
        "icon": "award",
        "artPrompt": "sticker-style small golden elephant statue"
      },
      {
        "id": "bangkok-jade-buddha-postcard",
        "name": "Emerald temple postcard",
        "description": "A rare postcard of the temple with the famous green statue.",
        "earn": { "type": "rare" },
        "icon": "sparkles",
        "artPrompt": "sticker-style vintage postcard of a gold and green Thai temple"
      }
    ],
    "postcardPrompts": [
      // exactly 3, the class answers together out loud; the teacher types the best line on the postcard
      "What was the most surprising thing we learned about Bangkok?",
      "Which food from Bangkok would you try first, and why?",
      "Write one sentence to a friend telling them about the floating markets."
    ],
    "localWords": [
      // exactly 3, useful + friendly, in the city's main local language
      { "word": "sawasdee", "language": "Thai", "meaning": "hello", "say": "sa-wat-DEE" },
      { "word": "khob khun", "language": "Thai", "meaning": "thank you", "say": "kop-KOON" },
      { "word": "aroi", "language": "Thai", "meaning": "delicious", "say": "a-ROY" }
    ],
    "needsReview": false,
    "reviewNotes": ""
  }
}
```

### Field rules

**mysteryClues** (the class must be able to reason its way in):
- Exactly 6, `order` 1–6, hardest first. `kind` from: `weather`, `food`, `language`, `nature`,
  `landmark`, `culture`, `animal`, `sport`, `history`, `giveaway`.
- Clue 6 is always `giveaway` (country or a near-certain fact). Clues 1–5 must use at least 4 different kinds.
- **Never name the city** in clues 1–5. Never name the country in clues 1–4. No neighbouring-city
  names that make it trivial.
- Each clue: one or two sentences, max 28 words, CEFR A2–B1 English, concrete and vivid.
- Kid-safe: no war, disasters, crime, religion as controversy, politics, or stereotypes about people.
  Religion is fine as architecture or a festival described neutrally.
- True. Prefer facts that are stable (landmarks, food, climate), not current events.

**souvenirs**:
- 4–6 per city. `id` = `<city-id>-<kebab-name>`, unique across the whole file.
- `earn.type`: `land` (exactly 1: you get it the first time you land), `mode` (at least 1:
  `earn.mode` from `world`, `topic`, `mystery`, `free`), `challenge` (at least 1: `earn.challenge` from
  the list below), `rare` (at most 1: random chance on landing).
- `challenge` values: `words-3` (whole class stamps 3 words), `vote-reasons` (everyone gives a reason in
  a vote), `debate-win`, `quiz-perfect` (a Flash Quiz round with no wrong answers), `postcard` (the
  class writes the postcard), `return-visit` (second landing in this city).
- `name`: 2–4 words, a real object tied to the city (food, craft, transport, animal, landmark model).
  No brand names or trademarks.
- `description`: one sentence, max 22 words, a small true fact a kid would enjoy.
- `icon`: a Lucide icon name (e.g. `car`, `lamp`, `award`, `sparkles`, `ship`, `landmark`, `fish`,
  `coffee`, `music`, `mountain`, `shell`, `flower`). It must exist in lucide-react.
- `artPrompt`: short, always starts "sticker-style", no text in the image, no people's faces.

**postcardPrompts**: exactly 3; each a speaking prompt for the whole class, max 18 words, mentions the
city or a real thing from `travelAnchors`.

**localWords**: exactly 3 from the city's main local language (for English-speaking cities, use a
fun local expression or slang, e.g. Sydney "arvo" = afternoon). `say` is a simple English-letters
pronunciation with the stressed syllable in CAPITALS. Friendly words only (greetings, thanks, food).

**needsReview / reviewNotes**: set `needsReview: true` with a note whenever you are unsure of a fact,
a translation, a pronunciation, or cultural sensitivity. Uncertain is fine; wrong is not.

## Validator (write it first)

`scripts/validate-city-packs.ts`, run with `npx tsx scripts/validate-city-packs.ts`. It must fail on:

- any destination id missing, or any id not in the 50;
- clue count ≠ 6, orders not 1–6, clue 6 not `giveaway`, fewer than 4 kinds in 1–5, a clue over 28 words;
- the city name (or its common English name) appearing in clues 1–5; the country name in clues 1–4;
- souvenir count outside 4–6, not exactly one `land`, no `mode`, no `challenge`, more than one `rare`;
  unknown `mode` or `challenge` values; duplicate souvenir ids; description over 22 words;
  `artPrompt` not starting with "sticker-style";
- an `icon` that isn't a real lucide-react export (check against `node_modules/lucide-react`);
- postcardPrompts ≠ 3 or localWords ≠ 3, or a missing `say`.

It prints a summary: cities done / 50, souvenirs total, and how many are `needsReview`.

## The batch loop (standing goal)

**Goal: all 50 cities complete and passing the validator.**

1. Write the validator and do **batch 1 = 5 cities** (bangkok, tokyo, paris, cairo, rio-de-janeiro).
   Stop and report so the owner can review tone and difficulty before continuing.
2. After approval, continue in **batches of 5 cities**. After each batch: run the validator, fix every
   failure, append a short entry to `docs/city-packs-progress.md` (cities added, anything flagged), commit.
3. Keep going until all 50 pass. Don't stop between batches unless the validator can't be made to pass or
   a fact can't be verified (then flag it with `needsReview` and move on).
4. Finish with a final report: totals, the `needsReview` list, and any cities where clues felt too easy.

## Rules

- Work on branch **`codex/city-packs`**. Never push, never merge to main.
- Commits: the owner approves committing each validated batch to `codex/city-packs` (still ask before
  anything else: pushing, merging, touching other files).
- Only create/edit: `src/data/world-flight/city-packs.json`, `scripts/validate-city-packs.ts`,
  `docs/city-packs-progress.md`. Don't touch app code, other data files, or `destinations.ts`.
- Facts must be checkable. If you use a web source, don't copy sentences: write your own words.
- Everything is for kids and teens worldwide: kind, curious, never mocking any culture.

## Codex prompt (paste this)

> Read `docs/city-packs-brief.md` and follow it exactly. Work on branch `codex/city-packs`. First write
> `scripts/validate-city-packs.ts`, then create batch 1 (bangkok, tokyo, paris, cairo, rio-de-janeiro)
> in `src/data/world-flight/city-packs.json`, make the validator pass, and stop to report so I can
> review the tone and difficulty. After I approve, continue in batches of 5 cities, running the validator
> and committing each validated batch to `codex/city-packs`, until all 50 destinations pass. Never push
> or merge. Flag anything uncertain with `needsReview` instead of guessing.
