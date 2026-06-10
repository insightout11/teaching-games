import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireAuth = vi.fn();
const mockCheckUsage = vi.fn();
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  checkAndRecordAiUsage: (...args: unknown[]) => mockCheckUsage(...args),
}));

const mockVerifyOwnership = vi.fn();
vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: (...args: unknown[]) => mockVerifyOwnership(...args),
}));

const mockMaybeSingle = vi.fn();
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
      })),
    })),
  }),
}));

const mockGenerateJSON = vi.fn();
vi.mock('@/lib/ai', () => ({
  generateJSON: (...args: unknown[]) => mockGenerateJSON(...args),
}));

import { POST } from '@/app/api/demo/student-answers/route';

const TEACHER = { id: 'teacher-1', email: 't@example.com', credits: 0, isPro: false, isDeveloper: false };
const SESSION_ID = '11111111-2222-4333-8444-555555555555';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/demo/student-answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ teacher: TEACHER, error: null });
  mockCheckUsage.mockResolvedValue(null);
  mockVerifyOwnership.mockResolvedValue({ session: { id: SESSION_ID }, error: null });
  mockMaybeSingle.mockResolvedValue({
    data: { topic: 'Travel & Tourism', custom_topic: null, difficulty: 'Intermediate' },
    error: null,
  });
});

describe('POST /api/demo/student-answers', () => {
  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue({
      teacher: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    });
    const res = await POST(makeRequest({ sessionId: SESSION_ID, prompt: 'x' }) as never);
    expect(res.status).toBe(401);
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });

  it('returns 400 without sessionId or prompt', async () => {
    const res = await POST(makeRequest({ sessionId: SESSION_ID }) as never);
    expect(res.status).toBe(400);
  });

  it('rejects sessions the teacher does not own', async () => {
    mockVerifyOwnership.mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });
    const res = await POST(makeRequest({ sessionId: SESSION_ID, prompt: 'Defend your pick' }) as never);
    expect(res.status).toBe(403);
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });

  it('enforces the AI usage cap', async () => {
    mockCheckUsage.mockResolvedValue(
      NextResponse.json({ error: 'limit', code: 'AI_LIMIT_REACHED' }, { status: 429 }),
    );
    const res = await POST(makeRequest({ sessionId: SESSION_ID, prompt: 'Defend your pick' }) as never);
    expect(res.status).toBe(429);
    expect(mockGenerateJSON).not.toHaveBeenCalled();
  });

  it('grounds the prompt in DB topic/difficulty and returns persona answers', async () => {
    mockGenerateJSON.mockResolvedValue([
      { name: 'Mia', text: 'I would pick the beach because my cousins live near one!' },
      { name: 'Leo', text: 'Beach. Less walking.' },
      { name: 'Unknown Persona', text: 'should be filtered' },
      { name: 'Mia', text: 'duplicate should be dropped' },
    ]);

    const res = await POST(makeRequest({
      sessionId: SESSION_ID,
      prompt: 'Beach week or three cities?',
      gameKey: 'decision-council',
      inputType: 'textarea',
    }) as never);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answers).toEqual([
      { name: 'Mia', text: 'I would pick the beach because my cousins live near one!' },
      { name: 'Leo', text: 'Beach. Less walking.' },
    ]);

    const aiPrompt = mockGenerateJSON.mock.calls[0][0] as string;
    expect(aiPrompt).toContain('Travel & Tourism');
    expect(aiPrompt).toContain('Beach week or three cities?');
    expect(aiPrompt).toContain('decision-council');
  });

  it('returns 502 when generation fails so the client falls back locally', async () => {
    mockGenerateJSON.mockRejectedValue(new Error('AI down'));
    const res = await POST(makeRequest({ sessionId: SESSION_ID, prompt: 'Defend your pick' }) as never);
    expect(res.status).toBe(502);
  });
});
