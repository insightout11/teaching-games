import { elevationAt, loadElevation } from './elevation';
import { snowlineM, type HighGround } from './elevation-ahead';
import { smoothCoastRing, groundMixAt, type CoastStrip } from './coast-strip';
import { greatCirclePoint, type LatLng } from './route-terrain';

/** Metres of real elevation to the flight's existing 400-world-units/km frame. */
export const HEIGHT_UNITS = 0.4;
export interface SurfaceGrid {
  ahead0: number; side0: number; step: number; rows: number; cols: number;
  height: Float32Array; snowline: Float32Array;
  /** Four normalized material weights at each vertex, rather than nearest-cell colour changes. */
  materials: string[]; kinds: Uint16Array; weights: Float32Array;
  max: Float32Array; blockCols: number;
}
export interface SurfaceTexture { pixels: Uint8ClampedArray; size: number; worldSize: number; mean: number[] }
export type SurfaceTextures = Map<string, SurfaceTexture>;

/** Direction to the actual sun/moon in the plane's right/forward/up axes. */
export function surfaceLightDirection(azimuth: number, elevation: number, heading: number): [number, number, number] {
  const r = Math.PI / 180, angle = (azimuth - heading) * r, height = elevation * r;
  return [Math.sin(angle) * Math.cos(height), Math.cos(angle) * Math.cos(height), Math.sin(height)];
}

function bearing(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180, d = (b.lng - a.lng) * r;
  return Math.atan2(Math.sin(d) * Math.cos(b.lat * r), Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos(d));
}
function offset(p: LatLng, heading: number, km: number): LatLng {
  const r = Math.PI / 180, d = km / 6371, a = p.lat * r, b = p.lng * r;
  const lat = Math.asin(Math.sin(a) * Math.cos(d) + Math.cos(a) * Math.sin(d) * Math.cos(heading));
  const lng = b + Math.atan2(Math.sin(heading) * Math.sin(d) * Math.cos(a), Math.cos(d) - Math.sin(a) * Math.sin(lat));
  return { lat: lat / r, lng: lng / r };
}

/** Inverse of the coast strip's along/cross-track frame, including beyond either endpoint. */
export function surfacePoint(from: LatLng, to: LatLng, km: number, side: number, length: number): LatLng {
  const t = km / Math.max(1, length), at = greatCirclePoint(from, to, t);
  const next = greatCirclePoint(from, to, t + 0.0001);
  return offset(at, bearing(at, next) + Math.PI / 2, side);
}

function indexMax(g: SurfaceGrid) {
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    const block = Math.floor(r / 8) * g.blockCols + Math.floor(c / 8);
    g.max[block] = Math.max(g.max[block], g.height[r * g.cols + c]);
  }
  return g;
}
function emptyGrid(ahead0: number, side0: number, step: number, rows: number, cols: number): SurfaceGrid {
  const n = rows * cols, blockCols = Math.ceil(cols / 8);
  return { ahead0, side0, step, rows, cols, height: new Float32Array(n), snowline: new Float32Array(n),
    kinds: new Uint16Array(n * 4), weights: new Float32Array(n * 4), materials: [],
    max: new Float32Array(Math.ceil(rows / 8) * blockCols), blockCols };
}

const cache = new WeakMap<CoastStrip, Promise<SurfaceGrid | null>>();
/** Reuse the bundled ETOPO elevation; no network, invented peaks, or change to the flight clock. */
export function loadSurfaceGrid(strip: CoastStrip): Promise<SurfaceGrid | null> {
  const cached = cache.get(strip); if (cached) return cached;
  const pending = (async () => {
    if (!strip.origin || !strip.destination) return null;
    await loadElevation();
    return buildSurfaceGrid(strip, elevationAt);
  })();
  cache.set(strip, pending); return pending;
}

