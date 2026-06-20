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
  'rio-de-janeiro': [
    {
      id: 'rio-de-janeiro-christ-redeemer',
      kind: 'landmark',
      title: 'Christ the Redeemer',
      provider: 'wikimedia',
      usage: ['lesson-intro', 'geo-clue', 'reveal'],
      difficulty: 'easy',
      url: wikimediaFileUrl('Rio by night-Christ, The Redeemer, moon and Sugarloaf (9071376882).jpg'),
      alt: 'Wide night view of Rio de Janeiro with Christ the Redeemer and Sugarloaf Mountain',
      caption: 'Christ the Redeemer, Sugarloaf, and the city lights show Rio as a mountain-and-coast city.',
      sourceName: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rio_by_night-Christ,_The_Redeemer,_moon_and_Sugarloaf_(9071376882).jpg',
      creator: 'Edmir Silvestre',
      license: 'CC BY 2.0',
      spoilerRisk: 'high',
      tags: ['christ-the-redeemer', 'corcovado', 'landmark'],
    },
    {
      id: 'rio-de-janeiro-copacabana-aerial',
      kind: 'landscape',
      title: 'Copacabana Beach',
      provider: 'wikimedia',
      usage: ['lesson-intro', 'geo-clue', 'reveal'],
      difficulty: 'medium',
      url: wikimediaFileUrl('Aerial view of Copacabana beach.jpg'),
      alt: 'Aerial view of Copacabana Beach in Rio de Janeiro',
      caption: 'Copacabana shows Rio as a dense coastal city shaped by beach public life.',
      sourceName: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aerial_view_of_Copacabana_beach.jpg',
      creator: 'Gustavo Facci',
      license: 'CC BY-SA 2.0',
      spoilerRisk: 'medium',
      tags: ['copacabana', 'beach', 'coast'],
    },
    {
      id: 'rio-de-janeiro-tijuca-waterfall',
      kind: 'landscape',
      title: 'Tijuca Forest Waterfall',
      provider: 'wikimedia',
      usage: ['lesson-intro', 'geo-clue', 'reveal'],
      difficulty: 'medium',
      url: wikimediaFileUrl('Cachoeira - Floresta da Tijuca, Rio de Janeiro, Brazil.jpg'),
      alt: 'Waterfall in Tijuca Forest in Rio de Janeiro',
      caption: 'Tijuca Forest brings Atlantic forest, water, shade, and biodiversity into the city.',
      sourceName: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cachoeira_-_Floresta_da_Tijuca,_Rio_de_Janeiro,_Brazil.jpg',
      creator: 'slasher-fun',
      license: 'CC BY-SA 2.0',
      spoilerRisk: 'medium',
      tags: ['tijuca-forest', 'waterfall', 'nature'],
    },
    {
      id: 'rio-de-janeiro-sambadrome-carnaval',
      kind: 'culture',
      title: 'Carnaval at the Sambadrome',
      provider: 'wikimedia',
      usage: ['lesson-intro', 'geo-clue', 'reveal'],
      difficulty: 'medium',
      url: wikimediaFileUrl('Carnaval celebrations at Sambadrome, Rio 2019 03.jpg'),
      alt: 'Carnaval celebration at the Sambadrome in Rio de Janeiro',
      caption: 'Carnaval connects music, costume, dance, planning, and neighborhood pride.',
      sourceName: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Carnaval_celebrations_at_Sambadrome,_Rio_2019_03.jpg',
      creator: 'The John Templeton',
      license: 'CC BY-SA 4.0',
      spoilerRisk: 'medium',
      tags: ['carnaval', 'sambadrome', 'culture'],
    },
  ],
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
