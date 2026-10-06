# Reading Flight: Concept

> Status: **concept for discussion, not a build plan.** Oct 6 2026.
> Part of Flight Presets v2 (`docs/flight-presets-concept-v2.md`). Rules that stay:
> - spoken-first: phones tap and vote, **nobody types**; talk happens out loud;
> - no spotlight on one student; many short turns;
> - one window in Zoom; nothing on the shared screen gives an answer away before the reveal;
> - do less, go deeper; fun breaks between stages;
> - the before → after shows at landing and is saved to the logbook;
> - a teacher's own book is used **only for their lessons**, never hosted or shared (decision, Sep 30 2026).

## Why its own flight
Reading courses are popular, especially when teachers bring their own book: a different chapter each lesson. That's a
different job from Captain's Flight, which uses a source as *evidence* for one big question in one lesson. A reading
course is about **the book itself**: following the story over weeks, remembering who's who, and reading longer text with
more confidence. So:
- **book = course, chapter (or part) = lesson**;
- every lesson starts from the last one ("previously…") and adds to a growing **cast list** and **word bank**;
- the before → after is about understanding *this* chapter, not changing an opinion.

## What exists already
- **12 library book courses** (`src/data/book-library.json`): kids and teens, 4 lessons each, with **levelled retellings**
  (A2 and B1, 250–500 words each, written for the class), a summary, a Flight Question and the series order.
- **Document upload** (`/api/source/extract-document`): a PDF/Word file up to 10 MB becomes text for one lesson.
- **Captain's Briefing reader:** readable text on the shared screen; **picture books** with read-along slides.
- **Courses:** a lesson list per course, carry-over between lessons (`lesson_memory`), and the logbook row of
  before-and-afters per lesson.

## The flight (one lesson = one chapter or part)

| Stage | What happens |
|---|---|
| **Takeoff: Previously…** | 60-second recap. The cast list and last lesson's key events on screen; Quick-fire turns: "What happened last time?" (first lesson: the cover, title and first line instead). |
| **Predict** | One line, the chapter title or a picture: "What do you think will happen?" Phones pick from 3 predictions (plus "something else"). **Part of the before.** |
| **Words** | 5 key words from the chapter, each in its sentence from the text. |
| **Read** | The chapter in **short chunks** (about 100–200 words) on the shared screen, and on phones. After each chunk, one quick **gist tap** on phones ("Why did Mowgli run?"). Read aloud (teacher, a synthetic voice, or students taking a paragraph each) or silently: see the questions. |
| *Break* | Turbulence pool. |
| **Talk about it** | A character choice in short turns: **Pass the Line** as the characters, or **Hot Seat** (one student is the character, the class asks), or "What would you do?" Quick-fire. |
| **Landing: What really happened** | The predictions vs what happened (the reveal), a 3-question comprehension check (the **after**: "caught the chapter"), then **everyone says one line of the story so far**, building a class retelling. The new characters and words join the course's cast list and word bank. Saved to the logbook. |

### The before → after
- **Before:** the prediction (no right answer yet) + "How sure are you about what's going on?" (confidence).
- **After:** the comprehension check ("caught the chapter: 7 of 8") + confidence again + how many predicted right.
- Over a course, the logbook shows a row per chapter: understanding and confidence lesson by lesson.

## Where the text comes from

| Source | How | Notes |
|---|---|---|
| **Library book courses** | Ready: 12 books, levelled retellings per lesson | Works now; the best starting point |
| **Teacher's own book** | Upload a PDF/Word file → the book is split into lesson-sized parts → a course | The new, risky part (below) |
| **Teacher's own chapter** | Upload or paste one chapter for one lesson | Already possible with the document upload |
| **Graded readers / short stories** | Same as the teacher's own book | |

### Splitting a teacher's book (the hard part)
A PDF of a novel is messy: page headers, page numbers, broken lines, footnotes. The plan:
1. **Extract and clean** the text (the existing extractor, plus header/footer and page-number removal).
2. **Find chapters** (headings like "Chapter 3", "III", "Part Two"); the teacher checks and adjusts the list.
3. **Size the lessons** by level and lesson length (see question 2): long chapters split at paragraph breaks, short ones
   joined.
4. Each part becomes a **course lesson** with its text stored for that teacher only.
5. Per lesson, the AI writes the chunks' gist taps, the 5 words, the predictions and the comprehension check, all
   grounded in that part's text and checked.

Large books may exceed today's 10 MB / extraction limits; we'd start with a cap (e.g. ~80,000 words) and say so.

## Courses
- **Book = course:** the course page shows chapters as lessons, the cast list and word bank growing, and each lesson's
  before → after.
- **Carry-over:** each lesson starts with "Previously…" built from the last lesson's memory (events, characters, words).
- **"Still flying?":** the next lesson's warm-up can bring back one word or one question from the last chapter.

## New pieces (none decided)
1. **Reading Room** (the Read stage): chunked text on screen + phones, gist taps, read-aloud modes.
2. **Predict / What really happened:** prediction at takeoff, reveal + comprehension check at landing, logbook save.
3. **Previously…** recap with the course's cast list.
4. **Book upload → course:** extract, clean, find chapters, size lessons, teacher review.
5. **Per-lesson content generation** grounded in the part's text (gist taps, words, predictions, comprehension).
6. **Cast list + word bank** in the course memory.
7. **The `reading-60` preset**, launchable from the planner, the Live Room and the course page ("Fly the next chapter").

## Questions for you
1. **Reading aloud:** in class, who reads? Options: the **teacher** reads, a **synthetic voice** reads, **students take a
   paragraph each** (short turns, everyone), or **silent reading** with a timer. Or let the teacher choose per lesson?
2. **Lesson size:** how much text per lesson? My guess: A1–A2 ~300–600 words, B1 ~800–1,200, B2 ~1,500–2,500 for a
   60-minute lesson. Does that match what you've seen in reading courses?
3. **Phones show the text?** On phones too (easier to read, but students may read ahead), or only on the shared screen
   (everyone at the same point)?
4. **Before → after:** prediction + confidence before, comprehension + confidence after. Right measures?
5. **Start with library books or uploads?** Library books work almost straight away; uploads are the bigger build.
   Build the flight on library books first, then add uploads? Or uploads first because that's what teachers want?
6. **Original text or retelling?** For library books we have levelled retellings. For uploads, do teachers want the
   **original text** as-is, or the option of a **simplified version** for lower levels (AI-written, clearly marked)?

## Decisions (owner, Oct 6 2026)
1. **Students read, taking turns** (short passages, everyone).
2. **Lesson sizes** as proposed (A1–A2 ~300–600 words, B1 ~800–1,200, B2 ~1,500–2,500).
3. **Text on both** the shared screen and phones.
4. **Before → after:** prediction + confidence before; comprehension + confidence after.
5. **Library books first**; uploads next, potentially the biggest part if done well.
6. **Uploads: both** the original text and an optional simplified version (clearly marked).

## The Read stage reuses Read Aloud (no new "Reading Room")
`src/activities/read-aloud` already does most of it: students take turns reading short passages aloud, everyone follows
on phones, a big sentence-by-sentence reading view, tricky-word taps collected for a vocab round, and a **class-level
version with the original one tap away** (decision 6). The Reading flight adds only what's missing:
- a **gist tap after each passage** (or every few passages) on phones;
- reading **this lesson's part** of the book (library retelling or uploaded part) instead of a cargo item;
- the new words feeding the course word bank.
