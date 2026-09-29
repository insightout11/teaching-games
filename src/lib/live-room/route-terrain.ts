/**
 * What the class is flying over. A great-circle route between two cities is
 * sampled by lesson progress, and each point is looked up in a small hand-made
 * map of named regions (seas, deserts, ranges, forests, ice); rough coastline
 * outlines decide land or sea. Deliberately coarse: it drives scenery and
 * an optional "Below us: …" line, not navigation.
 */
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import { LAND_OUTLINES, WATER_OUTLINES, inRing } from '@/lib/live-room/land-outlines';

export interface LatLng { lat: number; lng: number }
export interface Overflight { terrain: Terrain; name: string | null; point: LatLng }

/** LC International has no real coordinates; until the class journey exists it sits on an Atlantic island hub. */
export const LC_INTERNATIONAL_COORD: LatLng = { lat: 38.7, lng: -27.2 };

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Point at fraction t along the great circle from a to b. */
export function greatCirclePoint(a: LatLng, b: LatLng, t: number): LatLng {
  const f1 = toRad(a.lat), l1 = toRad(a.lng), f2 = toRad(b.lat), l2 = toRad(b.lng);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin((l2 - l1) / 2) ** 2));
  if (d === 0) return { ...a };
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(f1) * Math.cos(l1) + B * Math.cos(f2) * Math.cos(l2);
  const y = A * Math.cos(f1) * Math.sin(l1) + B * Math.cos(f2) * Math.sin(l2);
  const z = A * Math.sin(f1) + B * Math.sin(f2);
  return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lng: toDeg(Math.atan2(y, x)) };
}

/** [name, terrain, latMin, latMax, lngMin, lngMax] — first match wins, so specific regions come first. */
type Region = [string, Terrain, number, number, number, number];
const REGIONS: Region[] = [
  // Ice
  ['the Greenland ice sheet', 'ice', 60, 83, -73, -12],
  ['Antarctica', 'ice', -90, -62, -180, 180],
  ['the Arctic Ocean', 'ice', 75, 90, -180, 180],
  // Mountains
  ['the Himalayas', 'mountains', 26, 36, 72, 97],
  ['the Tibetan Plateau', 'mountains', 29, 38, 78, 102],
  ['the Alps', 'mountains', 44, 48.5, 5, 16],
  ['the Andes', 'mountains', -45, 8, -78, -66],
  ['the Rocky Mountains', 'mountains', 35, 60, -125, -104],
  ['the Caucasus Mountains', 'mountains', 40, 44, 38, 50],
  ['the Atlas Mountains', 'mountains', 29, 35, -10, 3],
  ['the Ural Mountains', 'mountains', 50, 68, 56, 62],
  ['the Zagros Mountains', 'mountains', 28, 35, 46, 54],
  // Hills and highlands
  ['the Scottish Highlands', 'hills', 56, 58.7, -6, -3],
  ['the Massif Central', 'hills', 44, 46.5, 1.8, 4.5],
  ['the Carpathian Mountains', 'hills', 45, 49.5, 19, 26],
  ['the Balkans', 'hills', 40, 45, 18, 24],
  ['the Anatolian Plateau', 'hills', 37, 40.5, 29, 40],
  ['the Ethiopian Highlands', 'hills', 6, 14, 36, 42],
  ['the Deccan Plateau', 'hills', 12, 21, 74, 80],
  ['the hills of southern China', 'hills', 22, 29, 105, 119],
  ['the mountains of Korea', 'hills', 35.5, 39, 127.5, 129.3],
  ['the Appalachian Mountains', 'hills', 34, 45, -84, -72],
  ['the Brazilian Highlands', 'hills', -23, -12, -50, -40],
  ['the Great Dividing Range', 'hills', -38, -16, 145, 152],
  // Deserts
  ['the Sahara Desert', 'desert', 16, 32, -17, 32],
  ['the Arabian Desert', 'desert', 16, 30, 36, 58],
  ['the Gobi Desert', 'desert', 38, 46, 90, 112],
  ['the Australian Outback', 'desert', -32, -18, 118, 145],
  ['the Kalahari Desert', 'desert', -28, -18, 18, 27],
  ['the Atacama Desert', 'desert', -28, -18, -71, -68],
  ['the Thar Desert', 'desert', 24, 30, 69, 76],
  ['the Mojave and Sonoran deserts', 'desert', 29, 37, -118, -109],
  ['the Iranian Plateau', 'desert', 26, 37, 50, 62],
  // Forests
  ['the Amazon rainforest', 'forest', -15, 5, -75, -48],
  ['the Congo rainforest', 'forest', -6, 5, 12, 30],
  ['the Siberian taiga', 'forest', 52, 70, 60, 140],
  ['the Canadian boreal forest', 'forest', 50, 65, -120, -60],
  ['the forests of Scandinavia', 'forest', 58, 70, 8, 30],
  ['the rainforests of Borneo', 'forest', -4, 7, 108, 119],
  // Seas (before oceans)
  ['the Mediterranean Sea', 'ocean', 31, 45, -5, 36],
  ['the Caribbean Sea', 'ocean', 9, 22, -88, -60],
  ['the Red Sea', 'ocean', 13, 29, 32, 43],
  ['the Black Sea', 'ocean', 41, 46.5, 28, 41],
  ['the North Sea', 'ocean', 51, 61, -3, 9],
  ['the Sea of Japan', 'ocean', 34, 51, 128, 141],
  ['the South China Sea', 'ocean', 3, 22, 105, 120],
  ['the Bay of Bengal', 'ocean', 5, 22, 80, 95],
  ['the Gulf of Mexico', 'ocean', 18, 30, -98, -81],
  ['the Tasman Sea', 'ocean', -45, -30, 150, 172],
  ['the Yellow Sea', 'ocean', 32, 41, 119, 127],
  ['the East China Sea', 'ocean', 24, 33, 119, 131],
  ['the Gulf of Thailand', 'ocean', 6, 13.8, 99, 105],
  ['the Java Sea', 'ocean', -8, -2, 105, 120],
  ['the Philippine Sea', 'ocean', 5, 30, 125, 140],
  ['the Persian Gulf', 'ocean', 24, 30.5, 48, 57],
  ['the Arabian Sea', 'ocean', 5, 25, 55, 75],
  ['the Baltic Sea', 'ocean', 53, 66, 10, 30],
  ['Hudson Bay', 'ocean', 51, 66, -95, -76],
  ['the Sea of Okhotsk', 'ocean', 44, 62, 135, 160],
  ['the Coral Sea', 'ocean', -25, -8, 145, 165],
  ['the Gulf of Guinea', 'ocean', -5, 6, -10, 10],
  ['the Bering Sea', 'ocean', 52, 66, 162, 180],
  ['the Bering Sea', 'ocean', 52, 66, -180, -157],
];

