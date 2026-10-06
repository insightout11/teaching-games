import { describe, expect, it } from 'vitest';
import { validSimplified } from './reading-pack';

const original = 'Alice was beginning to get very tired of sitting by her sister on the bank. Suddenly a White Rabbit with pink eyes ran close by her. '.repeat(6);

describe('validSimplified', () => {
  it('accepts a faithful, shorter retelling', () => {
    const s = 'Alice was tired. She sat with her sister by the river. Then a White Rabbit ran past her. It had pink eyes. '.repeat(4);
    expect(validSimplified(original, s)).toBe(s.trim());
  });
  it('rejects new names, commentary, and too-short text', () => {
    expect(validSimplified(original, 'Alice was tired. Then Captain Smollett came by the bank with her sister. '.repeat(6))).toBeNull();
    expect(validSimplified(original, `${'Alice was tired by the bank. '.repeat(10)}\n\nThis chapter shows that Alice is curious.`)).toBeNull();
    expect(validSimplified(original, 'Alice was tired.')).toBeNull();
  });
});
