import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { cleanText, libraryRaw, searchLibrary } from '@/lib/live-room/library-catalog';
import type { LibraryKind, LibraryLength } from '@/lib/live-room/library-search';
import { getCachedExtraction } from '@/lib/youtube-extraction';
import { createServiceClient } from '@/lib/supabase/service';
import { isMockMode } from '@/lib/mock/auth';
import { mockStore } from '@/lib/mock/data';
import type { RoomItem } from '@/stores/live-room-store';

export const dynamic = 'force-dynamic';

const KINDS: LibraryKind[] = ['video', 'hook', 'grammar', 'text', 'debate'];
const LENGTHS: LibraryLength[] = ['short', 'medium', 'long'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VIDEO_KINDS = new Set<LibraryKind>(['video', 'hook', 'grammar']);

async function sessionTopic(sessionId: string): Promise<string | null> {
  if (!sessionId) return null;
  try {
    if (isMockMode()) { const s = mockStore.getSession(sessionId) as { topic?: string; custom_topic?: string | null } | undefined; return s?.custom_topic || s?.topic || null; }
    // custom_topic is the Live Room Focus (updated on every new topic); topic is the planned one.
    const { data } = await createServiceClient().from('sessions').select('topic, custom_topic').eq('id', sessionId).maybeSingle();
    const row = data as { topic?: string | null; custom_topic?: string | null } | null;
    return row?.custom_topic || row?.topic || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/live-room/library?sessionId&q&levels=A2,B1&age&kind&length
 *   → { topic, shelf, results }   (shelf = "for today's topic", only without q)
 * GET /api/live-room/library?key=source:id
 *   → { item: RoomItem }          (ready to show / add; text grounds activities)
 * Reviewed items only (needsReview hidden). Transcripts come from the prefetch
 * cache — never fetched live here.
 */
export async function GET(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = new URL(request.url).searchParams;
  const key = p.get('key');

  if (key) {
    const raw = libraryRaw(key);
    if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const [source, ...rest] = key.split(':');
    const id = rest.join(':');
    const entry = searchLibrary({ limit: 100000 }).find((e) => e.key === key);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    let text = cleanText(raw.summary ?? raw.description ?? '');
    if (VIDEO_KINDS.has(entry.kind)) {
      try {
        const cached = await getCachedExtraction(source, id);
        if (cached?.summary) text = cached.summary;
      } catch { /* cache unavailable: use the library summary */ }
    }
    const item: RoomItem = entry.youtubeId
      ? {
          id: `lib-${key}`, kind: 'video', title: entry.title, url: entry.url ?? `https://www.youtube.com/watch?v=${entry.youtubeId}`,
          publisher: entry.publisher, description: entry.blurb, videoId: entry.youtubeId,
          thumbnailUrl: `https://i.ytimg.com/vi/${entry.youtubeId}/mqdefault.jpg`, text: text || undefined, library: { source, id },
        }
      : {
          id: `lib-${key}`, kind: 'article', title: entry.title, url: entry.url ?? `library:${key}`,
          publisher: entry.byline ? `${entry.publisher} · ${entry.byline}` : entry.publisher, description: entry.blurb, text, library: { source, id },
        };
    return NextResponse.json({ item });
  }

  const q = (p.get('q') ?? '').trim().slice(0, 120);
  const levels = (p.get('levels') ?? '').split(',').filter((l) => LEVELS.includes(l));
  const ageParam = p.get('age');
  const age = ageParam && ['kids', 'teens', 'adults'].includes(ageParam) ? ageParam : null;
  const kindParam = p.get('kind') as LibraryKind | null;
  const kind = kindParam && KINDS.includes(kindParam) ? kindParam : null;
  const lengthParam = p.get('length') as LibraryLength | null;
  const length = lengthParam && LENGTHS.includes(lengthParam) ? lengthParam : null;
  const filters = { levels, age, kind, length };

  const liveTopic = (p.get('topic') ?? '').trim().slice(0, 120);
  const topic = q ? null : liveTopic || await sessionTopic(p.get('sessionId') ?? '');
  const shelf = topic ? searchLibrary({ ...filters, topic, limit: 8 }) : [];
  const shelfKeys = new Set(shelf.map((e) => e.key));
  const results = searchLibrary({ ...filters, q, limit: 60 }).filter((e) => !shelfKeys.has(e.key));
  return NextResponse.json({ topic, shelf, results });
}