function oceanName({ lat, lng }: LatLng): string {
  if (lat > 0 && lng > -80 && lng < 0) return 'the Atlantic Ocean';
  if (lat <= 0 && lng > -70 && lng < 20) return 'the Atlantic Ocean';
  if (lng >= 20 && lng < 120 && lat < 25) return 'the Indian Ocean';
  return 'the Pacific Ocean';
}

const inBox = (p: LatLng, latMin: number, latMax: number, lngMin: number, lngMax: number) =>
  p.lat >= latMin && p.lat <= latMax && p.lng >= lngMin && p.lng <= lngMax;

/** The continent or island under a point, or null at sea (gives farmland its regional look). */
export function regionOf(p: LatLng): string | null {
  return landAt(p);
}

function landAt(p: LatLng): string | null {
  for (const [, ring] of WATER_OUTLINES) if (inRing(p.lng, p.lat, ring)) return null;
  for (const [name, ring] of LAND_OUTLINES) {
    if (!inRing(p.lng, p.lat, ring)) continue;
    return name === 'Eurasia' ? (p.lng < 40 && p.lat > 35 ? 'Europe' : 'Asia') : name;
  }
  return null;
}

export function terrainAt(p: LatLng): Overflight {
  const land = landAt(p);
  for (const [name, terrain, a, b, c, d] of REGIONS) {
    if (!inBox(p, a, b, c, d)) continue;
    if (terrain === 'ice') return { terrain, name, point: p };
    // Land scenery only on land, sea names only at sea.
    if ((terrain === 'ocean') === !land) return { terrain, name, point: p };
  }
  if (land) return { terrain: 'farmland', name: land, point: p };
  const water = WATER_OUTLINES.find(([, ring]) => inRing(p.lng, p.lat, ring));
  return { terrain: 'ocean', name: water ? water[0] : oceanName(p), point: p };
}

/** What is below the plane at lesson progress t (0 = departure, 1 = arrival). */
export function overflightAt(origin: LatLng, destination: LatLng, t: number): Overflight {
  return terrainAt(greatCirclePoint(origin, destination, Math.min(1, Math.max(0, t))));
}
