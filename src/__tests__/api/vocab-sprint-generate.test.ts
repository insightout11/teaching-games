import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AI and cache before importing the route
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

import { POST } from '@/app/api/vocab-sprint/generate/route';
import { generateJSON } from '@/lib/ai';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';

// Includes `level` so the route's normalisation (which defaults missing/invalid
// levels to 'easy') round-trips these fixtures unchanged.
const FAKE_SENTENCES = [
  { sentence: 'The dog went to the park.', weakWord: 'went', hint: 'Use a more specific movement verb.', level: 'easy' },
  { sentence: 'She said hello to her friend.', weakWord: 'said', hint: 'Try a more expressive verb.', level: 'easy' },
  { sentence: 'He ate a good meal.', weakWord: 'good', hint: 'Use a more descriptive adjective.', level: 'medium' },
  { sentence: 'The movie was nice.', weakWord: 'nice', hint: 'Be more specific about quality.', level: 'medium' },
  { sentence: 'It was a big day.', weakWord: 'big', hint: 'What kind of big exactly?', level: 'hard' },
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
    expect(storeCachedContent).toHaveBeenCalledWith('vocab-sprint', 'Business', 'Advanced', FAKE_SENTENCES, 3);
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

    expect(getCachedContent).toHaveBeenCalledWith('vocab-sprint', 'Travel', 'Easy', excludeIds, undefined, 3);
  });

  it('returns 200 with degraded fallback when AI throws and cache misses', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI timeout'));

    const req = makeRequest({ difficulty: 'Expert', topic: 'Psychology', tone: 'Professional' });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.degraded).toBe(true);
    expect(data.cacheId).toBeNull();
    expect(Array.isArray(data.sentences)).toBe(true);
    expect(data.sentences.length).toBeGreaterThan(0);
    // Topic-awareness: fallback content includes the requested topic
    const hasTopic = data.sentences.some((s: { sentence: string }) => s.sentence.includes('Psychology'));
    expect(hasTopic).toBe(true);
    // Correct shape
    for (const s of data.sentences) {
      expect(s).toHaveProperty('sentence');
      expect(s).toHaveProperty('weakWord');
      expect(s).toHaveProperty('hint');
    }
  });

  it('returns degraded cache hit when AI throws but relaxed cache succeeds', async () => {
    // First call (with excludeCacheIds in try) returns null, second call (relaxed in catch) returns cached
    vi.mocked(getCachedContent)
      .mockResolvedValueOnce(null)   // try block: cache check with excludeCacheIds
      .mockResolvedValueOnce({ id: 'emergency-id', content_json: FAKE_SENTENCES }); // catch block: relaxed emergency check
    vi.mocked(generateJSON).mockRejectedValue(new Error('AI down'));

    const req = makeRequest({ difficulty: 'Easy', topic: 'Travel', tone: 'Neutral', excludeCacheIds: ['old-id'] });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.degraded).toBe(true);
    expect(data.cacheId).toBe('emergency-id');
    expect(data.sentences).toEqual(FAKE_SENTENCES);
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
