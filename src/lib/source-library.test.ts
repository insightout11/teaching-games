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
    const interviewIds = new Set([
      'business-interviews',
      'business-interview-prepare-bbc',
      'business-interview-answering-bbc',
      'business-interview-competency-british-council',
    ]);
    expect(interviewIds.has(recommendSource({ topic: 'common job interview questions', keywords: ['job interviews', 'interview questions'] })?.id ?? ''))
      .toBe(true);
    expect(interviewIds.has(recommendSource({ topic: 'structuring STAR answers', keywords: ['STAR method', 'interview answers'] })?.id ?? ''))
      .toBe(true);
    expect(interviewIds.has(recommendSource({ topic: 'questions to ask the interviewer', keywords: ['interviewer questions'] })?.id ?? ''))
      .toBe(true);
  });

  it('uses course context to block cross-domain animal flukes', () => {
    const communication = recommendSource({
      topic: 'understanding animal sounds and body language',
      keywords: ['animal sounds', 'body language'],
      context: 'animals',
    });
    expect(communication?.title).not.toBe('Your Body Language May Shape Who You Are');
    expect(communication?.topicTags).toContain('animals');

    const story = recommendSource({
      topic: 'writing a short story about an animal adventure',
      keywords: ['stories', 'adventures'],
      context: 'animals',
    });
    expect(story?.title).not.toBe('What makes a poem … a poem?');
  });

  it('uses course context to keep job interview lessons off generic mindset sources', () => {
    expect(recommendSource({
      topic: 'answering tell me about yourself in an interview',
      keywords: ['growth mindset', 'interview answers'],
      context: 'job interviews',
    })?.sourceType).toBe('business-english');
  });

  it('supports easy transportation outlines with transport-specific sources', () => {
    expect(recommendSource({
      topic: 'types of local transport',
      keywords: ['local transport'],
      context: 'transportation',
    }, { level: 'Easy' })?.id).toBe('travel-transport');
    expect(recommendSource({
      topic: 'buying a bus ticket',
      keywords: ['bus tickets'],
      context: 'transportation',
    }, { level: 'Easy' })?.id).toBe('travel-transport');
    expect(recommendSource({
      topic: 'simple direction phrases',
      keywords: ['directions'],
      context: 'transportation',
    }, { level: 'Easy' })?.id).toBe('travel-directions');
    expect(recommendSource({
      topic: 'talking about personal transport',
      keywords: ['personal transport'],
      context: 'transportation',
    }, { level: 'Easy' })?.id).toBe('travel-transport');
  });

  it('makes World Flight videos available for relevant city and cuisine courses', () => {
    expect(recommendSources({
      topic: 'world cuisine and street food',
      keywords: ['cuisine', 'street food', 'markets'],
      context: 'world cuisine',
    }, { limit: 5 }).some((source) => source.sourceType === 'world-flight')).toBe(true);

    expect(recommendSource({
      topic: 'future food and food security',
      keywords: ['future food', 'food security', 'farming'],
      context: 'food systems',
    })?.id).toBe('bbc_food_future_food');

    expect(recommendSources({
      topic: 'public transport in global cities',
      keywords: ['public transport', 'metro', 'cities'],
      context: 'cities and transportation',
    }, { limit: 5 }).some((source) => source.sourceType === 'world-flight')).toBe(true);
  });

  it('matches BBC health and wellbeing topics from the expanded library', () => {
    expect(recommendSource({
      topic: 'why sitting is bad for health',
      keywords: ['sitting', 'exercise', 'movement'],
      context: 'health and wellbeing',
    })?.id).toBe('bbc_health_sitting');

    expect(recommendSource({
      topic: 'flourishing and personal wellbeing',
      keywords: ['flourishing', 'wellbeing', 'happiness'],
      context: 'health and wellbeing',
    })?.id).toBe('bbc_health_flourishing');
  });

  it('matches BBC technology and AI topics from the expanded library', () => {
    expect(recommendSource({
      topic: 'training artificial intelligence',
      keywords: ['artificial intelligence', 'training data', 'algorithms'],
      context: 'technology and AI',
    })?.id).toBe('bbc_tech_training_ai');

    expect(recommendSource({
      topic: 'how to evaluate media and information',
      keywords: ['media literacy', 'misinformation', 'fake news'],
      context: 'technology and AI',
    })?.id).toBe('bbc_tech_era_of_distrust');
  });

  it('matches BBC climate and environment topics from the expanded library', () => {
    expect(recommendSource({
      topic: 'climate change and mental health',
      keywords: ['climate change', 'mental health', 'climate anxiety'],
      context: 'climate and environment',
    })?.id).toBe('bbc_climate_mental_health');

    expect(recommendSource({
      topic: 'living with less plastic',
      keywords: ['plastic pollution', 'waste', 'sustainability'],
      context: 'climate and environment',
    })?.id).toBe('bbc_climate_without_plastic');
  });

  it('matches BBC animal and nature topics from the expanded library', () => {
    expect(recommendSource({
      topic: 'octopus brains and animal intelligence',
      keywords: ['octopus', 'animal intelligence', 'brains'],
      context: 'animals and nature',
    })?.id).toBe('bbc_animals_octopus_intelligence');

    expect(recommendSource({
      topic: 'whether animals should be kept in zoos',
      keywords: ['zoos', 'conservation', 'animal welfare'],
      context: 'animals and nature',
    })?.id).toBe('bbc_animals_zoos');
  });

  it('matches TED-Ed story and myth topics from the expanded library', () => {
    expect(recommendSource({
      topic: 'King Midas and the consequences of greed',
      keywords: ['King Midas', 'morals', 'greed'],
      context: 'stories myths folktales',
    })?.id).toBe('teded_myth_king_midas');

    expect(recommendSource({
      topic: 'how fairy tales change across versions and cultures',
      keywords: ['fairy tales', 'retelling', 'adaptation'],
      context: 'stories myths folktales',
    })?.id).toBe('teded_fairy_tale_origins');
  });
});
