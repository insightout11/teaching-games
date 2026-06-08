import { describe, expect, it } from 'vitest';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

describe('world flight destination packs', () => {
  it('ships the Tokyo pilot with distinct video and reading sources', () => {
    const tokyo = WORLD_DESTINATIONS.find((destination) => destination.id === 'tokyo');
    expect(tokyo).toBeDefined();

    const focusOptions = tokyo!.focusOptions;
    const videos = focusOptions.filter((focus) => focus.kind === 'video');
    const readings = focusOptions.filter((focus) => focus.kind === 'reading');

    expect(focusOptions).toHaveLength(6);
    expect(videos).toHaveLength(3);
    expect(readings).toHaveLength(3);
    expect(new Set(focusOptions.map((focus) => focus.id)).size).toBe(6);

    for (const video of videos) {
      expect(video.sourceMaterial.sourceType).toBe('youtube');
      expect(video.sourceMaterial.sourceKey).toMatch(/^[a-zA-Z0-9_-]{11}$/);
      expect(video.review.status).toBe('transcript-verified');
      expect(video.review.transcriptLanguage).toBeTruthy();
    }

    for (const reading of readings) {
      expect(reading.sourceMaterial.sourceType).toBe('text');
      expect(reading.review.status).toBe('researched');
      expect(reading.citations?.length).toBeGreaterThanOrEqual(2);
      expect(reading.sourceMaterial.briefingMode).toBe('generated');
    }
  });
});
