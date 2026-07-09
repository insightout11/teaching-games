import { describe, it, expect } from 'vitest';
import { composeLesson } from './planner-compose';
import { buildLessonSlots, buildCourseLessonPayload } from './planner-utils';
import {
  buildCourseModulesFromPreset,
  buildFlightConfigForCourseSlots,
  getCourseFlightPreset,
  getCourseSourceKind,
} from './course-flight-preset';
import type { CourseLessonContext } from './course-context';

describe('buildLessonSlots', () => {
  it('maps composed modules 1:1 to launchable slots', () => {
    const mods = composeLesson({ goal: 'speaking-fluency', level: 'intermediate', durationMinutes: 60 });
    const slots = buildLessonSlots(mods);
    expect(slots.length).toBe(mods.length);
    expect(slots.every((s) => (s.type === 'activity' || s.type === 'game') && !!s.key && !!s.name)).toBe(true);
  });

  it('preserves micro-event flag + pool on the slot', () => {
    const mods = composeLesson({ goal: 'speaking-fluency', level: 'intermediate', durationMinutes: 60 });
    const microMod = mods.find((m) => m.isMicroEvent);
    expect(microMod).toBeTruthy();
    const slots = buildLessonSlots(mods);
    const microSlot = slots.find((s) => s.isMicroEvent);
    expect(microSlot).toBeTruthy();
    if (microMod?.pool) expect(microSlot?.pool).toEqual(microMod.pool);
  });
});

describe('buildCourseLessonPayload', () => {
  it('assembles a launch-ready payload (the lessonPlanContent shape)', () => {
    const mods = composeLesson({ goal: 'grammar-reinforcement', level: 'beginner', durationMinutes: 45 });
    const payload = buildCourseLessonPayload(
      { topic: 'volcanoes', difficulty: 'Beginner', goal: 'grammar-reinforcement', durationMinutes: 45 },
      mods,
    );
    expect(payload.customTopic).toBe('volcanoes');
    expect(payload.difficulty).toBe('Beginner');
    expect(payload.goal).toBe('grammar-reinforcement');
    expect(payload.lessonDurationMinutes).toBe(45);
    expect(payload.slots.length).toBe(mods.length);
    expect(payload.generatedContent).toEqual({});
    expect(payload.generatedGameContent).toEqual({});
  });

  it('flags mission-based when a mission-selector module is present', () => {
    const mods = composeLesson({ goal: 'discussion-debate', level: 'intermediate', durationMinutes: 60 });
    const payload = buildCourseLessonPayload({ topic: 'x', difficulty: 'Intermediate' }, mods);
    const expected = mods.some((m) => m.key === 'mission-selector');
    expect(!!payload.isMissionBased).toBe(expected);
  });

  it('preserves course continuity context in the saved launch payload', () => {
    const mods = composeLesson({ goal: 'speaking-fluency', level: 'intermediate', durationMinutes: 60 });
    const courseContext: CourseLessonContext = {
      courseTitle: 'Animals & Nature',
      courseTheme: 'wildlife and ecosystems',
      lessonNumber: 2,
      totalLessons: 6,
      previousLessons: [{ title: 'Animal Migrations', topic: 'animal migration and habitats' }],
      reviewTerms: ['animal migration', 'wildlife', 'habitats'],
    };

    const payload = buildCourseLessonPayload(
      { topic: 'predators and ecosystems', difficulty: 'Intermediate', goal: 'critical-thinking', courseContext },
      mods,
    );

    expect(payload.courseContext).toEqual(courseContext);
  });

  it('can assemble course lessons from real flight presets with stage labels', () => {
    const preset = getCourseFlightPreset('discussion-debate');
    const modules = buildCourseModulesFromPreset(preset, getCourseSourceKind({ kind: 'video', sourceType: 'bbc' }));
    const payload = buildCourseLessonPayload(
      { topic: 'school uniforms', difficulty: 'Intermediate', goal: 'discussion-debate', durationMinutes: 60 },
      modules,
    );
    const flightConfig = buildFlightConfigForCourseSlots(preset.flightConfig, payload.slots);

    expect(preset.id).toBe('debate-60');
    expect(payload.slots.some((slot) => slot.stageLabel === 'Debate')).toBe(true);
    expect(payload.slots.every((slot) => slot.stageId)).toBe(true);
    expect(flightConfig?.stages.map((stage) => stage.label)).toEqual(
      payload.slots.map((slot) => slot.stageLabel),
    );
  });
});
