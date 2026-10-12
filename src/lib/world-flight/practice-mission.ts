import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { buildWorldFlightEvidenceSnapshot } from '@/lib/world-flight/journey';
import {
  WORLD_FLIGHT_INVESTIGATIONS,
  buildWorldFlightDesignMissionContext,
  deriveInvestigationTags,
  type CompletedWorldFlightEvidence,
  type WorldFlightDesignMissionContext,
} from '@/lib/world-flight/investigations';

/**
 * A practice design mission: the real mission for an investigation, built from three real city lessons in the
 * library as if the class had flown them. It lets a teacher try a mission without first completing three city
 * lessons. Nothing about it is saved to the class journey.
 */
export function buildPracticeDesignMission(investigationId: string): WorldFlightDesignMissionContext | null {
  const investigation = WORLD_FLIGHT_INVESTIGATIONS.find((candidate) => candidate.id === investigationId);
  if (!investigation) return null;

  // One library lesson per requirement, each from a different city, preferring a lesson that records how a design
  // could use it. (Picked directly: handing the whole library to the mission builder is far too slow.)
  const picked: CompletedWorldFlightEvidence[] = [];
  const usedCities = new Set<string>();
  for (const requirement of investigation.requirements) {
    const wanted = requirement.matchTags.map((tag) => tag.trim().toLowerCase());
    let best: CompletedWorldFlightEvidence | null = null;
    for (const destination of WORLD_DESTINATIONS) {
      if (usedCities.has(destination.id)) continue;
      for (const focus of destination.focusOptions) {
        const tags = deriveInvestigationTags(focus.skills, focus.evidence?.investigationTags);
        if (!wanted.some((tag) => tags.includes(tag))) continue;
        const useful = Boolean(focus.evidence?.designUse || focus.evidence?.keyIdea);
        if (best && !useful) continue;
        best = { destinationId: destination.id, completedAt: null, evidenceSnapshot: buildWorldFlightEvidenceSnapshot(destination, focus) } as CompletedWorldFlightEvidence;
        if (useful) break;
      }
      if (best?.evidenceSnapshot?.designUse || best?.evidenceSnapshot?.keyIdea) break;
    }
    if (!best) return null;
    usedCities.add(best.destinationId);
    picked.push(best);
  }

  const context = buildWorldFlightDesignMissionContext(investigationId, picked);
  return context ? { ...context, practice: true } : null;
}
