import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateJSON = vi.fn();
vi.mock('@/lib/ai', () => ({
  generateJSON: (...args: unknown[]) => mockGenerateJSON(...args),
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuthForGeneration: vi.fn().mockResolvedValue({ error: null }),
}));

import { POST } from '@/app/api/source/generate-reading/route';

const LONG_PASSAGE = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');

function call(body: Record<string, unknown>) {
  const req = new Request('http://localhost/api/source/generate-reading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(req as Parameters<typeof POST>[0]);
}

describe('POST /api/source/generate-reading', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a briefing-review-ready SourceMaterial', async () => {
    mockGenerateJSON.mockResolvedValue({ title: 'Life on Mars', passage: LONG_PASSAGE });
    const res = await call({ topic: 'space travel', difficulty: 'Intermediate' });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toMatchObject({
      sourceType: 'text',
      title: 'Life on Mars',
      briefingMode: 'generated',
      rawText: LONG_PASSAGE,
      briefingText: LONG_PASSAGE,
    });
    expect(data.briefingOptions[0]).toMatchObject({ id: 'recommended', mode: 'generated' });
    expect(data.wordCount).toBe(60);
  });

  it('clamps an invalid difficulty rather than failing', async () => {
    mockGenerateJSON.mockResolvedValue({ title: 'T', passage: LONG_PASSAGE });
    const res = await call({ topic: 'space travel', difficulty: 'B1' });
    expect(res.status).toBe(200);
  });

  it('falls back to the topic when the model omits a title', async () => {
    mockGenerateJSON.mockResolvedValue({ title: '', passage: LONG_PASSAGE });
    const data = await (await call({ topic: 'space travel' })).json();
    expect(data.title).toBe('space travel');
  });

  it('rejects a too-short topic without calling the model', async () => {
    const res = await call({ topic: 'x' });
    expect(res.status).toBe(400);
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });

  it('rejects an unusably short generated passage', async () => {
    mockGenerateJSON.mockResolvedValue({ title: 'T', passage: 'too short' });
    const res = await call({ topic: 'space travel' });
    expect(res.status).toBe(502);
  });
});
