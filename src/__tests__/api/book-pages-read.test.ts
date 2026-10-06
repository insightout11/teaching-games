import { beforeEach, describe, expect, it, vi } from 'vitest';

// Fake private storage: path -> Blob.
const files = new Map<string, Blob>();
const storage = {
  getBucket: async () => ({ data: { allowed_mime_types: ['image/jpeg', 'application/json'] } }),
  createBucket: async () => ({}),
  updateBucket: async () => ({}),
  from: () => ({
    download: async (p: string) => ({ data: files.get(p) ?? null, error: files.has(p) ? null : { message: 'not found' } }),
    upload: async (p: string, b: Blob) => { files.set(p, b); return { error: null }; },
  }),
};
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => ({ storage }) }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: async () => ({ teacher: { id: 't1' }, error: null }) }));
const read = vi.fn(async (images: unknown[]) => ({ pages: images.map(() => ({ page: 1, text: 'Peter ran into the garden.', heading: '', readable: true })), inputTokens: 1, outputTokens: 1, blocked: 0 }));
vi.mock('@/lib/book-import/page-reader', () => ({ readPagesSafely: (i: unknown[]) => read(i) }));

import { addScanUsage, getScanUsage, nextReset, usageMonth, SCAN_PAGE_CAP } from '@/lib/book-import/scan-usage';
import { GET, POST } from '@/app/api/book-pages/read/route';
import type { createServiceClient } from '@/lib/supabase/service';

const svc = { storage } as unknown as ReturnType<typeof createServiceClient>;
const post = (paths: string[]) => POST(new Request('http://x/api/book-pages/read', { method: 'POST', body: JSON.stringify({ paths }) }) as never);

describe('scanned page limit', () => {
  beforeEach(() => { files.clear(); read.mockClear(); });

  it('counts pages per teacher per month', async () => {
    expect(await getScanUsage(svc, 't1')).toBe(0);
    await addScanUsage(svc, 't1', 5);
    expect(await addScanUsage(svc, 't1', 3)).toBe(8);
    expect(await getScanUsage(svc, 't1', '1999-01')).toBe(0);
    expect(usageMonth(new Date('2026-10-06T12:00:00Z'))).toBe('2026-10');
    expect(nextReset(new Date('2026-12-15T00:00:00Z'))).toBe('2027-01-01');
  });

  it('reads pages, records them, and refuses once the month is full', async () => {
    files.set('t1/b1/1.jpg', new Blob(['x'], { type: 'image/jpeg' }));
    const ok = await post(['t1/b1/1.jpg']);
    expect(ok.status).toBe(200);
    expect(await getScanUsage(svc, 't1')).toBe(1);
    await addScanUsage(svc, 't1', SCAN_PAGE_CAP - 1);
    const full = await post(['t1/b1/1.jpg']);
    expect(full.status).toBe(429);
    expect(read).toHaveBeenCalledTimes(1);
    const usage = await (await GET()).json();
    expect(usage).toMatchObject({ used: SCAN_PAGE_CAP, cap: SCAN_PAGE_CAP });
  });

  it("never reads another teacher's pictures", async () => {
    expect((await post(['t2/b1/1.jpg'])).status).toBe(400);
  });
});
