import { describe, expect, it } from 'vitest';
import { WORLD_DESTINATIONS, WORLD_FLIGHT_MAX_VIDEO_DURATION_SECS } from '@/data/world-flight/destinations';
import { assessWorldFlightReadingQuality } from '@/lib/world-flight/readings';

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
        expect(reading.citations?.length, `${destination.id}/${reading.id}`).toBeGreaterThanOrEqual(2);
        const quality = assessWorldFlightReadingQuality(reading.sourceMaterial);
        expect(reading.review.status, `${destination.id}/${reading.id}: ${quality.issues.join(', ')}`).toBe(
          quality.publishable ? 'researched' : 'draft',
        );
      }
    }
  });

  it('publishes only substantial, leveled, instruction-free readings', () => {
    const publishedReadings = WORLD_DESTINATIONS.flatMap((destination) =>
      destination.focusOptions.filter((focus) => focus.kind === 'reading' && focus.review.status === 'researched'),
    );

    expect(publishedReadings.length).toBeGreaterThan(0);
    for (const reading of publishedReadings) {
      expect(assessWorldFlightReadingQuality(reading.sourceMaterial)).toEqual({ publishable: true, issues: [] });
      expect(reading.sourceMaterial.sourceText).toBeTruthy();
      expect(reading.sourceMaterial.briefingOptions).toHaveLength(3);
      expect(reading.sourceMaterial.citations).toEqual(reading.citations);
    }
  });
});
