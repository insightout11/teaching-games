/** Browser-safe media contracts. References are not article evidence or embed HTML. */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapViewport {
  center: Coordinates;
  zoom: number;
}

export interface SavedPlace {
  address: string | null;
  coordinates: Coordinates | null;
  referenceUrl: string;
  websiteUrl: string | null;
  providerPlaceId: string | null;
  viewport: MapViewport | null;
}

export interface SavedVideo {
  referenceUrl: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  playback: {
    provider: 'youtube';
    videoId: string;
  } | null;
  clip: {
    start: number;
    end: number | null;
  };
}

export function coordinates(value: unknown): Coordinates | null {
  if (!value || typeof value !== 'object')
    return null;
  const v = value as Coordinates;
  return typeof v.latitude === 'number' && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 &&
    typeof v.longitude === 'number' && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180
    ? { latitude: v.latitude, longitude: v.longitude } : null;
}

export function mapViewport(value: unknown): MapViewport | null {
  if (!value || typeof value !== 'object')
    return null;
  const v = value as MapViewport, center = coordinates(v.center);
  return center && typeof v.zoom === 'number' && Number.isFinite(v.zoom) && v.zoom >= 0 && v.zoom <= 22
    ? { center, zoom: v.zoom } : null;
}
/** Derive identity from the reference, never trust a caller-supplied embed URL/ID. */

export function youtubePlayback(value: string): SavedVideo['playback'] {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port)
      return null;
    const host = url.hostname.toLowerCase();
    const id = host === 'youtu.be' ? url.pathname.slice(1) :
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)
        ? url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(shorts|embed)\/([^/]+)$/.exec(url.pathname)?.[2] : null;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: 'youtube', videoId: id } : null;
  } catch {
    return null;
  }
}
