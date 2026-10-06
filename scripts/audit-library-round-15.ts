/** Read-only inventory of existing book retellings for Round 15 authoring. */
import fs from 'node:fs';
import { readingSentences, readingPassages } from './library-reading-sentences';

type Book = { id: string; title: string; retellings: Record<string, { text: string }> };
const books = JSON.parse(fs.readFileSync('src/data/book-library.json', 'utf8')) as Book[];
const detail = process.argv[2];
const showPassages = process.argv.indexOf('--passages') !== -1;
const countsOnly = process.argv.indexOf('--counts') !== -1;
const outline = process.argv.indexOf('--outline') !== -1;
const from = Math.max(0, Number(process.argv[process.argv.indexOf('--from') + 1] || 0));
const limit = Math.max(1, Number(process.argv[process.argv.indexOf('--count') + 1] || books.length));
for (const book of books.slice(from, from + limit)) {
  if (detail && !detail.startsWith('--') && book.id !== detail) continue;
  for (const level of Object.keys(book.retellings)) {
    if (outline && level !== Object.keys(book.retellings)[0]) continue;
    const text = book.retellings[level].text;
    const sentences = readingSentences(text);
    const paragraphs = text.split(/\n\s*\n/);
    if (countsOnly) { console.log(`${book.id} ${level} ${Math.ceil(sentences.length / 4)}`); continue; }
    console.log(`${book.id} ${level}: ${sentences.length} sentences, ${paragraphs.length} paragraphs, ${text.trim().split(/\s+/).length} words`);
    if (detail && !detail.startsWith('--')) sentences.forEach((sentence, index) => console.log(`${index + 1}. ${sentence}`));
    if (showPassages) readingPassages(text).forEach((passage, index) => console.log(`  ${index + 1}. ${passage}`));
    if (outline) readingPassages(text).forEach((passage, index) => console.log(`  ${index + 1}. ${passage.slice(0, 105).replace(/\s+/g, ' ')} ... ${passage.slice(-95).replace(/\s+/g, ' ')}`));
  }
}
