import { describe, expect, it } from 'vitest';
import { normalizePastedSourceMaterial, preparePastedSource } from './pasted-source';

describe('pasted source identity', () => {
  it('detects a short standalone Markdown title and removes it from the body', () => {
    const result = preparePastedSource("# Mina's Lunch\n\nMina eats rice and chicken with Leo.");
    expect(result).toEqual({
      title: "Mina's Lunch",
      body: 'Mina eats rice and chicken with Leo.',
      detectedTitle: true,
    });
  });

  it('prefers an explicit teacher title without deleting body text', () => {
    const result = preparePastedSource('A first sentence.\nA second sentence.', 'Lunch at School');
    expect(result.title).toBe('Lunch at School');
    expect(result.body).toContain('A first sentence.');
  });

  it('still removes an auto-detected first line when that title is posted explicitly', () => {
    const result = preparePastedSource("Mina's Lunch\n\nMina drinks water with Leo.", "Mina's Lunch");
    expect(result.title).toBe("Mina's Lunch");
    expect(result.body).toBe('Mina drinks water with Leo.');
  });

  it('upgrades existing generic pasted sources compatibly', () => {
    const source = normalizePastedSourceMaterial({
      sourceType: 'text',
      title: 'Pasted Text',
      summary: 'Lunch at school.',
      rawText: "Mina's Lunch\n\nMina drinks water.",
    });
    expect(source?.title).toBe("Mina's Lunch");
    expect(source?.rawText).toBe('Mina drinks water.');
  });
});
