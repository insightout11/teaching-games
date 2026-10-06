/**
 * Scanned books: measure page reading on local page images (accuracy by eye + real token cost).
 *   npx tsx scripts/measure-page-reading.ts <model> <image> [image...]    one call, prints each page
 *   npx tsx scripts/measure-page-reading.ts <model> --book <dir> [level]  whole book: batches of 5, then the same
 *     chapters / picture-book / lesson steps as the upload page; prints the lessons and the total cost
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { readPagesSafely as readPageImages } from '../src/lib/book-import/page-reader';
import { dropRepeatedCaptions, readBatches, readToBookPage, validPageRead } from '../src/lib/book-import/scan';
import { isPictureBook, picturePages, planLessons, planPictureLessons, toChapters } from '../src/lib/book-import';

// USD per million tokens (input, output), Gemini list prices.
const PRICES: Record<string, [number, number]> = {
  'gemini-2.5-flash-lite': [0.1, 0.4],
  'gemini-2.5-flash': [0.3, 2.5],
};
const img = (f: string) => ({ data: readFileSync(f).toString('base64'), mimeType: 'image/jpeg' });

async function book(model: string, dir: string, level: string) {
  const files = readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map((f) => join(dir, f));
  const [pi, po] = PRICES[model] ?? [0, 0];
  let cost = 0;
  const t = Date.now();
  const reads = [];
  for (const batch of readBatches(files.map((_, i) => i))) {
    const r = await readPageImages(batch.map((i) => img(files[i])), model);
    cost += (r.inputTokens * pi + r.outputTokens * po) / 1e6;
    reads.push(...r.pages.map((p) => validPageRead(p)));
    process.stdout.write(`.${reads.length}`);
  }
  const skipped = reads.filter((r) => !r || !r.readable).length;
  const pages = dropRepeatedCaptions(reads).map(readToBookPage);
  console.log(`\n${files.length} pages read in ${((Date.now() - t) / 1000).toFixed(0)}s, ${skipped} skipped, $${cost.toFixed(4)} ($${(cost / files.length).toFixed(5)}/page)`);
  if (isPictureBook(pages)) {
    const lessons = planPictureLessons(picturePages(pages), level, 'Book');
    console.log(`Picture book: ${lessons.length} lessons`);
    lessons.forEach((l) => console.log(` - ${l.title}: ${l.pages.length} pages, ${l.words} words`));
    console.log(lessons[0]?.pages.slice(0, 4).map((p) => `[p${p.page}] ${p.text}`).join('\n'));
    return;
  }
  const chapters = toChapters(pages);
  console.log(`Chapters: ${chapters.length}`);
  chapters.forEach((c) => console.log(` - ${c.title} (${c.words} words)`));
  const lessons = planLessons(chapters, level);
  console.log(`Lessons at ${level}: ${lessons.length}`);
  console.log(`\nStart of lesson 1:\n${lessons[0]?.text.slice(0, 1200)}`);
}

async function main() {
  const [model, ...rest] = process.argv.slice(2);
  if (rest[0] === '--book') return book(model, rest[1], rest[2] ?? 'Easy');
  const t = Date.now();
  const r = await readPageImages(rest.map(img), model);
  const [pi, po] = PRICES[model] ?? [0, 0];
  const cost = (r.inputTokens * pi + r.outputTokens * po) / 1e6;
  r.pages.forEach((p, i) => {
    const v = validPageRead(p);
    console.log(`--- ${rest[i]?.split(/[\\/]/).pop()} ${v ? (v.readable ? 'ok' : 'unreadable') : 'REJECTED'}${v?.heading ? ` [heading: ${v.heading}]` : ''}`);
    console.log(v?.text ?? JSON.stringify(p).slice(0, 300));
  });
  console.log(`\n${model}: ${rest.length} pages, ${((Date.now() - t) / 1000).toFixed(1)}s, in ${r.inputTokens} / out ${r.outputTokens} tokens, $${cost.toFixed(5)} ($${(cost / rest.length).toFixed(5)}/page)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
