import { describe, it, expect } from 'vitest';
import { getStageActionLabel } from '@/components/session/flight-session-view';

describe('stage action label', () => {
  it('does not advertise the next stage while the activity is unfinished', () => {
    const label = getStageActionLabel({
      isModuleFinished: false,
      isFinalSlot: false,
      nextLabel: 'Briefing',
    });

    // The reported regression: "Continue to Briefing" shown at Question 1 of 3.
    expect(label).not.toBe('Continue to Briefing');
    expect(label).toMatch(/^Skip to /);
  });

  it('only says Continue once the activity reports finished', () => {
    expect(
      getStageActionLabel({ isModuleFinished: true, isFinalSlot: false, nextLabel: 'Briefing' }),
    ).toBe('Continue to Briefing');
  });

  it('walks a three-question activity without offering Continue early', () => {
    // Prediction Round reports finished only after the final question is revealed.
    const progression = [
      { question: 1, isModuleFinished: false },
      { question: 2, isModuleFinished: false },
      { question: 3, isModuleFinished: false },
      { question: 3, isModuleFinished: true },
    ];

    const labels = progression.map((step) =>
      getStageActionLabel({
        isModuleFinished: step.isModuleFinished,
        isFinalSlot: false,
        nextLabel: 'Briefing',
      }),
    );

    expect(labels.slice(0, 3)).toEqual(['Skip to Briefing', 'Skip to Briefing', 'Skip to Briefing']);
    expect(labels[3]).toBe('Continue to Briefing');
  });

  it('uses end-of-lesson wording on the final slot', () => {
    expect(
      getStageActionLabel({ isModuleFinished: true, isFinalSlot: true }),
    ).toBe('Finish Lesson');
    expect(
      getStageActionLabel({ isModuleFinished: false, isFinalSlot: true }),
    ).toBe('Skip to the end');
  });
});
