import type { DestinationPack } from '@/lib/world-flight/types';

export type LngLat = [number, number];

export type WorldLineFeature = {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: 'LineString'; coordinates: LngLat[] };
};

export type WorldPolygonFeature = {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: 'Polygon'; coordinates: LngLat[][] };
};

export type WorldPointFeature = {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: 'Point'; coordinates: LngLat };
};

export type WorldFeature = WorldLineFeature | WorldPolygonFeature | WorldPointFeature;

export type WorldFeatureCollection = {
  type: 'FeatureCollection';
  features: WorldFeature[];
};

const EARTH_RADIUS_KM = 6371.0088;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function toRad(value: number) {
  return value * DEG_TO_RAD;
}

function toDeg(value: number) {
  return value * RAD_TO_DEG;
}

function normalizeLng(lng: number) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

export function destinationCoord(destination: DestinationPack): LngLat {
  return [destination.lng, destination.lat];
}

export function distanceBetweenCoordsKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceKm(a: DestinationPack, b: DestinationPack) {
  return distanceBetweenCoordsKm(a, b);
}

export function formatDistance(km: number) {
  return `${Math.round(km).toLocaleString()} km`;
}

export function destinationsWithinRange<T extends DestinationPack>(
  origin: DestinationPack,
  destinations: T[],
  radiusKm: number,
) {
  return destinations
    .filter((destination) => destination.id !== origin.id)
    .map((destination) => ({ destination, distanceKm: distanceKm(origin, destination) }))
    .filter((candidate) => candidate.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function greatCircleLine(origin: DestinationPack, destination: DestinationPack, steps = 72): WorldLineFeature {
  const lat1 = toRad(origin.lat);
  const lon1 = toRad(origin.lng);
  const lat2 = toRad(destination.lat);
  const lon2 = toRad(destination.lng);
  const delta = distanceKm(origin, destination) / EARTH_RADIUS_KM;

  if (delta === 0) {
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [destinationCoord(origin), destinationCoord(destination)] },
    };
  }

  const coordinates: LngLat[] = [];
  let previousLng = origin.lng;
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    const a = Math.sin((1 - f) * delta) / Math.sin(delta);
    const b = Math.sin(f * delta) / Math.sin(delta);
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    let lng = normalizeLng(toDeg(lon));

    // Keep a route continuous when its shortest path crosses the date line.
    while (lng - previousLng > 180) lng -= 360;
    while (lng - previousLng < -180) lng += 360;

    coordinates.push([lng, toDeg(lat)]);
    previousLng = lng;
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };
}

export function rangePolygon(origin: DestinationPack, radiusKm: number, steps = 96): WorldPolygonFeature {
  const lat1 = toRad(origin.lat);
  const lon1 = toRad(origin.lng);
  const angularDistance = radiusKm / EARTH_RADIUS_KM;
  const coordinates: LngLat[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const bearing = toRad((360 * i) / steps);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );
    coordinates.push([normalizeLng(toDeg(lon2)), toDeg(lat2)]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coordinates] },
  };
}

export function rangeRing(origin: DestinationPack, radiusKm: number, steps = 128): WorldLineFeature {
  const lat1 = toRad(origin.lat);
  const lon1 = toRad(origin.lng);
  const angularDistance = radiusKm / EARTH_RADIUS_KM;
  const coordinates: LngLat[] = [];
  let previousLng = origin.lng;

  for (let i = 0; i <= steps; i += 1) {
    const bearing = toRad((360 * i) / steps);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );
    let lng = normalizeLng(toDeg(lon2));

    // A date-line or polar range ring must stay continuous in the projected
    // map. Unwrapped longitudes prevent MapLibre from drawing a chord across
    // the world between independently normalized points.
    while (lng - previousLng > 180) lng -= 360;
    while (lng - previousLng < -180) lng += 360;

    coordinates.push([lng, toDeg(lat2)]);
    previousLng = lng;
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };
}
