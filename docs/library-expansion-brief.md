# Library expansion brief (for Codex)

_Written Sep 30 2026. Owner: LessonCaptain. Executor: Codex (a smaller model such as Luna can run the
mechanical loop; see "Who runs this")._

## Why this matters now

The Live Room is getting a **Library tab** (teacher's private window) and **Read it together**: any
text in cargo becomes a levelled, paragraph-by-paragraph class reading with vocabulary, questions and
discussion. Activities and games also build from the real text or transcript of whatever the class is
looking at. So the library's job changes from "videos to plan a lesson around" to **"a trustworthy
shelf of things a class can read, watch and talk about, at the right level, right now."**

## What we have (Sep 30 2026, ~460 items)

| Library | Items | Kind |
|---|---|---|
| world-flight | 150 | travel videos (destination-tied) |
| teded | 50 | video |
| bbc | 46 | video |
| voa | 32 | **text** (VOA Learning English) |
| stories | 24 | **text** (fables, classics) |
| ted | 20 | video |
| kids | 20 | video |
| natgeo | 15 | video |
| crash-course | 14 | video |
| kurzgesagt | 13 | video |
| bbc-ideas, bigthink, business-english | 10 each | video |
| vox | 9 | video |
| picture-books | 8 | **text + images** |
| travel-english | 6 | video |
| internet-memes, minecraft | 4 each | video |
| sports | 1 | video |

## The gaps, in priority order (and why)

1. **Readable texts: the biggest gap (only ~64).** Read it together needs short, levelled, safe texts.
   - **VOA Learning English**: public domain (US government), written for learners, news-like.
     Target **+150**: news stories, *Science & Technology*, *Health*, *Arts & Culture*, *Words and Their
     Stories*, *American Stories* (levelled fiction). Perfect for the news reader without live news risk.
   - **StoryWeaver (Pratham Books)**: CC BY 4.0, thousands of **levelled** children's stories (levels
     1–4) with illustrations, from many cultures. Target **+120** (levels 1–3 for kids, 3–4 for older).
   - **African Storybook**: CC BY, illustrated levelled stories. Target **+40**.
   - **Public-domain myths, legends and fables from every continent** (Project Gutenberg sources,
     retold/trimmed to 200–600 words). Target **+60**, spread across regions so World Flight
     destinations have a story.
2. **Kids' level (A1–A2) videos, 3–6 minutes.** Our audience is kids and teens; most videos are
   adult-level. Target **+80** from channels with captions: Crash Course Kids, SciShow Kids, Peekaboo
   Kidz, National Geographic Kids, Free School, Homeschool Pop, BBC Teach.
3. **Teen interests (A2–B2), 3–10 minutes.** Teens stay engaged when the content is theirs. Target
   **+100** across: sports (currently 1!), music, gaming (beyond Minecraft), internet culture, social
   media and wellbeing, careers/future jobs, space, climate, inventions, food, animals, mysteries.
   Sources: BBC Learning English (*6 Minute English*, *The English We Speak*, *News Review*), TED-Ed,
   Vox, Kurzgesagt, NatGeo, BBC Ideas, Veritasium (short ones), Tom Scott (short ones).
4. **Place-tied items** for World Flight and the class map. Every destination should have at least
   **one story or text and one short video**. Add `place` metadata (see schema) to everything
   place-related so the Library can pin items on the class map.
5. **Picture books for young kids.** Only 8 today. StoryWeaver / African Storybook levels 1–2 with
   their images (CC BY; keep attribution). Counted in (1).

Total target for this round: **~550 new items**, lifting the library to ~1,000.

## Hard rules

- **Licences.** Texts and images: **public domain, CC BY, or CC BY-SA only**, with attribution fields
  filled. Never copy text from sites without such a licence. Videos: **YouTube embed only** (we never
  host video).
- **Transcripts.** LIBRARY transcripts come ONLY from the local prefetch script
  (`scripts/prefetch-library-transcripts.ts`, free `youtube-transcript`, run locally because YouTube
  blocks cloud IPs) into Supabase. **Never** fetch YouTube transcripts at runtime or in API routes.
  Pasted/arbitrary videos use paid Supadata at runtime; that is a different pipeline. Don't mix them.
- **Only captioned videos.** If a video has no English captions, skip it (no transcript = no grounded
  activities).
- **Kid-safe.** No graphic violence, sexual content, self-harm, hate, or distressing news imagery.
  Teen items may cover serious topics (climate, history) in an age-appropriate way. When unsure, mark
  `needsReview: true` rather than guessing.
- **Levels.** Every item gets `cefr` (A1–C1) and `ageBand` (`kids` 6–11, `teens` 12–17, `all`).
  Texts: rewrite nothing at this stage. Level the ORIGINAL, and keep it 150–900 words (split longer
  pieces into parts: "Part 1/2").
