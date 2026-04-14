import { NextRequest, NextResponse } from 'next/server';
import { getCachedContent } from '@/lib/content-cache';
import { requireAuth } from '@/lib/auth-credits';

const GAME_KEY = 'brain-teasers';
const SCHEMA_VERSION = 1;

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { difficulty, excludeIds = [] } = await request.json() as {
    difficulty: string;
    excludeIds?: string[];
  };

  const cached = await getCachedContent(GAME_KEY, 'general', difficulty, excludeIds, undefined, SCHEMA_VERSION);

  if (!cached) {
    // Try without excludeIds — bank may be exhausted for this session
    const fallback = await getCachedContent(GAME_KEY, 'general', difficulty, [], undefined, SCHEMA_VERSION);
    if (!fallback) {
      return NextResponse.json({ error: 'No riddles available' }, { status: 404 });
    }
    return NextResponse.json({ ...fallback.content_json, cacheId: fallback.id });
  }

  return NextResponse.json({ ...cached.content_json, cacheId: cached.id });
}
