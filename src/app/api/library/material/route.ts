import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { getLibraryEntry, getLibrarySourceMaterial } from '@/lib/library-source-material';
import type { SourceType } from '@/types/source-material';

export const dynamic = 'force-dynamic';

// GET /api/library/material?sourceType=ted&id=abc — a library item as lesson material (Prepare the next lesson).
export async function GET(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;
  const sourceType = request.nextUrl.searchParams.get('sourceType') ?? '';
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const material = getLibrarySourceMaterial({ kind: 'library', sourceType: sourceType as SourceType, id, title: '' });
  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ material, listening: !!getLibraryEntry(sourceType, id)?.listeningPack });
}
