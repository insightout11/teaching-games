import { describe, expect, it } from 'vitest';
import { getPlaneAsset, getPlaneRangeKm, getPlaneTier, getPlaneTierForKey, getPlaneViewAsset, isPlaneKeyInTier } from '@/lib/plane-progression';

describe('plane progression assets', () => {
  it('resolves the persisted starter key to the LC Scout production views', () => {
    expect(getPlaneAsset('starter-biplane')).toMatchObject({
      key: 'starter-biplane',
      name: 'LC Scout',
      webp: '/assets/flight/planes/lc-scout-monoplane.webp',
      frontWebp: '/assets/flight/planes/lc-scout-monoplane-front.webp',
      front3qWebp: '/assets/flight/planes/lc-scout-monoplane-front-3q.webp',
    });
  });

  it('resolves the first range-upgrade tier to three authored branded aircraft', () => {
    expect(getPlaneAsset('scout-monoplane')).toMatchObject({
      key: 'scout-monoplane',
      name: 'LC Wayfarer',
      webp: '/assets/flight/planes/lc-wayfarer.webp',
    });
    expect(getPlaneAsset('cloud-hopper')).toMatchObject({
      key: 'cloud-hopper',
      name: 'Cloud Hopper',
      webp: '/assets/flight/planes/lc-cloud-hopper.webp',
      frontWebp: '/assets/flight/planes/lc-cloud-hopper-front.webp',
      front3qWebp: '/assets/flight/planes/lc-cloud-hopper-front-3q.webp',
    });
    expect(getPlaneAsset('trailblazer-biplane')).toMatchObject({
      key: 'trailblazer-biplane',
      name: 'Trailblazer',
      webp: '/assets/flight/planes/lc-trailblazer.webp',
      frontWebp: '/assets/flight/planes/lc-trailblazer-front.webp',
      front3qWebp: '/assets/flight/planes/lc-trailblazer-front-3q.webp',
    });
    expect(getPlaneViewAsset('scout-monoplane', 'front')).toBe(
      '/assets/flight/planes/lc-wayfarer-front.webp',
    );
    expect(getPlaneViewAsset('cloud-hopper', 'front-3q', 'png')).toBe(
      '/assets/flight/planes/lc-cloud-hopper-front-3q.png',
    );
  });

  it('groups plane choices by tier range', () => {
    expect(getPlaneTier(1)).toMatchObject({
      label: 'First Upgrade',
      rangeKm: 6800,
    });
    expect(getPlaneTier(1).choices.map((plane) => plane.key)).toEqual([
      'scout-monoplane',
      'cloud-hopper',
      'trailblazer-biplane',
    ]);
    expect(getPlaneTierForKey('sky-racer').tier).toBe(2);
    expect(getPlaneRangeKm('sky-racer')).toBe(8500);
    expect(isPlaneKeyInTier('sky-racer', 2)).toBe(true);
    expect(isPlaneKeyInTier('sky-racer', 1)).toBe(false);
  });

  it('resolves the specialist tier to three authored branded aircraft', () => {
    expect(getPlaneTier(2)).toMatchObject({
      label: 'Specialist',
      rangeKm: 8500,
    });
    expect(getPlaneTier(2).choices.map((plane) => plane.key)).toEqual([
      'sky-racer',
      'cargo-cruiser',
      'twin-prop-scout',
    ]);
    expect(getPlaneAsset('sky-racer')).toMatchObject({
      key: 'sky-racer',
      name: 'Sky Racer',
      webp: '/assets/flight/planes/lc-sky-racer.webp',
      frontWebp: '/assets/flight/planes/lc-sky-racer-front.webp',
      front3qWebp: '/assets/flight/planes/lc-sky-racer-front-3q.webp',
    });
    expect(getPlaneAsset('cargo-cruiser')).toMatchObject({
      key: 'cargo-cruiser',
      name: 'Cargo Cruiser',
      webp: '/assets/flight/planes/lc-cargo-cruiser.webp',
      frontWebp: '/assets/flight/planes/lc-cargo-cruiser-front.webp',
      front3qWebp: '/assets/flight/planes/lc-cargo-cruiser-front-3q.webp',
    });
    expect(getPlaneAsset('twin-prop-scout')).toMatchObject({
      key: 'twin-prop-scout',
      name: 'Twin-Prop Scout',
      webp: '/assets/flight/planes/lc-twin-prop-scout.webp',
      frontWebp: '/assets/flight/planes/lc-twin-prop-scout-front.webp',
      front3qWebp: '/assets/flight/planes/lc-twin-prop-scout-front-3q.webp',
    });
    expect(getPlaneViewAsset('twin-prop-scout', 'front-3q', 'png')).toBe(
      '/assets/flight/planes/lc-twin-prop-scout-front-3q.png',
    );
  });

  it('resolves the advanced tier to three authored branded aircraft', () => {
    expect(getPlaneTier(3)).toMatchObject({
      label: 'Advanced',
      rangeKm: 10500,
    });
    expect(getPlaneTier(3).choices.map((plane) => plane.key)).toEqual([
      'solar-flyer',
      'aurora-glider',
      'storm-runner',
    ]);
    expect(getPlaneAsset('solar-flyer')).toMatchObject({
      key: 'solar-flyer',
      name: 'Solar Flyer',
      webp: '/assets/flight/planes/lc-solar-flyer.webp',
      frontWebp: '/assets/flight/planes/lc-solar-flyer-front.webp',
      front3qWebp: '/assets/flight/planes/lc-solar-flyer-front-3q.webp',
    });
    expect(getPlaneAsset('aurora-glider')).toMatchObject({
      key: 'aurora-glider',
      name: 'Aurora Glider',
      webp: '/assets/flight/planes/lc-aurora-glider.webp',
      frontWebp: '/assets/flight/planes/lc-aurora-glider-front.webp',
      front3qWebp: '/assets/flight/planes/lc-aurora-glider-front-3q.webp',
    });
    expect(getPlaneAsset('storm-runner')).toMatchObject({
      key: 'storm-runner',
      name: 'Storm Runner',
      webp: '/assets/flight/planes/lc-storm-runner.webp',
      frontWebp: '/assets/flight/planes/lc-storm-runner-front.webp',
      front3qWebp: '/assets/flight/planes/lc-storm-runner-front-3q.webp',
    });
    expect(getPlaneViewAsset('storm-runner', 'front', 'png')).toBe(
      '/assets/flight/planes/lc-storm-runner-front.png',
    );
  });

  it('resolves the prestige tier to three authored branded aircraft', () => {
    expect(getPlaneTier(4)).toMatchObject({
      label: 'Prestige',
      rangeKm: 13000,
    });
    expect(getPlaneTier(4).choices.map((plane) => plane.key)).toEqual([
      'future-flyer',
      'starliner-mini',
      'comet-jet',
    ]);
    expect(getPlaneAsset('future-flyer')).toMatchObject({
      key: 'future-flyer',
      name: 'Future Flyer',
      webp: '/assets/flight/planes/lc-future-flyer.webp',
      frontWebp: '/assets/flight/planes/lc-future-flyer-front.webp',
      front3qWebp: '/assets/flight/planes/lc-future-flyer-front-3q.webp',
    });
    expect(getPlaneAsset('starliner-mini')).toMatchObject({
      key: 'starliner-mini',
      name: 'Starliner Mini',
      webp: '/assets/flight/planes/lc-starliner-mini.webp',
      frontWebp: '/assets/flight/planes/lc-starliner-mini-front.webp',
      front3qWebp: '/assets/flight/planes/lc-starliner-mini-front-3q.webp',
    });
    expect(getPlaneAsset('comet-jet')).toMatchObject({
      key: 'comet-jet',
      name: 'Comet Jet',
      webp: '/assets/flight/planes/lc-comet-jet.webp',
      frontWebp: '/assets/flight/planes/lc-comet-jet-front.webp',
      front3qWebp: '/assets/flight/planes/lc-comet-jet-front-3q.webp',
    });
    expect(getPlaneViewAsset('future-flyer', 'front-3q', 'png')).toBe(
      '/assets/flight/planes/lc-future-flyer-front-3q.png',
    );
  });
});
