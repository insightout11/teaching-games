# Batch 3 content check report

- Scope: fact-check existing LessonCaptain teaching content, fix only confirmed clear errors, keep the existing wording style and data shape.
- Base: branch `check/batch-3` at `80e89d42`.
- Result: **14 confirmed content corrections in 6 files across 3 local commits**:
  - Part 1: 1 correction (`ac8211bc`).
  - Part 2: 4 corrections (`1b37a7f2`).
  - Part 3: 9 corrections (`f62f0bad`).
- No items or option sets were added or removed, and no keys were renamed. No push, merge, or rebase was performed.
- This is a content/data review only. No claim is made that any item was tested with a real class.

## Part 1 — Topic briefings

Scope: `src/data/topic-briefings.json`.

- 150 topics (80 kids, 70 teens), 380 levels, 1,520 facts, 2,660 vocabulary entries, 2,280 expressions, 370 `grammarFits`.
- Reviewed the complete briefing/fact dump and a separate high-risk list of 120 claims (dates, numbers, animal facts, geography, science, and similar).
- Wording style was preserved for the one confirmed error.

### Confirmed correction (commit `ac8211bc`)

| Location | Was | Now | Why |
|---|---|---|---|
| `topic-kids-koalas`, A2 facts | `A joey first grows inside its mother's pouch.` | `A joey develops inside its mother's pouch after birth.` | A koala gives birth to a tiny, undeveloped joey, which then crawls into the pouch and develops there. The old wording implied the joey began growing in the pouch before birth. |

Source: NSW Environment and Heritage, “Koala facts” — <https://www.environment.nsw.gov.au/topics/animals-and-plants/native-animals/native-animal-facts/koala>.

No other confirmed factual errors were found in the 150 topics. No other Part 1 edits were made.

## Part 2 — World Flight destinations, city packs, phrases, and readings

Scope:

- 50 destinations and 50 city packs.
- 200 local phrases across those destinations.
- Vancouver reading content: 3 reading topics.
- Milestone-50 reading content: 12 cities.

All local phrases, destination descriptions, city-pack clues, and the reading content were reviewed. The four corrections below were the only confirmed clear errors.

### Confirmed corrections (commit `1b37a7f2`)

| Location | Was | Now | Why |
|---|---|---|---|
| London phrase `Ta` (`local-phrases.ts:38`) | Meaning: `Thanks / bye (informal)` | Meaning: `Thanks (informal)` | British informal `ta` means “thank you”; it is not a goodbye expression. |
| Auckland phrase `Tēnā koe` (`local-phrases.ts:216`) | `sayIt`: `teh-nah koy` | `sayIt`: `teh-nah koh-eh` | The Otago guide breaks the phrase as `Tē-nā ko-e`; the old respelling collapsed it into a two-syllable English-style “koy”. |
| Istanbul Hagia Sophia (`destinations.ts:3096`) | `A monumental former church and mosque in Sultanahmet.` | `A monumental historic church that is now a mosque in Sultanahmet.` | Hagia Sophia is currently a mosque; “former church and mosque” can imply the mosque use also ended. |
| Istanbul Hagia Sophia clue (`city-packs.json:459`) | `A domed former church and mosque has a large central dome and tall minarets.` | `A historic church that is now a mosque has a large central dome and tall minarets.` | Same current-status issue in the city-pack clue. |

Sources:

- Collins Dictionary, `ta` (British informal, “thank you”) — <https://www.collinsdictionary.com/us/dictionary/english-thesaurus/ta>.
- University of Otago, “Introduction to Te Reo Māori pronunciation” — <https://www.otago.ac.nz/__data/assets/pdf_file/0024/314907/introduction-to-te-reo-maori-pronunciation-830709.pdf>.
- Wikipedia, “Hagia Sophia” — <https://en.wikipedia.org/wiki/Hagia_Sophia>. The building was a church, then a mosque (1453–1935), a museum (1935–2020), and has been a mosque again since 2020.

### Reviewed but not changed

- Reykjavik `Halló` (`ha-low`, also represented as `HAH-loh`): the double L is normally pronounced [tɬ] in Icelandic, but `Halló` is a loanword and uses a normal L. Ylhýra explicitly notes this exception — <https://www.ylhyra.is/course/greetings>. The existing respelling is acceptable and was not changed.
- Istanbul `Teşekkürler` (`teh-shek-kyoor-lehr`): the respelling is an approximation of the Turkish sounds; it is not a confirmed factual error. Left unchanged.
- Vancouver `Hi there` (`hy thair`): the `hy` respelling is nonstandard but understandable and not a factual error. Left unchanged.
- Singapore `Can can`, `Steady lah`; Almaty “wooden cathedral built without metal nails”; and the other reviewed items were left unchanged because the claims are defensible or the wording is stylistic.
- Attraction, dish, and hotel prices come from `TRAVEL_PRICE_PROFILES` and are intentionally approximate. They can look stale or inconsistent, including values attached to free attractions. They were not changed because there is no single verified current price source for the whole dataset. This remains a documented caveat rather than a content correction.
- The Vancouver and milestone-50 reading passages were reviewed with no changes.

