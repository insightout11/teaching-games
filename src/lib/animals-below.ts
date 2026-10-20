import { ANIMAL_MIGRATIONS } from '@/data/world/animal-migrations';
import type { AnimalPoint, AnimalPolygon, MonthRange } from '@/data/world/animal-migrations';
import { REGION_ANIMALS } from '@/data/world/region-animals';
import type { RegionAnimal, RegionAnimals } from '@/data/world/region-animals';

type Point = AnimalPoint | { readonly lng: number; readonly lat: number };
type Vector = readonly [number, number, number];
const EARTH_KM = 6371.0088;
const RAD = Math.PI / 180;

function coordinate(point: Point): AnimalPoint {
  return 'lng' in point ? [point.lng, point.lat] : point;
}

function validPoint(point: AnimalPoint): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
    point[0] >= -180 && point[0] <= 180 && point[1] >= -90 && point[1] <= 90;
}

function vector(point: AnimalPoint): Vector {
  const lat = point[1] * RAD;
  const lng = point[0] * RAD;
  return [Math.cos(lat) * Math.cos(lng), Math.cos(lat) * Math.sin(lng), Math.sin(lat)];
}
function dot(a: Vector, b: Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a: Vector, b: Vector): Vector {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a: Vector): number { return Math.sqrt(dot(a, a)); }
function angle(a: Vector, b: Vector): number { return Math.atan2(norm(cross(a, b)), dot(a, b)); }

/** Minimum angular distance to the short great-circle arc, including its endpoints. */
function edgeDistance(p: Vector, a: Vector, b: Vector): number {
  const normal = cross(a, b);
  const length = norm(normal);
  const endDistance = Math.min(angle(p, a), angle(p, b));
  if (length < 1e-14) return endDistance;
  const n: Vector = [normal[0] / length, normal[1] / length, normal[2] / length];
  const height = dot(p, n);
  const projection: Vector = [p[0] - height * n[0], p[1] - height * n[1], p[2] - height * n[2]];
  const size = norm(projection);
  if (size < 1e-14) return endDistance;
  const foot: Vector = [projection[0] / size, projection[1] / size, projection[2] / size];
  if (angle(a, foot) + angle(foot, b) <= angle(a, b) + 1e-10) {
    return Math.min(endDistance, angle(p, foot));
  }
  return endDistance;
}

/** Closed outer rings, without holes, each confined to less than a hemisphere.
 * Spherical winding and short great-circle edges handle the date line and poles.
 * The centre-facing guard excludes the antipodal complement of a small ring.
 */
export function distanceToAnimalAreaKm(point: Point, polygons: readonly AnimalPolygon[]): number {
  const coord = coordinate(point);
  if (!validPoint(coord)) return Infinity;
  const p = vector(coord);
  let nearest = Infinity;
  polygons.forEach((polygon) => {
    if (polygon.length < 4 || polygon.some((vertex) => !validPoint(vertex))) return;
    let winding = 0;
    let centroidDot = 0;
    let boundary = Infinity;
    for (let i = 0; i < polygon.length - 1; i += 1) {
      const a = vector(polygon[i]);
      const b = vector(polygon[i + 1]);
      centroidDot += dot(p, a);
      winding += Math.atan2(dot(p, cross(a, b)), dot(a, b) - dot(p, a) * dot(p, b));
      boundary = Math.min(boundary, edgeDistance(p, a, b));
    }
    const inside = centroidDot > 0 && Math.abs(winding) > Math.PI;
    nearest = Math.min(nearest, inside || boundary < 1e-10 ? 0 : boundary * EARTH_KM);
  });
  return nearest;
}

/** Inclusive month ranges, including December–February as { start: 12, end: 2 }. */
export function monthInSeason(month: number, seasons: readonly MonthRange[]): boolean {
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  return seasons.some(({ start, end }) => start <= end
    ? month >= start && month <= end
    : month >= start || month <= end);
}

/** Seasonal habitat matches, not live observations. km is distance to area, not centre.
 * Uses UTC month so all classrooms receive the same result for the same instant.
 * Invalid coordinates, dates and negative/non-finite radii return no matches.
 */
export function migrationsNear(point: Point, date: Date, km: number) {
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(km) || km < 0 || !validPoint(coordinate(point))) return [];
  const month = date.getUTCMonth() + 1;
  return ANIMAL_MIGRATIONS.filter((migration) => monthInSeason(month, migration.months) &&
    distanceToAnimalAreaKm(point, migration.polygons) <= km);
}

export function normalizeAnimalPlace(name: string): string {
  return name.trim().toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ');
}

const places: Record<string, RegionAnimals> = Object.create(null);
REGION_ANIMALS.forEach((region) => {
  [region.name].concat(Array.from(region.aliases)).forEach((alias) => {
    const key = normalizeAnimalPlace(alias);
    if (places[key] && places[key] !== region) throw new Error(`Animal place alias collision: ${alias}`);
    places[key] = region;
  });
});

/** Exact names and aliases only; no substring or fuzzy guesses. Read scope for context. */
export function animalRegionOf(placeName: string): RegionAnimals | undefined {
  return places[normalizeAnimalPlace(placeName)];
}

/** Resident examples. Call animalRegionOf as well when displaying habitat qualifications. */
export function animalsOf(placeName: string): readonly RegionAnimal[] {
  return animalRegionOf(placeName)?.animals ?? [];
}
