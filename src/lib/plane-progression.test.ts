import { describe, expect, it } from 'vitest';
import { getPlaneAsset, getPlaneViewAsset } from '@/lib/plane-progression';

describe('plane progression assets', () => {
  it('resolves the persisted starter key to the LC Wayfarer production views', () => {
    expect(getPlaneAsset('starter-biplane')).toMatchObject({
      key: 'starter-biplane',
      name: 'LC Wayfarer',
      webp: '/assets/flight/planes/lc-wayfarer.webp',
      frontWebp: '/assets/flight/planes/lc-wayfarer-front.webp',
      front3qWebp: '/assets/flight/planes/lc-wayfarer-front-3q.webp',
    });
  });

  it('falls back to Wayfarer front views until another plane has authored views', () => {
    expect(getPlaneViewAsset('scout-monoplane', 'front')).toBe(
      '/assets/flight/planes/lc-wayfarer-front.webp',
    );
    expect(getPlaneViewAsset('scout-monoplane', 'front-3q', 'png')).toBe(
      '/assets/flight/planes/lc-wayfarer-front-3q.png',
    );
  });
});
