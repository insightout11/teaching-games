import { describe, expect, it } from 'vitest';
import {
  buildFallbackCaptainSuggestions,
  sanitizeCaptainSuggestions,
  type CaptainSuggestionSourceSubmission,
} from './captain-suggestions';

const submissions: CaptainSuggestionSourceSubmission[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Mina',
    content: 'I think cities should make more quiet public spaces because people need rest.',
    status: 'pending',
    gameKey: 'captain-suggestion-question',
    createdAt: '2026-06-05T10:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    displayName: 'Leo',
    content: 'Better trains would help.',
    status: 'approved',
    gameKey: 'discussion',
    createdAt: '2026-06-05T10:01:00.000Z',
  },
];

describe('captain suggestions', () => {
  it('builds useful fallback actions without student submissions', () => {
    const suggestions = buildFallbackCaptainSuggestions({
      topic: 'future cities',
      difficulty: 'Intermediate',
      submissions: [],
    });

    expect(suggestions.map((s) => s.kind)).toEqual(['question', 'poll']);
    expect(suggestions[0].prompt).toContain('future cities');
    expect(suggestions[1].options?.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps spotlight suggestions tied to real submissions', () => {
    const fallback = buildFallbackCaptainSuggestions({
      topic: 'future cities',
      difficulty: 'Intermediate',
      submissions,
    });

    const suggestions = sanitizeCaptainSuggestions(
      [
        {
          kind: 'spotlight',
          title: 'Spotlight Mina',
          rationale: 'This gives everyone a clear idea to discuss.',
          prompt: 'Show this idea.',
          sourceSubmissionId: submissions[0].id,
        },
        {
          kind: 'spotlight',
          title: 'Bad source',
          rationale: 'This should be removed.',
          prompt: 'Show this idea.',
          sourceSubmissionId: 'missing',
        },
        {
          kind: 'poll',
          title: 'Pick direction',
          rationale: 'Choose the next direction quickly.',
          prompt: 'Which city idea matters most?',
          options: ['Transport', 'Green space', 'Transport'],
        },
      ],
      submissions,
      fallback,
    );

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toMatchObject({
      kind: 'spotlight',
      sourceSubmissionId: submissions[0].id,
      sourceStudentName: 'Mina',
    });
    expect(suggestions[1].options).toEqual(['Transport', 'Green space']);
  });
});
