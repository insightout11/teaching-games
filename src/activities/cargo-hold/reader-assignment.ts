/**
 * Cargo Hold â€” reading assignment.
 *
 * Every submitted sentence is read aloud by someone other than its author. The
 * assignment must be deterministic (so it survives refresh unchanged) and balanced
 * (so no student is handed the whole round).
 */

import type { CargoSubmission } from './types';

/** Small deterministic hash so the same round always derangess the same way. */
function seedFrom(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

export interface ReaderAssignmentInput {
  submissions: Array<Pick<CargoSubmission, 'submissionId' | 'clientId'>>;
  /** Every client currently able to read â€” usually all connected players. */
  readerClientIds: string[];
  roundId: string;
}

/**
 * Assign a non-author reader to each submission.
 *
 * Guarantees:
 * - no student is ever assigned their own sentence;
 * - the same inputs always produce the same assignment;
 * - reading load differs by at most one across available readers.
 *
 * When only one reader exists (everyone else disconnected) their own sentence is
 * left unassigned rather than mis-assigned â€” the teacher reads or skips it.
 */
export function assignReaders({
  submissions,
  readerClientIds,
  roundId,
}: ReaderAssignmentInput): Record<string, string | null> {
  const assignment: Record<string, string | null> = {};
  const readers = readerClientIds.filter((id, index) => readerClientIds.indexOf(id) === index);
  if (submissions.length === 0) return assignment;
  if (readers.length === 0) {
    submissions.forEach((submission) => {
      assignment[submission.submissionId] = null;
    });
    return assignment;
  }

  const random = seededRandom(seedFrom(roundId));
  // A cyclic walk over the readers is what keeps the load even: each pass around the
  // ring hands out one reading each. The per-round starting offset is what stops the
  // same two students being paired every single round.
  const offset = Math.floor(random() * readers.length);
  const load = new Map<string, number>(readers.map((id) => [id, 0]));

  const ordered = [...submissions].sort((a, b) => a.submissionId.localeCompare(b.submissionId));

  let cursor = offset;
  ordered.forEach((submission) => {
    let chosen: string | null = null;
    // Walk forward from the cursor to the first reader who is not the author. Skipping
    // costs at most one position, so loads still differ by no more than one.
    for (let step = 0; step < readers.length; step += 1) {
      const candidate = readers[(cursor + step) % readers.length];
      if (candidate !== submission.clientId) {
        chosen = candidate;
        cursor = (cursor + step + 1) % readers.length;
        break;
      }
    }

    assignment[submission.submissionId] = chosen;
    if (chosen) load.set(chosen, (load.get(chosen) ?? 0) + 1);
  });

  return assignment;
}

/**
 * Reassign one submission away from a disconnected reader. Authorship never changes;
 * only who speaks it does.
 */
export function reassignReader(
  current: Record<string, string | null>,
  submission: Pick<CargoSubmission, 'submissionId' | 'clientId'>,
  availableReaderClientIds: string[],
): Record<string, string | null> {
  const previous = current[submission.submissionId] ?? null;
  const load = new Map<string, number>();
  Object.values(current).forEach((readerId) => {
    if (readerId) load.set(readerId, (load.get(readerId) ?? 0) + 1);
  });

  const candidate = availableReaderClientIds
    .filter((id) => id !== submission.clientId && id !== previous)
    .sort((a, b) => (load.get(a) ?? 0) - (load.get(b) ?? 0))[0] ?? null;

  return { ...current, [submission.submissionId]: candidate };
}
