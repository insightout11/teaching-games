import { describe, expect, it } from 'vitest';
import { buildSafePredictionQuestions, isObjectivePredictionQuestion } from '@/lib/prediction-quality';

const objective = {
  text: 'The first Hallyu exports were television dramas.',
  optionA: 'True', optionB: 'False', correctAnswer: 'A',
  revealFact: 'Television dramas were among the earliest major exports.',
};

describe('Prediction Round question quality', () => {
  it('accepts specific, verifiable factual claims', () => {
    expect(isObjectivePredictionQuestion(objective)).toBe(true);
  });

  it('rejects subjective rankings and interpretations', () => {
    expect(isObjectivePredictionQuestion({ ...objective, text: 'Seoul is the most important city for Hallyu.' })).toBe(false);
    expect(isObjectivePredictionQuestion({ ...objective, text: 'A city decides which parts of its history to protect and show.' })).toBe(false);
  });

  it('replaces a rejected claim with an objective fallback', () => {
    const questions = buildSafePredictionQuestions([
      { ...objective, text: 'Seoul is the most important city for Hallyu.' },
      objective,
      objective,
    ], 'Hallyu');
    expect(questions[0]).toMatchObject({ optionA: 'True', optionB: 'False', correctAnswer: 'A' });
    expect(questions[0].text).toBe("Today's lesson focuses on Hallyu.");
  });
});
