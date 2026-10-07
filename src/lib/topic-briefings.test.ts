import { describe, expect, it } from 'vitest';
import { findTopicBriefing, topicBriefingLevel, topicKey, type TopicBriefing } from './topic-briefings';

const lvl = (tag: string) => ({ briefing: `A briefing about volcanoes at ${tag} level for the class.`, facts: ['f'], angles: ['a'], vocab: [], expressions: [] });
const bank: TopicBriefing[] = [
  { id: 'volcanoes', title: 'Volcanoes', aliases: ['volcano', 'eruption', 'lava'], ageBand: 'kids', levels: { A1: lvl('A1'), A2: lvl('A2'), B1: lvl('B1') } },
  { id: 'social-media', title: 'Social media', aliases: ['instagram and tiktok'], ageBand: 'teens', levels: { B1: lvl('B1'), B2: lvl('B2') } },
];

describe('topic briefing bank', () => {
  it('folds case, punctuation and simple plurals', () => {
    expect(topicKey('Volcanoes!')).toBe('volcano');
    expect(topicKey('  Social   Media ')).toBe('social media');
    expect(topicKey('glass')).toBe('glass');
  });

  it('matches a title or alias exactly, never a long sentence', () => {
    expect(findTopicBriefing('volcano', bank)?.id).toBe('volcanoes');
    expect(findTopicBriefing('Lava', bank)?.id).toBe('volcanoes');
    expect(findTopicBriefing('social media', bank)?.id).toBe('social-media');
    expect(findTopicBriefing('the volcano in Bali that erupted yesterday morning', bank)).toBeNull();
    expect(findTopicBriefing('football', bank)).toBeNull();
  });

  it('picks the class level, or the nearest one', () => {
    expect(topicBriefingLevel(bank[0], 'Beginner')?.briefing).toContain('A1');
    expect(topicBriefingLevel(bank[0], 'Advanced')?.briefing).toContain('B1');
    expect(topicBriefingLevel(bank[1], 'Easy')?.briefing).toContain('B1');
  });
});
