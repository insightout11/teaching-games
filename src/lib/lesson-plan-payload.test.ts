import { describe, expect, it } from 'vitest';
import {
  lessonPlanStorageKey,
  parseLessonPlanPayload,
  resolveLessonPlanPayload,
} from './lesson-plan-payload';

describe('lesson plan persistence boundary', () => {
  it('keeps the guided route and source context needed by a fresh teacher tab', () => {
    const parsed = parseLessonPlanPayload({
      customTopic: 'Seoul: Neighborhoods and Change',
      difficulty: 'Easy',
      goal: 'Discuss evidence',
      slots: [
        { type: 'activity', key: 'read-aloud', name: 'Captain Briefing', stageLabel: 'Briefing' },
        { type: 'game', key: 'flash-quiz', name: 'Flash Quiz' },
      ],
      sourceMaterial: {
        sourceType: 'world-flight',
        title: 'Seoul: Neighborhoods and Change',
        summary: 'A grounded source summary.',
        briefingText: 'Student-facing reading.',
      },
      generatedContent: { 'read-aloud': { activityKey: 'read-aloud' } },
      generatedGameContent: {},
    });

    expect(parsed).toMatchObject({
      customTopic: 'Seoul: Neighborhoods and Change',
      difficulty: 'Easy',
      sourceMaterial: { title: 'Seoul: Neighborhoods and Change' },
      slots: [
        { key: 'read-aloud', stageLabel: 'Briefing' },
        { key: 'flash-quiz' },
      ],
    });
  });

  it('rejects malformed or empty routes instead of persisting a broken lesson', () => {
    expect(parseLessonPlanPayload({ customTopic: 'Seoul', slots: [] })).toBeNull();
    expect(parseLessonPlanPayload({
      customTopic: 'Seoul',
      slots: [{ type: 'unknown', key: 'quiz', name: 'Quiz' }],
    })).toBeNull();
  });

  it('uses the source title when a source-backed planner launch has no typed topic', () => {
    const parsed = parseLessonPlanPayload({
      customTopic: '',
      slots: [{ type: 'activity', key: 'read-aloud', name: 'Captain Briefing' }],
      sourceMaterial: {
        sourceType: 'world-flight',
        title: 'Tokyo: Design and Daily Life',
        summary: 'Grounding.',
      },
      generatedContent: {},
      generatedGameContent: {},
    });

    expect(parsed?.customTopic).toBe('Tokyo: Design and Daily Life');
  });

  it('names local fallbacks per session', () => {
    expect(lessonPlanStorageKey('session-a')).toBe('lessonPlanContent:session-a');
    expect(lessonPlanStorageKey('session-b')).not.toBe(lessonPlanStorageKey('session-a'));
  });

  it('hydrates a fresh tab from the server while honoring an intentional scoped override', () => {
    const persisted = {
      customTopic: 'Seoul lesson',
      slots: [{ type: 'activity', key: 'read-aloud', name: 'Briefing' }],
      generatedContent: {},
      generatedGameContent: {},
    };
    const scoped = JSON.stringify({
      customTopic: 'Quick pivot',
      slots: [{ type: 'game', key: 'flash-quiz', name: 'Flash Quiz' }],
      generatedContent: {},
      generatedGameContent: {},
    });

    expect(resolveLessonPlanPayload(persisted)?.customTopic).toBe('Seoul lesson');
    expect(resolveLessonPlanPayload(persisted, scoped)?.customTopic).toBe('Quick pivot');
  });
});
