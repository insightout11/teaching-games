import { describe, expect, it } from 'vitest';
import { COURSE_PRESETS } from './course-presets';
import { buildCourseLessonContext } from './course-context';
import {
  buildCourseModulesFromPreset,
  buildFlightConfigForCourseSlots,
  getCourseFlightPreset,
  getCourseSourceKind,
} from './course-flight-preset';
import { getLibrarySourceMaterial } from './library-source-material';
import { buildCourseLessonPayload } from './planner-utils';
import worldFlightLibrary from '@/data/world-flight-library.json';
import tedLibrary from '@/data/ted-library.json';
import tededLibrary from '@/data/teded-library.json';
import bbcLibrary from '@/data/bbc-library.json';
import bbcIdeasLibrary from '@/data/bbc-ideas-library.json';
import natgeoLibrary from '@/data/natgeo-library.json';
import crashCourseLibrary from '@/data/crash-course-library.json';
import travelEnglishLibrary from '@/data/travel-english-library.json';
import businessEnglishLibrary from '@/data/business-english-library.json';
import internetMemesLibrary from '@/data/internet-memes-library.json';
import storiesLibrary from '@/data/stories-library.json';
import voaLibrary from '@/data/voa-library.json';
import type { CourseLessonPayload, CourseOutlineLesson, CourseSourceRef } from './course';

type PresetLibraryEntry = {
  id: string;
  title: string;
  youtubeId?: string | null;
  durationSecs?: number;
  wordCount?: number;
  topicTags?: string[];
  description?: string;
  summary?: string;
  difficultyLevel?: string;
};

const entriesBySourceType = new Map<string, PresetLibraryEntry[]>([
  ['bbc', bbcLibrary],
  ['bbc-ideas', bbcIdeasLibrary],
  ['business-english', businessEnglishLibrary],
  ['crash-course', crashCourseLibrary],
  ['internet-memes', internetMemesLibrary],
  ['natgeo', natgeoLibrary],
  ['stories', storiesLibrary],
  ['ted', tedLibrary],
  ['teded', tededLibrary],
  ['travel-english', travelEnglishLibrary],
  ['voa', voaLibrary],
  ['world-flight', worldFlightLibrary],
]);

const idsBySourceType = new Map([
  ['bbc', new Set(bbcLibrary.map((entry) => entry.id))],
  ['bbc-ideas', new Set(bbcIdeasLibrary.map((entry) => entry.id))],
  ['business-english', new Set(businessEnglishLibrary.map((entry) => entry.id))],
  ['crash-course', new Set(crashCourseLibrary.map((entry) => entry.id))],
  ['internet-memes', new Set(internetMemesLibrary.map((entry) => entry.id))],
  ['natgeo', new Set(natgeoLibrary.map((entry) => entry.id))],
  ['stories', new Set(storiesLibrary.map((entry) => entry.id))],
  ['ted', new Set(tedLibrary.map((entry) => entry.id))],
  ['teded', new Set(tededLibrary.map((entry) => entry.id))],
  ['travel-english', new Set(travelEnglishLibrary.map((entry) => entry.id))],
  ['voa', new Set(voaLibrary.map((entry) => entry.id))],
  ['world-flight', new Set(worldFlightLibrary.map((entry) => entry.id))],
]);

const stopwords = new Set([
  'about',
  'after',
  'affect',
  'affects',
  'around',
  'before',
  'being',
  'building',
  'change',
  'come',
  'daily',
  'different',
  'english',
  'future',
  'getting',
  'health',
  'help',
  'into',
  'language',
  'learning',
  'lesson',
  'making',
  'people',
  'place',
  'places',
  'questions',
  'shared',
  'systems',
  'their',
  'thing',
  'things',
  'through',
  'using',
  'what',
  'where',
  'whether',
  'with',
  'world',
]);

function getPresetLibraryEntry(ref: NonNullable<CourseOutlineLesson['suggestedSource']>): PresetLibraryEntry | null {
  return entriesBySourceType.get(ref.sourceType)?.find((entry) => entry.id === ref.id) ?? null;
}

function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function keywordTerms(keywords: string[]): string[] {
  return Array.from(
    new Set(
      keywords
        .flatMap((keyword) => normalizeTerm(keyword).split(/\s+/))
        .filter((term) => term.length >= 4 && !stopwords.has(term)),
    ),
  );
}

