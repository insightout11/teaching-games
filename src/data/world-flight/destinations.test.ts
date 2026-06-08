import { describe, expect, it } from 'vitest';
import { WORLD_DESTINATIONS, WORLD_FLIGHT_MAX_VIDEO_DURATION_SECS } from '@/data/world-flight/destinations';

describe('world flight destination packs', () => {
  it('ships every destination with distinct video and reading sources', () => {
    for (const destination of WORLD_DESTINATIONS) {
      const focusOptions = destination.focusOptions;
      const videos = focusOptions.filter((focus) => focus.kind === 'video');
      const readings = focusOptions.filter((focus) => focus.kind === 'reading');

      expect(focusOptions, destination.id).toHaveLength(6);
      expect(videos, destination.id).toHaveLength(3);
      expect(readings, destination.id).toHaveLength(3);
      expect(new Set(focusOptions.map((focus) => focus.id)).size, destination.id).toBe(6);

      for (const video of videos) {
        expect(video.sourceMaterial.sourceType, `${destination.id}/${video.id}`).toBe('youtube');
        expect(video.sourceMaterial.sourceKey, `${destination.id}/${video.id}`).toMatch(/^[a-zA-Z0-9_-]{11}$/);
        expect(video.sourceMaterial.duration, `${destination.id}/${video.id}`).toBeLessThan(WORLD_FLIGHT_MAX_VIDEO_DURATION_SECS);
        expect(video.review.status, `${destination.id}/${video.id}`).toBe('transcript-verified');
        expect(video.review.transcriptLanguage, `${destination.id}/${video.id}`).toBeTruthy();
      }

      for (const reading of readings) {
        expect(reading.sourceMaterial.sourceType, `${destination.id}/${reading.id}`).toBe('text');
        expect(reading.review.status, `${destination.id}/${reading.id}`).toBe('researched');
        expect(reading.citations?.length, `${destination.id}/${reading.id}`).toBeGreaterThanOrEqual(2);
        expect(reading.sourceMaterial.briefingMode, `${destination.id}/${reading.id}`).toBe('generated');
      }
    }
  });
});
