/** Replace Round 6's reflective padding with chapter-scoped narrative scenes. */
import fs from 'node:fs';
import path from 'node:path';
import { readingSentences } from './library-reading-sentences';
import { sceneSupplements, storyScenes } from './library-round-16-story-scenes';

type Version = { text: string; wordCount: number };
type Book = { id: string; summary: string; wordCount: number; retellings: Record<string, Version> };
const file = path.join(process.cwd(), 'src/data/book-library.json');
const books = JSON.parse(fs.readFileSync(file, 'utf8')) as Book[];
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
let changed = 0;
const lengthIssues: string[] = [];

function storyOnly(text: string, id: string): string {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (id.startsWith('book6-treasure-island-')) {
    if (paragraphs.length < 4 || !paragraphs[paragraphs.length-1].startsWith('The ')) throw new Error(`${id}: expected treasure padding`);
    return paragraphs.slice(0,-1).join(' ');
  }
  if (paragraphs.length !== 2 || !/^(This part of the story|The episode marks)/.test(paragraphs[1])) throw new Error(`${id}: expected reflective padding`);
  return paragraphs[0];
}

function weave(base: string, additions: [string,string,string], extra?: [string,string,string]): string {
  const sentences = readingSentences(base);
  if (sentences.length < 6) throw new Error('Story needs at least six sentences to weave scenes');
  const boundaries = [Math.ceil(sentences.length/3), Math.ceil(2*sentences.length/3), sentences.length];
  const paragraphs: string[] = [];
  let start = 0;
  for (let index = 0; index < 3; index += 1) {
    const parts = [sentences.slice(start,boundaries[index]).join(' '), additions[index]];
    if (extra) parts.push(extra[index]);
    paragraphs.push(parts.join(' '));
    start = boundaries[index];
  }
  return paragraphs.join('\n\n');
}

for (const book of books) {
  const details = storyScenes[book.id];
  if (!details) continue;
  for (const level of ['B1','B2']) {
    const version = book.retellings[level];
    if (!version) throw new Error(`${book.id}: missing ${level}`);
    if (!/(?:The adults around Jim|The ship carries more than|The island changes the scale|The final search changes|This part of the story|The episode marks)/.test(version.text)) {
      throw new Error(`${book.id} ${level}: expected original text; script is intentionally single-use`);
    }
    const base = details.base ? details.base.replace(/\n\s*\n/g,' ') : storyOnly(version.text,book.id);
    const additions: [string,string,string] = [details.b1[0], details.b1[1], details.b1[2]];
    if (sceneSupplements[book.id]) additions[1] += ' ' + sceneSupplements[book.id];
    const text = weave(base,additions,level==='B2' ? details.b2 : undefined);
    const count = wordCount(text);
    const min = level === 'B2' ? 400 : 300;
    const max = level === 'B2' ? 600 : 500;
    if (count < min || count > max) lengthIssues.push(`${book.id} ${level}: ${count} words outside ${min}–${max}`);
    version.text = text; version.wordCount = count;
    if (level === 'B1') { book.summary = text; book.wordCount = count; }
    changed += 1;
  }
}
if (changed !== 48) throw new Error(`Expected 48 teen retellings; found ${changed}`);
if (lengthIssues.length) throw new Error(lengthIssues.join('\n'));
fs.writeFileSync(file, JSON.stringify(books,null,2)+'\n');
console.log(`Replaced padding in ${changed} teen retellings.`);