function textMatchesTerm(searchable: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}s?\\b`).test(searchable);
}

function buildPresetLessonPayload(preset: (typeof COURSE_PRESETS)[number], lessonIndex: number): CourseLessonPayload {
  const lesson = preset.lessons[lessonIndex];
  const flightPreset = getCourseFlightPreset(lesson.goal);
  const sourceKind = getCourseSourceKind(lesson.suggestedSource);
  const modules = buildCourseModulesFromPreset(flightPreset, sourceKind);
  const sourceRef: CourseSourceRef = lesson.suggestedSource
    ? {
        kind: 'library',
        sourceType: lesson.suggestedSource.sourceType,
        id: lesson.suggestedSource.id,
        title: lesson.suggestedSource.title,
      }
    : null;
  const sourceMaterial = getLibrarySourceMaterial(sourceRef) ?? undefined;
  const courseContext = buildCourseLessonContext({
    courseTitle: preset.title,
    courseTheme: preset.theme,
    lessons: preset.lessons,
    index: lessonIndex,
  });
  const payload = buildCourseLessonPayload(
    { topic: lesson.topic, difficulty: preset.level, goal: lesson.goal, durationMinutes: 60, sourceMaterial, courseContext },
    modules,
  );
  const flightConfig = buildFlightConfigForCourseSlots(flightPreset.flightConfig, payload.slots);
  if (flightConfig) {
    payload.flightPresetId = flightPreset.id;
    payload.flightConfig = flightConfig;
  }
  return payload;
}

describe('COURSE_PRESETS', () => {
  it('ships eight editable six-lesson course presets', () => {
    expect(COURSE_PRESETS).toHaveLength(8);
    for (const preset of COURSE_PRESETS) {
      expect(preset.lessons).toHaveLength(6);
      expect(preset.theme.length).toBeGreaterThan(20);
    }
  });

  it('references real library sources', () => {
    for (const preset of COURSE_PRESETS) {
      for (const lesson of preset.lessons) {
        expect(lesson.keywords?.length).toBeGreaterThan(0);
        const ref = lesson.suggestedSource;
        expect(ref).toBeTruthy();
        const ids = ref ? idsBySourceType.get(ref.sourceType) : null;
        expect(ids, `${preset.id}/${lesson.title}: missing source type ${ref?.sourceType}`).toBeTruthy();
        expect(ids?.has(ref!.id), `${preset.id}/${lesson.title}: missing source ${ref?.sourceType}/${ref?.id}`).toBe(true);
      }
    }
  });

  it('hydrates every preset source into launchable source material', () => {
    for (const preset of COURSE_PRESETS) {
      for (const lesson of preset.lessons) {
        const ref = lesson.suggestedSource
          ? {
              kind: 'library' as const,
              sourceType: lesson.suggestedSource.sourceType,
              id: lesson.suggestedSource.id,
              title: lesson.suggestedSource.title,
            }
          : null;
        const material = getLibrarySourceMaterial(ref);

        expect(material, `${preset.id}/${lesson.title} did not hydrate from source_ref`).toBeTruthy();
        expect(material?.sourceKey).toBe(ref?.id);
        expect(material?.summary?.trim().length, `${preset.id}/${lesson.title} has no grounding summary`).toBeGreaterThan(20);
      }
    }
  });

  it('assembles each preset lesson into the right flight and briefing route', () => {
    for (const preset of COURSE_PRESETS) {
      for (let index = 0; index < preset.lessons.length; index += 1) {
        const lesson = preset.lessons[index];
        const sourceKind = getCourseSourceKind(lesson.suggestedSource);
        const ref: CourseSourceRef = lesson.suggestedSource
          ? {
              kind: 'library',
              sourceType: lesson.suggestedSource.sourceType,
              id: lesson.suggestedSource.id,
              title: lesson.suggestedSource.title,
            }
          : null;
        const flightPreset = getCourseFlightPreset(lesson.goal);
        const payload = buildPresetLessonPayload(preset, index);
        const slotKeys = payload.slots.map((slot) => slot.key);
        const expectedBriefingKey = sourceKind === 'video' ? 'video-player' : sourceKind === 'text' ? 'read-aloud' : null;

        if (expectedBriefingKey) {
          expect(slotKeys, `${preset.id}/${lesson.title} missing ${expectedBriefingKey}`).toContain(expectedBriefingKey);
        }
        expect(payload.sourceMaterial?.sourceKey, `${preset.id}/${lesson.title} missing sourceMaterial`).toBe(ref?.id);
        expect(payload.courseContext).toMatchObject({
          courseTitle: preset.title,
          courseTheme: preset.theme,
          lessonNumber: index + 1,
          totalLessons: preset.lessons.length,
        });
        expect(payload.courseContext?.previousLessons).toHaveLength(index);
        expect(payload.flightPresetId).toBe(flightPreset.id);
        expect(payload.flightConfig?.stages.map((stage) => stage.stageId)).toEqual(
          payload.slots.map((slot) => slot.stageId).filter(Boolean),
        );
        expect(flightPreset.id === 'grammar-60', `${preset.id}/${lesson.title} should not route to Grammar`).toBe(lesson.goal === 'grammar-reinforcement');
      }
    }
  });

  it('keeps preset source text aligned with lesson keywords', () => {
    for (const preset of COURSE_PRESETS) {
      for (const lesson of preset.lessons) {
        const ref: CourseSourceRef = lesson.suggestedSource
          ? {
              kind: 'library',
              sourceType: lesson.suggestedSource.sourceType,
              id: lesson.suggestedSource.id,
              title: lesson.suggestedSource.title,
            }
          : null;
        const material = getLibrarySourceMaterial(ref);
        const searchable = [
          lesson.suggestedSource?.title,
          material?.title,
          material?.summary,
        ].map((part) => normalizeTerm(part ?? '')).join(' ');
        const hits = keywordTerms(lesson.keywords ?? []).filter((term) => textMatchesTerm(searchable, term));

        expect(hits.length, `${preset.id}/${lesson.title} source does not echo any concrete keyword`).toBeGreaterThan(0);
      }
    }
  });

  it('ships useful local metadata for preset-used library entries', () => {
    for (const preset of COURSE_PRESETS) {
      for (const lesson of preset.lessons) {
        const ref = lesson.suggestedSource;
        expect(ref).toBeTruthy();
        if (!ref) continue;

        const entry = getPresetLibraryEntry(ref);
        const label = `${preset.id}/${lesson.title} -> ${ref.sourceType}/${ref.id}`;
        expect(entry, `${label} missing local library entry`).toBeTruthy();
        if (!entry) continue;

        const tags = entry.topicTags ?? [];
        const groundingText = [entry.summary, entry.description].filter(Boolean).join(' ').trim();
        const metadataText = [entry.title, entry.summary, entry.description, ...tags].map((part) => normalizeTerm(part ?? '')).join(' ');
        const matchedTerms = keywordTerms(lesson.keywords ?? []).filter((term) => textMatchesTerm(metadataText, term));

        expect(entry.title.trim().length, `${label} missing title`).toBeGreaterThan(4);
        expect(entry.difficultyLevel, `${label} missing difficultyLevel`).toBeTruthy();
        expect(tags.length, `${label} needs richer topicTags`).toBeGreaterThanOrEqual(4);
        expect(new Set(tags.map((tag) => normalizeTerm(tag))).size, `${label} has duplicate topicTags`).toBe(tags.length);
        expect(tags.every((tag) => normalizeTerm(tag).length >= 2), `${label} has weak topicTags`).toBe(true);
        expect(groundingText.length, `${label} needs a useful summary or description`).toBeGreaterThanOrEqual(140);
        expect(matchedTerms.length, `${label} metadata does not match lesson keywords`).toBeGreaterThan(0);

        if (ref.kind === 'video') {
          expect(entry.youtubeId, `${label} missing youtubeId`).toBeTruthy();
          expect(entry.durationSecs, `${label} missing durationSecs`).toBeGreaterThan(0);
        } else if (ref.kind === 'reading') {
          expect(entry.wordCount, `${label} missing wordCount`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('world-flight course library', () => {
  it('imports every reviewed World Flight video as a unique library entry', () => {
    expect(worldFlightLibrary).toHaveLength(150);
    expect(new Set(worldFlightLibrary.map((entry) => entry.youtubeId)).size).toBe(150);
    expect(worldFlightLibrary.every((entry) => entry.topicTags.includes('world-flight'))).toBe(true);
  });
});
