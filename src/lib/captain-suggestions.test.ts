import { describe, expect, it } from 'vitest';
import {
  buildCaptainSuggestionsPrompt,
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

    expect(suggestions.map((s) => s.kind)).toEqual(['question', 'question', 'poll']);
    expect(suggestions[0].prompt).toContain('future cities');
    expect(suggestions[1].prompt).toContain('future cities');
    expect(suggestions[0].prompt.length).toBeGreaterThan(20);
    expect(suggestions[1].prompt.length).toBeGreaterThan(20);
    expect(suggestions[0].prompt).not.toBe(suggestions[1].prompt);
    expect(suggestions[2].options?.length).toBeGreaterThanOrEqual(2);
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
      tag: 'idea', // default when the model omits it
    });
    expect(suggestions[1].options).toEqual(['Transport', 'Green space']);
  });

  it('keeps a spotlight highlight only when it is a real phrase from the submission', () => {
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
          rationale: 'Strong phrase worth showing.',
          prompt: 'Show this idea.',
          sourceSubmissionId: submissions[0].id,
          tag: 'wordcraft',
          highlight: 'quiet public spaces',
        },
        {
          kind: 'spotlight',
          title: 'Spotlight Leo',
          rationale: 'Highlight is invented, must be dropped.',
          prompt: 'Show this idea.',
          sourceSubmissionId: submissions[1].id,
          tag: 'answer',
          highlight: 'high-speed rail network',
        },
        {
          kind: 'question',
          title: 'Quick opinion',
          rationale: 'Keeps the class thinking about Mina\'s idea.',
          prompt: 'Would YOU use a quiet public space? Why or why not?',
        },
      ],
      submissions,
      fallback,
    );

    expect(suggestions[0]).toMatchObject({ tag: 'wordcraft', highlight: 'quiet public spaces' });
    expect(suggestions[1].highlight).toBeUndefined();
    expect(suggestions[1].tag).toBe('answer');
  });

  it('never tells the model the topic is General', () => {
    const prompt = buildCaptainSuggestionsPrompt({
      topic: 'General',
      difficulty: 'Intermediate',
      submissions,
    });

    expect(prompt).not.toContain('Lesson topic: General');
    expect(prompt).toContain('infer it from the student writing');
  });

  it('includes live telemetry when provided', () => {
    const prompt = buildCaptainSuggestionsPrompt({
      topic: 'future cities',
      difficulty: 'Intermediate',
      submissions,
      stageLabel: 'Explore',
      nextStageLabel: 'Debate',
      vocab: ['commute', 'infrastructure'],
      quietStudents: ['Ana'],
      recentScores: [{ studentName: 'Leo', accuracyStatus: 'incorrect' }],
      lastPoll: { question: 'Best transport?', results: [{ option: 'Bikes', votes: 4 }, { option: 'Trains', votes: 2 }] },
    });

    expect(prompt).toContain('Lesson topic: future cities');
    expect(prompt).toContain('Current stage: Explore');
    expect(prompt).toContain('Next stage: Debate');
    expect(prompt).toContain('commute, infrastructure');
    expect(prompt).toContain('Quiet so far (no recent answers): Ana');
    expect(prompt).toContain('Leo:incorrect');
    expect(prompt).toContain('Bikes=4');
  });
});
