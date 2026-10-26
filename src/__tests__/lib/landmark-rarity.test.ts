import { describe, expect, it } from 'vitest';
import { landmarksOnRoute, rarityForCount, rarityOf } from '@/lib/live-room/landmark-rarity';

describe('landmark rarity', () => {
  it('turns route counts into words', () => {
    expect(rarityForCount(0)).toBeNull();
    expect(rarityForCount(3)).toBe('very rare');
    expect(rarityForCount(7)).toBe('rare');
    expect(rarityForCount(15)).toBe('uncommon');
    expect(rarityForCount(25)).toBe('common');
  });
  it('knows real landmarks and routes', () => {
    expect(rarityOf('everest')).toBe('common');
    expect(rarityOf('kilimanjaro')).toBeNull();
    expect(landmarksOnRoute('delhi', 'hong-kong').some((l) => l.id === 'everest')).toBe(true);
  });
});
