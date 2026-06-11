import type { DestinationFocus, DestinationFocusKind, DestinationPack } from '@/lib/world-flight/types';
import type { WorldFlightInvestigationProgress } from '@/lib/world-flight/investigations';
import { deriveInvestigationTags } from '@/lib/world-flight/investigations';

export type WorldFlightLegStatus = 'planned' | 'completed' | 'cancelled';

export interface WorldFlightClassSummary {
  id: string;
  name: string;
  currentDestinationId: string | null;
  planeTier: number;
  planeKey: string;
  rangeKm: number;
  investigations: WorldFlightInvestigationProgress[];
}

export interface WorldFlightLaunchContext {
  destinationId: string;
  focusId: string;
  requestedMove: boolean;
  /** Teacher-selected starting city used only when the class has no persisted location yet. */
  departureDestinationId?: string;
}

export interface WorldFlightEvidenceSnapshot {
  destinationId: string;
  city: string;
  country: string;
  focusId: string;
  focusTitle: string;
  focusKind: DestinationFocusKind;
  publisher: string;
  lessonGoal: string;
  skills: string[];
  investigationTags: string[];
  keyIdea: string | null;
  tradeoff: string | null;
  designUse: string | null;
}

export interface WorldFlightSessionContext extends WorldFlightLaunchContext {
  originDestinationId: string | null;
  distanceKm: number;
  rangeKm: number;
  movesClass: boolean;
  evidenceSnapshot: WorldFlightEvidenceSnapshot;
}

export interface WorldFlightMovement {
  isFirstFlight: boolean;
  isWithinRange: boolean;
  movesClass: boolean;
}

export function parseWorldFlightLaunchContext(value: unknown): WorldFlightLaunchContext | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.destinationId !== 'string' ||
    typeof candidate.focusId !== 'string' ||
    typeof candidate.requestedMove !== 'boolean'
  ) {
    return null;
  }

  return {
    destinationId: candidate.destinationId,
    focusId: candidate.focusId,
    requestedMove: candidate.requestedMove,
    ...(typeof candidate.departureDestinationId === 'string'
      ? { departureDestinationId: candidate.departureDestinationId }
      : {}),
  };
}

export function resolveWorldFlightMovement({
  originDestinationId,
  destinationId,
  distanceKm,
  rangeKm,
  requestedMove,
}: {
  originDestinationId: string | null;
  destinationId: string;
  distanceKm: number;
  rangeKm: number;
  requestedMove: boolean;
}): WorldFlightMovement {
  const isFirstFlight = originDestinationId === null;
  const isWithinRange = isFirstFlight || originDestinationId === destinationId || distanceKm <= rangeKm;

  return {
    isFirstFlight,
    isWithinRange,
    movesClass: requestedMove && isWithinRange && originDestinationId !== destinationId,
  };
}

export function buildWorldFlightEvidenceSnapshot(
  destination: DestinationPack,
  focus: DestinationFocus,
): WorldFlightEvidenceSnapshot {
  return {
    destinationId: destination.id,
    city: destination.city,
    country: destination.country,
    focusId: focus.id,
    focusTitle: focus.title,
    focusKind: focus.kind,
    publisher: focus.publisher,
    lessonGoal: focus.lessonGoal,
    skills: focus.skills,
    investigationTags: deriveInvestigationTags(focus.skills, focus.evidence?.investigationTags),
    keyIdea: focus.evidence?.keyIdea ?? null,
    tradeoff: focus.evidence?.tradeoff ?? null,
    designUse: focus.evidence?.designUse ?? null,
  };
}

