# Pictures and art + Junior mode (concept)

_Oct 7 2026. Roadmap Phase 1 #5 and #6. Concept for owner review; nothing built. Mockups: claude.ai artifact
"Junior Mode Mockups"._

## Why together
Young kids (about 5–9) read slowly or not yet. Today almost every phone answer is words, so young classes depend on the
teacher reading everything out. **Junior mode needs pictures**, and pictures help every class (vocabulary, Read
Aloud, Travel). So the picture library comes first, and Junior mode is the first big thing built on it.

## What exists
- **Sticker-style crew avatars** (the owner's pick for kids, Sep 2026): thick white outline, flat colours, soft shadow.
- **Place photos** for cities (Wikimedia, Unsplash) in `src/lib/place-media.ts`.
- **Picture books** with open licences (StoryWeaver, African Storybook) and uploaded picture books with page images.
- **No word pictures**, and phone answers (`InputSpec` options) are text only.

## Part 1: the picture library
One shared library of pictures, used everywhere a word or idea needs one.

**Where pictures come from** (in this order when a picture is needed):
1. **A core sticker set, made once**: about 500 everyday A1–A2 words (animals, food, family, body, clothes, home,
   school, weather, transport, actions, feelings, places) drawn in the Sticker style with an AI image model, checked,
   and stored in our own storage. Estimated one-off cost: about $10–25 (roughly 2–5¢ an image). We own the use of them.
2. **Real photos** where a real picture is better (a real volcano, a city, a dish): free photo services that allow
   this use with credit (Unsplash, Pexels, Wikimedia), with the credit kept next to each photo.
3. **New stickers on demand**: when a lesson needs a word that has no picture, one is drawn in the Sticker style,
   **shown to the teacher first** ("AI proposes, Captain approves"), and once approved it joins the library for every
   teacher. Never drawn fresh for each lesson; a word is drawn once.

**Matching pictures to words**: by the word's base form ("apples" → apple) and meaning tag; phrases and abstract words
("because", "maybe") get no picture rather than a confusing one.

**Where pictures appear**
- **Phones**: picture answers (2×2 tiles: tap the picture), word cards in the Pocket Phrasebook, "I used it!" stamps.
- **Teacher screen**: Language Toolkit word cards, quiz options, Read Aloud (word pictures for tricky words),
  Travel (dishes, sights), Focus briefings (one picture for the topic).
- **Teens and adults**: real photos more than stickers; the "Paper-cut" style (the owner's pick for teens and the
  brand) for illustrations.

**Safety and rights**: only kid-safe subjects; no people's faces in generated stickers except the crew style; every
photo keeps its credit and licence; nothing from search results is shown to students unchecked.

## Part 2: Junior mode
**One switch per class** ("Junior class", in class settings; a tag on the Home gate). It changes the whole lesson for
young kids. Students never see a setting.

**On the phones**
- **Picture answers** wherever an activity has short answers: 2–4 big tiles with a picture and one word.
- **Bigger everything**: tiles at least a thumb wide, one question on screen, no scrolling.
- **No reading needed to play**: the question is also shown as a picture or read out on the teacher screen.
- **No typing anywhere** (already mostly true: spoken-first).
- **Gentle feedback**: a sticker and a sound for joining in, not "wrong" in red.

**On the teacher screen**
- **Sticker style** for the room's art, larger type, fewer words on screen.
- **Read it out**: a speaker button on every question (the computer voice, already used by Black Box and Static).
- **Shorter rounds** (about half the time) and more movement breaks (stand up if…, show me…).
- **No rankings**: class totals and "everyone who answered" instead of a leaderboard; celebrations for the class.

**Content**
- **A1 texts**: the new A1 retellings and packs (round 17) and the Beatrix Potter and First fairy tales courses.
- **Picture books** first in the Reading flight's book list.
- **Topic briefings** at A1 (round 18).

**Which flights and activities**
| Works well for juniors | Adjust | Hide in Junior mode |
|---|---|---|
| Reading (picture books, A1 retellings), Travel (cities, food, pictures), Quick Pulse, Would You Rather, Flight Question, Picture Reveal, Spinner, Twenty Questions, Vocab activities with pictures | Speak (fewer, shorter lines; picture prompts), Listening (A1 clips only, one gist question with pictures), Static and Black Box (shorter, slower voice) | Debate flight, Tag-team Debate, Evidence Cards, Hot Take, grammar-heavy games, anything with typing |

## Build steps (after approval)
1. **Picture library**: storage, the word → picture lookup, the core 500-sticker set (draw, check, store), photo
   sources with credits. Codex can prepare the word list and meaning tags; Claude draws and checks.
2. **Picture answers on phones**: `InputSpec` options can carry a picture; the phone shows tiles.
3. **Pictures in the first places**: Language Toolkit cards, Pocket Phrasebook, quiz options, Travel.
4. **Junior mode switch** and the phone changes (big tiles, gentle feedback, no rankings).
5. **Teacher screen in Junior mode**: Sticker style, read-it-out buttons, shorter rounds, hidden activities.
6. **On-demand stickers** with teacher approval.

## Decisions for the owner
1. **Age range** for Junior mode: about 5–9? (Older kids keep the normal mode with pictures available.)
2. **Core sticker set**: AI-drawn in our Sticker style (recommended), or an open-licence icon set (cheaper, but it
   won't match our style)?
3. **On-demand stickers**: allowed, with teacher approval before use (recommended), or core set only?
4. **Rankings off in Junior mode** by default (recommended), or a teacher choice?
5. Anything the owner's own young classes need that isn't here (from real teaching)?
