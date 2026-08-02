import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireAuth = vi.fn();
const mockVerifyTeacherOwnsSession = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: (...args: unknown[]) => mockVerifyTeacherOwnsSession(...args),
}));

import { POST } from '@/app/api/session/captain-suggestions/route';

function request(body: unknown) {
  return new Request('http://localhost/api/session/captain-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/session/captain-suggestions session ID validation', () => {
  beforeEach(() => {
    mockRequireAuth.mockResolvedValue({
      teacher: { id: 'teacher-1', email: 'teacher@example.com', credits: 5, isPro: false, isDeveloper: false },
      error: null,
    });
    mockVerifyTeacherOwnsSession.mockResolvedValue({
      error: NextResponse.json({ error: 'not found' }, { status: 404 }),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('allows a named demo session in mock mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true');

    const response = await POST(request({ sessionId: 'live-demo' }) as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
    expect(Array.isArray(data.suggestions)).toBe(true);
  });

  it.each([{ label: 'missing', body: {} }, { label: 'empty', body: { sessionId: '   ' } }])(
    'rejects a $label session ID in mock mode',
    async ({ body }) => {
      vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true');

      const response = await POST(request(body) as never);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid sessionId' });
    },
  );

  it('rejects a non-UUID session ID outside mock mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');

    const response = await POST(request({ sessionId: 'live-demo' }) as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sessionId' });
  });

  it('does not reject a valid UUID before ownership checks outside mock mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');

    const response = await POST(request({ sessionId: '11111111-1111-4111-8111-111111111111' }) as never);

    expect(response.status).toBe(404);
    expect(mockVerifyTeacherOwnsSession).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'teacher-1',
      { requireActive: true },
    );
  });
});
