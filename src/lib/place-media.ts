import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationImage, DestinationPack } from '@/lib/world-flight/types';

export type PlaceMediaUsage = 'lesson-intro' | 'geo-clue' | 'reveal' | 'immersive' | 'background';
export type PlaceMediaProvider = 'wikimedia' | 'unsplash' | 'mapillary' | 'local' | 'external';
export type PlaceMediaKind = 'cityscape' | 'landmark' | 'street-scene' | 'landscape' | 'airport' | 'culture';
export type PlaceDifficulty = 'easy' | 'medium' | 'hard';

export interface PlaceMediaAsset {
  id: string;
  kind: PlaceMediaKind;
  title: string;
  provider: PlaceMediaProvider;
  usage: PlaceMediaUsage[];
  difficulty: PlaceDifficulty;
  alt: string;
  caption: string;
  sourceName: string;
  sourceUrl: string;
  url?: string;
  thumbnailUrl?: string;
  mapillaryImageId?: string;
  creator?: string;
  license?: string;
  focalPoint?: { x: number; y: number };
  spoilerRisk?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface PlaceMediaRecord {
  id: string;
  name: string;
  city?: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  kind: 'city' | 'landmark' | 'region';
  difficulty: PlaceDifficulty;
  destinationId?: string;
  countryCode?: string;
  tags: string[];
  media: PlaceMediaAsset[];
}

function providerForImage(image: DestinationImage): PlaceMediaProvider {
  if (image.sourceName.toLowerCase().includes('wikimedia')) return 'wikimedia';
  if (image.sourceName.toLowerCase().includes('unsplash')) return 'unsplash';
  return 'external';
}

function destinationDifficulty(destination: DestinationPack): PlaceDifficulty {
  if (['paris', 'london', 'new-york', 'tokyo', 'cairo', 'sydney', 'rome'].includes(destination.id)) {
    return 'easy';
  }
  if (['suva', 'ulaanbaatar', 'almaty', 'dakar', 'recife', 'addis-ababa'].includes(destination.id)) {
    return 'hard';
  }
  return 'medium';
}

function mediaFromDestinationImage(destination: DestinationPack): PlaceMediaAsset {
  const image = destination.heroImage;
  return {
    id: `${destination.id}-hero`,
    kind: destination.scene.landmarkSilhouette ? 'cityscape' : 'landscape',
    title: `${destination.city} arrival view`,
    provider: providerForImage(image),
    usage: ['lesson-intro', 'geo-clue', 'reveal', 'background'],
    difficulty: destinationDifficulty(destination),
    url: image.url,
    alt: image.alt,
    caption: image.caption,
    sourceName: image.sourceName,
    sourceUrl: image.sourceUrl,
    creator: image.creator,
    license: image.license,
    focalPoint: image.focalPoint,
    spoilerRisk: 'medium',
    tags: [destination.scene.terrain, destination.scene.skyline, destination.region],
  };
}

function wikimediaFileUrl(fileName: string, width = 1200) {
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}?width=${width}`;
}

const CURATED_DESTINATION_MEDIA: Record<string, PlaceMediaAsset[]> = {
  'panama-city': [
    {
      id: 'panama-city-panama-canal-gatun-locks',
      kind: 'landmark',
      title: 'Panama Canal - Gatun Locks',
      provider: 'wikimedia',
      usage: ['lesson-intro', 'geo-clue', 'reveal'],
      difficulty: 'easy',
      url: wikimediaFileUrl('Panama Canal Gatun Locks.jpg'),
      alt: 'Gatun Locks on the Panama Canal',
      caption: 'The Panama Canal connects Atlantic and Pacific shipping routes through Panama.',
      sourceName: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Panama_Canal_Gatun_Locks.jpg',
      creator: 'Stan Shebs',
      license: 'CC BY-SA 3.0',
      spoilerRisk: 'high',
      tags: ['canal', 'engineering', 'waterway', 'trade'],
    },
  ],
};

function recordFromDestination(destination: DestinationPack): PlaceMediaRecord {
  const difficulty = destinationDifficulty(destination);
  return {
    id: destination.id,
    name: `${destination.city}, ${destination.country}`,
    city: destination.city,
    country: destination.country,
    region: destination.region,
    lat: destination.lat,
    lng: destination.lng,
    kind: 'city',
    difficulty,
    destinationId: destination.id,
    tags: [
      destination.primaryAirport,
      destination.region,
      destination.scene.terrain,
      destination.scene.skyline,
      ...(destination.scene.landmarkSilhouette ? [destination.scene.landmarkSilhouette] : []),
    ],
    media: [
      ...(CURATED_DESTINATION_MEDIA[destination.id] ?? []),
      mediaFromDestinationImage(destination),
    ],
  };
}

export const PLACE_MEDIA_LIBRARY: PlaceMediaRecord[] = WORLD_DESTINATIONS.map(recordFromDestination);

export function getPlaceMediaRecord(id: string) {
  return PLACE_MEDIA_LIBRARY.find((place) => place.id === id);
}

export function getPlaceMediaRecordByDestination(destinationId: string) {
  return PLACE_MEDIA_LIBRARY.find((place) => place.destinationId === destinationId);
}

export function getMediaForUsage(place: PlaceMediaRecord, usage: PlaceMediaUsage) {
  return place.media.filter((media) => media.usage.includes(usage) && (media.url || media.thumbnailUrl));
}

export function getLessonIntroMediaForDestination(destinationId: string) {
  const place = getPlaceMediaRecordByDestination(destinationId);
  return place ? getMediaForUsage(place, 'lesson-intro')[0] ?? null : null;
}

export function getRevealMediaForDestination(destinationId: string) {
  const place = getPlaceMediaRecordByDestination(destinationId);
  return place ? getMediaForUsage(place, 'reveal')[0] ?? null : null;
}

export function getWorldLensPlacePool() {
  return PLACE_MEDIA_LIBRARY.filter((place) => getMediaForUsage(place, 'geo-clue').length > 0);
}
