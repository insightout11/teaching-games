import { describe, expect, it } from 'vitest';
import { citySouvenirs, howToEarn, postcardPrompts, postcardSouvenir, rareLanding, souvenirsForLanding } from './souvenirs';

describe('souvenirs', () => {
  it('every city has souvenirs, three postcard prompts and an icon for each souvenir', () => {
    const ids = ['bangkok', 'tokyo', 'paris', 'lisbon'];
    for (const id of ids) {
      expect(citySouvenirs(id).length, id).toBeGreaterThanOrEqual(4);
      expect(postcardPrompts(id)).toHaveLength(3);
      citySouvenirs(id).forEach((s) => expect(howToEarn(s).length).toBeGreaterThan(3));
    }
  });

  it('a first landing earns the landing and World Flight souvenirs, never the return visit', () => {
    const got = souvenirsForLanding({ destinationId: 'bangkok', sessionId: 's1', firstLanding: true, owned: new Set() });
    expect(got.some((s) => s.earn.type === 'land')).toBe(true);
    expect(got.some((s) => s.earn.challenge === 'return-visit')).toBe(false);
    expect(got.some((s) => s.earn.type === 'rare')).toBe(rareLanding('s1', 'bangkok'));
  });

  it('nothing already owned is earned again', () => {
    const all = new Set(citySouvenirs('bangkok').map((s) => s.id));
    expect(souvenirsForLanding({ destinationId: 'bangkok', sessionId: 's2', firstLanding: false, owned: all })).toEqual([]);
  });

  it('the rare souvenir comes up about one landing in five, and always the same for the same lesson', () => {
    let hits = 0;
    for (let i = 0; i < 1000; i++) if (rareLanding(`session-${i}`, 'tokyo')) hits++;
    expect(hits).toBeGreaterThan(150);
    expect(hits).toBeLessThan(250);
    expect(rareLanding('abc', 'tokyo')).toBe(rareLanding('abc', 'tokyo'));
  });

  it('cities with a postcard souvenir say so', () => {
    expect(postcardSouvenir('bangkok')?.id).toBe('bangkok-market-tote');
  });
});
