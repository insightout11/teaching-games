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

function wikimediaFilePage(fileName: string) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName).replace(/%20/g, '_')}`;
}

function wikimediaMediaAsset({
  id,
  kind,
  title,
  difficulty,
  fileName,
  alt,
  caption,
  creator,
  license,
  spoilerRisk = 'medium',
  tags = [],
}: {
  id: string;
  kind: PlaceMediaKind;
  title: string;
  difficulty: PlaceDifficulty;
  fileName: string;
  alt: string;
  caption: string;
  creator: string;
  license: string;
  spoilerRisk?: PlaceMediaAsset['spoilerRisk'];
  tags?: string[];
}): PlaceMediaAsset {
  return {
    id,
    kind,
    title,
    provider: 'wikimedia',
    usage: ['lesson-intro', 'geo-clue', 'reveal'],
    difficulty,
    url: wikimediaFileUrl(fileName),
    alt,
    caption,
    sourceName: 'Wikimedia Commons',
    sourceUrl: wikimediaFilePage(fileName),
    creator,
    license,
    spoilerRisk,
    tags,
  };
}

const CURATED_DESTINATION_MEDIA: Record<string, PlaceMediaAsset[]> = {
  bangkok: [
    wikimediaMediaAsset({
      id: 'bangkok-wat-arun-river',
      kind: 'landmark',
      title: 'Wat Arun on the Chao Phraya',
      difficulty: 'easy',
      fileName: 'Wat Arun from Chao Phraya River.jpg',
      alt: 'Wat Arun temple beside the Chao Phraya River in Bangkok',
      caption: 'Wat Arun links Bangkok river life with Buddhist temple architecture.',
      creator: 'Diliff',
      license: 'CC BY 2.5',
      spoilerRisk: 'high',
      tags: ['wat-arun', 'chao-phraya', 'temple'],
    }),
    wikimediaMediaAsset({
      id: 'bangkok-chatuchak-tuk-tuk',
      kind: 'street-scene',
      title: 'Tuk-tuk at Chatuchak Market',
      difficulty: 'medium',
      fileName: 'Tuk-tuk waiting outside Chatuchak Market - Bangkok.jpg',
      alt: 'Tuk-tuk waiting outside Chatuchak Market in Bangkok',
      caption: 'Tuk-tuks, markets, and street movement are part of everyday Bangkok.',
      creator: 'Zeugma fr (Antoine FLEURY-GOBERT)',
      license: 'CC BY-SA 3.0',
      tags: ['tuk-tuk', 'market', 'transport'],
    }),
    wikimediaMediaAsset({
      id: 'bangkok-chatuchak-market',
      kind: 'culture',
      title: 'Chatuchak Weekend Market',
      difficulty: 'medium',
      fileName: 'Chatuchak Weekend Market, Bangkok, Thailand (4570450571).jpg',
      alt: 'Shoppers and stalls at Chatuchak Weekend Market in Bangkok',
      caption: 'Chatuchak shows Bangkok as a city of markets, food, shopping, and crowds.',
      creator: 'yeowatzup',
      license: 'CC BY 2.0',
      tags: ['chatuchak', 'market', 'daily-life'],
    }),
  ],
  cairo: [
    wikimediaMediaAsset({
      id: 'cairo-giza-pyramids',
      kind: 'landmark',
      title: 'Giza Pyramids',
      difficulty: 'easy',
      fileName: 'The Giza Pyramids.jpg',
      alt: 'The Giza Pyramids near Cairo',
      caption: 'The pyramids place ancient history at the edge of modern Cairo.',
      creator: 'Morhaf Kamal Aljanee',
      license: 'CC BY-SA 3.0',
      spoilerRisk: 'high',
      tags: ['giza', 'pyramids', 'ancient-history'],
    }),
    wikimediaMediaAsset({
      id: 'cairo-nile-view',
      kind: 'cityscape',
      title: 'The Nile Through Cairo',
      difficulty: 'medium',
      fileName: 'River Nile in Cairo.jpg',
      alt: 'The Nile River running through Cairo',
      caption: 'The Nile is still a central line through Cairo city life.',
      creator: 'Mathew Eshak',
      license: 'CC BY-SA 4.0',
      tags: ['nile', 'river', 'cityscape'],
    }),
    wikimediaMediaAsset({
      id: 'cairo-khan-el-khalili',
      kind: 'culture',
      title: 'Khan el-Khalili Bazaar',
      difficulty: 'medium',
      fileName: 'Khan el-Khalili 2019 1.jpg',
      alt: 'Khan el-Khalili bazaar in Cairo',
      caption: 'Khan el-Khalili shows Cairo through trade, craft, tourism, and local movement.',
      creator: 'Mohammed Ali Moussa',
      license: 'CC BY-SA 4.0',
      tags: ['market', 'bazaar', 'historic-cairo'],
    }),
  ],
  london: [
    wikimediaMediaAsset({
      id: 'london-tower-bridge-thames',
      kind: 'landmark',
      title: 'Tower Bridge and the Thames',
      difficulty: 'easy',
      fileName: "Tower Bridge and St Paul's Cathedral.jpg",
      alt: 'Tower Bridge and St Pauls Cathedral seen from across the River Thames',
      caption: 'The Thames connects London landmarks, transport, trade, and public space.',
      creator: 'sebastiandoe5',
      license: 'CC BY-SA 2.0',
      spoilerRisk: 'high',
      tags: ['tower-bridge', 'thames', 'landmark'],
    }),
    wikimediaMediaAsset({
      id: 'london-kings-cross-concourse',
      kind: 'street-scene',
      title: "King's Cross Station",
      difficulty: 'medium',
      fileName: "London banner King's Cross Western Concourse.jpg",
      alt: 'The western concourse of Kings Cross station in London',
      caption: "King's Cross shows how London moves through rail, work, and daily commuting.",
      creator: 'Colin; derivative work by Jjtkk',
      license: 'CC BY-SA 3.0',
      tags: ['rail', 'station', 'transport'],
    }),
    wikimediaMediaAsset({
      id: 'london-british-museum-court',
      kind: 'culture',
      title: 'British Museum Great Court',
      difficulty: 'medium',
      fileName: 'British Museum Great Court, London, UK - Diliff.jpg',
      alt: 'The Great Court inside the British Museum in London',
      caption: "Museums are part of London's global history, tourism, and public culture.",
      creator: 'Diliff',
      license: 'CC BY-SA 3.0',
      tags: ['museum', 'history', 'culture'],
    }),
  ],
  'new-york': [
    wikimediaMediaAsset({
      id: 'new-york-brooklyn-bridge-skyline',
      kind: 'cityscape',
      title: 'Brooklyn Bridge and Manhattan',
      difficulty: 'easy',
      fileName: 'Brooklyn Bridge And Manhattan At Sunset New York Cityscape Photography (238415973).jpeg',
      alt: 'Brooklyn Bridge and Manhattan skyline at sunset',
      caption: 'The Brooklyn Bridge frames New York as a city of movement, density, and skyline views.',
      creator: 'Giuseppe Milo',
      license: 'CC BY 3.0',
      spoilerRisk: 'high',
      tags: ['brooklyn-bridge', 'manhattan', 'skyline'],
    }),
    wikimediaMediaAsset({
      id: 'new-york-central-park-skyline',
      kind: 'landscape',
      title: 'Central Park and Midtown',
      difficulty: 'easy',
      fileName: 'Central Park New York May 2015 007.jpg',
      alt: 'Central Park with New York buildings around it',
      caption: 'Central Park shows how green public space fits inside a very dense city.',
      creator: 'King of Hearts',
      license: 'CC BY-SA 3.0',
      tags: ['central-park', 'public-space', 'skyline'],
    }),
    wikimediaMediaAsset({
      id: 'new-york-times-square-food-carts',
      kind: 'culture',
      title: 'Food Carts in Times Square',
      difficulty: 'medium',
      fileName: 'Food Carts in Times Square NYC.jpg',
      alt: 'Food carts in Times Square in New York City',
      caption: 'Food carts are part of New York street life, tourism, and quick daily routines.',
      creator: 'SteveStrummer',
      license: 'CC0',
      tags: ['food-carts', 'times-square', 'street-food'],
    }),
  ],
  paris: [
    wikimediaMediaAsset({
      id: 'paris-eiffel-front-de-seine',
      kind: 'landmark',
      title: 'Eiffel Tower and the Seine',
      difficulty: 'easy',
      fileName: 'Aerial photograph of Eiffel Tower and Front de Seine, Paris 2005.jpg',
      alt: 'Aerial view of the Eiffel Tower and the Seine in Paris',
      caption: 'The Eiffel Tower and Seine make Paris easy to recognize from above.',
      creator: 'NateBW',
      license: 'CC BY-SA 2.0',
      spoilerRisk: 'high',
      tags: ['eiffel-tower', 'seine', 'landmark'],
    }),
    wikimediaMediaAsset({
      id: 'paris-grand-louvre',
      kind: 'culture',
      title: 'The Grand Louvre',
      difficulty: 'easy',
      fileName: 'The Grand Louvre (235493607).jpeg',
      alt: 'The Louvre Museum in Paris',
      caption: 'The Louvre connects Paris with art, tourism, history, and public space.',
      creator: 'Wichien W',
      license: 'CC0',
      tags: ['louvre', 'museum', 'art'],
    }),
    wikimediaMediaAsset({
      id: 'paris-bakery-counter',
      kind: 'culture',
      title: 'Paris Bakery Counter',
      difficulty: 'medium',
      fileName: 'Bakery sales counter in Paris.jpg',
      alt: 'Bakery sales counter in Paris',
      caption: 'Bakeries and small food routines are part of everyday Paris culture.',
      creator: 'THOR',
      license: 'CC BY 2.0',
      tags: ['bakery', 'food', 'daily-life'],
    }),
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
    wikimediaMediaAsset({
      id: 'panama-city-skyline-casco-viejo',
      kind: 'cityscape',
      title: 'Panama City Skyline',
      difficulty: 'medium',
      fileName: 'Panama Skyline.jpg',
      alt: 'Panama City skyline seen from Casco Viejo',
      caption: 'Panama City pairs a historic district with a dense modern skyline.',
      creator: 'Nico2panama',
      license: 'CC BY-SA 3.0',
      tags: ['skyline', 'casco-viejo', 'waterfront'],
    }),
    wikimediaMediaAsset({
      id: 'panama-city-casco-viejo-street',
      kind: 'street-scene',
      title: 'Casco Viejo Street',
      difficulty: 'medium',
      fileName: 'Old Panama City - Casco Viejo - Panama - panoramio.jpg',
      alt: 'Street in Casco Viejo in Panama City',
      caption: "Casco Viejo shows the city's colonial streets, restoration, and neighborhood life.",
      creator: 'David Broad',
      license: 'CC BY 3.0',
      tags: ['casco-viejo', 'historic-district', 'street'],
    }),
  ],
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
  singapore: [
    wikimediaMediaAsset({
      id: 'singapore-marina-bay-dusk',
      kind: 'cityscape',
      title: 'Marina Bay at Dusk',
      difficulty: 'easy',
      fileName: 'Singapore Marina Bay Dusk 2018-02-27.jpg',
      alt: 'Singapore Marina Bay skyline at dusk',
      caption: "Marina Bay shows Singapore's skyline, waterfront design, and global city identity.",
      creator: 'Benh LIEU SONG (Flickr)',
      license: 'CC BY-SA 4.0',
      spoilerRisk: 'high',
      tags: ['marina-bay', 'skyline', 'waterfront'],
    }),
    wikimediaMediaAsset({
      id: 'singapore-gardens-by-the-bay',
      kind: 'landscape',
      title: 'Gardens by the Bay',
      difficulty: 'easy',
      fileName: 'Gardens by the Bay, Singapore 2012.JPG',
      alt: 'Gardens by the Bay in Singapore',
      caption: 'Gardens by the Bay connects nature, design, tourism, and city planning.',
      creator: 'RudolfSimon',
      license: 'CC BY-SA 3.0',
      tags: ['gardens-by-the-bay', 'garden-city', 'design'],
    }),
    wikimediaMediaAsset({
      id: 'singapore-hawker-centre',
      kind: 'culture',
      title: 'Singapore Hawker Centre',
      difficulty: 'medium',
      fileName: 'Image of a Singapore hawker center.jpg',
      alt: 'Hawker centre in Singapore',
      caption: 'Hawker centres show Singapore through affordable food, shared tables, and multilingual life.',
      creator: 'Qvssjp',
      license: 'CC BY-SA 4.0',
      tags: ['hawker-centre', 'food', 'daily-life'],
    }),
  ],
  tokyo: [
    wikimediaMediaAsset({
      id: 'tokyo-shibuya-crossing',
      kind: 'street-scene',
      title: 'Shibuya Crossing',
      difficulty: 'easy',
      fileName: 'Tokyo Shibuya Crossing 01.jpg',
      alt: 'Shibuya Crossing in Tokyo',
      caption: "Shibuya Crossing shows Tokyo's density, transit rhythms, and pedestrian flow.",
      creator: 'Zairon',
      license: 'CC BY-SA 4.0',
      spoilerRisk: 'high',
      tags: ['shibuya', 'crossing', 'pedestrians'],
    }),
    wikimediaMediaAsset({
      id: 'tokyo-sensoji-kaminarimon',
      kind: 'landmark',
      title: 'Senso-ji Kaminarimon Gate',
      difficulty: 'easy',
      fileName: 'Senso-ji Kaminarimon 201503b.jpg',
      alt: 'Kaminarimon gate at Senso-ji temple in Tokyo',
      caption: 'Senso-ji brings historic temple space into the middle of modern Tokyo tourism.',
      creator: 'Tak1701d',
      license: 'CC BY-SA 3.0',
      tags: ['senso-ji', 'asakusa', 'temple'],
    }),
    wikimediaMediaAsset({
      id: 'tokyo-station-marunouchi',
      kind: 'street-scene',
      title: 'Tokyo Station',
      difficulty: 'medium',
      fileName: 'Tokyo Station (Marunouchi Building).jpg',
      alt: 'Tokyo Station Marunouchi building',
      caption: "Tokyo Station connects rail, work, shopping, and the city's organized movement.",
      creator: 'Alexandr3126',
      license: 'CC BY-SA 4.0',
      tags: ['tokyo-station', 'rail', 'transport'],
    }),
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