/** The 4 km mesh resamples (does not add detail to) the roughly 50 km source data. */
export function buildSurfaceGrid(strip: CoastStrip, elevation: (p: LatLng) => number): SurfaceGrid {
  if (!strip.origin || !strip.destination) throw new Error('Surface route has no coordinates');
  const g = emptyGrid(-200, -220, 4, Math.ceil((strip.routeKm + 400) / 4) + 1, 111);
  const land = new Uint8Array(g.height.length), distance = new Float32Array(g.height.length);
  const materials = new Map<string, number>();
  const landRings = strip.land.map(smoothCoastRing);
  for (let r = 0; r < g.rows; r++) {
    const along = g.ahead0 + r * g.step;
    const crossings: number[] = [];
    for (const ring of landRings) for (let k = 0; k < ring.length; k++) {
      const [a, x] = ring[k], [b, y] = ring[(k + 1) % ring.length];
      if ((a <= along && along < b) || (b <= along && along < a)) crossings.push(x + (along - a) * (y - x) / (b - a));
    }
    crossings.sort((a, b) => a - b);
    let crossing = 0;
    for (let c = 0; c < g.cols; c++) {
      const side = g.side0 + c * g.step, i = r * g.cols + c;
      while (crossing < crossings.length && crossings[crossing] < side) crossing++;
      land[i] = crossing % 2;
      // Entirely inland views can have no coastline rings in the bounded strip. The loaded elevation map
      // still describes that land; absence of a nearby shore must not erase the Alps or Tibetan Plateau.
      let p: LatLng | null = null;
      if (!strip.land.length) {
        p = surfacePoint(strip.origin, strip.destination, along, side, strip.routeKm);
        land[i] = elevation(p) > 0 ? 1 : 0;
      }
      distance[i] = land[i] ? 1000 : 0;
      if (!land[i]) continue;
      p ??= surfacePoint(strip.origin, strip.destination, along, side, strip.routeKm);
      g.height[i] = Math.max(0, elevation(p)); g.snowline[i] = snowlineM(p.lat);
      const mix = groundMixAt(strip, along, side);
      mix.slice(0, 4).forEach((cell, k) => {
        const key = `${cell.terrain}|${cell.region}`;
        let id = materials.get(key);
        if (id === undefined) { id = materials.size; materials.set(key, id); g.materials.push(key); }
        g.kinds[i * 4 + k] = id; g.weights[i * 4 + k] = cell.weight;
      });
    }
  }
  // Fade the real elevation to sea level over the coastal mesh cells. No elevated ocean or vertical shore walls.
  for (const direction of [1, -1]) for (let n = 0; n < land.length; n++) {
    const i = direction === 1 ? n : land.length - 1 - n, r = Math.floor(i / g.cols), c = i % g.cols;
    if (!land[i]) continue;
    const a = c - direction, b = r - direction;
    if (a >= 0 && a < g.cols) distance[i] = Math.min(distance[i], distance[i - direction] + g.step);
    if (b >= 0 && b < g.rows) distance[i] = Math.min(distance[i], distance[i - direction * g.cols] + g.step);
  }
  for (let i = 0; i < land.length; i++) {
    const t = Math.max(0, Math.min(1, (distance[i] - g.step) / 8));
    g.height[i] *= t * t * (3 - 2 * t);
  }
  return indexMax(g);
}

/** Existing locally loaded high-ground data remains usable when no whole-route strip is available. */
export function surfaceFromHighGround(h: HighGround): SurfaceGrid {
  const g = emptyGrid(h.ahead0, h.side0, h.step, h.rows, h.cols);
  g.height.set(h.height);
  for (let i = 0; i < h.height.length; i++) g.snowline[i] = h.snow[i] ? h.height[i] - 100 : 10000;
  return indexMax(g);
}

export function sampleHeight(g: SurfaceGrid, ahead: number, side: number): number {
  const r = (ahead - g.ahead0) / g.step, c = (side - g.side0) / g.step;
  if (r < 0 || c < 0 || r >= g.rows - 1 || c >= g.cols - 1) return 0;
  const row = Math.floor(r), col = Math.floor(c), fy = r - row, fx = c - col, i = row * g.cols + col;
  return (g.height[i] * (1 - fx) + g.height[i + 1] * fx) * (1 - fy) +
    (g.height[i + g.cols] * (1 - fx) + g.height[i + g.cols + 1] * fx) * fy;
}

export function hasSurfaceRelief(g: SurfaceGrid, ahead: number, reach: number, halfWidth: number): boolean {
  const r0 = Math.max(0, Math.floor((ahead - g.ahead0) / (g.step * 8)));
  const r1 = Math.min(Math.ceil(g.rows / 8) - 1, Math.floor((ahead + reach - g.ahead0) / (g.step * 8)));
  const c0 = Math.max(0, Math.floor((-halfWidth - g.side0) / (g.step * 8)));
  const c1 = Math.min(g.blockCols - 1, Math.floor((halfWidth - g.side0) / (g.step * 8)));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (g.max[r * g.blockCols + c] > 200) return true;
  return false;
}

