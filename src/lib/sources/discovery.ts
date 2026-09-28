import { assertSource, object } from './validation';
import { searchRequest } from './serper';
import type { SearchResponse, SourceResult } from './types';

export const DISCOVERY_SURFACES = ['web', 'images', 'news', 'places', 'videos'] as const;

export type DiscoverySurface = typeof DISCOVERY_SURFACES[number];

export interface PlaceResult {
  id: string;
  title: string;
  address: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  referenceUrl: string;
  websiteUrl: string | null;
  providerPlaceId: string | null;
}

export interface VideoResult {
  id: string;
  title: string;
  referenceUrl: string;
  publisher: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  playback: {
    provider: 'youtube';
    videoId: string;
  } | null;
}

export type DiscoveryItem = {
  kind: 'reference';
  surface: 'web' | 'images' | 'news';
  result: SourceResult;
} | {
  kind: 'place';
  result: PlaceResult;
} | {
  kind: 'video';
  result: VideoResult;
};

export interface DiscoveryResponse {
  schemaVersion: 1;
  surface: DiscoverySurface;
  query: string;
  page: number;
  items: DiscoveryItem[];
  nextPage: number | null;
  retrievedAt: string;
  filtering: 'strict' | 'not-applicable';
}

export function discoveryRequest(input: unknown) {
  object(input);
  assertSource(Object.keys(input).every(key => ['surface', 'query', 'page'].includes(key)), 'INVALID_REQUEST');
  assertSource(DISCOVERY_SURFACES.includes(input.surface as DiscoverySurface), 'INVALID_TAB');
  const surface = input.surface as DiscoverySurface;
  const parsed = searchRequest({ query: input.query, page: input.page, tab: surface === 'places' || surface === 'videos' ? 'images' : surface });
  return { schemaVersion: 1 as const, surface, query: parsed.query, page: parsed.page };
}

export function wrapDiscovery(response: SearchResponse): DiscoveryResponse {
  return {
    schemaVersion: 1, surface: response.tab, query: response.query, page: response.page,
    items: response.results.map(result => ({ kind: 'reference', surface: response.tab, result })),
    nextPage: response.nextPage, retrievedAt: response.retrievedAt, filtering: 'strict'
  };
}
