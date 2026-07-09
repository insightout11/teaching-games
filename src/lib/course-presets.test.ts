import { describe, expect, it } from 'vitest';
import { COURSE_PRESETS } from './course-presets';
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
});

describe('world-flight course library', () => {
  it('imports every reviewed World Flight video as a unique library entry', () => {
    expect(worldFlightLibrary).toHaveLength(150);
    expect(new Set(worldFlightLibrary.map((entry) => entry.youtubeId)).size).toBe(150);
    expect(worldFlightLibrary.every((entry) => entry.topicTags.includes('world-flight'))).toBe(true);
  });
});
