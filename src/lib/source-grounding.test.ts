import { describe, expect, it } from 'vitest';
import { buildSourceGroundingContract, validateGroundedStrings } from './source-grounding';

const mina = {
  sourceType: 'text' as const,
  title: "Mina's Lunch",
  summary: 'Mina and Leo eat lunch at school.',
  rawText: 'Mina has rice, chicken, and an apple. Leo has noodles and a banana. Mina drinks water. Leo drinks milk.',
};

describe('source grounding contract', () => {
  const contract = buildSourceGroundingContract(mina, 'Food and lunch');

  it('accepts structured content grounded in the source', () => {
    expect(validateGroundedStrings([
      'Rank the lunch foods', 'rice', 'chicken', 'apple', 'banana', 'water',
    ], contract).valid).toBe(true);
  });

  it('rejects the unrelated Rank It evidence set', () => {
    const result = validateGroundedStrings(['Keys', 'Phone', 'Water', 'Bed'], contract);
    expect(result.valid).toBe(false);
    expect(result.overlap).toEqual(['water']);
  });
});
