import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { recommendSources } from '@/lib/source-library';
import { getLibraryEntry } from '@/lib/library-source-material';

export const dynamic = 'force-dynamic';

// GET /api/library/search?q=volcanoes&level=Easy&kids=1 — library items for a course lesson (builder "find material").
export async function GET(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ results: [] });
  const level = request.nextUrl.searchParams.get('level') ?? undefined;
  const kids = request.nextUrl.searchParams.get('kids') === '1';
  const results = recommendSources(q, { limit: 8, level, allowKids: kids }).map((r) => ({
    kind: r.kind,
    sourceType: r.sourceType,
    id: r.id,
    title: r.title,
    ...(getLibraryEntry(r.sourceType, r.id)?.listeningPack ? { listening: true } : {}),
  }));
  return NextResponse.json({ results });
}
