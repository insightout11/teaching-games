import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AI — make generateJSON controllable per call
const mockGenerateJSON = vi.fn();
vi.mock('@/lib/ai', () => ({
  generateJSON: (...args: unknown[]) => mockGenerateJSON(...args),
}));

vi.mock('@/lib/ai/concurrency', () => ({
  bulkSemaphore: { run: <T>(fn: () => T) => fn() },
}));

vi.mock('@/lib/content-cache', () => ({
  getCachedContent: vi.fn().mockResolvedValue(null),
  storeCachedContent: vi.fn().mockResolvedValue('cache-id'),
  groundingVariant: vi.fn(() => undefined),
}));

// The route gates on requireAuthForGeneration. Credits are consumed at session
// creation, NOT per generation, so the route never calls consumeCredit.
vi.mock('@/lib/auth-credits', () => ({
  requireAuthForGeneration: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/lib/generate-mission-selector', () => ({
  generateMissionSelectorContent: vi.fn().mockResolvedValue({
    activityKey: 'mission-selector',
    topicContext: 'test',
    questions: ['q1'],
  }),
}));

import { POST } from '@/app/api/lesson-plan/generate/route';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/lesson-plan/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/lesson-plan/generate — degraded mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns partial content when some generators fail (Promise.allSettled)', async () => {
    let callCount = 0;
    mockGenerateJSON.mockImplementation(() => {
      callCount++;
      // First call succeeds (would-you-rather), second fails (vocab-sprint)
      if (callCount === 1) {
        return Promise.resolve({
          scenarios: [
            { optionA: 'A', optionB: 'B', followUp: 'Why?' },
            { optionA: 'C', optionB: 'D', followUp: 'How?' },
            { optionA: 'E', optionB: 'F', followUp: 'What?' },
          ],
        });
      }
      return Promise.reject(new Error('AI provider down'));
    });

    const req = makeRequest({
      customTopic: 'Animals',
      difficulty: 'Intermediate',
      activities: ['would-you-rather'],
      games: ['vocab-sprint'],
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    // One succeeded, one failed
    expect(data.success).toBe(true);
    expect(data.degraded).toBe(true);
    expect(data.failedCount).toBe(1);
    // The successful generator populated content
    expect(data.content['would-you-rather']).toBeDefined();
    // The failed generator left gameContent empty
    expect(data.gameContent['vocab-sprint']).toBeUndefined();
  });

  it('reports success:false when all generators fail', async () => {
    mockGenerateJSON.mockRejectedValue(new Error('all down'));

    const req = makeRequest({
      customTopic: 'Space',
      difficulty: 'Easy',
      activities: [],
      games: ['vocab-sprint'],
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.degraded).toBe(true);
    expect(data.failedCount).toBe(1);
  });
  it('the video still plays when its questions cannot be generated', async () => {
    mockGenerateJSON.mockRejectedValue(new Error('AI down'));
    const res = await POST(makeRequest({
      customTopic: 'At the airport',
      difficulty: 'Easy',
      activities: ['video-player'],
      sourceMaterial: { sourceType: 'travel-english', sourceKey: 'travel-airport', title: 'At the Airport', summary: 'Checking in at the airport.' },
    }) as never);
    const data = await res.json();
    expect(data.content?.['video-player']?.videoUrl).toBe('https://www.youtube.com/watch?v=z6E7t29sg0Y');
    expect(data.content['video-player'].comprehensionQuestions).toEqual([]);
  });
});

describe('POST /api/lesson-plan/generate — scene scripts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the script when the AI labels lines with character names, and never shows a placeholder line", async () => {
    mockGenerateJSON.mockResolvedValue({
      title: 'Chasing the Magic',
      context: 'Two friends look for a unicorn.',
      genre: 'comedy',
      cast: [
        { id: 'A', name: 'Sarah', role: 'a hopeful explorer', want: 'wants to find a unicorn' },
        { id: 'B', name: 'Leo', role: 'a doubtful friend', want: 'wants to go home' },
      ],
      improvPrompt: 'The scene continues: it starts to rain.',
      improvScript: Array.from({ length: 8 }, (_, i) => ({ character: i % 2 ? 'Leo' : 'Sarah', text: 'I feel so ___ today!' })),
      lines: Array.from({ length: 8 }, (_, i) => ({ lineIndex: i + 1, character: i % 2 ? 'Leo' : 'Sarah', text: `Real line ${i + 1}` })),
    });
    const res = await POST(makeRequest({ customTopic: 'Rainbows and Unicorns', difficulty: 'Easy', activities: ['scene-igniter'], studentCount: 2 }) as never);
    const data = await res.json();
    const scene = data.content['scene-igniter'].scenes[0];
    expect(scene.lines.map((l: { text: string }) => l.text)).toEqual(Array.from({ length: 8 }, (_, i) => `Real line ${i + 1}`));
    expect(scene.lines.map((l: { character: string }) => l.character)).toEqual(['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']);
    expect(scene.cast.map((c: { name: string }) => c.name)).toEqual(['Sarah', 'Leo']);
  });

  it('falls back to a playable conversation, not one repeated placeholder, when the script is unusable', async () => {
    mockGenerateJSON.mockResolvedValue({ title: 'x', context: 'x', genre: 'comedy', cast: [], improvPrompt: 'x', improvScript: [], lines: [] });
    const res = await POST(makeRequest({ customTopic: 'Rainbows and Unicorns', difficulty: 'Easy', activities: ['scene-igniter'], studentCount: 2 }) as never);
    const data = await res.json();
    const texts = data.content['scene-igniter'].scenes[0].lines.map((l: { text: string }) => l.text);
    expect(texts).toHaveLength(8);
    expect(new Set(texts).size).toBe(8);
    expect(texts.join(' ')).not.toContain('Something about');
  });
});

describe('POST /api/lesson-plan/generate — content health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports the AI failure and the stand-in it led to, with the content', async () => {
    mockGenerateJSON.mockRejectedValue(new Error('AI provider down'));
    const res = await POST(makeRequest({ customTopic: 'quarterly tax accounting for dentists', difficulty: 'Easy', activities: ['imposter'], studentCount: 4 }) as never);
    const data = await res.json();
    expect(data.content.imposter.rounds.length).toBeGreaterThan(0);
    const kinds = data.contentIssues.map((i: { kind: string }) => i.kind);
    expect(kinds).toContain('ai_error');
    expect(data.contentIssues.find((i: { kind: string; activity?: string }) => i.kind === 'stand_in')?.activity).toBe('imposter');
  });

  it('reports an AI answer that failed our checks', async () => {
    mockGenerateJSON.mockResolvedValue({ title: 'x', context: 'x', genre: 'comedy', cast: [], improvPrompt: 'x', improvScript: [], lines: [] });
    const res = await POST(makeRequest({ customTopic: 'Rainbows', difficulty: 'Easy', activities: ['scene-igniter'], studentCount: 2 }) as never);
    const data = await res.json();
    expect(data.contentIssues.some((i: { kind: string; activity?: string }) => i.kind === 'rejected' && i.activity === 'scene-igniter')).toBe(true);
  });

  it('adds nothing when the content was made cleanly', async () => {
    mockGenerateJSON.mockResolvedValue({ questions: ['What is your favourite colour?', 'Which animal do you like?', 'Why do you like it?'] });
    const res = await POST(makeRequest({ customTopic: 'Rainbows', difficulty: 'Easy', activities: ['quick-fire'], studentCount: 2 }) as never);
    const data = await res.json();
    expect(data.contentIssues).toBeUndefined();
    expect(data.content['quick-fire'].questions).toHaveLength(3);
  });
});
