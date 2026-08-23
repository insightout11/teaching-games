import { describe, expect, it } from 'vitest';
import {
  binaryOptionClassName,
  reconcileBinarySelection,
  resolveBinarySelectedIndex,
} from './binary-input-state';

describe('binary input submitted state', () => {
  it('keeps the selected answer readable after a successful submission', () => {
    expect(reconcileBinarySelection(1, 'success')).toBe(1);

    const selectedClasses = binaryOptionClassName(true);
    expect(selectedClasses).toContain('bg-cyan-400');
    expect(selectedClasses).toContain('text-slate-950');
    expect(selectedClasses).toContain('disabled:opacity-100');
  });

  it('restores the selected answer from the active round response', () => {
    expect(resolveBinarySelectedIndex(['True', 'False'], 'False')).toBe(1);
    expect(resolveBinarySelectedIndex(['True', 'False'], 'older answer')).toBeNull();
    expect(resolveBinarySelectedIndex(['True', 'False'], null)).toBeNull();
  });
});
