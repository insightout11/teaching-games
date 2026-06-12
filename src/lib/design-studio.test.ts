import { describe, expect, it } from 'vitest';
import {
  applyDesignStudioDecision,
  buildFallbackDesignStudioBrief,
  normalizeDesignStudioBrief,
  normalizeDesignStudioRound,
  optionIdFromChoice,
  resolveDesignStudioWinner,
} from './design-studio';
import type { DesignStudioRound, DesignStudioState } from '@/activities/types';

const initialState: DesignStudioState = {
  challenge: 'Design a public park that works for everyone.',
  originalIdeas: ['Add gardens and places to play.'],
  designSummary: 'A public park for the whole community.',
  decisions: [],
};

const round: DesignStudioRound = {
  stage: 'People',
  question: 'Who should the park support first?',
  whyItMatters: 'The priority changes the whole design.',
  designSummary: initialState.designSummary,
  options: [
    {
      id: 'A',
      title: 'Families',
      description: 'Prioritize spaces for families.',
      benefit: 'Families can spend time together.',
      tradeoff: 'Quiet spaces receive less room.',
      designChange: 'The park prioritizes flexible spaces for families.',
    },
    {
      id: 'B',
      title: 'Teenagers',
      description: 'Prioritize spaces for teenagers.',
      benefit: 'Teenagers have a safe social space.',
      tradeoff: 'Some areas may be noisier.',
      designChange: 'The park prioritizes safe social spaces for teenagers.',
    },
    {
      id: 'C',
      title: 'Older residents',
      description: 'Prioritize spaces for older residents.',
      benefit: 'Older residents can use the park comfortably.',
      tradeoff: 'Active recreation receives less room.',
      designChange: 'The park prioritizes accessible spaces for older residents.',
    },
  ],
};

describe('Design Studio decision engine', () => {
  it('reads option ids from student-controller labels', () => {
    expect(optionIdFromChoice('B')).toBe('B');
    expect(optionIdFromChoice('c: Older residents')).toBe('C');
    expect(optionIdFromChoice('unknown')).toBeNull();
  });

  it('resolves the class vote and keeps the first option as the tie breaker', () => {
    expect(resolveDesignStudioWinner(round.options, [
      { clientId: '1', choice: 'B' },
      { clientId: '2', choice: 'B: Teenagers' },
      { clientId: '3', choice: 'A' },
    ]).id).toBe('B');

    expect(resolveDesignStudioWinner(round.options, [])).toBe(round.options[0]);
  });

  it('applies a decision without erasing the decision history', () => {
    const afterFirst = applyDesignStudioDecision(initialState, round, round.options[1]);
    const afterSecond = applyDesignStudioDecision(afterFirst, round, round.options[2]);

    expect(afterSecond.designSummary).toBe(round.options[2].designChange);
    expect(afterSecond.decisions).toHaveLength(2);
    expect(afterSecond.decisions.map((decision) => decision.roundNumber)).toEqual([1, 2]);
  });

  it('normalizes incomplete AI rounds into exactly three usable options', () => {
    const normalized = normalizeDesignStudioRound({
      stage: 'Starting Direction',
      question: 'Which direction?',
      options: [{ id: 'wrong', title: 'A garden network' }],
    }, initialState);

    expect(normalized.options.map((option) => option.id)).toEqual(['A', 'B', 'C']);
    expect(normalized.options.every((option) => option.description && option.tradeoff && option.designChange)).toBe(true);
    expect(normalized.question).toBe('Which direction?');
  });

  it('builds a fallback brief from the choices the class made', () => {
    const decided = applyDesignStudioDecision(initialState, round, round.options[1]);
    const brief = buildFallbackDesignStudioBrief(decided);

    expect(brief.summary).toBe(round.options[1].designChange);
    expect(brief.coreFeatures).toContain('Teenagers');
    expect(brief.remainingTradeoffs).toContain(round.options[1].tradeoff);
  });

  it('fills incomplete final briefs from the class decision history', () => {
    const decided = applyDesignStudioDecision(initialState, round, round.options[1]);
    const brief = normalizeDesignStudioBrief({ title: 'Park Together', coreFeatures: [] }, decided);

    expect(brief.title).toBe('Park Together');
    expect(brief.summary).toBe(round.options[1].designChange);
    expect(brief.coreFeatures).toContain('Teenagers');
    expect(brief.pitch).toContain(initialState.challenge);
  });
});
