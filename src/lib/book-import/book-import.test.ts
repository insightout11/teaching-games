import { describe, expect, it } from 'vitest';
import { planLessons, toChapters, unspace, type BookPage } from './index';
import { linesFromTextItems } from './pdf-lines';

const body = (s: string) => ({ text: s, size: 10 });
const head = (s: string) => ({ text: s, size: 20 });
const filler = (n: number) => Array.from({ length: n }, (_, i) => body(`This is line ${i} of the story and it keeps going on and on here.`));

// A small book: running header + page number on every page, a drop-cap-free chapter heading,
// a hyphenated word across lines, and a second chapter.
function book(): BookPage[] {
  return [
    { lines: [body('My Little Book 1'), head('Chapter I.'), head('The Start'), body('Once upon a time there was a rab-'), body('bit who lived in a hole.'), ...filler(10), body('1')] },
    { lines: [body('My Little Book 2'), ...filler(12), body('2')] },
    { lines: [body('My Little Book 3'), head('Chapter II.'), head('The End'), ...filler(12), body('3')] },
    { lines: [body('My Little Book 4'), ...filler(12), body('4')] },
  ];
}

describe('book import', () => {
  it('drops running headers and page numbers, joins headings, rejoins hyphenated words', () => {
    const ch = toChapters(book());
    expect(ch.map((c) => c.title)).toEqual(['Chapter I. The Start', 'Chapter II. The End']);
    const text = ch[0].paragraphs.join(' ');
    expect(text).toContain('rabbit who lived');
    expect(text).not.toMatch(/My Little Book/);
  });

  it('never treats dialogue or sentences starting with "part" as headings', () => {
    const pages: BookPage[] = [{ lines: [head('Chapter 1'), ...filler(12), body('part closed upon and held me tight.'), body('‘Wah!’'), ...filler(12)] }];
    expect(toChapters(pages)).toHaveLength(1);
  });

  it('joins letter-spaced titles only when they are letter-spaced', () => {
    expect(unspace('T H E TA L E O F')).toBe('THETALEOF');
    expect(unspace('7. I Go to Bristol')).toBe('7. I Go to Bristol');
  });

  it('groups short chapters (2–3 a lesson) and splits long ones by level', () => {
    const short = Array.from({ length: 6 }, (_, i) => ({ title: `Chapter ${i + 1}`, paragraphs: ['x '.repeat(200).trim()], words: 200 }));
    const easy = planLessons(short, 'Easy');
    expect(easy.length).toBe(3);
    expect(easy[0].chapters).toEqual(['Chapter 1', 'Chapter 2']);
    const long = [{ title: 'Big', paragraphs: Array.from({ length: 10 }, () => 'y '.repeat(250).trim()), words: 2500 }];
    expect(planLessons(long, 'Intermediate').map((l) => l.title)).toEqual(['Big (part 1)', 'Big (part 2)', 'Big (part 3)']);
  });

  it('builds lines from pdf.js items and puts a drop cap back on the first line', () => {
    const it = (str: string, x: number, y: number, size: number, width = 100) => ({ str, transform: [size, 0, 0, size, x, y], width });
    const lines = linesFromTextItems([
      it('lice was beginning to get very tired', 40, 700, 10, 200),
      it('A', 30, 688, 28.5, 9),
      it('sister on the bank, and of having nothing', 40, 688, 10, 200),
    ]);
    expect(lines.map((l) => l.text)).toEqual(['Alice was beginning to get very tired', 'sister on the bank, and of having nothing']);
    expect(lines[1].size).toBe(10);
  });
});
