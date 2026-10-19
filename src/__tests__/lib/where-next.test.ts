import { describe, expect, it } from 'vitest';
import { cleanNextTopics, nextTopicsPrompt } from '@/lib/live-room/where-next';

describe('Where next?', () => {
  it('drops covered topics, duplicates and blanks', () => {
    const out = cleanNextTopics([
      { link: 'Bigger picture', title: 'Volcanoes' },
      { link: 'The other side', title: 'Geothermal energy' },
      { link: 'Closer to home', title: 'geothermal energy' },
      { link: 'In the news', title: '' },
      'junk',
    ], ['Volcanoes']);
    expect(out).toEqual([{ link: 'The other side', title: 'Geothermal energy' }]);
  });
  it('tells the AI what was already covered', () => {
    expect(nextTopicsPrompt('Volcanoes', ['Olivia Rodrigo'])).toContain('"Olivia Rodrigo"');
  });
});
