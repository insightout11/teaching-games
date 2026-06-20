import { describe, expect, it } from 'vitest';
import {
  getLessonIntroMediaForDestination,
  getMediaForUsage,
  getPlaceMediaRecordByDestination,
  getWorldLensPlacePool,
  PLACE_MEDIA_LIBRARY,
} from './place-media';

const PRIORITY_BRIEFING_DESTINATIONS = [
  'rio-de-janeiro',
  'panama-city',
  'bangkok',
  'tokyo',
  'london',
  'paris',
  'new-york',
  'cairo',
  'singapore',
];

describe('place media library', () => {
  it('has unique place ids and source metadata for every media asset', () => {
    const ids = new Set<string>();
    for (const place of PLACE_MEDIA_LIBRARY) {
      expect(ids.has(place.id)).toBe(false);
      ids.add(place.id);
      for (const media of place.media) {
        expect(media.id).toBeTruthy();
        expect(media.sourceName).toBeTruthy();
        expect(media.sourceUrl).toMatch(/^https?:\/\//);
        expect(media.usage.length).toBeGreaterThan(0);
      }
    }
  });

  it('makes World Flight destination images available to World Lens', () => {
    const pool = getWorldLensPlacePool();
    expect(pool.length).toBeGreaterThan(40);
    expect(pool.every((place) => getMediaForUsage(place, 'geo-clue').length > 0)).toBe(true);
  });

  it('uses the Panama Canal as Panama City lesson media', () => {
    const panama = getPlaceMediaRecordByDestination('panama-city');
    expect(panama?.country).toBe('Panama');

    const media = getLessonIntroMediaForDestination('panama-city');
    expect(media?.title).toContain('Panama Canal');
    expect(media?.usage).toContain('lesson-intro');
    expect(media?.usage).toContain('geo-clue');
  });

  it('uses classroom-friendly landscape media for Rio landmark slides', () => {
    const rio = getPlaceMediaRecordByDestination('rio-de-janeiro');
    const christ = rio?.media.find((media) => media.id === 'rio-de-janeiro-christ-redeemer');

    expect(christ?.url).toContain('Rio%20by%20night-Christ');
    expect(christ?.sourceUrl).toContain('Rio_by_night-Christ');
    expect(christ?.url).not.toContain('Christ%20the%20Redeemer%20-%20Cristo%20Redentor');
  });

  it('keeps priority destination curated media source-attributed', () => {
    for (const destinationId of PRIORITY_BRIEFING_DESTINATIONS) {
      const place = getPlaceMediaRecordByDestination(destinationId);
      const curatedMedia = place?.media.filter((media) => !media.id.endsWith('-hero')) ?? [];

      expect(curatedMedia.length, destinationId).toBeGreaterThanOrEqual(3);
      for (const media of curatedMedia) {
        expect(media.sourceName, media.id).toBe('Wikimedia Commons');
        expect(media.sourceUrl, media.id).toContain('commons.wikimedia.org/wiki/File');
        expect(media.creator, media.id).toBeTruthy();
        expect(media.license, media.id).toBeTruthy();
      }
    }
  });
});
