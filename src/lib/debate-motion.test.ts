import { describe, expect, it } from 'vitest';
import motionsBank from '@/data/debate-motions.json';
import { bankMotionFor, fallbackMotion, validMotion } from './debate-motion';

describe('debate motions', () => {
  it('every bank motion is valid with evidence for both sides', () => {
    (motionsBank as unknown[]).forEach((m) => {
      const v = validMotion(m)!;
      expect(v).not.toBeNull();
      expect(v.pulse.endsWith('?')).toBe(true);
    });
  });

  it('matches a topic to a checked motion, else null', () => {
    const m = bankMotionFor('phones at school', 'Intermediate');
    expect(m).not.toBeNull();
    expect(m!.forPoints.length).toBeGreaterThanOrEqual(2);
    expect(bankMotionFor('quantum chromodynamics')).toBeNull();
  });

  it('falls back to a usable motion from any topic', () => {
    const f = fallbackMotion('Should cities ban cars?');
    expect(f.pulse).toBe('Should cities ban cars?');
    expect(validMotion(f)).not.toBeNull();
  });
});
