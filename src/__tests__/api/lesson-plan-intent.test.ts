import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateJSON = vi.fn();
vi.mock('@/lib/ai', () => ({
  generateJSON: (...args: unknown[]) => mockGenerateJSON(...args),
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuthForGeneration: vi.fn().mockResolvedValue({ error: null }),
}));

import { POST } from '@/app/api/lesson-plan/intent/route';

function call(body: Record<string, unknown>) {
  const req = new Request('http://localhost/api/lesson-plan/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(req as Parameters<typeof POST>[0]);
}

describe('POST /api/lesson-plan/intent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes through a well-formed extraction', async () => {
    mockGenerateJSON.mockResolvedValue({
      goal: 'grammar-reinforcement',
      secondaryGoals: ['vocabulary-building'],
      difficulty: 'Beginner',
      durationMinutes: 45,
      topic: 'past simple tense',
    });
    const res = await call({ text: 'beginner grammar lesson on past simple' });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toMatchObject({
      goal: 'grammar-reinforcement',
      secondaryGoals: ['vocabulary-building'],
      difficulty: 'Beginner',
      durationMinutes: 45,
      topic: 'past simple tense',
    });
  });

  it('clamps an invalid goal and difficulty to safe defaults', async () => {
    mockGenerateJSON.mockResolvedValue({
      goal: 'become-fluent-overnight',
      difficulty: 'B1',
      durationMinutes: 60,
      topic: 'x',
    });
    const res = await call({ text: 'something' });
    const data = await res.json();
    expect(data.goal).toBe('discussion-debate');
    expect(data.difficulty).toBe('Intermediate');
  });

  it('snaps an off-grid duration to the nearest allowed value', async () => {
    mockGenerateJSON.mockResolvedValue({ goal: 'speaking-fluency', difficulty: 'Intermediate', durationMinutes: 50, topic: 'x' });
    const res = await call({ text: 'something' });
    expect((await res.json()).durationMinutes).toBe(45);
  });

  it('drops invalid secondary goals, dedupes, excludes the primary, and caps at 2', async () => {
    mockGenerateJSON.mockResolvedValue({
      goal: 'speaking-fluency',
      secondaryGoals: ['speaking-fluency', 'vocabulary-building', 'vocabulary-building', 'made-up', 'creativity', 'collaboration'],
      difficulty: 'Intermediate',
      durationMinutes: 60,
      topic: 'x',
    });
    const data = await (await call({ text: 'something' })).json();
    expect(data.secondaryGoals).not.toContain('speaking-fluency'); // primary excluded
    expect(data.secondaryGoals).not.toContain('made-up'); // invalid dropped
    expect(data.secondaryGoals.length).toBeLessThanOrEqual(2);
    expect(new Set(data.secondaryGoals).size).toBe(data.secondaryGoals.length); // deduped
  });

  it('falls back to the teacher text when the model returns an empty topic', async () => {
    mockGenerateJSON.mockResolvedValue({
      goal: 'speaking-fluency',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      topic: '',
    });
    const data = await (await call({ text: 'a fun lesson about turtles' })).json();
    expect(data.topic).toBe('a fun lesson about turtles');
  });

  it('falls back to the teacher text when the model omits the topic field', async () => {
    mockGenerateJSON.mockResolvedValue({
      goal: 'vocabulary-building',
      difficulty: 'Beginner',
      durationMinutes: 45,
    });
    const data = await (await call({ text: 'turtles and their habitats' })).json();
    expect(data.topic).toBe('turtles and their habitats');
  });

  it('keeps the provided level/length when the model omits them (chips win)', async () => {
    mockGenerateJSON.mockResolvedValue({ goal: 'speaking-fluency', topic: 'turtles' }); // no difficulty/duration
    const data = await (await call({
      text: 'turtles',
      currentDifficulty: 'Advanced',
      currentDurationMinutes: 45,
    })).json();
    expect(data.difficulty).toBe('Advanced');
    expect(data.durationMinutes).toBe(45);
  });

  it('lets an explicitly described level/length override the chips', async () => {
    mockGenerateJSON.mockResolvedValue({ goal: 'grammar-reinforcement', difficulty: 'Beginner', durationMinutes: 30, topic: 'x' });
    const data = await (await call({
      text: 'a short beginner grammar lesson',
      currentDifficulty: 'Advanced',
      currentDurationMinutes: 90,
    })).json();
    expect(data.difficulty).toBe('Beginner');
    expect(data.durationMinutes).toBe(30);
  });

  it('rejects empty input without calling the model', async () => {
    const res = await call({ text: '  ' });
    expect(res.status).toBe(400);
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });
});
