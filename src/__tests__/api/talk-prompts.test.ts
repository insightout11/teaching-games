import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiGen = vi.fn();
vi.mock('@/lib/ai', () => ({ generateJSON: (...a: unknown[]) => aiGen(...a) }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })) }));

import { POST } from '@/app/api/live-room/talk-prompts/route';

const post = (body: unknown) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }));

describe('talk-prompts route', () => {
  beforeEach(() => { aiGen.mockReset(); });

  it('returns three prompts with two follow-ups each', async () => {
    aiGen.mockResolvedValue([
      { prompt: 'Would you rather visit Tokyo or Paris?', followUps: ['Why?', 'Who would you take?', 'extra'] },
      { prompt: 'What food would you try first?', followUps: ['Is it spicy?'] },
      { prompt: 'Which festival is best?', followUps: ['When is it?', 'Have you been?'] },
      { prompt: 'dropped', followUps: [] },
    ]);
    const res = await post({ kind: 'wyr', topic: 'travel', difficulty: 'Beginner' });
    const data = await res.json();
    expect(data.prompts).toHaveLength(3);
    expect(data.prompts[0].followUps).toEqual(['Why?', 'Who would you take?']);
    expect(aiGen.mock.calls[0][0]).toContain('"Would you rather');
    expect(aiGen.mock.calls[0][0]).toContain('Topic: "travel"');
  });

  it('rejects unknown kinds', async () => {
    expect((await post({ kind: 'nope' })).status).toBe(400);
    expect(aiGen).not.toHaveBeenCalled();
  });

  it('reports a friendly error when the AI fails', async () => {
    aiGen.mockImplementation(async () => { throw new Error('down'); });
    const res = await post({ kind: 'warmup' });
    expect(res.status).toBe(502);
  });
});
