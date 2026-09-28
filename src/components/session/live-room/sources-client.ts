import type { RoomItem } from '@/stores/live-room-store';

/** Client for the sources API (docs/sources-api.md). Maps responses to RoomItems. */

export type Surface = 'web' | 'images' | 'news' | 'places' | 'videos';

export class SourcesError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const MESSAGES: Record<string, string> = {
  SOURCES_DISABLED: "Search isn't switched on yet.",
  SEARCH_UNAVAILABLE: "Search isn't set up yet. You can still paste a link.",
  SOURCE_LIMIT: 'Daily search limit reached. You can still paste a link and keep teaching.',
  PROVIDER_RATE_LIMIT: 'Search is busy. Try again in a moment.',
  SOURCE_TIMEOUT: 'That page took too long to load.',
  UNSAFE_URL: "That link can't be opened. Check it's a normal web address.",
  UNSAFE_ADDRESS: "That link can't be opened.",
  SOURCE_CONTENT_TYPE: "That link isn't a readable page.",
  SOURCE_CHARSET: "That page's text format isn't supported.",
  SOURCE_TOO_LARGE: 'That page is too large to read.',
  INVALID_QUERY: 'Type a shorter search.',
  AUTH_REQUIRED: 'Your sign-in expired. Refresh the page.',
  NO_READABLE_TEXT: "Couldn't find readable text on that page. Try opening it instead.",
};

export function sourcesMessage(code: string): string {
  return MESSAGES[code] ?? "Couldn't reach search. Try again.";
}

async function post<T>(sessionId: string, action: 'search' | 'read', body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/sources/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new SourcesError('NETWORK');
  }
  // 404 = API not deployed yet; treat like disabled.
  if (res.status === 404) throw new SourcesError('SOURCES_DISABLED');
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new SourcesError(typeof data?.error === 'string' ? data.error : 'UNKNOWN');
  return data as T;
}

interface ReferenceResult {
  id: string; title: string; url: string; description: string;
  publisher: string | null; publishedAt: string | null; imageUrl: string | null;
}
type SearchItem =
  | { kind: 'reference'; surface: 'web' | 'images' | 'news'; result: ReferenceResult }
  | { kind: 'place'; result: { id: string; title: string; address: string | null; coordinates: { latitude: number; longitude: number } | null; referenceUrl: string } }
  | { kind: 'video'; result: { id: string; title: string; referenceUrl: string; publisher: string | null; thumbnailUrl: string | null; playback: { provider: 'youtube'; videoId: string } | null } };

function toRoomItem(item: SearchItem): RoomItem {
  if (item.kind === 'place') {
    const r = item.result;
    return { id: r.id, kind: 'place', title: r.title, url: r.referenceUrl, publisher: null, address: r.address, coordinates: r.coordinates };
  }
  if (item.kind === 'video') {
    const r = item.result;
    return { id: r.id, kind: 'video', title: r.title, url: r.referenceUrl, publisher: r.publisher, thumbnailUrl: r.thumbnailUrl, videoId: r.playback?.videoId ?? null };
  }
  const r = item.result;
  return {
    id: r.id,
    kind: item.surface === 'images' ? 'image' : item.surface,
    title: r.title,
    url: r.url,
    publisher: r.publisher,
    description: r.description,
    imageUrl: r.imageUrl,
  };
}

export async function searchSources(sessionId: string, surface: Surface, query: string): Promise<RoomItem[]> {
  const data = await post<{ items: SearchItem[] }>(sessionId, 'search', { surface, query, page: 0 });
  return (data.items ?? []).map(toRoomItem);
}

export async function readSource(sessionId: string, url: string): Promise<RoomItem> {
  const r = await post<{ originalUrl: string; finalUrl: string; title: string; text: string; publisher: string | null; status: string }>(
    sessionId, 'read', { url },
  );
  if (r.status === 'unavailable' || !r.text) throw new SourcesError('NO_READABLE_TEXT');
  return { id: `read:${r.finalUrl}`, kind: 'article', title: r.title || r.finalUrl, url: r.originalUrl, publisher: r.publisher, text: r.text };
}
