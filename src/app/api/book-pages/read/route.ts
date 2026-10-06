import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { readPagesSafely } from '@/lib/book-import/page-reader';
import { validPageRead } from '@/lib/book-import/scan';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Scanned books: read the text of up to 5 of the teacher's own uploaded page pictures (one AI call).
// Pricing is decided later (docs/scanned-books-proposal.md); usage is logged per call for now.
const MAX_PAGES = 5;

export async function POST(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const body = (await request.json().catch(() => null)) as { paths?: unknown } | null;
  const paths = Array.isArray(body?.paths) ? body.paths.filter((p): p is string => typeof p === 'string') : [];
  if (paths.length === 0 || paths.length > MAX_PAGES || paths.some((p) => !p.startsWith(`${teacher.id}/`))) {
    return NextResponse.json({ error: `Send 1-${MAX_PAGES} of your own page pictures` }, { status: 400 });
  }

  const supabase = createServiceClient();
  const images: Array<{ data: string; mimeType: string }> = [];
  for (const path of paths) {
    const { data, error: dlErr } = await supabase.storage.from('book-pages').download(path);
    if (dlErr || !data) return NextResponse.json({ error: 'A page picture is missing' }, { status: 404 });
    images.push({ data: Buffer.from(await data.arrayBuffer()).toString('base64'), mimeType: 'image/jpeg' });
  }

  try {
    const r = await readPagesSafely(images);
    console.info(`[api/book-pages/read] teacher=${teacher.id} pages=${paths.length} in=${r.inputTokens} out=${r.outputTokens} blocked=${r.blocked}`);
    return NextResponse.json({ pages: r.pages.map((p) => validPageRead(p)) });
  } catch (e) {
    console.error('[api/book-pages/read] failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Could not read these pages. Please try again.' }, { status: 502 });
  }
}
