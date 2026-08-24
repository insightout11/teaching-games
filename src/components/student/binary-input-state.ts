export type BinarySubmitStatus = 'idle' | 'success' | 'error' | 'rate_limited';

export function resolveBinarySelectedIndex(
  labels: readonly string[],
  initialResponse?: string | null,
): number | null {
  if (!initialResponse) return null;
  const index = labels.indexOf(initialResponse);
  return index >= 0 ? index : null;
}

export function reconcileBinarySelection(
  selectedIndex: number | null,
  submitStatus: BinarySubmitStatus,
): number | null {
  return submitStatus === 'error' ? null : selectedIndex;
}

export function binaryOptionClassName(selected: boolean): string {
  return `p-6 rounded-2xl border transition-all font-bold text-xl disabled:opacity-100 ${
    selected
      ? 'border-cyan-200 bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-200/70'
      : 'border-lc-border bg-lc-surface text-lc-text hover:border-cyan-500/50 hover:bg-lc-card'
  }`;
}
