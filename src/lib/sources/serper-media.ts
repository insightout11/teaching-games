import { createHash } from 'node:crypto';
import { assertSource } from './validation';
import { coordinates, youtubePlayback } from './media';
import { publicUrl } from './public-fetch';
import { searchRequest, fetchSerperJSON } from './serper';
import type { DiscoveryResponse, DiscoveryItem } from './discovery';

export interface MediaSearchRequest { surface: 'places' | 'videos'; query: string; page: number }
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const clean = (v: unknown, max: number) => typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim().slice(0, max) : '';
function url(v: unknown) { try { return publicUrl(v).href; } catch { return null; } }
function request(input: MediaSearchRequest): MediaSearchRequest {
  assertSource(input.surface === 'places' || input.surface === 'videos', 'INVALID_TAB');
  const parsed = searchRequest({ query: input.query, tab: 'images', page: input.page });
  return { surface: input.surface, query: parsed.query, page: parsed.page };
}
export function mediaSerperRequest(input: MediaSearchRequest) {
  const parsed = request(input);
  return { url: `https://google.serper.dev/${parsed.surface}`,
    body: { q: parsed.query, num: 10, hl: 'en', safe: 'active', autocorrect: false } };
}
function duration(v: unknown): number | null {
  // No guessing units from a bare number. Accept an explicit clock string only.
  if (typeof v !== 'string' || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(v)) return null;
  const parts = v.split(':').map(Number);
  if (parts.slice(1).some(n => n > 59)) return null;
  const seconds = parts.reduce((total, n) => total * 60 + n, 0);
  return seconds > 0 && seconds <= 86400 ? seconds : null;
}
export function normalizeSerperMedia(input: unknown, suppliedRequest: MediaSearchRequest, retrievedAt: string): DiscoveryResponse {
  const parsed = request(suppliedRequest), data = obj(input);
  if (parsed.surface === 'videos') assertSource(obj(data.searchParameters).safe === 'active', 'PROVIDER_RESPONSE_INVALID', 502);
  const collection = data[parsed.surface];
  assertSource(Array.isArray(collection), 'PROVIDER_RESPONSE_INVALID', 502);
  const items: DiscoveryItem[] = [], seen = new Set<string>();
  for (const supplied of collection.slice(0, 10)) {
    const raw = obj(supplied), title = clean(raw.title, 300);
    if (!title) continue;
    if (parsed.surface === 'places') {
      const point = coordinates({ latitude: raw.latitude, longitude: raw.longitude });
      const address = clean(raw.address, 1000) || null;
      // A Maps search link is an external reference, not an embedded basemap.
      // Serper cid is not a Google Place ID; never pass it as query_place_id.
      const reference = new URL('https://www.google.com/maps/search/');
      reference.searchParams.set('api', '1');
      reference.searchParams.set('query', point ? `${point.latitude},${point.longitude}` : `${title} ${address ?? ''}`.trim());
      const referenceUrl = reference.href;
      const providerPlaceId = typeof raw.cid === 'string' && /^\d{1,30}$/.test(raw.cid) ? `serper:cid:${raw.cid}` : null;
      const identity = providerPlaceId ?? `${referenceUrl}:${title}`;
      if (seen.has(identity)) continue; seen.add(identity);
      items.push({ kind: 'place', result: { id: createHash('sha256').update(`place:${identity}`).digest('hex'), title,
        address, coordinates: point, referenceUrl, websiteUrl: url(raw.website), providerPlaceId } });
    } else {
      const referenceUrl = url(raw.link);
      if (!referenceUrl || seen.has(referenceUrl)) continue; seen.add(referenceUrl);
      const date = typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}(T|$)/.test(raw.date) && Number.isFinite(Date.parse(raw.date))
        ? new Date(raw.date).toISOString() : null;
      items.push({ kind: 'video', result: { id: createHash('sha256').update(`video:${referenceUrl}`).digest('hex'),
        title, referenceUrl, publisher: clean(raw.source, 200) || null, publishedAt: date,
        durationSeconds: duration(raw.duration), thumbnailUrl: url(raw.imageUrl), playback: youtubePlayback(referenceUrl) } });
    }
  }
  return { schemaVersion: 1, ...parsed, items, nextPage: null, retrievedAt,
    filtering: parsed.surface === 'places' ? 'not-applicable' : 'strict' };
}
export async function searchSerperMedia(input: MediaSearchRequest, token: string, fetcher = fetch): Promise<DiscoveryResponse> {
  const parsed = request(input);
  const data = await fetchSerperJSON(mediaSerperRequest(parsed), token, fetcher);
  return normalizeSerperMedia(data, parsed, new Date().toISOString());
}
