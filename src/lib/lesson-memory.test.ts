import { describe, expect, it } from 'vitest';
import { addActivity, addMaterial, addTopic, addWords, emptyLessonMemory, sanitizeLessonMemory } from './lesson-memory';

describe('lesson memory', () => {
  it('records topics (no repeats in a row), words (deduplicated), material (once) and activities', () => {
    let m = emptyLessonMemory();
    m = addTopic(m, 'Volcanoes', 'note');
    expect(addTopic(m, 'Volcanoes', 'note')).toBe(m);
    m = addTopic(m, 'Bali', 'place');
    m = addWords(m, ['lava', 'Ash', 'lava']);
    m = addWords(m, ['ash', 'crater']);
    m = addMaterial(m, 'Mount Batur', 'article');
    expect(addMaterial(m, 'Mount Batur', 'article')).toBe(m);
    m = addActivity(m, 'Static');
    expect(m.topics.map((t) => t.title)).toEqual(['Volcanoes', 'Bali']);
    expect(m.words).toEqual(['lava', 'Ash', 'crater']);
    expect(m.material).toEqual([{ title: 'Mount Batur', kind: 'article' }]);
    expect(m.activities.map((a) => a.name)).toEqual(['Static']);
  });

  it('accepts only known fields, trimmed and capped, and rejects empty records', () => {
    const s = sanitizeLessonMemory({ topics: [{ title: '  Volcanoes  ', kind: 'note', at: 'x', extra: 1 }], words: ['lava', 5], hack: true });
    expect(s?.topics).toEqual([{ title: 'Volcanoes', kind: 'note', at: 'x' }]);
    expect(s?.words).toEqual(['lava']);
    expect(s && 'hack' in s).toBe(false);
    expect(sanitizeLessonMemory({ topics: [] })).toBeNull();
    expect(sanitizeLessonMemory('x')).toBeNull();
  });
});

import { lessonEntry } from './lesson-memory';

describe('lesson entry (step 2)', () => {
  it('summarises topics, words, activities and material, or nothing for an empty lesson', () => {
    let m = emptyLessonMemory();
    expect(lessonEntry(m)).toBeNull();
    m = addTopic(addTopic(m, 'Volcanoes', 'note'), 'Bali', 'place');
    m = addWords(m, Array.from({ length: 13 }, (_, i) => `word${i}`));
    m = addActivity(addActivity(addActivity(m, 'Static'), 'Static'), 'Black Box');
    m = addMaterial(m, 'Mount Batur', 'article');
    expect(lessonEntry(m)).toEqual({ topics: ['Volcanoes', 'Bali'], words: m.words.slice(0, 10), moreWords: 3, activities: ['Static', 'Black Box'], explored: 1 });
  });
});
