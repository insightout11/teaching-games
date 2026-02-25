import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AI and cache before importing the route
vi.mock('@/lib/ai', () => ({
  generateJSON: vi.fn(),
}));

vi.mock('@/lib/content-cache', () => ({
  getCachedContent: vi.fn(),
  storeCachedContent: vi.fn(),
}));

import { POST } from '@/app/api/vocab-sprint/generate/route';
import { generateJSON } from '@/lib/ai';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';

const FAKE_SENTENCES = [
  { sentence: 'The dog went to the park.', weakWord: 'went', hint: 'Use a more specific movement verb.' },
  { sentence: 'She said hello to her friend.', weakWord: 'said', hint: 'Try a more expressive verb.' },
  { sentence: 'He ate a good meal.', weakWord: 'good', hint: 'Use a more descriptive adjective.' },
  { sentence: 'The movie was nice.', weakWord: 'nice', hint: 'Be more specific about quality.' },
  { sentence: 'It was a big day.', weakWord: 'big', hint: 'What kind of big exactly?' },
];

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/vocab-sprint/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/vocab-sprint/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached content without calling AI on cache hit', async () => {
    const cachedId = 'cached-uuid-001';
    vi.mocked(getCachedContent).mockResolvedValue({
      id: cachedId,
      content_json: FAKE_SENTENCES,
    });

    const req = makeRequest({ difficulty: 'Intermediate', topic: 'General', tone: 'Neutral' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sentences).toEqual(FAKE_SENTENCES);
    expect(data.cacheId).toBe(cachedId);
    expect(generateJSON).not.toHaveBeenCalled();
  });

  it('calls AI and stores to cache on cache miss', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockResolvedValue(FAKE_SENTENCES);
    vi.mocked(storeCachedContent).mockResolvedValue('new-cache-uuid');

    const req = makeRequest({ difficulty: 'Advanced', topic: 'Business', tone: 'Formal' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sentences).toEqual(FAKE_SENTENCES);
    expect(data.cacheId).toBe('new-cache-uuid');
    expect(generateJSON).toHaveBeenCalledOnce();
    expect(storeCachedContent).toHaveBeenCalledWith('vocab-sprint', 'Business', 'Advanced', FAKE_SENTENCES, 1);
  });

  it('passes seenItems as exclusion list to AI on cache miss', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockResolvedValue(FAKE_SENTENCES);
    vi.mocked(storeCachedContent).mockResolvedValue(null);

    const seenItems = ['good', 'nice', 'went'];
    const req = makeRequest({
      difficulty: 'Beginner',
      topic: 'Nature',
      tone: 'Casual',
      seenItems,
    });
    await POST(req as never);

    const promptArg = vi.mocked(generateJSON).mock.calls[0][0] as string;
    expect(promptArg).toContain('good, nice, went');
    expect(promptArg).toContain('Do NOT use these weak words');
  });

  it('passes excludeCacheIds to cache lookup', async () => {
    const excludeIds = ['id-a', 'id-b'];
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockResolvedValue(FAKE_SENTENCES);
    vi.mocked(storeCachedContent).mockResolvedValue(null);

    const req = makeRequest({
      difficulty: 'Easy',
      topic: 'Travel',
      tone: 'Neutral',
      excludeCacheIds: excludeIds,
    });
    await POST(req as never);

    expect(getCachedContent).toHaveBeenCalledWith('vocab-sprint', 'Travel', 'Easy', excludeIds);
  });

  it('returns 500 when AI throws and cache misses', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI timeout'));

    const req = makeRequest({ difficulty: 'Expert', topic: 'Psychology', tone: 'Professional' });
    const res = await POST(req as never);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('response includes sentences array with correct shape', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockResolvedValue(FAKE_SENTENCES);
    vi.mocked(storeCachedContent).mockResolvedValue('some-id');

    const req = makeRequest({ difficulty: 'Intermediate', topic: 'General', tone: 'Neutral' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(Array.isArray(data.sentences)).toBe(true);
    expect(data.sentences).toHaveLength(5);
    for (const s of data.sentences) {
      expect(s).toHaveProperty('sentence');
      expect(s).toHaveProperty('weakWord');
      expect(s).toHaveProperty('hint');
    }
  });
});
