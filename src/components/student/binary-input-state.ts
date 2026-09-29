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
  return `p-6 rounded-2xl border transition-all font-display text-2xl touch-manipulation disabled:opacity-100 ${
    selected
      ? 'border-amber-200 bg-amber-400 text-slate-950 ring-2 ring-amber-200/60'
      : 'border-lc-border bg-lc-card text-lc-text hover:border-lc-text3'
  }`;
}
