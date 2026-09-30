/**
 * Word-level diff between a student's sentence and its corrected version, so the
 * shared screen can show exactly what changed (removed words struck through,
 * added words highlighted). Longest-common-subsequence on words; punctuation and
 * case are ignored when matching but kept for display.
 */
export type DiffPart = { text: string; kind: 'same' | 'removed' | 'added' };

const key = (w: string) => w.toLowerCase().replace(/[^a-z0-9'\u00C0-\u024F]/g, '');

export function wordDiff(before: string, after: string): DiffPart[] {
  const a = before.trim().split(/\s+/).filter(Boolean);
  const b = after.trim().split(/\s+/).filter(Boolean);
  const n = a.length;
  const m = b.length;
  // LCS table (sentences are short, so O(n·m) is fine).
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = key(a[i]) === key(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(a[i]) === key(b[j])) { out.push({ text: b[j], kind: 'same' }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ text: a[i], kind: 'removed' }); i++; }
    else { out.push({ text: b[j], kind: 'added' }); j++; }
  }
  while (i < n) out.push({ text: a[i++], kind: 'removed' });
  while (j < m) out.push({ text: b[j++], kind: 'added' });
  return out;
}

/** True when the correction changed nothing but punctuation/case. */
export function isUnchanged(before: string, after: string): boolean {
  return wordDiff(before, after).every((p) => p.kind === 'same');
}
