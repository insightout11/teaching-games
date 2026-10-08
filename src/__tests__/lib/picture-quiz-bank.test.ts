import { describe, expect, it } from 'vitest';
import ids from '@/data/sticker-ids.json';
import { JUNIOR_SETS, pickJuniorSet, stickerLabel } from '@/activities/picture-quiz/bank';

describe('Picture Quiz bank', () => {
  it('only uses drawn stickers', () => {
    const drawn = new Set(ids as string[]);
    const missing = JUNIOR_SETS.flatMap((s) => s.questions.flatMap((q) => q.options)).filter((o) => !drawn.has(o));
    expect(missing).toEqual([]);
  });
  it('picks a set for the lesson topic, or none', () => {
    expect(pickJuniorSet('animals')?.id).toBe('animals');
    expect(pickJuniorSet('General')).toBeNull();
    expect(pickJuniorSet('quantum physics')).toBeNull();
  });
  it('labels stickers with their word', () => {
    expect(stickerLabel('ice-cream')).toBe('ice cream');
  });
});
