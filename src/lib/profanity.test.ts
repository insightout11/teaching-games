import { describe, expect, it } from 'vitest';
import { mentionsName } from './profanity';

describe('Word Cloud first-name matching', () => {
  it('matches case-insensitively anywhere as a whole word', () => {
    expect(mentionsName('I like MIA!', ['Mia K'])).toBe(true);
    expect(mentionsName('Sam is kind', ['Sam Jones'])).toBe(true);
    expect(mentionsName('Hello, (mia).', ['Mia'])).toBe(true);
  });
  it('does not match parts of words or surnames', () => {
    expect(mentionsName('samantha and sammy', ['Sam'])).toBe(false);
    expect(mentionsName('Jones', ['Sam Jones'])).toBe(false);
    expect(mentionsName('sam123', ['Sam'])).toBe(false);
  });
  it('ignores first names shorter than three letters and empty names', () => {
    expect(mentionsName('Al Jo Bo', ['Al', 'Jo Smith', 'Bo', ''])).toBe(false);
    expect(mentionsName('Ana', ['Ana'])).toBe(true);
  });
  it('handles accented and Thai names with whole-word boundaries', () => {
    expect(mentionsName('Hi, JOSÉ!', ['José'])).toBe(true);
    expect(mentionsName('Hello สมชาย!', ['สมชาย'])).toBe(true);
    expect(mentionsName('Joséa', ['José'])).toBe(false);
  });
  it('treats regex punctuation literally', () => {
    expect(mentionsName('AnnX', ['Ann.'])).toBe(false);
    expect(mentionsName('Hi Ann. today', ['Ann.'])).toBe(true);
  });
});
