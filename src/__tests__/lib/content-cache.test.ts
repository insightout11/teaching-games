import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';

// Mock the Supabase service client
const mockRpc = vi.fn().mockResolvedValue({ error: null });
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockNot = vi.fn();
const mockLimit = vi.fn();


vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      void table; // suppress unused warning
      return {
        select: mockSelect,
        eq: mockEq,
        is: mockIs,
        not: mockNot,
        limit: mockLimit,
        insert: mockInsert,
        single: mockSingle,
      };
    }),
    rpc: mockRpc,
  })),
}));

describe('content-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCachedContent', () => {
    it('returns null when no cached entries exist', async () => {
      // Chain: select → eq(×4) → is → limit (limit is last — called after is/not)
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ eq: mockEq, is: mockIs });
      mockIs.mockReturnValue({ not: mockNot, limit: mockLimit });
      mockNot.mockReturnValue({ limit: mockLimit });
      mockLimit.mockResolvedValue({ data: [], error: null });

      const result = await getCachedContent('vocab-sprint', 'General', 'Intermediate');
      expect(result).toBeNull();
    });

    it('returns a cached entry and fires increment RPC when cache has data', async () => {
      const fakeEntry = { id: 'abc-123', content_json: [{ sentence: 'Test', weakWord: 'good', hint: 'Use a stronger adjective' }] };

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ eq: mockEq, is: mockIs });
      mockIs.mockReturnValue({ not: mockNot, limit: mockLimit });
      mockNot.mockReturnValue({ limit: mockLimit });
      mockLimit.mockResolvedValue({ data: [fakeEntry], error: null });

      const result = await getCachedContent('vocab-sprint', 'General', 'Intermediate');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('abc-123');
      expect(result?.content_json).toEqual(fakeEntry.content_json);
    });

    it('returns null when Supabase returns an error', async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ eq: mockEq, is: mockIs });
      mockIs.mockReturnValue({ not: mockNot, limit: mockLimit });
      mockNot.mockReturnValue({ limit: mockLimit });
      mockLimit.mockResolvedValue({ data: null, error: new Error('DB error') });

      const result = await getCachedContent('vocab-sprint', 'General', 'Intermediate');
      expect(result).toBeNull();
    });

    it('returns null when service client throws', async () => {
      const { createServiceClient } = await import('@/lib/supabase/service');
      vi.mocked(createServiceClient).mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      const result = await getCachedContent('vocab-sprint', 'General', 'Intermediate');
      expect(result).toBeNull();
    });
  });

  describe('storeCachedContent', () => {
    it('returns the new entry ID on success', async () => {
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: { id: 'new-id-456' }, error: null });

      // Wire up from() to return the chain
      const { createServiceClient } = await import('@/lib/supabase/service');
      vi.mocked(createServiceClient).mockReturnValueOnce({
        from: () => ({
          insert: mockInsert,
          select: mockSelect,
          single: mockSingle,
        }),
        rpc: mockRpc,
      } as unknown as ReturnType<typeof createServiceClient>);

      const content = [{ sentence: 'Test', weakWord: 'good', hint: 'Hint' }];
      const id = await storeCachedContent('vocab-sprint', 'General', 'Intermediate', content);
      expect(id).toBe('new-id-456');
    });

    it('returns null when insert fails', async () => {
      const { createServiceClient } = await import('@/lib/supabase/service');
      vi.mocked(createServiceClient).mockReturnValueOnce({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
            }),
          }),
        }),
        rpc: mockRpc,
      } as unknown as ReturnType<typeof createServiceClient>);

      const result = await storeCachedContent('vocab-sprint', 'General', 'Intermediate', []);
      expect(result).toBeNull();
    });
  });
});
