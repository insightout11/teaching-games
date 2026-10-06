import type { createServiceClient } from '@/lib/supabase/service';

/**
 * Scanned books: a monthly page limit per teacher, so AI page reading can't run up a large bill before
 * pricing is decided (docs/scanned-books-proposal.md). Kept as a small JSON file in the teacher's own
 * folder of the private `book-pages` bucket (no table needed): `<teacher id>/_usage/<YYYY-MM>.json`.
 */
export const BOOK_PAGES_BUCKET = 'book-pages';
export const SCAN_PAGE_CAP = Number(process.env.SCAN_PAGE_CAP) > 0 ? Number(process.env.SCAN_PAGE_CAP) : 1000;
const MIME = ['image/jpeg', 'application/json'];

type Service = ReturnType<typeof createServiceClient>;

export function usageMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** The first day of next month (UTC), for "resets on ..." messages. */
export function nextReset(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

/** The bucket exists, private, and accepts page pictures and the usage file. */
export async function ensureBookPagesBucket(supabase: Service): Promise<void> {
  const { data } = await supabase.storage.getBucket(BOOK_PAGES_BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BOOK_PAGES_BUCKET, { public: false, fileSizeLimit: 1_500_000, allowedMimeTypes: MIME });
    return;
  }
  const allowed = (data as { allowed_mime_types?: string[] | null }).allowed_mime_types;
  if (allowed && !MIME.every((m) => allowed.includes(m))) {
    await supabase.storage.updateBucket(BOOK_PAGES_BUCKET, { public: false, fileSizeLimit: 1_500_000, allowedMimeTypes: MIME });
  }
}

const usagePath = (teacherId: string, month: string) => `${teacherId}/_usage/${month}.json`;

export async function getScanUsage(supabase: Service, teacherId: string, month = usageMonth()): Promise<number> {
  const { data } = await supabase.storage.from(BOOK_PAGES_BUCKET).download(usagePath(teacherId, month));
  if (!data) return 0;
  try {
    const n = Number((JSON.parse(await data.text()) as { pages?: unknown }).pages);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function addScanUsage(supabase: Service, teacherId: string, pages: number, month = usageMonth()): Promise<number> {
  const total = (await getScanUsage(supabase, teacherId, month)) + pages;
  const body = new Blob([JSON.stringify({ pages: total, updatedAt: new Date().toISOString() })], { type: 'application/json' });
  await supabase.storage.from(BOOK_PAGES_BUCKET).upload(usagePath(teacherId, month), body, { contentType: 'application/json', upsert: true });
  return total;
}
