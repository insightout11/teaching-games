// Curated Find Your Way starting points for hero cities: a NAMED, recognisable start
// (O'Connell Bridge, Tokyo Station…) plus a hand-picked map centre. Round landmarks now come
// from travelAnchors.attractions' real coordinates (all 50 cities); the landmark lists below
// remain only as a fallback for malformed anchor data. Coordinates are the real places.

export interface CityLandmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface CityLandmarkSet {
  center: { lat: number; lng: number };
  /** A recognisable starting point students give directions from. */
  start: CityLandmark;
  landmarks: CityLandmark[];
}

export const CITY_LANDMARKS: Record<string, CityLandmarkSet> = {
  dublin: {
    center: { lat: 53.3459, lng: -6.2625 },
    start: { id: 'oconnell-bridge', name: "O'Connell Bridge", lat: 53.3474, lng: -6.2591 },
    landmarks: [
      { id: 'trinity-college', name: 'Trinity College', lat: 53.3438, lng: -6.2546 },
      { id: 'temple-bar', name: 'Temple Bar', lat: 53.3455, lng: -6.2637 },
      { id: 'st-stephens-green', name: "St Stephen's Green", lat: 53.3382, lng: -6.2591 },
      { id: 'dublin-castle', name: 'Dublin Castle', lat: 53.3429, lng: -6.2674 },
      { id: 'guinness-storehouse', name: 'Guinness Storehouse', lat: 53.3419, lng: -6.2867 },
    ],
  },
  tokyo: {
    center: { lat: 35.6845, lng: 139.7534 },
    start: { id: 'tokyo-station', name: 'Tokyo Station', lat: 35.6812, lng: 139.7671 },
    landmarks: [
      { id: 'senso-ji', name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967 },
      { id: 'shibuya-crossing', name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7005 },
      { id: 'tokyo-tower', name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454 },
      { id: 'meiji-jingu', name: 'Meiji Shrine', lat: 35.6764, lng: 139.6993 },
      { id: 'imperial-palace', name: 'Imperial Palace', lat: 35.6852, lng: 139.7528 },
    ],
  },
  paris: {
    center: { lat: 48.8606, lng: 2.3376 },
    start: { id: 'notre-dame', name: 'Notre-Dame', lat: 48.8530, lng: 2.3499 },
    landmarks: [
      { id: 'eiffel-tower', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 },
      { id: 'louvre', name: 'Louvre Museum', lat: 48.8606, lng: 2.3376 },
      { id: 'arc-de-triomphe', name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950 },
      { id: 'montmartre', name: 'Sacré-Cœur, Montmartre', lat: 48.8867, lng: 2.3431 },
      { id: 'musee-dorsay', name: "Musée d'Orsay", lat: 48.8600, lng: 2.3266 },
    ],
  },
  london: {
    center: { lat: 51.5074, lng: -0.1210 },
    start: { id: 'trafalgar-square', name: 'Trafalgar Square', lat: 51.5080, lng: -0.1281 },
    landmarks: [
      { id: 'big-ben', name: 'Big Ben', lat: 51.5007, lng: -0.1246 },
      { id: 'tower-of-london', name: 'Tower of London', lat: 51.5081, lng: -0.0759 },
      { id: 'british-museum', name: 'British Museum', lat: 51.5194, lng: -0.1270 },
      { id: 'buckingham-palace', name: 'Buckingham Palace', lat: 51.5014, lng: -0.1419 },
      { id: 'london-eye', name: 'London Eye', lat: 51.5033, lng: -0.1196 },
    ],
  },
  'new-york': {
    center: { lat: 40.7549, lng: -73.9840 },
    start: { id: 'times-square', name: 'Times Square', lat: 40.7580, lng: -73.9855 },
    landmarks: [
      { id: 'central-park', name: 'Central Park (south)', lat: 40.7660, lng: -73.9773 },
      { id: 'empire-state', name: 'Empire State Building', lat: 40.7484, lng: -73.9857 },
      { id: 'bryant-park', name: 'Bryant Park', lat: 40.7536, lng: -73.9832 },
      { id: 'grand-central', name: 'Grand Central', lat: 40.7527, lng: -73.9772 },
      { id: 'rockefeller', name: 'Rockefeller Center', lat: 40.7587, lng: -73.9787 },
    ],
  },
};

export function getCityLandmarks(destinationId: string): CityLandmarkSet | null {
  return CITY_LANDMARKS[destinationId] ?? null;
}
