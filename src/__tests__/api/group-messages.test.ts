import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiGen = vi.fn();
vi.mock('@/lib/ai', () => ({ generateJSON: (...a: unknown[]) => aiGen(...a) }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })) }));

import { POST } from '@/app/api/live-room/group-messages/route';

const post = (body: unknown) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }));

describe('group-messages route', () => {
  beforeEach(() => { aiGen.mockReset(); });

  it('keeps only real groups of known messages', async () => {
    aiGen.mockResolvedValue([
      { label: 'Why do cities flood?', ids: ['a', 'b', 'zzz'] },
      { label: 'Lonely', ids: ['c'] },
      { label: 'Dup', ids: ['a', 'd'] },
    ]);
    const data = await (await post({ messages: [
      { id: 'a', text: 'why do cities flood' },
      { id: 'b', text: 'how come cities get floods' },
      { id: 'c', text: 'can we play a game' },
      { id: 'd', text: 'what is a delta' },
    ] })).json();
    expect(data.groups).toEqual([{ label: 'Why do cities flood?', ids: ['a', 'b'] }]);
  });

  it('skips the AI for fewer than two messages and fails soft', async () => {
    expect((await (await post({ messages: [{ id: 'a', text: 'hi' }] })).json()).groups).toEqual([]);
    expect(aiGen).not.toHaveBeenCalled();
    aiGen.mockRejectedValue(new Error('down'));
    expect((await (await post({ messages: [{ id: 'a', text: 'x' }, { id: 'b', text: 'y' }] })).json()).groups).toEqual([]);
  });
});
