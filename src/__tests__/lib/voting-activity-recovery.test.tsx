import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuickPulseActivity } from '@/activities/quick-pulse/activity';
import { PredictionRoundActivity } from '@/activities/prediction-round/activity';
import type { ActivityProps, PredictionRoundContent, QuickPulseContent } from '@/activities/types';

// These Next.js client components use the automatic JSX runtime in the app;
// Vitest's server renderer needs the classic runtime available globally.
Object.assign(globalThis, { React });

const baseProps = {
  sessionId: 'session-1',
  students: [],
  currentStudentId: null,
  sessionSettings: { timerSeconds: 30 } as ActivityProps['sessionSettings'],
  onContinue: async () => ({ nextQuestion: 'Next', teacherNote: 'Note' }),
};

const quickPulseContent: QuickPulseContent = {
  activityKey: 'quick-pulse',
  topicContext: 'General',
  prompts: [
    { text: 'First prompt', type: 'yesno' },
    { text: 'Second prompt', type: 'likert' },
    { text: 'Third prompt', type: 'yesno' },
  ],
};

const predictionContent: PredictionRoundContent = {
  activityKey: 'prediction-round',
  topicContext: 'General',
  questions: [
    { text: 'Fingerprints are unique.', optionA: 'True', optionB: 'False', correctAnswer: 'A', revealFact: 'They form before birth.' },
    { text: 'Honeybees recognize faces.', optionA: 'True', optionB: 'False', correctAnswer: 'A', revealFact: 'They learn visual configurations.' },
    { text: 'Bananas are berries.', optionA: 'True', optionB: 'False', correctAnswer: 'A', revealFact: 'Botanically, they are berries.' },
  ],
};

const regeneratedQuickPulseContent: QuickPulseContent = {
  ...quickPulseContent,
  prompts: [
    { ...quickPulseContent.prompts[0], text: 'Regenerated prompt 1' },
    { ...quickPulseContent.prompts[1], text: 'Regenerated prompt 2' },
    { ...quickPulseContent.prompts[2], text: 'Regenerated prompt 3' },
  ],
};

const regeneratedPredictionContent: PredictionRoundContent = {
  ...predictionContent,
  questions: [
    { ...predictionContent.questions[0], text: 'Regenerated question 1', revealFact: 'Regenerated fact 1' },
    { ...predictionContent.questions[1], text: 'Regenerated question 2', revealFact: 'Regenerated fact 2' },
    { ...predictionContent.questions[2], text: 'Regenerated question 3', revealFact: 'Regenerated fact 3' },
  ],
};

describe('live voting activity recovery', () => {
  it('reopens Quick Pulse on the exact revealed prompt with its votes', () => {
    const html = renderToStaticMarkup(<QuickPulseActivity
      {...baseProps}
      generatedContent={regeneratedQuickPulseContent}
      initialRuntimeState={{
        phase: 'revealing',
        currentIndex: 1,
        prompts: quickPulseContent.prompts,
        votes: { 0: {}, 1: { mia: '4' }, 2: {} },
        timeLeft: 12,
        activityInstance: { id: 'quick-pulse:100:1', startedAt: 100 },
      }}
    />);

    expect(html).toContain('Prompt 2 of 3');
    expect(html).toContain('Second prompt');
    expect(html).not.toContain('Regenerated prompt 2');
    expect(html).toContain('NEXT PROMPT');
    expect(html).not.toContain('>START<');
  });

  it('reopens Prediction Round on the exact revealed question with its answer', () => {
    const html = renderToStaticMarkup(<PredictionRoundActivity
      {...baseProps}
      generatedContent={regeneratedPredictionContent}
      initialRuntimeState={{
        phase: 'revealing',
        currentIndex: 1,
        questions: predictionContent.questions,
        deferReveal: false,
        votes: {
          0: {},
          1: { mia: { studentId: 'student-1', clientId: 'mia', displayName: 'Mia', choice: 'True' } },
          2: {},
        },
        timeLeft: 9,
        activityInstance: { id: 'prediction-round:100:1', startedAt: 100 },
        scoredVoteKeys: ['1:mia'],
      }}
    />);

    expect(html).toContain('Question 2 of 3');
    expect(html).toContain('Honeybees recognize faces.');
    expect(html).toContain('They learn visual configurations.');
    expect(html).not.toContain('Regenerated question 2');
    expect(html).not.toContain('Regenerated fact 2');
    expect(html).toContain('NEXT QUESTION');
    expect(html).not.toContain('>START<');
  });
});
