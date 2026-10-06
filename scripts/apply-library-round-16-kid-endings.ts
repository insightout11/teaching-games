import fs from 'node:fs';
import path from 'node:path';
import { kidEndings } from './library-round-16-kid-endings';
type Version = { text:string; wordCount:number };
type Book = {id:string; summary:string; wordCount:number; retellings:Record<string,Version>};
const file = path.join(process.cwd(),'src/data/book-library.json');
const books = JSON.parse(fs.readFileSync(file,'utf8')) as Book[];
let changed = 0;
for (const book of books) {
  const endings = kidEndings[book.id];
  if (!endings) continue;
  for (const level of ['A2','B1'] as const) {
    const paragraphs = book.retellings[level].text.split(/\n\s*\n/);
    const text = paragraphs.slice(0,-1).concat(endings[level]).join('\n\n');
    const count = text.trim().split(/\s+/).length;
    if (count < 250 || count > 450) throw new Error(`${book.id} ${level}: ${count}`);
    book.retellings[level].text = text; book.retellings[level].wordCount = count;
    if (level === 'A2') {book.summary = text;book.wordCount=count;}
    changed += 1;
  }
}
fs.writeFileSync(file,JSON.stringify(books,null,2)+'\n');
console.log(`Replaced ${changed} additional kids endings.`);
