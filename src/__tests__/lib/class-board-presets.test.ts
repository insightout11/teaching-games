import { describe, expect, it } from 'vitest';
import { CLASS_BOARD_PRESETS, getClassBoardPreset } from '@/lib/class-board';

describe('class board presets', () => {
  it('offers a Topics board for collecting topic ideas through the class', () => {
    const topics = getClassBoardPreset('topics');
    expect(topics.key).toBe('topics');
    expect(topics.title).toBe('Topics');
    expect(topics.question).toBe('What topics should we talk about?');
    expect(topics.allowVotes).toBe(true);
  });
  it.each(Object.values(CLASS_BOARD_PRESETS))('$key: defaults point at a real category and zone', (preset) => {
    expect(preset.categories.map((c) => c.key)).toContain(preset.defaultCategory);
    expect(preset.zones.map((z) => z.key)).toContain(preset.defaultZone);
  });
});
