// Imposter rules that must hold every round — kept pure so they're tested.

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick imposters, preferring students who haven't been one yet this game.
 * `count` is clamped so at least two crew remain.
 */
export function pickImposters(names: string[], used: string[], count: number, rand: () => number = Math.random): string[] {
  const n = Math.max(1, Math.min(count, names.length - 2));
  const fresh = shuffle(names.filter((x) => !used.includes(x)), rand);
  const rest = shuffle(names.filter((x) => used.includes(x)), rand);
  return [...fresh, ...rest].slice(0, n);
}

/**
 * Clue order for a round. It must change every round:
 * - never the same first speaker as last round,
 * - never the exact same order as last round,
 * - an imposter never speaks first (they need to hear at least one clue).
 */
export function clueOrder(
  names: string[],
  imposters: string[],
  previous: string[] | null,
  rand: () => number = Math.random,
): string[] {
  if (names.length <= 1) return [...names];
  const ok = (order: string[]) =>
    !imposters.includes(order[0]) &&
    (!previous || previous.length === 0 || order[0] !== previous[0] || names.length === imposters.length + 1) &&
    (!previous || order.join('|') !== previous.join('|'));
  for (let attempt = 0; attempt < 60; attempt++) {
    const order = shuffle(names, rand);
    if (ok(order)) return order;
  }
  // Tiny classes: construct one directly — a crew member who didn't start last time goes first.
  const crew = names.filter((x) => !imposters.includes(x));
  const first = crew.find((x) => x !== previous?.[0]) ?? crew[0] ?? names[0];
  return [first, ...shuffle(names.filter((x) => x !== first), rand)];
}

export interface ImposterVote { clientId: string; choice: string; studentId?: string | null; displayName?: string }

/** Who the class accused: the top `count` vote-getters (ties at the cut-off mean nobody extra is accused). */
export function accusedFrom(votes: ImposterVote[], count: number): string[] {
  const tally = new Map<string, number>();
  for (const v of votes) tally.set(v.choice, (tally.get(v.choice) ?? 0) + 1);
  const sorted = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]);
  const out: string[] = [];
  for (let i = 0; i < sorted.length && out.length < count; i++) {
    const [name, n] = sorted[i];
    const tiedLeft = sorted.filter(([other, m]) => m === n && !out.includes(other)).length;
    if (out.length + tiedLeft > count) break; // tie at the cut-off → can't accuse
    out.push(name);
  }
  return out;
}

export function tallyVotes(votes: ImposterVote[]): Record<string, number> {
  const t: Record<string, number> = {};
  for (const v of votes) t[v.choice] = (t[v.choice] ?? 0) + 1;
  return t;
}
