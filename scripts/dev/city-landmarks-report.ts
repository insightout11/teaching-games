/** Run: pnpm exec tsx --tsconfig tsconfig.json scripts/dev/city-landmarks-report.ts
 * Static great-circle reach, not a promise of visibility, weather or a classroom result.
 */
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { LANDMARK_CATALOG, type Landmark } from '@/data/world/landmark-catalog';
import { drawnLandmarkNear, landmarksAhead } from '@/lib/live-room/landmarks-ahead';

type Position = { lat: number; lng: number };
type City = Position & { id: string; city: string };
export const REACH_KM = 150;

export function greatCircleKm(a: Position, b: Position): number {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLng = (b.lng - a.lng) * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}

/** Probe the existing drawing filter, without duplicating its private DRAWN map.
 * A synthetic position places each shape directly ahead, within its view limits.
 */
export function shapeIsDrawn(landmark: Landmark): boolean {
  return landmarksAhead({ lat: 0, lng: 0 }, 0, [{ ...landmark, lat: 0.5, lng: 0 }]).length > 0;
}

export function cityLandmarksReport(cities: readonly City[] = WORLD_DESTINATIONS, catalog: readonly Landmark[] = LANDMARK_CATALOG) {
  return cities.map(city => ({
    city,
    landmarks: catalog.map(landmark => ({ landmark, distanceKm: greatCircleKm(city, landmark), drawn: shapeIsDrawn(landmark) }))
      .filter(entry => entry.distanceKm <= REACH_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm || a.landmark.id.localeCompare(b.landmark.id, 'en')),
    takeOffLandmark: drawnLandmarkNear(city, 0, REACH_KM, catalog),
  }));
}

export function renderCityLandmarksReport(report = cityLandmarksReport()): string {
  const rows: string[] = [];
  const cell = (value: string) => value.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
  report.forEach(({ city, landmarks }) => {
    if (!landmarks.length) rows.push(`| ${cell(city.city)} (${city.id}) | none | — | — | — | — |`);
    landmarks.forEach(({ landmark, distanceKm, drawn }) => {
      const takeOff = drawnLandmarkNear(city, 0, REACH_KM, [landmark]) !== null;
      rows.push(`| ${cell(city.city)} (${city.id}) | ${cell(landmark.name)} | ${landmark.shape} | ${distanceKm.toFixed(1)} | ${drawn ? 'yes' : 'no'} | ${takeOff ? 'yes' : 'no'} |`);
    });
  });
  const noneDrawn = report.filter(row => !row.landmarks.some(entry => entry.drawn)).map(row => row.city.city);
  const noneTakeOff = report.filter(row => !row.takeOffLandmark).map(row => row.city.city);
  return [
    '# City landmark reach (150 km)',
    '',
    'Distances use a 6,371 km spherical Earth, city destination coordinates and catalogue coordinates. Inclusion uses unrounded distance, <= 150 km. Rows follow destination order; landmarks are nearest first.',
    'Drawn follows the existing landmarksAhead filter. City take-off follows drawnLandmarkNear, which excludes Niagara. Neither is a visibility guarantee.',
    '',
    '| City (destination id) | Landmark | Shape | Distance km | Drawn | City take-off |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...rows,
    '',
    'Cities with no drawn shape in reach:',
    noneDrawn.join(', ') || 'none',
    '',
    'Cities with no eligible city take-off landmark in reach:',
    noneTakeOff.join(', ') || 'none',
    '',
  ].join('\n');
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/city-landmarks-report.ts')) console.log(renderCityLandmarksReport());
