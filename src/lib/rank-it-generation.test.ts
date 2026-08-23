import { describe, expect, it, vi } from 'vitest';
import { buildSourceGroundingContract } from './source-grounding';
import { generateGroundedRankIt } from './rank-it-generation';

const contract = buildSourceGroundingContract({
  sourceType: 'text',
  title: "Mina's Lunch",
  summary: 'Mina and Leo eat lunch.',
  rawText: 'Mina eats rice, chicken, and an apple. Leo eats noodles and a banana. They drink water and milk.',
}, 'Food and lunch');
const schema = { type: 'object' as const, properties: {}, required: [] };
const unrelated = { challenges: [{ id: '1', prompt: 'Rank these objects', items: [
  { id: 'a', name: 'Keys', hiddenFact: 'They open doors.' },
  { id: 'b', name: 'Phone', hiddenFact: 'It calls people.' },
  { id: 'c', name: 'Bed', hiddenFact: 'It is for sleep.' },
] }] };
const grounded = { challenges: [{ id: '1', prompt: 'Rank Mina and Leo lunch foods', items: [
  { id: 'a', name: 'Rice', hiddenFact: 'Mina eats rice.' },
  { id: 'b', name: 'Chicken', hiddenFact: 'Mina and Leo share chicken.' },
  { id: 'c', name: 'Apple', hiddenFact: 'Mina likes apples.' },
] }] };

describe('grounded Rank It generation', () => {
  it('retries an unrelated set once with correction feedback', async () => {
    const generate = vi.fn().mockResolvedValueOnce(unrelated).mockResolvedValueOnce(grounded);
    const result = await generateGroundedRankIt({ topic: 'Food', prompt: 'Generate', schema, contract, generate });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1][0]).toContain('CORRECTION REQUIRED');
    expect(result.challenges[0].items[0].name).toBe('Rice');
  });

  it('falls back to source-derived items after two invalid attempts', async () => {
    const generate = vi.fn().mockResolvedValue(unrelated);
    const result = await generateGroundedRankIt({ topic: 'Food', prompt: 'Generate', schema, contract, generate });
    expect(result.challenges[0].prompt).toContain("Mina's Lunch");
    expect(result.challenges[0].items.some((item) => item.name === 'Mina')).toBe(true);
  });
});
