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
});
