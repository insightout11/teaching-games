/**
 * A fair random pick: everyone present is picked once (in random order) before anyone is picked again,
 * and never the same student twice in a row. `picked` holds this round's ids; the caller keeps it.
 */
export function fairPick(ids: string[], picked: string[], lastId: string | null, rand: () => number = Math.random): { id: string | null; picked: string[] } {
  if (ids.length === 0) return { id: null, picked };
  let round = picked.filter((id) => ids.indexOf(id) !== -1);
  let pool = ids.filter((id) => round.indexOf(id) === -1);
  if (pool.length === 0) {
    round = [];
    pool = ids.length > 1 ? ids.filter((id) => id !== lastId) : ids.slice();
  }
  const id = pool[Math.floor(rand() * pool.length)] ?? pool[0];
  return { id, picked: [...round, id] };
}
