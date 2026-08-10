import { describe, expect, it } from 'vitest';
import { LatestRequestGate } from '@/lib/latest-request-gate';

describe('LatestRequestGate', () => {
  it('rejects an older response after a newer request starts', () => {
    const gate = new LatestRequestGate();
    const older = gate.begin();
    const newer = gate.begin();

    expect(gate.isCurrent(older)).toBe(false);
    expect(gate.isCurrent(newer)).toBe(true);
  });

  it('rejects an in-flight response after realtime invalidation', () => {
    const gate = new LatestRequestGate();
    const request = gate.begin();
    gate.invalidate();

    expect(gate.isCurrent(request)).toBe(false);
  });

  it('does not let an older failed reconcile overwrite a newer success', async () => {
    const gate = new LatestRequestGate();
    const applied: string[] = [];
    const older = gate.begin();
    const newer = gate.begin();

    await Promise.resolve();
    if (gate.isCurrent(newer)) applied.push('newer-success');
    if (gate.isCurrent(older)) applied.push('older-failure');

    expect(applied).toEqual(['newer-success']);
  });

  it('ignores a late question-one submission after question two invalidates it', async () => {
    const gate = new LatestRequestGate();
    const applied: string[] = [];
    const questionOne = gate.begin();
    gate.invalidate();
    const questionTwo = gate.begin();

    if (gate.isCurrent(questionOne)) applied.push('question-one-disabled');
    if (gate.isCurrent(questionTwo)) applied.push('question-two-ready');

    expect(applied).toEqual(['question-two-ready']);
  });
});
