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
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuthWithCredits: vi.fn().mockResolvedValue({
    teacher: { id: 'test', email: 'test@test.com', credits: 10, isPro: false },
    error: null,
  }),
  useCredit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/generate-mission-selector', () => ({
  generateMissionSelectorContent: vi.fn().mockResolvedValue({
    activityKey: 'mission-selector',
    topicContext: 'test',
    questions: ['q1'],
  }),
}));

import { POST } from '@/app/api/lesson-plan/generate/route';
import { useCredit } from '@/lib/auth-credits';

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
    // Credit still charged (at least one succeeded)
    expect(useCredit).toHaveBeenCalled();
  });

  it('does not charge credit when all generators fail', async () => {
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
    expect(useCredit).not.toHaveBeenCalled();
  });
});
