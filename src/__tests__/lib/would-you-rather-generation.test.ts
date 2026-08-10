import { describe, expect, it, vi } from 'vitest';
import {
  generateValidatedWouldYouRather,
  validateBeginnerWouldYouRather,
  type RawWouldYouRatherContent,
} from '@/lib/would-you-rather-generation';

function beginnerBatch(prefix = 'food'): RawWouldYouRatherContent {
  const dilemmas = Array.from({ length: 5 }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    optionA: index % 2 === 0 ? 'Eat pizza every day' : 'Cook rice at home',
    optionB: index % 2 === 0 ? 'Drink only water' : 'Eat fruit for lunch',
    discussionPrompt: 'Which food choice is better for you?',
  }));
  return {
    dilemmas,
    potentialFollowUps: dilemmas.map((dilemma) => ({
      dilemmaId: dilemma.id,
      questions: ['Why do you like this food?', 'Who eats with you?', 'When do you eat it?'],
    })),
  };
}

function advancedBatch(): RawWouldYouRatherContent {
  const batch = beginnerBatch('bad');
  batch.dilemmas[0] = {
    ...batch.dilemmas[0],
    optionA: 'Teleport to a mysterious restaurant every evening',
    optionB: 'Eat outside in a gentle breeze',
  };
  return batch;
}

describe('Beginner Would You Rather generation', () => {
  it('accepts a concrete, short, topic-grounded batch', () => {
    expect(validateBeginnerWouldYouRather(beginnerBatch(), 'Food and drinks')).toEqual({
      valid: true,
      reasons: [],
    });
  });

  it('retries once with correction feedback and the shared language rule', async () => {
    const generate = vi.fn()
      .mockResolvedValueOnce(advancedBatch())
      .mockResolvedValueOnce(beginnerBatch('fixed'));

    const result = await generateValidatedWouldYouRather({
      topic: 'Food and drinks',
      difficulty: 'Beginner',
      context: 'LESSON STAGE: Practice',
      generate,
    });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[0][0]).toContain('LANGUAGE RULE');
    expect(generate.mock.calls[0][0]).toContain('A1 level');
    expect(generate.mock.calls[1][0]).toContain('CORRECT THE PREVIOUS OUTPUT');
    expect(result.dilemmas[0].id).toBe('fixed-1');
  });

  it('falls back to safe food language when the correction still fails', async () => {
    const generate = vi.fn().mockResolvedValue(advancedBatch());
    const result = await generateValidatedWouldYouRather({
      topic: 'Food and drinks',
      difficulty: 'Beginner',
      generate,
    });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(result.dilemmas[0]).toMatchObject({
      optionA: 'Eat pizza every day',
      optionB: 'Drink only water',
    });
    expect(JSON.stringify(result)).not.toMatch(/teleport|gentle breeze/i);
  });

  it('uses the safe fallback when the correction request fails', async () => {
    const generate = vi.fn()
      .mockResolvedValueOnce(advancedBatch())
      .mockRejectedValueOnce(new Error('provider unavailable'));
    const result = await generateValidatedWouldYouRather({
      topic: 'Food and drinks',
      difficulty: 'Beginner',
      generate,
    });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(result.dilemmas[0].optionA).toBe('Eat pizza every day');
  });

  it('keeps non-Beginner generation to one pass', async () => {
    const generate = vi.fn().mockResolvedValue(advancedBatch());
    const result = await generateValidatedWouldYouRather({
      topic: 'Food and drinks',
      difficulty: 'Intermediate',
      generate,
    });

    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.dilemmas[0].optionA).toContain('Teleport');
  });
});
