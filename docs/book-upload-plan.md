# Book Upload → Reading Course: Build Plan

> Status: **plan for discussion.** Oct 6 2026. Reading flight step 4 (`docs/reading-flight-concept.md`).
> Owner decisions that apply: students read aloud in turns; lesson sizes A1–A2 ~300–600 words, B1 ~800–1,200,
> B2 ~1,500–2,500; text on screen and phones; uploads offer the **original** and an optional **simplified** version;
> a lesson can be **2–3 chapters** for short kids' books (*Fly Guy*, *Dragon Masters*); a teacher's book is used **only
> for their own lessons**, never shared.

## The goal
A teacher uploads a book (PDF or Word), checks the chapter list, picks the class level, and gets a **private reading
course**: one lesson per part, each flown with the Reading flight (predict, read aloud in turns with quick checks, talk,
what really happened). Five minutes from upload to course.

## What exists, and why it isn't enough
- **The current upload** (`/api/source/extract-document`) sends the file to an AI document model and gets back **one
  excerpt of up to ~1,200 words** for one lesson. A whole book needs the **full text**, which an AI call can't return in one
  go (output limits, 60-second request limit, cost).
- **There's no PDF or Word parsing library** in the project yet.
- **Courses** already store per-lesson payloads and sources, the Reading flight reads a lesson's text and pack, and
  "Previously…" works from the earlier lessons.

## The pipeline

| Step | What happens | How |
|---|---|---|
| **1. Upload** | PDF, Word (.docx) or plain text, up to ~25 MB | Upload straight to private storage (Supabase Storage, teacher-only bucket), not through a 60s request |
| **2. Extract the text** | The full text, page by page | **Text-layer PDFs:** a PDF text library (e.g. `unpdf`/`pdfjs`), no AI, no cost. **Word:** a .docx library (e.g. `mammoth`). **Scanned PDFs (images):** detected (no text layer) and handled later (step 9) |
| **3. Clean** | Remove running headers/footers, page numbers, hyphenation across lines, broken lines, front matter (copyright page, contents) | Rules: lines repeated on most pages = headers/footers; lone numbers = page numbers; re-join lines into paragraphs |
| **4. Find chapters** | A list of chapters with titles and word counts | Headings like "Chapter 3", "CHAPTER THREE", "III", "Part Two", numbered titles; fallback: the contents page; last fallback: split every ~N words at paragraph breaks |
| **5. Teacher review** | The chapter list with word counts; the teacher can rename, merge, split, or drop front/back matter | A simple list editor (no text editing) |
| **6. Plan the lessons** | Lessons sized to the class level: **short chapters grouped (2–3 per lesson)**, long chapters split at paragraph breaks | Pure function from the chapter list + level + lesson length; the teacher can adjust the grouping |
| **7. Original or simplified** | Per course: read the original text, or a **simplified version** at the class level (clearly marked "Simplified") | Simplified = AI retelling per lesson part, generated lesson by lesson (not all at once), checked for length and faithfulness |
| **8. Build the course** | A private course: one lesson per part, Reading flight, the part's text stored with the lesson | Lesson packs (passages + gist taps, prediction, check, words, cast, talk) generated **per lesson when it's prepared**, not upfront, so a 30-lesson book doesn't spend 30 AI calls at once |
| **9. Scanned books (later)** | Page images → text | AI page OCR in small batches, with a clear credit cost shown first |

## Privacy and rights
- The file and its text live in **teacher-only storage** (per-teacher folder, row-level security); never in the public
  library, never shown to other teachers, never used to train anything.
- Courses built from uploads are **private** (not shareable as templates).
- The teacher confirms they have the right to use the book with their class (a one-line checkbox at upload).
- Delete the course → delete the stored text and file.

## Limits for the first version
- Text-layer PDFs, .docx and .txt. Scanned PDFs are detected and explained ("This looks like a scanned book; we can't read
  it yet").
- Up to ~100,000 words (a long novel) per book.
- Chapter detection will sometimes be wrong; the review step is how teachers fix it, so it must be quick.
- Picture books with little text (e.g. *Fly Guy*) work if the PDF has a text layer; their pictures aren't used in v1.

## Build order
1. **Storage + upload** (private bucket, teacher folder, RLS) and the **rights checkbox**.
2. **Extraction + cleaning** for PDF (text layer), .docx, .txt, with tests on real-world samples (headers, page
   numbers, hyphenation, contents pages).
3. **Chapter finder + lesson planner** (pure functions, heavily tested).
4. **Review screen**: chapters (rename/merge/split/drop) and lesson grouping at the chosen level.
5. **Course creation**: private course, lesson payloads with the part text; packs generated per lesson on demand.
6. **Simplified version** option (per lesson, on demand, marked).
7. **Scanned PDFs** via AI OCR (later, with cost shown).

## Risks
- **Messy PDFs** are the biggest risk: two-column layouts, footnotes, drop caps, odd encodings. Mitigation: test on a
  set of real files early; the review step; a "this didn't work well" path back to the paste-one-chapter flow.
- **New dependencies** (a PDF text library, a .docx library) must run on Vercel's serverless runtime; pick ones that do.
- **Cost:** packs and simplified versions are AI calls; generating them per lesson on demand keeps the cost tied to use.
- **Copyright:** private-only storage plus the teacher's confirmation; no sharing of uploaded courses.

## Questions for you
1. **A sample:** can you share 2–3 real PDFs you'd use (or similar), including a short kids' chapter book and a longer
   novel? Testing on real files early is the best way to de-risk this.
2. **Word files and plain text** in v1 too, or PDF only?
3. **Scanned books:** how common are they for you? If very common, OCR moves up the order (and has a cost).
4. **The rights checkbox:** OK to ask teachers to confirm they can use the book with their class?
5. **Pictures:** for very young books (*Fly Guy*), should v1 try to keep the pictures with the text, or text-only first?

## Decisions (owner, Oct 6 2026)
1. **Samples:** owner has none; Claude finds public-domain / openly licensed test files (with owner approval to download).
2. **File types:** PDF, Word (.docx) and plain text in v1.
3. **Scanned books:** not used by the owner → OCR stays last (or later).
4. **Rights checkbox:** yes.
5. **Pictures:** keep the pictures with the text for very young books (v1 extracts page images and shows them with the
   passage, like the picture-book read-along slides).
