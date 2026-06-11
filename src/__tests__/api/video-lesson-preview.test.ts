import { describe, it, expect, vi, beforeEach } from 'vitest';

// 'server-only' throws when imported outside a React Server bundle (vitest is plain node).
vi.mock('server-only', () => ({}));

vi.mock('@/lib/content-cache', () => ({
  getCachedContent: vi.fn(),
  storeCachedContent: vi.fn(),
}));

vi.mock('@/lib/youtube-extraction', () => ({
  // Keep parseYouTubeId real-ish so URL validation is exercised.
  parseYouTubeId: (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  },
  getCachedExtraction: vi.fn(),
  storeExtraction: vi.fn(),
  fetchYouTubeTranscript: vi.fn(),
  fetchOEmbedTitle: vi.fn(),
}));

vi.mock('@/lib/video-preview', () => ({
  generateVideoPreview: vi.fn(),
  buildDegradedPreview: vi.fn((title: string, transcriptUsed: boolean) => ({
    title,
    transcriptUsed,
    suggestedLevel: 'B1 — Intermediate',
    hook: `Turn "${title}" into a full English lesson.`,
    keyVocab: [],
    comprehensionQuestions: [`What is "${title}" mainly about?`],
    discussionPrompts: [],
  })),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}));

import { POST } from '@/app/api/public/video-lesson-preview/route';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { getCachedExtraction, fetchYouTubeTranscript, fetchOEmbedTitle } from '@/lib/youtube-extraction';
import { generateVideoPreview } from '@/lib/video-preview';
import { createServiceClient } from '@/lib/supabase/service';

const FAKE_PREVIEW = {
  title: 'How Volcanoes Work',
  transcriptUsed: true,
  suggestedLevel: 'B1 — Intermediate',
  hook: 'A vivid science clip perfect for descriptive vocabulary.',
  keyVocab: [
    { word: 'erupt', definition: 'to burst out suddenly', example: 'The volcano erupted at dawn.' },
  ],
  comprehensionQuestions: ['What causes a volcano to erupt?', 'q2', 'q3'],
  discussionPrompts: ['Would you live near a volcano?', 'p2'],
};

/** Chainable supabase mock supporting the route's two select shapes + insert. */
function makeSupabase({ ipRows = [] as { video_id: string }[], globalCount = 0 } = {}) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => {
    let isCount = false;
    const builder: Record<string, unknown> = {
      select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
        isCount = !!opts?.count;
        return builder;
      }),
      eq: vi.fn(() => builder),
      gte: vi.fn(() => Promise.resolve(isCount ? { count: globalCount } : { data: ipRows })),
      insert,
    };
    return builder;
  });
  return { from, _insert: insert };
}

function makeRequest(url: string, ip = '1.2.3.4') {
  return new Request('http://localhost/api/public/video-lesson-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ url }),
  });
}

const VIDEO_URL = 'https://www.youtube.com/watch?v=abcDEF12345';

describe('POST /api/public/video-lesson-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceClient).mockReturnValue(makeSupabase() as never);
  });

  it('returns cached preview without extraction or AI on cache hit', async () => {
    vi.mocked(getCachedContent).mockResolvedValue({ id: 'c1', content_json: FAKE_PREVIEW });

    const res = await POST(makeRequest(VIDEO_URL) as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cached).toBe(true);
    expect(data.title).toBe('How Volcanoes Work');
    expect(data.keyVocab).toEqual(FAKE_PREVIEW.keyVocab);
    expect(data.stageLabels.length).toBeGreaterThan(0);
    expect(generateVideoPreview).not.toHaveBeenCalled();
    expect(fetchYouTubeTranscript).not.toHaveBeenCalled();
  });

  it('rejects a non-YouTube URL with 400', async () => {
    const res = await POST(makeRequest('https://example.com/video') as never);
    expect(res.status).toBe(400);
    expect(generateVideoPreview).not.toHaveBeenCalled();
  });

  it('rejects an empty URL with 400', async () => {
    const res = await POST(makeRequest('   ') as never);
    expect(res.status).toBe(400);
  });

  it('returns 429 DEMO_LIMIT when an IP exceeds 3 distinct new videos', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(createServiceClient).mockReturnValue(
      makeSupabase({ ipRows: [{ video_id: 'aaa' }, { video_id: 'bbb' }, { video_id: 'ccc' }] }) as never,
    );

    const res = await POST(makeRequest(VIDEO_URL) as never);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('DEMO_LIMIT');
    expect(generateVideoPreview).not.toHaveBeenCalled();
  });

  it('returns 429 DEMO_BUSY when the global daily cap is reached', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(createServiceClient).mockReturnValue(makeSupabase({ globalCount: 150 }) as never);

    const res = await POST(makeRequest(VIDEO_URL) as never);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('DEMO_BUSY');
  });

  it('generates and caches a fresh preview on cache miss', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(getCachedExtraction).mockResolvedValue(null);
    vi.mocked(fetchYouTubeTranscript).mockResolvedValue({
      title: 'How Volcanoes Work',
      summary: 'A summary of volcanic activity.',
      rawTranscript: '[]',
    });
    vi.mocked(generateVideoPreview).mockResolvedValue(FAKE_PREVIEW);

    const res = await POST(makeRequest(VIDEO_URL) as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cached).toBe(false);
    expect(data.transcriptUsed).toBe(true);
    expect(generateVideoPreview).toHaveBeenCalledOnce();
    expect(storeCachedContent).toHaveBeenCalledWith(
      'video-lesson-preview',
      'abcDEF12345',
      'Intermediate',
      FAKE_PREVIEW,
    );
  });

  it('falls back to oEmbed title-only when no transcript is available', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(getCachedExtraction).mockResolvedValue(null);
    vi.mocked(fetchYouTubeTranscript).mockRejectedValue(new Error('SUPADATA_NOT_CONFIGURED'));
    vi.mocked(fetchOEmbedTitle).mockResolvedValue('Cooking Pasta 101');
    vi.mocked(generateVideoPreview).mockResolvedValue({ ...FAKE_PREVIEW, title: 'Cooking Pasta 101', transcriptUsed: false });

    const res = await POST(makeRequest(VIDEO_URL) as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Cooking Pasta 101');
    expect(data.transcriptUsed).toBe(false);
    expect(vi.mocked(generateVideoPreview).mock.calls[0][2]).toBe(false); // transcriptUsed arg
  });

  it('returns a 200 degraded preview mentioning the title when AI fails', async () => {
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(getCachedExtraction).mockResolvedValue(null);
    vi.mocked(fetchYouTubeTranscript).mockResolvedValue({
      title: 'The History of Tea',
      summary: 'Tea summary.',
      rawTranscript: '[]',
    });
    vi.mocked(generateVideoPreview).mockRejectedValue(new Error('AI down'));

    const res = await POST(makeRequest(VIDEO_URL) as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('The History of Tea');
    expect(data.comprehensionQuestions[0]).toContain('The History of Tea');
    expect(storeCachedContent).not.toHaveBeenCalled();
  });
});
