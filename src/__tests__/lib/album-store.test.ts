import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => { throw new Error('should not reach the database'); } }));

import { isRarePhoto, saveLandmarkPhoto } from '@/lib/world-flight/album-store';

describe('Landmark Album', () => {
  it('marks dusk, night and unusual weather as rare', () => {
    expect(isRarePhoto('dusk', 'clear')).toBe(true);
    expect(isRarePhoto('day', 'aurora')).toBe(true);
    expect(isRarePhoto('day', 'clear')).toBe(false);
  });

  it('refuses anything that is not a JPEG picture, before touching storage', async () => {
    const base = { classId: 'c', sessionId: 's', landmarkId: 'pyramids', timeOfDay: 'day', weather: 'clear', fromCity: 'Cairo', toCity: 'Istanbul' };
    expect(await saveLandmarkPhoto({ ...base, image: 'data:image/png;base64,AAAA' })).toEqual({ ok: false, rare: false });
    expect(await saveLandmarkPhoto({ ...base, image: 'https://example.com/x.jpg' })).toEqual({ ok: false, rare: false });
  });
});
