import { describe, expect, it } from 'vitest';
import { anonymiseThread, planKeyOf, restorableThread, threadHasContent } from './thread-backup';

describe('thread backup', () => {
  const thread = {
    pulse: [{ text: 'Ban cars?', type: 'binary' as const, votes: { c1: { name: 'Ana', choice: 'Yes' } } }],
    grammarCheck: { target: 'past simple', total: 3, results: { c1: { name: 'Ana', right: 2 } } },
  };

  it('strips names but keeps the choices', () => {
    const a = anonymiseThread(thread);
    expect(a.pulse[0].votes.c1).toEqual({ name: '', choice: 'Yes' });
    expect(a.grammarCheck?.results.c1).toEqual({ name: '', right: 2 });
    expect(JSON.stringify(a)).not.toContain('Ana');
  });

  it('restores only for the same plan', () => {
    const key = planKeyOf({ flightPresetId: 'speak-60', customTopic: 'Cafés', callsign: 'LC-1' });
    expect(restorableThread({ planKey: key, thread }, key)).toEqual(thread);
    expect(restorableThread({ planKey: key, thread }, 'other')).toBeNull();
    expect(restorableThread(null, key)).toBeNull();
  });

  it('knows an empty thread', () => {
    expect(threadHasContent({ pulse: [] })).toBe(false);
    expect(threadHasContent(thread)).toBe(true);
  });
});