/** A disposable CPU copy, never a read from a live CanvasPattern source. */
export function copySurfaceTexture(source: HTMLCanvasElement): SurfaceTexture | null {
  const probe = document.createElement('canvas'); probe.width = probe.height = 64;
  const ctx = probe.getContext('2d', { willReadFrequently: true }); if (!ctx) return null;
  ctx.drawImage(source, 0, 0, 64, 64);
  const pixels = ctx.getImageData(0, 0, 64, 64).data, mean = [0, 0, 0];
  for (let i = 0; i < pixels.length; i += 4) for (let k = 0; k < 3; k++) mean[k] += pixels[i + k] / (64 * 64);
  return { pixels, size: 64, worldSize: source.width * 14, mean };
}

export interface SurfaceView {
  width: number; height: number; horizon: number; focal: number; cameraHeight: number;
  /** Along coordinate of the camera and world units per geographic km; both use the existing one-clock frame. */
  ahead: number; alongScale: number; sideScale: number; textureZ: number;
  far: number; near: number; sunX: number; sunY: number; dark: boolean;
  sunDirection?: [number, number, number];
  haze: number[]; fallback: number[]; snow: number[]; cloudCover: number; seconds: number;
}

/** Front-to-back voxel-space columns. The caller uploads only this reduced-resolution result. */
export function drawSurface(g: SurfaceGrid, textures: SurfaceTextures, view: SurfaceView, pixels: Uint8ClampedArray, depth: Float32Array): number {
  const { width: w, height: h, horizon, focal, cameraHeight, far, near } = view;
  pixels.fill(0); depth.fill(Infinity);
  const materials = g.materials.map(key => textures.get(key));
  const snowTexture = textures.get('__snow');
  const sunUp = Math.max(0.05, view.sunDirection?.[2] ?? 1 - view.sunY);
  const sunSide = view.sunDirection?.[0] ?? (view.sunX - 0.5) * 1.5, sunAhead = view.sunDirection?.[1] ?? 0.4;
  const lightLength = Math.hypot(sunSide, sunAhead, sunUp);
  let drawn = 0;
  for (let x = 0; x < w; x++) {
    let top = h;
    for (let z = near; z < far && top > 0; z += Math.max(90, z * 0.027)) {
      const worldX = (x + 0.5 - w / 2) * z / focal;
      const ahead = view.ahead + z / view.alongScale, side = worldX / view.sideScale;
      const r = (ahead - g.ahead0) / g.step, c = (side - g.side0) / g.step;
      if (r < 1 || c < 1 || r >= g.rows - 2 || c >= g.cols - 2) continue;
      const row = Math.floor(r), col = Math.floor(c), fy = r - row, fx = c - col, i = row * g.cols + col;
      const h0 = g.height[i] * (1 - fx) + g.height[i + 1] * fx;
      const h1 = g.height[i + g.cols] * (1 - fx) + g.height[i + g.cols + 1] * fx;
      const heightM = h0 * (1 - fy) + h1 * fy;
      const y = Math.max(0, Math.floor(horizon + (cameraHeight - heightM * HEIGHT_UNITS) * focal / z));
      if (y >= top) continue;
      if (heightM < 2) {
        // Near sea/flat ground occludes distant relief too. Keep its existing coast/sea pixels underneath.
        for (let yy = y; yy < top; yy++) depth[yy * w + x] = z;
        top = y; continue;
      }
      const dx = ((g.height[i + 1] - g.height[i]) * (1 - fy) + (g.height[i + g.cols + 1] - g.height[i + g.cols]) * fy) / (g.step * 1000);
      const dz = (h1 - h0) / (g.step * 1000);
      // The source averages slopes over ~50 km. Enhance normals, not heights, to keep those real ridges legible.
      const illumination = (-dx * 6 * sunSide - dz * 6 * sunAhead + sunUp) / (Math.hypot(dx * 6, dz * 6, 1) * lightLength);
      const cloud = 1 - view.cloudCover / 100 * 0.15 * (0.5 + 0.5 * Math.sin(ahead * 0.15 + side * 0.2));
      const light = (view.dark ? 0.38 : 0.55 + Math.max(0, illumination) * 0.55) * cloud;
      let red = 0, green = 0, blue = 0, total = 0;
      const a = i * 4, b = (i + 1) * 4, c0 = (i + g.cols) * 4, d = (i + g.cols + 1) * 4;
      const material = g.kinds[a];
      if (g.weights[a] > 0.999 && g.weights[b] > 0.999 && g.weights[c0] > 0.999 && g.weights[d] > 0.999 &&
          material === g.kinds[b] && material === g.kinds[c0] && material === g.kinds[d]) {
        // Most mountain/plains cells have one material. Sample it once, not at all four grid vertices.
        const tex = materials[material];
        if (tex) {
          const u = Math.floor(worldX * tex.size / tex.worldSize) & 63;
          const v = Math.floor((view.textureZ + z) * tex.size / tex.worldSize) & 63;
          const p = (v * tex.size + u) * 4, detail = Math.min(0.65, 7000 / z);
          red = tex.mean[0] + (tex.pixels[p] - tex.mean[0]) * detail;
          green = tex.mean[1] + (tex.pixels[p + 1] - tex.mean[1]) * detail;
          blue = tex.mean[2] + (tex.pixels[p + 2] - tex.mean[2]) * detail;
          total = 1;
        }
      } else {
        // Interpolate the four material mixtures at the surrounding vertices; texture phase stays world-anchored.
        for (let vertex = 0; vertex < 4; vertex++) {
          const at = i + (vertex >= 2 ? g.cols : 0) + vertex % 2;
          const factor = (vertex >= 2 ? fy : 1 - fy) * (vertex % 2 ? fx : 1 - fx);
          for (let k = 0; k < 4; k++) {
            const weight = g.weights[at * 4 + k] * factor; if (weight < 0.005) continue;
            const tex = materials[g.kinds[at * 4 + k]];
            if (!tex) { red += view.fallback[0] * weight; green += view.fallback[1] * weight; blue += view.fallback[2] * weight; }
            else {
              const u = Math.floor(worldX * tex.size / tex.worldSize) & 63;
              const v = Math.floor((view.textureZ + z) * tex.size / tex.worldSize) & 63;
              const p = (v * tex.size + u) * 4;
              // Mip-like distance attenuation keeps field patterns from sparkling at the horizon.
              const detail = Math.min(0.65, 7000 / z);
              red += (tex.mean[0] + (tex.pixels[p] - tex.mean[0]) * detail) * weight;
              green += (tex.mean[1] + (tex.pixels[p + 1] - tex.mean[1]) * detail) * weight;
              blue += (tex.mean[2] + (tex.pixels[p + 2] - tex.mean[2]) * detail) * weight;
            }
            total += weight;
          }
        }
      }
      if (total < 0.01) { red = view.fallback[0]; green = view.fallback[1]; blue = view.fallback[2]; total = 1; }
      const snowline = (g.snowline[i] * (1 - fx) + g.snowline[i + 1] * fx) * (1 - fy) + (g.snowline[i + g.cols] * (1 - fx) + g.snowline[i + g.cols + 1] * fx) * fy;
      const snow = Math.max(0, Math.min(1, (heightM - snowline) / 250));
      let snowRed = view.snow[0], snowGreen = view.snow[1], snowBlue = view.snow[2];
      if (snow > 0 && snowTexture) {
        const u = Math.floor(worldX * 64 / snowTexture.worldSize) & 63;
        const v = Math.floor((view.textureZ + z) * 64 / snowTexture.worldSize) & 63;
        const at = (v * 64 + u) * 4;
        snowRed = snowRed * 0.4 + snowTexture.pixels[at] * 0.6;
        snowGreen = snowGreen * 0.4 + snowTexture.pixels[at + 1] * 0.6;
        snowBlue = snowBlue * 0.4 + snowTexture.pixels[at + 2] * 0.6;
      }
      const fog = Math.min(0.96, Math.pow(z / far, 0.7) * 0.9);
      const rr = ((red / total * (1 - snow) + snowRed * snow) * light) * (1 - fog) + view.haze[0] * fog;
      const gg = ((green / total * (1 - snow) + snowGreen * snow) * light) * (1 - fog) + view.haze[1] * fog;
      const bb = ((blue / total * (1 - snow) + snowBlue * snow) * light) * (1 - fog) + view.haze[2] * fog;
      for (let yy = y; yy < top; yy++) {
        const cell = yy * w + x, p = cell * 4;
        pixels[p] = rr; pixels[p + 1] = gg; pixels[p + 2] = bb; pixels[p + 3] = 255; depth[cell] = z;
      }
      drawn += top - y; top = y;
    }
  }
  return drawn;
}
