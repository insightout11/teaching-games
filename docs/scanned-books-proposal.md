# Scanned books: proposal

_Oct 6 2026. Status: **BUILT** (see "Built" below); pricing decided later. Builds on `docs/book-upload-plan.md` (browser extraction, picture books,
Simplified, Previously)._

## Why
Most kids' books teachers own (*Fly Guy*, *Dragon Masters*) are print books in copyright. To bring one in, a teacher
scans it on the school copier or photographs the pages with a phone. Both give **pictures of pages with no text
inside**. Store ebooks (Kindle) are locked and can't be exported. Today the upload page turns these away ("it can't be
read yet"), so for kids' courses this is probably the main way in, not an edge case.

## What the teacher does
1. **Choose files:** a scanned PDF, **or several photos** (phone pictures of the pages, JPG/PNG/HEIC, in order).
2. The page detects there's no text and says: *"This is a scanned book: 32 pages. We'll read the text from the
   pictures. This uses 1 credit"* (or whatever the cost decision below is). One button: **Read the pages**.
3. Progress: *"Reading page 12 of 32…"*. Then the same "Book ready" screen as today (lessons by level, join, Original or
   Simplified, rights box).
4. No proofreading screen (owner decision for uploads). Pages the AI couldn't read clearly are dropped with a quiet
   note: *"2 pages were too blurry to read and were skipped."*

## How it works
- **In the browser (no cost):** each page is drawn as an image, as picture books are now (PDF pages via pdf.js; photos
  resized to ~1,400 px and turned upright from their EXIF orientation). Images are uploaded to the private `book-pages`
  bucket as today.
- **On the server (the AI part):** a new route reads the text from the uploaded page images in **batches of ~5 pages**
  (each call well under the 60 s limit), using Gemini. For each page it returns the page's story text only, plus
  whether the page is a heading/new chapter and whether it was readable. Running headers, page numbers and imprint
  lines are dropped in the prompt **and** by our existing cleaning (`stripRunningLines`).
- The returned text becomes the same `BookPage` lines the PDF path produces, so **everything after is reused**:
  chapters, lessons by level, picture-book mode (few words per page → one page per turn, with its picture),
  Simplified, Previously.
- **Picture books keep their pictures** (already stored). Chapter books keep only the text (same as now).
- **Checks:** a page result is kept only if it's mostly real words (not gibberish), not longer than a page could hold,
  and not a refusal. Book-wide: if fewer than half the pages read cleanly, stop and say the scan is too unclear.

## Cost
Estimated, not yet measured: a page image is ~1,000–1,500 input tokens and its text ~300 output tokens. With Gemini
Flash-Lite that's roughly **$0.0003 per page**: about **1 cent for a 32-page picture book** and **3–5 cents for a
150-page chapter book**. Reading is done **once per book** (the text is saved with the course), never per lesson.
If Flash-Lite misreads kids' fonts or speech bubbles, Gemini Flash costs about 3× more (still a few cents a book).
The build's first step measures this on real scans.

## Decisions for the owner
1. **Charging:** (a) included in Pro with a fair-use cap (e.g. 600 pages a month), no credits; (b) 1 credit per book
   (any length up to the cap); (c) credits by pages (e.g. 1 credit per 100 pages). _Recommendation: (a). The real
   cost is cents, credits add friction to the feature most likely to win teachers, and a cap stops abuse._
2. **Phone photos in v1?** _Recommendation: yes_, since many teachers won't have a scanner. Page order: sorted by the
   time each photo was taken, with no reordering screen in v1 (teachers photograph the book in order).
3. **Speech bubbles and comic-style pages** (*Fly Guy* has some): read bubble text into the page's text in reading
   order (_recommended_), or skip bubbles?
4. **Test material:** I need 2–3 real scans or phone photos of books you've taught with (they stay in this test, never
   committed). Without them I'd test on scans I make from public-domain picture books, which are cleaner than real
   copier scans.

## Build order (after decisions)
1. **Measure:** run the OCR prompt on the test scans with Flash-Lite and Flash; check accuracy and real cost.
2. **Route** `/api/book-pages/read` (batched, teacher-owned images only, checks above) + cap/charging.
3. **Upload page:** scanned-PDF detection, photo upload, the cost line, progress, skipped-page note.
4. **Tests:** page-result checks, batching, the `BookPage` conversion; then a full run on the deployed site.

## Privacy and rights
Unchanged from book upload: the rights box, images in the teacher's private folder, text private to the teacher's
course, pictures shown only on the teacher's screen. Page images are sent to the AI provider only to read their text
(as uploaded documents already are elsewhere in the product).

## Owner decisions (Oct 6 2026)
1. **Pricing: decide later**, once everything is built (it's a different product; probably Pro). For now it's
   behind the Pro upload page, with no credits; each read call logs pages and tokens.
2. Phone photos in v1: **yes**, ordered by the time taken.
3. Speech bubbles: **read in reading order**.
4. Test material: public-domain scans from the Internet Archive (*Peter Rabbit* 1917, *When Peter Rabbit Went to
   School* 1921, *The New Wizard of Oz* 1903) plus simulated phone photos (tilted, shadowed, blurred).

## Measured (Oct 6 2026, `scripts/measure-page-reading.ts`)
- **Flash-Lite isn't good enough**: it mixed text between pages and kept line breaks. **Gemini 2.5 Flash** reads
  cleanly (drop caps, two text blocks on a page, hyphenation) at **$0.0002-0.0005 a page**.
- *When Peter Rabbit Went to School*, 76 pages: **2.5¢, ~2.5 min**, 0 skipped, 6 lessons at Easy, clean text.
- *Peter Rabbit* (picture book), 52 pages: **1.2¢, ~1 min**, 2 picture-book lessons.
- Simulated phone photos: read correctly.
- **Gemini's RECITATION filter** sometimes refuses a batch (it won't repeat a known book word for word). Blocked
  batches are retried page by page; a still-blocked page is skipped (and counted in the note). Expect this more with
  in-copyright books: the first real-world test should watch the skipped count.
- **Scans with hidden text** (copier text recognition, the Archive's own) are common and their text is poor (*Oz*:
  pictures read as chapter titles, running headers as chapters, 87 broken lessons). They're detected (pages = a
  picture + invisible text, 12 pages sampled through the book) and read from the pictures like other scans.

## Built
- `src/lib/book-import/page-reader.ts`: the prompt, `readPageImages` (pages labelled and matched by number, so a
  skipped picture page never shifts the rest), `readPagesSafely` (recitation retry).
- `src/lib/book-import/scan.ts`: `needsReading`, `validPageRead` (noise/refusal checks, drop caps, split words),
  `readToBookPage` (paragraphs run on across page breaks), `dropRepeatedCaptions`, `readBatches`.
- `/api/book-pages/read`: up to 5 of the teacher's own page pictures per call.
- Upload page: scanned PDFs (no text, or hidden scan text via `isScannedPdf`) and phone photos → "Read the pages"
  with progress → the usual "Book ready" screen; unclear pages skipped with a note; picture books reuse the saved
  pictures.
- Not yet: a full run on the deployed site; per-teacher page cap (with pricing).
