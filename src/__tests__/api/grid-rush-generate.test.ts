import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai', () => ({
  generateJSON: vi.fn(),
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn().mockResolvedValue({ teacher: { id: 'test', email: 'test@test.com', credits: 5, isPro: false }, error: null }),
  checkAndRecordAiUsage: vi.fn().mockResolvedValue(null),
}));

import { POST } from '@/app/api/grid-rush/generate/route';
import { generateJSON } from '@/lib/ai';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/grid-rush/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/grid-rush/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with degraded grid when AI throws', async () => {
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI timeout'));

    const req = makeRequest({ topic: 'Animals', difficulty: 'Intermediate' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.degraded).toBe(true);
    expect(data.grid).toBeDefined();
    expect(data.grid.letters).toHaveLength(9);
    expect(data.grid.bonusLetter).toBeDefined();
    expect(typeof data.grid.bonusIndex).toBe('number');
    expect(Array.isArray(data.grid.topicWords)).toBe(true);
    // All letters are single uppercase characters
    for (const l of data.grid.letters) {
      expect(l).toMatch(/^[A-Z]$/);
    }
  });

  it('fallback grid includes topic-derived letters', async () => {
    vi.mocked(generateJSON).mockRejectedValue(new Error('fail'));

    const req = makeRequest({ topic: 'Music', difficulty: 'Easy' });
    const res = await POST(req as never);
    const data = await res.json();

    // At least some letters from "MUSIC" should appear in the grid
    const gridLetters = new Set(data.grid.letters);
    const topicLetters = 'MUSIC'.split('');
    const overlap = topicLetters.filter((l) => gridLetters.has(l));
    expect(overlap.length).toBeGreaterThan(0);
  });
});
