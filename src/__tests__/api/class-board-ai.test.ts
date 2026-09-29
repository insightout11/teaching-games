import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiGen = vi.fn();
vi.mock('@/lib/ai', () => ({ generateJSON: (...a: unknown[]) => aiGen(...a) }));
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })),
  checkAndRecordAiUsage: vi.fn(async () => null),
}));

import { POST } from '@/app/api/class-board/ai/route';

const post = (body: unknown) => POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }));
const items = [
  { id: 'a', text: 'Rivers goes to the sea' },
  { id: 'b', text: 'Cities are built near rivers' },
  { id: 'c', text: 'floods is dangerous' },
];

describe('class board AI', () => {
  beforeEach(() => { aiGen.mockReset(); });

  it('designs a board for the topic', async () => {
    aiGen.mockResolvedValue({ title: 'Rivers', prompt: 'Add a fact or a question', zones: [{ label: 'Facts', description: 'x' }, { label: 'Questions', description: 'y' }, { label: '', description: '' }] });
    const data = await (await post({ action: 'zones', topic: 'Rivers', difficulty: 'Beginner' })).json();
    expect(data.zones.map((z: { label: string }) => z.label)).toEqual(['Facts', 'Questions']);
    expect(aiGen.mock.calls[0][0]).toContain('LANGUAGE RULE');
  });

  it('returns only real corrections', async () => {
    aiGen.mockResolvedValue([{ id: 'a', corrected: 'Rivers go to the sea' }, { id: 'b', corrected: 'Cities are built near rivers' }, { id: 'zzz', corrected: 'x' }]);
    const data = await (await post({ action: 'polish', items })).json();
    expect(data.fixes).toEqual([{ id: 'a', corrected: 'Rivers go to the sea' }]);
  });

  it('groups every card into a theme, none lost', async () => {
    aiGen.mockResolvedValue([{ label: 'Water', ids: ['a', 'c'] }]);
    const data = await (await post({ action: 'themes', items })).json();
    expect(data.themes).toEqual([{ label: 'Water', ids: ['a', 'c', 'b'] }]);
  });

  it('validates input and fails soft', async () => {
    expect((await post({ action: 'nope' })).status).toBe(400);
    expect((await post({ action: 'zones' })).status).toBe(400);
    expect((await (await post({ action: 'polish', items: [] })).json()).fixes).toEqual([]);
    aiGen.mockRejectedValue(new Error('down'));
    expect((await post({ action: 'themes', items })).status).toBe(502);
  });
});
