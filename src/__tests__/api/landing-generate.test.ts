import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai', () => ({
  generateJSON: vi.fn(),
}));

vi.mock('@/lib/content-cache', () => ({
  getCachedContent: vi.fn(),
  storeCachedContent: vi.fn(),
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn().mockResolvedValue({ teacher: { id: 'test', email: 'test@test.com', credits: 5, isPro: false }, error: null }),
  checkAndRecordAiUsage: vi.fn().mockResolvedValue(null),
}));

import { POST } from '@/app/api/landing/generate/route';
import { generateJSON } from '@/lib/ai';
import { getCachedContent } from '@/lib/content-cache';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/landing/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/landing/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns degraded final-answer fallback when AI throws', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI down'));

    const req = makeRequest({ activityKey: 'final-answer', topic: 'Weather', difficulty: 'Intermediate' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.degraded).toBe(true);
    expect(data.cacheId).toBeNull();
    expect(data.content.activityKey).toBe('final-answer');
    expect(data.content.prompt).toContain('Weather');
    expect(Array.isArray(data.content.targetKeywords)).toBe(true);
  });

  it('returns degraded opinion-shift fallback when AI throws', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI down'));

    const req = makeRequest({ activityKey: 'opinion-shift', topic: 'Sports', difficulty: 'Easy' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.degraded).toBe(true);
    expect(data.content.beforePrompt).toContain('Sports');
    expect(data.content.nowPrompt).toContain('Sports');
  });

  it('returns degraded lightning-round fallback when AI throws', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI down'));

    const req = makeRequest({ activityKey: 'lightning-round', topic: 'Technology', difficulty: 'Advanced' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.degraded).toBe(true);
    expect(Array.isArray(data.content.prompts)).toBe(true);
    expect(data.content.prompts.length).toBeGreaterThanOrEqual(3);
    // Topic-awareness
    const hasTopicRef = data.content.prompts.some((p: { text: string }) => p.text.includes('Technology'));
    expect(hasTopicRef).toBe(true);
  });

  it('returns degraded mic-drop fallback when AI throws', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI down'));

    const req = makeRequest({ activityKey: 'mic-drop', topic: 'History', difficulty: 'Beginner' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.degraded).toBe(true);
    expect(data.content.activityKey).toBe('mic-drop');
    expect(data.content.prompt).toContain('History');
  });
});
