import { describe, expect, it } from 'vitest';
import {
  STARTER_PLANE_RANGE_KM,
  WORLD_DESTINATIONS,
  WORLD_FLIGHT_MAX_VIDEO_DURATION_SECS,
} from '@/data/world-flight/destinations';
import { getReadingTurnWordTarget, splitReadingTurns } from '@/lib/read-aloud';
import { distanceKm } from '@/lib/world-flight/geo';
import { assessWorldFlightReadingQuality, countWords } from '@/lib/world-flight/readings';

type TravelAnchorCatalogItem = {
  id: string;
  whatItIs: string;
  sourceUrl?: string;
  review: {
    status: string;
  };
};

function validateWorldFlightTravelAnchorsCatalog(destinations = WORLD_DESTINATIONS) {
  const issues: string[] = [];
  const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function validateItems(destinationId: string, listName: string, items: TravelAnchorCatalogItem[]) {
    const seenIds = new Set<string>();

    for (const item of items) {
      const label = `${destinationId}/${listName}/${item.id || '(missing-id)'}`;
      if (!item.id) {
        issues.push(`${label}: missing id`);
      } else if (!kebabCase.test(item.id)) {
        issues.push(`${label}: id must be kebab-case`);
      }

      if (seenIds.has(item.id)) {
        issues.push(`${label}: duplicate id`);
      }
      seenIds.add(item.id);

      if (!item.whatItIs.trim()) {
        issues.push(`${label}: missing whatItIs`);
      }

      if (item.review.status === 'verified' && !item.sourceUrl) {
        issues.push(`${label}: verified item must include sourceUrl`);
      }

      const sourceUrl = item.sourceUrl;
      if (sourceUrl) {
        expect(() => new URL(sourceUrl), `${label}: ${sourceUrl}`).not.toThrow();
      }
    }
  }

  for (const destination of destinations) {
    const anchors = destination.travelAnchors;
    if (!anchors) {
      issues.push(`${destination.id}: missing travelAnchors`);
      continue;
    }

    if (anchors.dishes.length < 3 || anchors.dishes.length > 5) {
      issues.push(`${destination.id}: dishes must include 3 to 5 items`);
    }
    if (anchors.attractions.length < 3) {
      issues.push(`${destination.id}: attractions must include at least 3 items`);
    }

    validateItems(destination.id, 'dishes', anchors.dishes);
    validateItems(destination.id, 'attractions', anchors.attractions);

    const validAirports = new Set([destination.primaryAirport, ...destination.airports]);
    for (const transport of anchors.transport ?? []) {
      if (!validAirports.has(transport.fromAirport)) {
        issues.push(`${destination.id}/transport/${transport.mode}: fromAirport must match a city airport`);
      }
    }
  }

  return issues;
}

describe('world flight destination packs', () => {
  it('ships verified travel anchors for every destination', () => {
    expect(validateWorldFlightTravelAnchorsCatalog()).toEqual([]);
  });

  it('ships every destination with three readings and only verified video sets', () => {
    for (const destination of WORLD_DESTINATIONS) {
      const focusOptions = destination.focusOptions;
      const videos = focusOptions.filter((focus) => focus.kind === 'video');
      const readings = focusOptions.filter((focus) => focus.kind === 'reading');

      expect(focusOptions, destination.id).toHaveLength(6);
      expect(videos, destination.id).toHaveLength(3);
      expect(readings, destination.id).toHaveLength(3);
      expect(new Set(focusOptions.map((focus) => focus.id)).size, destination.id).toBe(focusOptions.length);

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
        expect(new Set(reading.citations?.map((citation) => citation.url)).size, `${destination.id}/${reading.id}`).toBe(
          reading.citations?.length,
        );
        for (const citation of reading.citations ?? []) {
          expect(() => new URL(citation.url), `${destination.id}/${reading.id}: ${citation.url}`).not.toThrow();
        }
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

    expect(publishedReadings).toHaveLength(WORLD_DESTINATIONS.length * 3);
    for (const reading of publishedReadings) {
      expect(assessWorldFlightReadingQuality(reading.sourceMaterial)).toEqual({ publishable: true, issues: [] });
      expect(reading.sourceMaterial.sourceText).toBeTruthy();
      expect(reading.sourceMaterial.briefingOptions).toHaveLength(3);
      expect(new Set(reading.sourceMaterial.briefingOptions?.map((option) => option.text)).size).toBe(3);
      expect(reading.sourceMaterial.citations).toEqual(reading.citations);

      const easy = reading.sourceMaterial.briefingOptions?.find((option) => option.id === 'world-flight-easy')?.text ?? '';
      const standard =
        reading.sourceMaterial.briefingOptions?.find((option) => option.id === 'world-flight-standard')?.text ?? '';
      const advanced =
        reading.sourceMaterial.briefingOptions?.find((option) => option.id === 'world-flight-advanced')?.text ?? '';
      expect(countWords(easy), reading.id).toBeLessThan(countWords(standard));
      expect(countWords(standard), reading.id).toBeLessThan(countWords(advanced));

      const easyTurns = splitReadingTurns(easy, 6, getReadingTurnWordTarget('Easy'));
      const standardTurns = splitReadingTurns(standard, 6, getReadingTurnWordTarget('Intermediate'));
      expect(easyTurns.length, reading.id).toBeGreaterThanOrEqual(standardTurns.length);
    }
  });

  it('offers an approachable and challenging topic mix in every city', () => {
    for (const destination of WORLD_DESTINATIONS) {
      const easyTopics = destination.focusOptions.filter((focus) => focus.difficulty === 'Easy');
      expect(easyTopics.length, destination.id).toBeGreaterThanOrEqual(2);
      expect(destination.focusOptions.some((focus) => focus.difficulty === 'Intermediate'), destination.id).toBe(true);
      expect(destination.focusOptions.some((focus) => focus.difficulty === 'Advanced'), destination.id).toBe(true);
    }
  });

  it('does not reuse long article paragraphs across different readings', () => {
    const paragraphOwners = new Map<string, Set<string>>();

    for (const destination of WORLD_DESTINATIONS) {
      for (const reading of destination.focusOptions.filter((focus) => focus.kind === 'reading')) {
        for (const option of reading.sourceMaterial.briefingOptions ?? []) {
          for (const paragraph of option.text.split(/\n\s*\n/)) {
            if (paragraph.trim().split(/\s+/).length < 20) continue;
            const owners = paragraphOwners.get(paragraph) ?? new Set<string>();
            owners.add(`${destination.id}/${reading.id}`);
            paragraphOwners.set(paragraph, owners);
          }
        }
      }
    }

    const reusedParagraphs = Array.from(paragraphOwners.entries()).filter(([, owners]) => owners.size > 1);
    expect(reusedParagraphs).toEqual([]);
  });

  it('keeps every city connected by starter-plane legs', () => {
    const visited = new Set<string>([WORLD_DESTINATIONS[0].id]);
    const queue = [WORLD_DESTINATIONS[0]];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      for (const candidate of WORLD_DESTINATIONS) {
        if (visited.has(candidate.id) || distanceKm(current, candidate) > STARTER_PLANE_RANGE_KM) continue;
        visited.add(candidate.id);
        queue.push(candidate);
      }
    }

    expect(Array.from(visited).sort()).toEqual(WORLD_DESTINATIONS.map((destination) => destination.id).sort());
  });
});
