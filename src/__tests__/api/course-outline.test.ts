import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateJSON = vi.fn();
vi.mock('@/lib/ai', () => ({
  generateJSON: (...args: unknown[]) => mockGenerateJSON(...args),
}));
vi.mock('@/lib/auth-credits', () => ({
  requireAuthForGeneration: vi.fn().mockResolvedValue({ error: null }),
}));

import { POST } from '@/app/api/course/outline/route';

function call(body: Record<string, unknown>) {
  const req = new Request('http://localhost/api/course/outline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(req as Parameters<typeof POST>[0]);
}

const goodOutline = {
  courseTitle: 'Travel English',
  lessons: [
    { title: 'At the airport', topic: 'checking in at the airport', keywords: ['airport', 'check-in'], goal: 'functional-english' },
    { title: 'At the hotel', topic: 'checking into a hotel', keywords: ['hotel', 'reception'], goal: 'functional-english' },
    { title: 'Eating out', topic: 'ordering food at a restaurant', keywords: ['restaurant', 'food'], goal: 'speaking-fluency' },
  ],
};

describe('POST /api/course/outline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a structured outline with clamped goals and a source per lesson where matched', async () => {
    mockGenerateJSON.mockResolvedValue(goodOutline);
    const res = await call({ theme: 'travel english', lessonCount: 3, level: 'Intermediate' });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.title).toBe('Travel English');
    expect(data.lessons).toHaveLength(3);
    for (const l of data.lessons) {
      expect(typeof l.topic).toBe('string');
      expect(l.keywords.length).toBeGreaterThan(0);
      expect(['speaking-fluency', 'functional-english', 'vocabulary-building', 'grammar-reinforcement',
        'discussion-debate', 'collaboration', 'creativity', 'critical-thinking', 'confidence-building']).toContain(l.goal);
      // suggestedSource is null or a well-formed ref
      if (l.suggestedSource) {
        expect(l.suggestedSource).toMatchObject({ kind: expect.any(String), sourceType: expect.any(String), id: expect.any(String) });
      }
    }
  });

  it('clamps invalid goals to a safe default', async () => {
    mockGenerateJSON.mockResolvedValue({
      courseTitle: 'X',
      lessons: [{ title: 'L', topic: 'volcanoes and lava', keywords: ['volcanoes', 'lava'], goal: 'win-the-lottery' }],
    });
    const data = await (await call({ theme: 'science' })).json();
    expect(data.lessons[0].goal).toBe('discussion-debate');
  });

  it('clamps lessonCount into [3, 8]', async () => {
    mockGenerateJSON.mockImplementation((prompt: string) => {
      // the prompt should request the clamped count (12 -> 8)
      expect(prompt).toContain('Number of lessons: 8');
      expect(prompt).toContain('keywords - 2-4 concrete noun keywords');
      return Promise.resolve(goodOutline);
    });
    await call({ theme: 'travel', lessonCount: 12 });
    expect(mockGenerateJSON).toHaveBeenCalled();
  });

  it('rejects a too-short theme without calling the model', async () => {
    const res = await call({ theme: 'a' });
    expect(res.status).toBe(400);
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });

  it('502s when the model returns no usable lessons', async () => {
    mockGenerateJSON.mockResolvedValue({ courseTitle: 'X', lessons: [{ title: 'L', topic: '', keywords: ['topic'], goal: 'x' }] });
    const res = await call({ theme: 'something real' });
    expect(res.status).toBe(502);
  });

  it('does not recommend from topic text when the model omits keywords', async () => {
    mockGenerateJSON.mockResolvedValue({
      courseTitle: 'No Keywords',
      lessons: [{ title: 'L', topic: 'asking for and giving directions', goal: 'functional-english' }],
    });
    const data = await (await call({ theme: 'travel' })).json();
    expect(data.lessons[0].keywords).toEqual([]);
    expect(data.lessons[0].suggestedSource).toBeNull();
  });
});
