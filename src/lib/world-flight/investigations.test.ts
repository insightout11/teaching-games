import { describe, expect, it } from 'vitest';
import {
  deriveInvestigationTags,
  deriveWorldFlightInvestigationProgress,
  type CompletedWorldFlightEvidence,
} from '@/lib/world-flight/investigations';
import { buildWorldFlightEvidenceSnapshot, type WorldFlightEvidenceSnapshot } from '@/lib/world-flight/journey';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

function evidence(
  destinationId: string,
  city: string,
  skills: string[],
  completedAt: string,
): CompletedWorldFlightEvidence {
  const snapshot: WorldFlightEvidenceSnapshot = {
    destinationId,
    city,
    country: 'Test',
    focusId: `${destinationId}-focus`,
    focusTitle: `${city} lesson`,
    focusKind: 'reading',
    publisher: 'LessonCaptain',
    lessonGoal: 'Test the investigation system.',
    skills,
    investigationTags: [],
    keyIdea: null,
    tradeoff: null,
    designUse: null,
  };

  return { destinationId, completedAt, evidenceSnapshot: snapshot };
}

describe('World Flight investigations', () => {
  it('adds canonical tags while preserving source skills', () => {
    expect(deriveInvestigationTags(['Transport', 'debate'])).toEqual(
      expect.arrayContaining(['transport', 'debate', 'mobility', 'fairness']),
    );
  });

  it('requires three distinct cities to complete an investigation', () => {
    const progress = deriveWorldFlightInvestigationProgress([
      evidence('tokyo', 'Tokyo', ['transport', 'functional English', 'debate'], '2026-01-01'),
      evidence('seoul', 'Seoul', ['transport'], '2026-01-02'),
      evidence('los-angeles', 'Los Angeles', ['environment', 'debate'], '2026-01-03'),
    ]);
    const movement = progress.find((item) => item.id === 'how-cities-move');

    expect(movement).toMatchObject({ completedCount: 3, complete: true });
    expect(new Set(movement?.requirements.map((requirement) => requirement.evidence?.city)).size).toBe(3);
  });

  it('does not let one city satisfy multiple requirements', () => {
    const progress = deriveWorldFlightInvestigationProgress([
      evidence('tokyo', 'Tokyo', ['transport', 'functional English', 'debate'], '2026-01-01'),
    ]);
    const movement = progress.find((item) => item.id === 'how-cities-move');

    expect(movement).toMatchObject({ completedCount: 1, complete: false });
  });

  it('keeps every investigation achievable with the current destination catalog', () => {
    const catalogEvidence = WORLD_DESTINATIONS.flatMap((destination, destinationIndex) => (
      destination.focusOptions.map((focus, focusIndex) => ({
        destinationId: destination.id,
        completedAt: `2026-01-${String(destinationIndex + 1).padStart(2, '0')}T00:00:${String(focusIndex).padStart(2, '0')}Z`,
        evidenceSnapshot: buildWorldFlightEvidenceSnapshot(destination, focus),
      }))
    ));
    const progress = deriveWorldFlightInvestigationProgress(catalogEvidence);

    expect(progress.every((investigation) => investigation.complete)).toBe(true);
    expect(catalogEvidence.every((entry) => entry.evidenceSnapshot.investigationTags.length > 0)).toBe(true);
  });
});
