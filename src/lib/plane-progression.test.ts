import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { getPlaneAsset, getPlaneRangeKm, getPlaneTier, getPlaneTierForKey, getPlaneViewAsset, isPlaneKeyInTier, PLANE_TIERS } from '@/lib/plane-progression';

function publicAssetExists(assetPath: string) {
  return existsSync(join(process.cwd(), 'public', assetPath.replace(/^\//, '')));
}

describe('plane progression assets', () => {
  it('resolves the persisted starter key to the LC Cadet runway trainer views', () => {
    expect(getPlaneAsset('starter-biplane')).toMatchObject({
      key: 'starter-biplane',
      name: 'LC Cadet',
      webp: '/assets/flight/planes/lc-cadet.webp',
      groundWebp: '/assets/flight/planes/lc-cadet-ground.webp',
      frontWebp: '/assets/flight/planes/lc-cadet-front.webp',
      front3qWebp: '/assets/flight/planes/lc-cadet-front-3q.webp',
      front3qGroundWebp: '/assets/flight/planes/lc-cadet-front-3q-ground.webp',
      displayMeta: expect.objectContaining({ runwayYOffset: -48, hangarYOffset: 34 }),
    });
  });

  it('resolves the first range-upgrade tier to runway-safe branded aircraft', () => {
    expect(getPlaneAsset('scout-monoplane')).toMatchObject({
      key: 'scout-monoplane',
      name: 'LC Wayfarer',
      webp: '/assets/flight/planes/lc-wayfarer.webp',
    });
    expect(getPlaneAsset('cloud-hopper')).toMatchObject({
      key: 'scout-monoplane',
      name: 'LC Wayfarer',
      webp: '/assets/flight/planes/lc-wayfarer.webp',
    });
    expect(getPlaneAsset('lc-scout')).toMatchObject({
      key: 'lc-scout',
      name: 'LC Scout',
      webp: '/assets/flight/planes/lc-scout-monoplane.webp',
      frontWebp: '/assets/flight/planes/lc-scout-monoplane-front.webp',
      front3qWebp: '/assets/flight/planes/lc-scout-monoplane-front-3q.webp',
      displayMeta: expect.objectContaining({ runwayYOffset: -30, hangarYOffset: 20 }),
    });
    expect(getPlaneAsset('trailblazer-biplane')).toMatchObject({
      key: 'trailblazer-biplane',
      name: 'Trailblazer',
      webp: '/assets/flight/planes/lc-trailblazer.webp',
      frontWebp: '/assets/flight/planes/lc-trailblazer-front.webp',
      front3qWebp: '/assets/flight/planes/lc-trailblazer-front-3q.webp',
      displayMeta: expect.objectContaining({ runwayYOffset: -34, hangarYOffset: 34 }),
    });
    expect(getPlaneViewAsset('scout-monoplane', 'front')).toBe(
      '/assets/flight/planes/lc-wayfarer-front.webp',
    );
    expect(getPlaneViewAsset('cloud-hopper', 'front-3q', 'png')).toBe(
      '/assets/flight/planes/lc-wayfarer-front-3q.png',
    );
    expect(getPlaneViewAsset('cloud-hopper', 'ground')).toBe(
      '/assets/flight/planes/lc-wayfarer-ground.webp',
    );
    expect(getPlaneViewAsset('lc-scout', 'front')).toBe(
      '/assets/flight/planes/lc-scout-monoplane-front.webp',
    );
    expect(getPlaneViewAsset('lc-scout', 'front-3q-ground', 'png')).toBe(
      '/assets/flight/planes/lc-scout-monoplane-front-3q-ground.png',
    );
  });

  // groundContactOffset cancels the transparent padding under each plane's landing
  // gear (measured by scripts/measure-plane-ground-offsets.mjs). A plane left at 0
  // visibly hovers above the runway, which is what happened to 11 of 14 aircraft
  // before these were calibrated — so assert none of them slips back to zero.
  it('gives every aircraft a runway calibration so none hovers', () => {
    for (const tier of PLANE_TIERS) {
      for (const choice of tier.choices) {
        expect(choice.displayMeta.groundContactOffset, choice.key).toBeLessThan(0);
      }
    }
  });

  it('groups plane choices by tier range', () => {
    expect(getPlaneTier(1)).toMatchObject({
      label: 'First Upgrade',
      rangeKm: 6800,
    });
    expect(getPlaneTier(1).choices.map((plane) => plane.key)).toEqual([
      'scout-monoplane',
      'lc-scout',
      'trailblazer-biplane',
    ]);
    expect(getPlaneTierForKey('cloud-hopper').tier).toBe(1);
    expect(isPlaneKeyInTier('cloud-hopper', 1)).toBe(true);
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

  it('provides runway ground views for every aircraft choice', () => {
    for (const tier of [0, 1, 2, 3, 4]) {
      for (const plane of getPlaneTier(tier).choices) {
        expect(plane.groundWebp, plane.key).toMatch(/-ground\.webp$/);
        expect(plane.groundPng, plane.key).toMatch(/-ground\.png$/);
        expect(plane.front3qGroundWebp, plane.key).toMatch(/-front-3q-ground\.webp$/);
        expect(plane.front3qGroundPng, plane.key).toMatch(/-front-3q-ground\.png$/);
        expect(publicAssetExists(plane.groundWebp!), plane.groundWebp).toBe(true);
        expect(publicAssetExists(plane.groundPng!), plane.groundPng).toBe(true);
        expect(publicAssetExists(plane.front3qGroundWebp!), plane.front3qGroundWebp).toBe(true);
        expect(publicAssetExists(plane.front3qGroundPng!), plane.front3qGroundPng).toBe(true);
      }
    }

    expect(getPlaneViewAsset('comet-jet', 'ground')).toBe(
      '/assets/flight/planes/lc-comet-jet-ground.webp',
    );
    expect(getPlaneViewAsset('starliner-mini', 'front-3q-ground')).toBe(
      '/assets/flight/planes/lc-starliner-mini-front-3q-ground.webp',
    );
  });
});
