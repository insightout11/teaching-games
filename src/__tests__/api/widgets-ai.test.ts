import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiGen = vi.fn();
vi.mock('@/lib/ai', () => ({ generateJSON: (...a: unknown[]) => aiGen(...a) }));
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })),
  checkAndRecordAiUsage: vi.fn(async () => null),
}));

import { POST } from '@/app/api/widgets/ai/route';

const post = (body: unknown) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }));

describe('widgets AI', () => {
  beforeEach(() => { aiGen.mockReset(); });

  it('writes a poll for the topic', async () => {
    aiGen.mockResolvedValue({ question: 'Would you live by a river?', options: ['Yes', 'No', 'Maybe', '', 'x', 'y'] });
    const data = await (await post({ action: 'poll', topic: 'Rivers', difficulty: 'Beginner' })).json();
    expect(data).toEqual({ question: 'Would you live by a river?', options: ['Yes', 'No', 'Maybe', 'x', 'y'] });
  });

  it('writes a word cloud prompt', async () => {
    aiGen.mockResolvedValue({ prompt: 'One word for rivers' });
    expect((await (await post({ action: 'cloudPrompt', topic: 'Rivers' })).json()).prompt).toBe('One word for rivers');
  });

  it('tidies only words students actually sent', async () => {
    aiGen.mockResolvedValue({ merge: [{ from: 'Rivers', to: 'river' }, { from: 'ghost', to: 'x' }, { from: 'river', to: 'river' }], blocked: ['stupid', 'nothere'] });
    const data = await (await post({ action: 'cloudTidy', words: ['rivers', 'river', 'stupid', 'water'] })).json();
    expect(data).toEqual({ merge: [{ from: 'rivers', to: 'river' }], blocked: ['stupid'] });
  });

  it('validates and fails soft', async () => {
    expect((await post({ action: 'nope' })).status).toBe(400);
    expect((await post({ action: 'poll' })).status).toBe(400);
    expect((await (await post({ action: 'cloudTidy', words: [] })).json())).toEqual({ merge: [], blocked: [] });
    aiGen.mockRejectedValue(new Error('down'));
    expect((await post({ action: 'poll', topic: 'x' })).status).toBe(502);
  });
});
