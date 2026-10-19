/** Small dependency-free polygon helpers, shared by offline builds and lookups. */
export type Position = [number, number];
export type RegionPolygon = Position[][];

export function unwrapRing(ring: Position[]): Position[] {
  const result: Position[] = [];
  for (const [lng, lat] of ring) {
    let x = lng;
    if (result.length) {
      const previous = result[result.length - 1][0];
      while (x - previous > 180) x -= 360;
      while (x - previous < -180) x += 360;
    }
    result.push([x, lat]);
  }
  return result;
}

function inRing(lng: number, lat: number, ring: Position[]): boolean {
  if (ring.length < 4) return false;
  const points = unwrapRing(ring);
  const x = lng + 360 * Math.round((points[0][0] - lng) / 360);
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [a, b] = points[i], [c, d] = points[j];
    if ((b > lat) !== (d > lat) && x < (c - a) * (lat - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}

export function inPolygon(lng: number, lat: number, polygon: RegionPolygon): boolean {
  return !!polygon.length && inRing(lng, lat, polygon[0]) && !polygon.slice(1).some(ring => inRing(lng, lat, ring));
}

/** Spherical area in square kilometres, accounting for holes and the date line. */
export function polygonArea(polygon: RegionPolygon): number {
  const rad = Math.PI / 180;
  const areas = polygon.map(ring => {
    const p = unwrapRing(ring);
    let sum = 0;
    for (let i = 1; i < p.length; i++) sum += (p[i][0] - p[i - 1][0]) * rad * (2 + Math.sin(p[i][1] * rad) + Math.sin(p[i - 1][1] * rad));
    return Math.abs(sum) * 6371 * 6371 / 2;
  });
  return Math.max(0, (areas[0] || 0) - areas.slice(1).reduce((sum, a) => sum + a, 0));
}
