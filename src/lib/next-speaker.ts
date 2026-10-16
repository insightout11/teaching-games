/**
 * Next speaker picking helper — shared by every activity's speaking moment.
 *
 * Picks a student who is present (in `presentIds`) and has not been named yet
 * in the current cycle (`alreadyNamed`). When everyone present has been named,
 * the cycle starts again. Students named least recently (lowest `callCounts`)
 * come first, so quiet students are not skipped.
 *
 * ES5-safe: no `/u` regex, no iterating a Set/Map directly.
 */

export function pickNextSpeaker(
  presentIds: string[],
  callCounts: Record<string, number>,
  alreadyNamed: string[],
  preferredId?: string | null,
): string | null {
  if (!presentIds || presentIds.length === 0) return null;

  // alreadyNamed filtered to present students only (absent students never count).
  const namedPresent: string[] = [];
  for (let i = 0; i < alreadyNamed.length; i++) {
    const id = alreadyNamed[i];
    if (presentIds.indexOf(id) !== -1 && namedPresent.indexOf(id) === -1) {
      namedPresent.push(id);
    }
  }

  // A preferred first name (for example the student who solved a group) goes
  // first, but only when present and not already named this cycle.
  if (preferredId && presentIds.indexOf(preferredId) !== -1 && namedPresent.indexOf(preferredId) === -1) {
    return preferredId;
  }

  // Candidates: present students not yet named this cycle.
  let candidates: string[] = [];
  for (let i = 0; i < presentIds.length; i++) {
    const id = presentIds[i];
    if (namedPresent.indexOf(id) === -1) {
      candidates.push(id);
    }
  }

  // Everyone has been named: start again from the full present list.
  if (candidates.length === 0) {
    candidates = presentIds.slice();
  }

  // Least recent first. Ties keep roster order (stable, no skipping).
  let best: string | null = null;
  let bestCount = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const id = candidates[i];
    const count = typeof callCounts[id] === 'number' ? callCounts[id] : 0;
    if (count < bestCount) {
      bestCount = count;
      best = id;
    }
  }
  return best;
}