- **Quality over count.** A great 5-minute video beats three mediocre ones.

## Item schema (add these fields; keep existing ones)

```jsonc
{
  "id": "voa-why-bees-matter",           // library prefix + slug, unique
  "title": "Why Bees Matter",
  "kind": "text",                          // "text" | "video" | "picture-book"
  "author": "VOA Learning English",        // or speaker/channel for video
  "url": "https://learningenglish.voanews.com/…",
  "youtubeId": null,                       // videos only
  "durationSecs": null,                    // videos only
  "wordCount": 412,                        // texts only
  "summary": "…full text for texts…",      // texts: the full text, paragraphs separated by blank lines
  "images": [],                            // picture books: [{ "url", "alt" }]
  "description": "One-line teacher-facing hook.",
  "topicTags": ["animals", "science", "farming"],
  "genre": "expository",                   // expository | narrative | news | opinion | poem | dialogue
  "difficultyLevel": "Beginner",           // keep existing field for back-compat
  "cefr": "A2",
  "ageBand": "kids",
  "place": { "name": "Kenya", "lat": -0.02, "lng": 37.9 },   // or null
  "license": "Public domain (US government)",               // or "CC BY 4.0" etc.
  "attribution": "VOA Learning English",
  "needsReview": false
}
```

## The process (per batch of 20)

1. **Pick the next category** from the priority list that is furthest below its target
   (`docs/library-expansion-progress.md` keeps the counts).
2. **Find candidates** (30 per batch so 10 can be rejected). Check licence and captions first.
3. **Fill the schema.** For texts, copy the full text (licence permitting) into `summary`, clean
   formatting, split into paragraphs. For videos, fill metadata from the page.
4. **Level + tag + safety** with the existing enrichment scripts
   (`scripts/enrich-library-topic-tags.ts`, `scripts/classify-library-genres.ts`), then set
   `cefr` / `ageBand` / `needsReview`.
5. **Validate**: write `scripts/validate-library.ts` in the FIRST batch (then run it every batch):
   unique ids, required fields per kind, licence + attribution present for texts/images, wordCount in
   range, youtubeId format, cefr/ageBand values, no duplicate URLs across all libraries.
   **A batch that fails validation is not committed.**
6. **Prefetch transcripts** for new videos: `npm run prefetch-transcripts` locally (idempotent), then
   confirm every new video has `raw_transcript` in Supabase. Drop any that didn't get one.
7. **Commit** the batch to a branch `codex/library-expansion` with a message listing counts per
   category, and append a line to `docs/library-expansion-progress.md`:
   `2026-10-01 · batch 7 · +20 (voa-news 12, storyweaver-L2 8) · 3 needsReview · totals …`.
8. **Repeat.**

## Standing goal (so it keeps working)

> **Keep adding validated batches of 20 until every category in the priority list reaches its
> target, then stop and write a summary.** Each batch must pass `scripts/validate-library.ts` and have
> transcripts prefetched before it is committed. If a source runs dry or its licence is unclear, skip
> to the next category and note it in the progress file. Never push to `main`; the owner merges the
> branch after reviewing a sample. After every 5 batches, stop for a short checkpoint: list 5 random
> new items with their level, licence and a one-line quality note.

## Who runs this

- **A smaller model (e.g. Luna) can run steps 1–3 and 5–8.** They're mechanical: find, copy, fill
  fields, run scripts, commit. The validator is the safety net, so a weaker model can't commit broken
  data.
- **Judgement steps need a stronger pass:** levelling (`cefr`), safety (`needsReview`), and "is this
  actually good for a class". Recommended: let the small model do the loop, have it mark anything
  borderline `needsReview: true`, and every 5 batches have a stronger model (or the owner) review the
  `needsReview` items plus a random sample of 5.
- Budget: text items cost nothing but time. Video transcripts are free (local prefetch). AI tagging
  uses the cheap default model.

## Ready-to-paste prompt

```
You are expanding LessonCaptain's content library. Read docs/library-expansion-brief.md fully and
follow it exactly: the hard rules (licences, transcript pipeline, kid-safety), the item schema, and
the per-batch process. Work on branch codex/library-expansion (create it from main).

First batch only: write scripts/validate-library.ts as specified and create
docs/library-expansion-progress.md with the target table and current counts.

Then work continuously toward the standing goal: validated batches of 20, highest-priority category
furthest below target first, transcripts prefetched for every new video before committing, a progress
line per batch, and a checkpoint summary every 5 batches. Mark anything borderline needsReview: true.
Never push to main. Stop when all targets are met and write a final summary.
```
