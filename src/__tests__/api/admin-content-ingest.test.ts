import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/content-cache', () => ({
  storeCachedContent: vi.fn(),
}));

import { POST } from '@/app/api/admin/content-ingest/route';
import { storeCachedContent } from '@/lib/content-cache';

const VALID_API_KEY = 'test-secret-key';

function makeRequest(
  body: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token !== undefined) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost/api/admin/content-ingest', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  game_key: 'vocab-sprint',
  topic: 'General',
  difficulty: 'Intermediate',
  content_json: [{ sentence: 'Hello world.', weakWord: 'Hello', hint: 'Try a greeting.' }],
};

describe('POST /api/admin/content-ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CONTENT_INGEST_API_KEY', VALID_API_KEY);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeRequest(VALID_BODY);
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns 401 when token is wrong', async () => {
    const req = makeRequest(VALID_BODY, 'wrong-token');
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid game_key', async () => {
    const req = makeRequest({ ...VALID_BODY, game_key: 'not-a-game' }, VALID_API_KEY);
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('game_key');
  });

  it('returns 400 when content_json exceeds 50KB', async () => {
    // Generate a string that serializes to > 50KB
    const bigContent = { data: 'x'.repeat(52 * 1024) };
    const req = makeRequest({ ...VALID_BODY, content_json: bigContent }, VALID_API_KEY);
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('size');
  });

  it('returns 200 and id on valid request', async () => {
    vi.mocked(storeCachedContent).mockResolvedValue('new-ingest-uuid');

    const req = makeRequest(VALID_BODY, VALID_API_KEY);
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe('new-ingest-uuid');
    expect(data.created_at).toBeDefined();
    expect(storeCachedContent).toHaveBeenCalledWith(
      'vocab-sprint',
      'General',
      'Intermediate',
      VALID_BODY.content_json,
      1,
      undefined,
    );
  });

  it('returns 400 for missing required fields', async () => {
    const req = makeRequest({ game_key: 'vocab-sprint' }, VALID_API_KEY);
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('passes variant to storeCachedContent when provided', async () => {
    vi.mocked(storeCachedContent).mockResolvedValue('grammar-uuid');

    const req = makeRequest(
      { ...VALID_BODY, game_key: 'grammar-boss', variant: 'Present Perfect' },
      VALID_API_KEY,
    );
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(storeCachedContent).toHaveBeenCalledWith(
      'grammar-boss',
      'General',
      'Intermediate',
      VALID_BODY.content_json,
      1,
      'Present Perfect',
    );
  });
});
