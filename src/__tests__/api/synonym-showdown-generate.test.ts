import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai', () => ({
  generateJSON: vi.fn(),
}));

vi.mock('@/lib/content-cache', () => ({
  getCachedContent: vi.fn(),
  storeCachedContent: vi.fn(),
}));

import { POST } from '@/app/api/synonym-showdown/generate/route';
import { generateJSON } from '@/lib/ai';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';

const FAKE_CHALLENGE = {
  targetWord: 'happy',
  contextSentence: 'She was happy to receive the good news.',
  hint: 'Think about emotional state',
};

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/synonym-showdown/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/synonym-showdown/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached content without calling AI on cache hit', async () => {
    const cachedId = 'cached-uuid-ss-001';
    vi.mocked(getCachedContent).mockResolvedValue({
      id: cachedId,
      content_json: FAKE_CHALLENGE,
    });

    const req = makeRequest({ difficulty: 'Intermediate', topic: 'General' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.targetWord).toBe(FAKE_CHALLENGE.targetWord);
    expect(data.contextSentence).toBe(FAKE_CHALLENGE.contextSentence);
    expect(data.cacheId).toBe(cachedId);
    expect(generateJSON).not.toHaveBeenCalled();
  });

  it('calls AI and stores to cache on cache miss', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockResolvedValue(FAKE_CHALLENGE);
    vi.mocked(storeCachedContent).mockResolvedValue('new-cache-uuid-ss');

    const req = makeRequest({ difficulty: 'Advanced', topic: 'Business' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.targetWord).toBe(FAKE_CHALLENGE.targetWord);
    expect(data.cacheId).toBe('new-cache-uuid-ss');
    expect(generateJSON).toHaveBeenCalledOnce();
    expect(storeCachedContent).toHaveBeenCalledWith('synonym-showdown', 'Business', 'Advanced', FAKE_CHALLENGE, 1);
  });

  it('passes seenItems as exclusion list to AI prompt on cache miss', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockResolvedValue(FAKE_CHALLENGE);
    vi.mocked(storeCachedContent).mockResolvedValue(null);

    const seenItems = ['happy', 'sad', 'angry'];
    const req = makeRequest({ difficulty: 'Beginner', topic: 'Emotions', seenItems });
    await POST(req as never);

    const promptArg = vi.mocked(generateJSON).mock.calls[0][0] as string;
    expect(promptArg).toContain('happy, sad, angry');
    expect(promptArg).toContain('Do NOT use these target words');
  });

  it('returns 500 when AI throws and cache misses', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI timeout'));

    const req = makeRequest({ difficulty: 'Expert', topic: 'Science' });
    const res = await POST(req as never);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
