# Library round 2 brief (for Codex)

_Written Sep 30 2026. Owner: LessonCaptain. Executor: Codex. Follows `docs/library-expansion-brief.md`
(same schema, licences, safety rules, validator and transcript pipeline; read it first)._

## Why

The library has 1,033 items, but four gaps hurt live classes:

| Gap | Now | Why it matters |
|---|---|---|
| Items with no `cefr` / `ageBand` | **446** | The Library tab filters by class level and age; these are invisible to it |
| Grammar videos | **17** | New grammar activities (Grammar Hunt, Fix the Captain, Tense Time Machine) need short, tagged clips |
| Short videos (< 3 min) | **43** | A 7-minute video is too long as a live-class hook or warm-up |
| Opinion / discussion texts | **10** | The product is speaking-first; teens need "should…?" pieces to argue about |

## Tasks, in this order

### 1. Metadata backfill (all 446)
For every item missing `cefr` or `ageBand`, add them from the item's own text / prefetched transcript /
description. Use `A1 A2 B1 B2` and `kids | teens | all`. Be conservative (when unsure, pick the higher
CEFR and the older age band). Don't change any other field. If an item has too little to judge, set
`needsReview: true` with a note instead of guessing.

### 2. Grammar videos (+60)
Short (ideally 2–6 min), classroom-safe explanations, **tagged with the grammar point** in `topicTags`
using these exact tags so activities can find them:
`grammar:present-simple`, `grammar:present-continuous`, `grammar:past-simple`, `grammar:past-continuous`,
`grammar:present-perfect`, `grammar:future-will-going-to`, `grammar:questions`, `grammar:articles`,
`grammar:prepositions`, `grammar:comparatives-superlatives`, `grammar:modals`, `grammar:conditionals`,
`grammar:countable-uncountable`, `grammar:phrasal-verbs`, `grammar:passive`.
Aim for ~4 per point across levels. Prefer VOA Learning English (public domain) and other sources the
first brief already approved; embedding YouTube is fine, never host copies.

### 3. Short hooks (+60 videos under 3 minutes)
Warm-up / curiosity clips: animals, science, places, "how it's made", sports moments, world cultures.
Kid-safe, no ads-heavy channels, `durationSecs` < 180. Tag `hook` in `topicTags`.

### 4. Opinion and discussion texts (+40)
Short levelled pieces (150–400 words) that take a position or present two sides a class can debate:
"Should schools have homework?", "Are zoos good for animals?". Public domain or CC BY / CC BY-SA only,
or write original balanced texts clearly marked `author: "LessonCaptain"` and `license: "CC BY 4.0"`.
`genre: "opinion"` or `"discussion"`, with a one-line `description` of the question.

## Rules (same as before, plus one)

- Branch **`codex/library-round-2`** from the latest main. Never push or merge.
- Run `npx tsx scripts/validate-library.ts` after every batch; commit each validated batch.
- **Transcripts:** only via the local prefetch script (`scripts/prefetch-library-transcripts.ts`), never
  fetched at runtime.
- **New: our TypeScript build targets ES5.** Any script you add or edit must typecheck with
  `npx tsc --noEmit -p .`: no regex `/u` flag, no `for…of` over `Map`/`Set`/`.entries()` (wrap in
  `Array.from(...)`), no spreading a `Set`. Run it before each commit.
- Flag uncertain items with `needsReview` rather than guessing. Kid-safety first.
- Batches of ~20; append each batch to `docs/library-round-2-progress.md`.

## Codex prompt (paste this)

> Pull the latest main and read `docs/library-round-2-brief.md` (and `docs/library-expansion-brief.md`
> for the schema and rules). Create branch `codex/library-round-2`. Do the four tasks in order:
> metadata backfill for all items missing cefr/ageBand, +60 tagged grammar videos, +60 short hooks under
> 3 minutes, +40 opinion/discussion texts. Work in batches of about 20; after each batch run
> `npx tsx scripts/validate-library.ts` and `npx tsc --noEmit -p .`, fix everything, log it in
> `docs/library-round-2-progress.md`, and commit to `codex/library-round-2`. Keep going until all four
> tasks are done. Never push or merge. Flag anything uncertain with `needsReview`.
