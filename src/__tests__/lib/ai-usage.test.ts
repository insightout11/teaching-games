import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase service client used by checkAndRecordAiUsage.
const mockRpc = vi.fn();
const mockGte = vi.fn();
const mockEq = vi.fn(() => ({ gte: mockGte }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    rpc: mockRpc,
    from: vi.fn(() => ({ select: mockSelect, insert: mockInsert })),
  })),
}));

import { checkAndRecordAiUsage } from '@/lib/auth-credits';

const teacher = { id: 'teacher-1', email: 't@test.com', credits: 0, isPro: false, isDeveloper: false };

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
});

describe('checkAndRecordAiUsage', () => {
  it('records usage and returns null for a non-pro teacher under the cap', async () => {
    mockRpc.mockResolvedValue({ data: [{ is_pro: false, is_developer: false }], error: null });
    mockGte.mockResolvedValue({ count: 5, error: null });

    const res = await checkAndRecordAiUsage(teacher);

    expect(res).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith({ teacher_id: 'teacher-1' });
  });

  it('returns a 429 with AI_LIMIT_REACHED at the cap and does not record', async () => {
    mockRpc.mockResolvedValue({ data: [{ is_pro: false, is_developer: false }], error: null });
    mockGte.mockResolvedValue({ count: 200, error: null });

    const res = await checkAndRecordAiUsage(teacher);

    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    const body = await res!.json();
    expect(body.code).toBe('AI_LIMIT_REACHED');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('exempts Pro teachers (no usage query, no record)', async () => {
    mockRpc.mockResolvedValue({ data: [{ is_pro: true, is_developer: false }], error: null });

    const res = await checkAndRecordAiUsage(teacher);

    expect(res).toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('exempts developer teachers', async () => {
    mockRpc.mockResolvedValue({ data: [{ is_pro: false, is_developer: true }], error: null });

    const res = await checkAndRecordAiUsage(teacher);

    expect(res).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('fails open (returns null) when the tier lookup errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const res = await checkAndRecordAiUsage(teacher);

    expect(res).toBeNull();
  });

  it('fails open (returns null) when the usage count query errors', async () => {
    mockRpc.mockResolvedValue({ data: [{ is_pro: false, is_developer: false }], error: null });
    mockGte.mockResolvedValue({ count: null, error: { message: 'boom' } });

    const res = await checkAndRecordAiUsage(teacher);

    expect(res).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
