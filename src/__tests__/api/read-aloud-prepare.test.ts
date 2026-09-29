import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiGen = vi.fn();
vi.mock('@/lib/ai', () => ({ generateJSON: (...a: unknown[]) => aiGen(...a) }));
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })),
  checkAndRecordAiUsage: vi.fn(async () => null),
}));

import { POST } from '@/app/api/read-aloud/prepare/route';

const post = (body: unknown) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }));
const text = 'The river flooded the town after three days of heavy rain. Families moved to higher ground while volunteers helped.';

describe('read-aloud prepare', () => {
  beforeEach(() => { aiGen.mockReset(); });

  it('returns the class version and the safety check', async () => {
    aiGen.mockResolvedValue({ classText: 'It rained for three days. The river flooded the town.\n\nFamilies moved up the hill.', safe: true, safetyNote: '' });
    const data = await (await post({ title: 'Flood', text, difficulty: 'Beginner' })).json();
    expect(data.safe).toBe(true);
    expect(data.classText).toContain('flooded');
    expect(aiGen.mock.calls[0][0]).toContain('LANGUAGE RULE');
    expect(aiGen.mock.calls[0][0]).toContain('Beginner');
  });

  it('passes through a safety warning', async () => {
    aiGen.mockResolvedValue({ classText: 'A long enough class version of the article text for reading.', safe: false, safetyNote: 'Describes injuries in detail.' });
    expect(await (await post({ title: 'x', text })).json()).toMatchObject({ safe: false, safetyNote: 'Describes injuries in detail.' });
  });

  it('validates and fails soft', async () => {
    expect((await post({ title: 'x', text: 'too short' })).status).toBe(400);
    aiGen.mockRejectedValue(new Error('down'));
    expect((await post({ title: 'x', text })).status).toBe(502);
  });
});
