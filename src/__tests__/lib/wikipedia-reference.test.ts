import { describe, expect, it } from 'vitest';
import { holdBackEnding, kindFromDescription, splitSections } from '@/lib/sources/wikipedia';
import { depthPromptNote } from '@/lib/topic-depth';

describe('wikipedia reference helpers', () => {
  it('reads the kind from the short description', () => {
    expect(kindFromDescription('American singer-songwriter and actress (born 2003)')).toBe('music');
    expect(kindFromDescription('2026 film by Leah McKendrick')).toBe('film');
    expect(kindFromDescription('1997 fantasy novel by J. K. Rowling')).toBe('book');
    expect(kindFromDescription('Portuguese footballer (born 1985)')).toBe('person');
    expect(kindFromDescription('Opening in a planet crust')).toBe('other');
  });

  it('splits an extract into lead and sections', () => {
    const { lead, sections } = splitSections('Lead text.\n\n== Plot ==\nA happens.\n\n== Cast ==\nSomeone');
    expect(lead).toBe('Lead text.');
    expect(sections.map((s) => s.name)).toEqual(['Plot', 'Cast']);
  });

  it('keeps the ending back', () => {
    const { story, ending } = holdBackEnding('One.\nTwo.\nThree.\nFour.\nFive.');
    expect(story).toBe('One.\nTwo.\nThree.');
    expect(ending).toBe('Four.\nFive.');
    expect(holdBackEnding('Short plot.').ending).toBeNull();
  });

  it('only Deep dive changes the prompt', () => {
    expect(depthPromptNote('big')).toBe('');
    expect(depthPromptNote('deep')).toContain('DEEP DIVE');
  });
});
