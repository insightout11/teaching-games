import { describe, it, expect } from 'vitest';
import { recommendSource, recommendSources } from './source-library';

describe('recommendSources', () => {
  it('returns nothing for empty or stopword-only topics', () => {
    expect(recommendSources('')).toEqual([]);
    expect(recommendSources('the and of a to')).toEqual([]);
  });

  it('finds relevant library items for a topic that exists in the catalog', () => {
    const results = recommendSources('minecraft');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.score > 0)).toBe(true);
  });

  it('ranks by score, highest first', () => {
    const results = recommendSources('minecraft');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('respects the limit', () => {
    expect(recommendSources('minecraft', { limit: 2 }).length).toBeLessThanOrEqual(2);
  });

  it('restricts to a single kind when asked', () => {
    expect(recommendSources('minecraft', { kind: 'video' }).every((r) => r.kind === 'video')).toBe(true);
    expect(recommendSources('minecraft', { kind: 'reading' }).every((r) => r.kind === 'reading')).toBe(true);
  });

  it('excludes young-learner (kids) content unless allowed', () => {
    // The kids library has cave content, so it's a real test of the audience filter.
    const withoutKids = recommendSources('caves', { allowKids: false });
    const withKids = recommendSources('caves', { allowKids: true });
    expect(withoutKids.every((r) => r.sourceType !== 'kids')).toBe(true);
    expect(withKids.some((r) => r.sourceType === 'kids')).toBe(true);
  });

  it('applying a level filters but never adds results', () => {
    const all = recommendSources('caves', { allowKids: true });
    const leveled = recommendSources('caves', { level: 'Beginner', allowKids: true });
    expect(leveled.length).toBeLessThanOrEqual(all.length);
  });

  it('every recommendation carries the fields the extract flow needs', () => {
    const [first] = recommendSources('minecraft');
    expect(first).toBeDefined();
    expect(typeof first.id).toBe('string');
    expect(typeof first.sourceType).toBe('string');
    expect(['video', 'reading']).toContain(first.kind);
  });

  it('does not match short tags by substring', () => {
    const results = recommendSources({ topic: 'endangered animals', keywords: ['endangered'] });
    expect(results.some((r) => r.title === 'Little Red Riding Hood')).toBe(false);
    expect(results.some((r) => r.topicTags.includes('danger'))).toBe(false);
  });

  it('uses concrete keywords to rank wolves above unrelated items', () => {
    const [first] = recommendSources({ topic: 'predators in ecosystems', keywords: ['predators', 'ecosystems'] }, { limit: 5 });
    expect(first?.id).toBe('natgeo-wolves-change-rivers');
  });

  it('returns null when no source clears the quality bar', () => {
    expect(recommendSource({ topic: 'ceramic payroll staplers', keywords: ['staplers', 'payroll'] })).toBeNull();
  });

  it('does not fall back to phrase matching when outline keywords are missing', () => {
    expect(recommendSource({ topic: 'asking for and giving directions', keywords: [] })).toBeNull();
  });

  it('ignores generic lesson keywords that caused story/adventure flukes', () => {
    expect(recommendSource({ topic: 'creating animal stories', keywords: ['stories', 'adventures'] })).toBeNull();
  });

  it('keeps job-interview lessons on the interview source or null', () => {
    expect(recommendSource({ topic: 'common job interview questions', keywords: ['job interviews', 'interview questions'] })?.id)
      .toBe('business-interviews');
    expect(recommendSource({ topic: 'structuring STAR answers', keywords: ['STAR method', 'interview answers'] })?.id)
      .toBe('business-interviews');
    expect(recommendSource({ topic: 'questions to ask the interviewer', keywords: ['interviewer questions'] })?.id)
      .toBe('business-interviews');
  });
});
