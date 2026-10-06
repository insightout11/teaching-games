import { describe, expect, it } from 'vitest';
import { needsReading, readBatches, readToBookPage, validPageRead } from './scan';
import { toChapters } from './index';

describe('scanned books', () => {
  it('needs reading only when the PDF has (almost) no text inside', () => {
    const empty = Array.from({ length: 10 }, () => ({ lines: [] }));
    expect(needsReading(empty)).toBe(true);
    const text = Array.from({ length: 10 }, () => ({ lines: [{ text: 'Peter ran into the garden and hid under a pot.', size: 10 }] }));
    expect(needsReading(text)).toBe(false);
  });

  it('checks each page: normal words, drop caps, unreadable, refusals and noise', () => {
    expect(validPageRead({ text: 'HE found a door in a wall.\n\nAND tried to put his foot upon Peter.', heading: '', readable: true })?.text)
      .toBe('He found a door in a wall.\n\nAnd tried to put his foot upon Peter.');
    expect(validPageRead({ text: 'x', heading: '', readable: false })).toEqual({ text: '', heading: '', readable: false });
    expect(validPageRead({ text: 'The image shows a rabbit in a garden.', heading: '', readable: true })).toBeNull();
    expect(validPageRead({ text: '%$# 3@! ~~ 1|1 ;;; ### @@', heading: '', readable: true })).toBeNull();
    expect(validPageRead({ text: '', heading: '', readable: true })).toEqual({ text: '', heading: '', readable: true });
  });

  it('turns read pages into chapters, with the heading once', () => {
    const page = (heading: string, text: string) => readToBookPage(validPageRead({ text, heading, readable: true }));
    const body = (w: string) => `Peter went to school with his ${w} and his lunch, and he sat by the window all day long. `.repeat(4).trim();
    const pages = [page('Chapter 1: School', `Chapter 1: School

${body('bag')}`), page('', body('book')), page('Chapter 2: Home', body('hat')), page('', body('coat'))];
    expect(pages[0].lines.filter((l) => l.size === 20)).toHaveLength(1);
    expect(toChapters(pages).map((c) => c.title)).toEqual(['Chapter 1: School', 'Chapter 2: Home']);
  });

  it('batches pages five at a time', () => {
    expect(readBatches([1, 2, 3, 4, 5, 6, 7])).toEqual([[1, 2, 3, 4, 5], [6, 7]]);
  });
});

describe('scanned page joins', () => {
  it('rejoins words split at line ends and runs a paragraph on across a page break', () => {
    expect(validPageRead({ text: 'and Cot- ton-tail and some- thing', heading: '', readable: true })?.text).toBe('and Cotton-tail and something');
    const a = readToBookPage(validPageRead({ text: 'Peter climbed up to see how it looked way down', heading: '', readable: true }));
    expect(a.lines[0].para).toBe(false);
    const b = readToBookPage(validPageRead({ text: 'He fell in.', heading: '', readable: true }));
    expect(b.lines[0].para).toBe(true);
  });
});

describe('picture captions', () => {
  it('drops a caption that repeats the next page, and normalises drop caps before a comma', async () => {
    const { dropRepeatedCaptions } = await import('./scan');
    const r = (text: string) => ({ text, heading: '', readable: true });
    const out = dropRepeatedCaptions([r('Then old Mrs. Rabbit took a basket'), r('Then old Mrs. Rabbit took a basket and her umbrella and went through the wood.')]);
    expect(out[0]?.text).toBe('');
    expect(out[1]?.text).toContain('umbrella');
    expect(validPageRead(r('NOW, my dears, said old Mrs. Rabbit.'))?.text).toBe('Now, my dears, said old Mrs. Rabbit.');
  });
});
