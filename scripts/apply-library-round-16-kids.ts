/** Replace early kids lessons that crossed into later chapters. */
import fs from 'node:fs';
import path from 'node:path';
import { kidReplacements } from './library-round-16-kid-replacements';
import { fableEndings } from './library-round-16-fable-endings';

type Version = { text: string; wordCount: number };
type Book = { id: string; summary: string; wordCount: number; retellings: Record<string, Version> };
const file = path.join(process.cwd(), 'src/data/book-library.json');
const books = JSON.parse(fs.readFileSync(file,'utf8')) as Book[];
let changed = 0;
for (const book of books) {
  const replacement = kidReplacements[book.id];
  if (!replacement) continue;
  for (const level of ['A2','B1'] as const) {
    const text = replacement[level];
    const count = text.trim().split(/\s+/).length;
    if (count < 250 || count > 450) throw new Error(`${book.id} ${level}: ${count} words outside 250–450`);
    book.retellings[level].text = text;
    book.retellings[level].wordCount = count;
    if (level === 'A2') { book.summary = text; book.wordCount = count; }
    changed += 1;
  }
}
for (const book of books) {
  const endings = fableEndings[book.id];
  if (!endings) continue;
  for (const level of ['A2','B1'] as const) {
    const paragraphs = book.retellings[level].text.split(/\n\s*\n/);
    const text = paragraphs.slice(0,2).concat(endings[level]).join('\n\n');
    const count = text.trim().split(/\s+/).length;
    if (count < 250 || count > 450) throw new Error(`${book.id} ${level}: ${count} words outside 250–450`);
    book.retellings[level].text = text;
    book.retellings[level].wordCount = count;
    if (level === 'A2') { book.summary = text; book.wordCount = count; }
    changed += 1;
  }
}
if (changed !== (Object.keys(kidReplacements).length+Object.keys(fableEndings).length)*2) throw new Error(`Changed ${changed} kid retellings`);
fs.writeFileSync(file, JSON.stringify(books,null,2)+'\n');
console.log(`Replaced ${changed} early kids retellings.`);