## Part 3 — Junior picture questions and stories

Scope:

- `src/data/junior-picture-questions.json`: 61 sets, 610 questions, 183 opinion questions (30.0%), 458 sticker words used.
- `src/data/junior-picture-stories.json`: 61 stories (51 short, 10 standard), 376 pages, A1 31 / A2 30, 285 distinct sticker IDs, 183 story questions.
- Reviewed every prompt, option set, answer, `say` field, and story-question context. All answers were checked against the story text or the sticker meaning; no new sticker IDs were introduced.

### Confirmed corrections (commit `f62f0bad`)

Question edits also update the matching `say` field.

| Location | Was | Now | Why |
|---|---|---|---|
| `food-01` | `Which one can go on bread?` | `Which sweet spread goes on bread?` | Rice, egg, and carrot can also go on bread; only jam is the intended sweet spread. |
| `colours-of-things-04` | `Which one is white?` | `Which white figure is made of snow?` | The options include sun, grass, and strawberry; the added clue makes the snowman the only correct answer. |
| `the-sun-06` | `When do you usually see the sun?` | `When does the sun rise?` | Night, winter, and autumn are not sunrise; morning matches the intended answer. |
| `festivals-around-the-world-06` | `Which action can people do together?` | `Which action is often part of a festival?` | People can sleep, cry, or fall together too; dance is the festival-specific intended answer. |
| `birthdays-2-04` | `What could friends sing together?` | `What do friends do at a birthday party?` | The old wording did not distinguish singing from the other options; the new wording matches the birthday context. |
| `sports-2-06` | `What marks a soccer score?` | `Which thing stands at the goal in soccer?` | A goalpost is the object at the goal; the old prompt described a score, not the pictured object. |
| `rainy-boots` Q2 | `Where is the missing boot?` | `Where are the missing boots?` | The story says “boots” and “them”; the answer remains `bed`. |
| `autumn-game` Q2 | `What was missing?` | `Which game was missing a piece?` | The story is specifically about a board game; the answer remains `board-game`. |
| `airport-ticket` Q1 | `What did Suri lose?` | `What was Suri's ticket made of?` | The story says “Her paper ticket slipped”; the answer remains `paper`. |

### Reviewed but not changed

- `the-sun-01`: `What lights the daytime sky?` with options moon, star, sun, cloud. A star also technically lights the daytime sky, so the item is slightly ambiguous. It was not changed because the intended A1 answer is clearly the sun and no clean replacement was agreed without altering the option set.
- Validator note: 5 junior sets have no `topicIds`. This is not a duplicate or answer-key error; the validator’s `badTopicIds` and `topicCoverage` checks are both zero. Left as-is.
- No other confirmed answer-key or factual errors were found in the 610 questions or 183 story questions.

## Checks run

- `npx tsc --noEmit -p .` — only the known allowed error:
  - `src/lib/sources/extractor.ts(1,29): error TS2307: Cannot find module '@mozilla/readability' or its corresponding type declarations.`
- `pnpm next lint` — no errors. Two pre-existing React Hook warnings remain in `src/activities/final-answer/activity.tsx` at lines 85 and 181.
- `pnpm exec vitest run --testTimeout=20000` — final full run:
  - 260 test files passed, 1 failed, 1 skipped (262).
  - 3,614 tests passed, 3 skipped (3,617).
  - The only failed suite was the known `src/__tests__/sources/source-extractor.test.ts`, failing because `@mozilla/readability` is not installed.
  - A default-timeout run hit the known `terrain-map-data` timeout under load; the same test passes with the raised timeout. No content test failed.
- `npx tsx scripts/validate-junior-questions.ts` — passed:
  - 61 sets, 610 questions, 183 opinion (30.0%), 458 sticker words.
  - `longPrompt 0`, `badAnswer 0`, `unknownOption 0`, all other checks 0.
  - Note: 5 sets with no `topicIds`; not a validation failure.
- `npx tsx scripts/validate-junior-stories.ts` — passed:
  - 61 stories, 376 pages, A1 31 / A2 30, 285 distinct sticker IDs.
  - all story checks 0.
- JSON parse and `git diff --check` — passed.
- Per-file `pnpm next lint --file <json>` is not a valid JSON check in this repo: ESLint treats the JSON as JavaScript and reports `@typescript-eslint/no-unused-expressions`. The full lint plus validators were used instead.

## Commits

- `ac8211bc` — `Batch 3 check 1: correct koala joey pouch fact` — 1 file, +1/−1.
- `1b37a7f2` — `Batch 3 check 2: correct London, Auckland, and Hagia Sophia facts` — 3 files, +4/−4.
- `f62f0bad` — `Batch 3 check 3: clarify junior picture questions and stories` — 2 files, +15/−15.

## Remaining notes

- No classroom validation was performed; this report only covers content review and automated checks.
- Attraction-price currentness and the few stylistic/doubtful wordings listed above are documented rather than silently changed.
