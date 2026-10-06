import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { ensureBookPagesBucket } from '@/lib/book-import/scan-usage';

export const dynamic = 'force-dynamic';

// Page pictures for uploaded picture books (docs/book-upload-plan.md). Private bucket, one folder
// per teacher; pictures are only ever shown to their teacher (the shared screen) via short-lived links.
const BUCKET = 'book-pages';
const MAX_BYTES = 1_500_000;
const SAFE = /^[a-z0-9-]{8,64}$/i;

// POST (multipart: file, bookId, page) → { path }
export async function POST(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const bookId = String(form?.get('bookId') ?? '');
  const page = Number(form?.get('page'));
  if (!(file instanceof Blob) || file.type !== 'image/jpeg' || file.size > MAX_BYTES) return NextResponse.json({ error: 'A JPEG page picture is required' }, { status: 400 });
  if (!SAFE.test(bookId) || !Number.isInteger(page) || page < 1 || page > 2000) return NextResponse.json({ error: 'Bad page' }, { status: 400 });

  const supabase = createServiceClient();
  await ensureBookPagesBucket(supabase);
  const path = `${teacher.id}/${bookId}/${page}.jpg`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: 'image/jpeg', upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  return NextResponse.json({ path });
}

// GET ?paths=a,b → { urls: { [path]: signedUrl } } (the teacher's own pictures only)
export async function GET(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const paths = (request.nextUrl.searchParams.get('paths') ?? '').split(',').filter((p) => p.startsWith(`${teacher.id}/`)).slice(0, 200);
  if (paths.length === 0) return NextResponse.json({ urls: {} });
  const supabase = createServiceClient();
  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 6 * 3600);
  if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 });
  const urls: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
  return NextResponse.json({ urls });
}
