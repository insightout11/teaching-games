import { shadeSurfaceSample } from './terrain-shading';
import { beginMaterialCoverage, filterMaterialCoverage } from './terrain-materials';
import { mountainClimateAt } from './land-cover';
import { beginTerrainEdges, recordTerrainEdge, coverTerrainEdges } from './terrain-edges';
import { elevationAt, loadElevation } from './elevation';
import { loadTerrarium } from './terrarium';
import { sharpenTerrainSummits } from './terrain-landmarks';
import { clampElevationSpikes, medianElevation, mountainSnowline, contourElevation, CONTOUR_SCALE, interiorSample, terrainHeight, terrainGradient, TERRAIN_GAIN, snowlineVariation } from './terrain-filter';
import { snowlineM, type HighGround } from './elevation-ahead';
import { smoothCoastRing, groundMixAt, type CoastStrip } from './coast-strip';
import { greatCirclePoint, type LatLng } from './route-terrain';

/** Metres of real elevation to the flight's existing 400-world-units/km frame. */
export const HEIGHT_UNITS = 0.4;
/** Cruise/descent datum plus clearance above the highest height in the forward view. */
export function surfaceCameraHeight(baseHeight: number, groundHeight: number, altitude: number): number {
  return Math.max(baseHeight, groundHeight + 1100 * Math.max(0.15, Math.min(1, altitude)));
}
export function easeSurfaceHeight(current: number, target: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, dt) / 1.8));
}
/** A route-wide bound keeps the display scale continuous as new peaks enter the forward envelope. */
export function safeExaggeration(camera: number, routePeak: number, altitude: number): number {
  return Math.max(0, Math.min(TERRAIN_GAIN, (camera - 1100 * Math.max(0.15, altitude)) / Math.max(1, terrainHeight(routePeak, 1) * HEIGHT_UNITS)));
}
export interface SurfaceGrid {
  ahead0: number; side0: number; step: number; rows: number; cols: number;
  height: Float32Array; snowline: Float32Array;
  /** Unmodified source metres for snow; conservative median reference for the farthest skyline. */
  trueHeight?: Float32Array; distanceHeight?: [Float32Array, Float32Array];
  contourHeight?: Float32Array;
  /** Alpine material coordinates follow the contour field, but retain unshaped source metres. */
  snowContour?: Float32Array;
  climateDryness?: Float32Array; snowSlope?: Float32Array;
  source?: 'terrarium' | 'mixed' | 'coarse'; tiles?: number; failedTiles?: number;
  /** Four normalized material weights at each vertex, rather than nearest-cell colour changes. */
  materials: string[]; kinds: Uint16Array; weights: Float32Array;
  max: Float32Array; blockCols: number; peak?: number; slopeX?: Float32Array; slopeZ?: Float32Array;
  /** Take-off caches: linear differential fields and an upper bound over every contour sample in a cell. */
  curvature?: Float32Array; ceiling?: Float32Array; contourCeiling?: Float32Array; snowPossible?: Uint8Array;
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
  g.max.fill(0);
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    const block = Math.floor(r / 8) * g.blockCols + Math.floor(c / 8);
    g.max[block] = Math.max(g.max[block], g.height[r * g.cols + c]);
  }
  g.slopeX = new Float32Array(g.height.length); g.slopeZ = new Float32Array(g.height.length); g.curvature = new Float32Array(g.height.length);
  for (let r = 1; r < g.rows - 1; r++) for (let c = 1; c < g.cols - 1; c++) {
    const i = r * g.cols + c;
    g.slopeX[i] = (g.height[i + 1] - g.height[i - 1]) / (g.step * 2000);
    g.slopeZ[i] = (g.height[i + g.cols] - g.height[i - g.cols]) / (g.step * 2000);
    g.curvature[i] = 4 * g.height[i] - g.height[i + 1] - g.height[i - 1] - g.height[i + g.cols] - g.height[i - g.cols];
  }
  g.peak = g.max.reduce((a, b) => Math.max(a, b), 0);
  g.distanceHeight = [g.height, medianElevation(g.height, g.rows, g.cols)];
  g.contourHeight = contourElevation(g.height, g.rows, g.cols);
  // A bilinear sample cannot exceed its four corners. Include ALL cached sub-cell corners
  // and both distant-field corners; this also bounds their LOD blend, without assuming that
  // contour interpolation stays below the four original elevations.
  g.ceiling = new Float32Array(g.height.length);
  g.contourCeiling = new Float32Array(g.contourHeight.length);
  g.snowPossible = new Uint8Array(g.height.length);
  const wide = (g.cols - 1) * CONTOUR_SCALE + 1, distant = g.distanceHeight[1];
  for (let r = 0; r < g.rows - 1; r++) for (let c = 0; c < g.cols - 1; c++) {
    const i = r * g.cols + c;
    let upper = Math.max(distant[i], distant[i + 1], distant[i + g.cols], distant[i + g.cols + 1]);
    for (let y = 0; y <= CONTOUR_SCALE; y++) for (let x = 0; x <= CONTOUR_SCALE; x++)
      upper = Math.max(upper, g.contourHeight[(r * CONTOUR_SCALE + y) * wide + c * CONTOUR_SCALE + x]);
    // Round UP in the same monotone display lookup used below, including Float32 storage error.
    const source = g.trueHeight ?? g.height;
    const snowHeight = Math.max(source[i], source[i + 1], source[i + g.cols], source[i + g.cols + 1]);
    const line = Math.min(g.snowline[i], g.snowline[i + 1], g.snowline[i + g.cols], g.snowline[i + g.cols + 1]);
    g.snowPossible[i] = snowHeight >= line - 160 ? 1 : 0;
    g.ceiling[i] = displayHeight[Math.min(displayHeight.length - 1, Math.ceil(upper / 4))] + 0.125;
  }
  for (let y = 0; y < (g.rows - 1) * CONTOUR_SCALE; y++) for (let x = 0; x < wide - 1; x++) {
    const i = y * wide + x, values = g.contourHeight;
    const upper = Math.max(values[i], values[i + 1], values[i + wide], values[i + wide + 1]);
    g.contourCeiling[i] = displayHeight[Math.min(displayHeight.length - 1, Math.ceil(upper / 4))] + 0.125;
  }
  if (g.snowSlope?.some(slope => slope > 0.7))
    g.snowContour = contourElevation(g.trueHeight ?? g.height, g.rows, g.cols);
  return g;
}

function smoothElevation(g: SurfaceGrid): SurfaceGrid {
  g.trueHeight = g.height.slice();
  g.height = clampElevationSpikes(g.height, g.rows, g.cols, 180 * g.step);
  return indexMax(g);
}
function emptyGrid(ahead0: number, side0: number, step: number, rows: number, cols: number): SurfaceGrid {
  const n = rows * cols, blockCols = Math.ceil(cols / 8);
  return { ahead0, side0, step, rows, cols, height: new Float32Array(n), snowline: new Float32Array(n),
    kinds: new Uint16Array(n * 4), weights: new Float32Array(n * 4), materials: [],
    max: new Float32Array(Math.ceil(rows / 8) * blockCols), blockCols };
}

const cache = new WeakMap<CoastStrip, Promise<SurfaceGrid | null>>();
/** Load the sharper route band once at take-off; bundled elevation is an explicit offline fallback. */
export function loadSurfaceGrid(strip: CoastStrip, signal?: AbortSignal, options: { fresh?: boolean } = {}): Promise<SurfaceGrid | null> {
  const cached = !signal && !options.fresh && cache.get(strip); if (cached) return cached;
  const pending = (async () => {
    if (!strip.origin || !strip.destination) return null;
    await loadElevation();
    const from = strip.origin, to = strip.destination;
    function* band() {
      for (let a = -40; a <= strip.routeKm + 200; a += 12) for (let s = -160; s <= 160; s += 12)
        yield surfacePoint(from!, to!, a, s, strip.routeKm);
    }
    signal?.throwIfAborted();
    const tiles = await loadTerrarium(band(), signal);
    signal?.throwIfAborted();
    let missing = 0;
    const grid = buildSurfaceGrid(strip, p => {
      const height = tiles.sample(p);
      if (height === null) { missing++; return elevationAt(p); }
      return height;
    }, { step: 1, halfWidth: 160, behind: 40, beyond: 200 });
    grid.source = tiles.count === 0 ? 'coarse' : missing ? 'mixed' : 'terrarium';
    grid.tiles = tiles.count; grid.failedTiles = tiles.failed;
    sharpenTerrainSummits(grid, from!, to!, strip.routeKm);
    return indexMax(grid);
  })();
  if (!signal) {
    cache.set(strip, pending);
    // A failed load must not stick to the route: a later call (or retry) tries again.
    pending.catch(() => { if (cache.get(strip) === pending) cache.delete(strip); });
  }
  return pending;
}

/** A regular route mesh preserves source metres; exaggeration belongs to the view, never snow altitude. */
export function buildSurfaceGrid(strip: CoastStrip, elevation: (p: LatLng) => number,
  options = { step: 4, halfWidth: 220, behind: 200, beyond: 200 }): SurfaceGrid {
  if (!strip.origin || !strip.destination) throw new Error('Surface route has no coordinates');
  const { step, halfWidth, behind, beyond } = options;
  const g = emptyGrid(-behind, -halfWidth, step, Math.ceil((strip.routeKm + behind + beyond) / step) + 1, Math.ceil(halfWidth * 2 / step) + 1);
  g.climateDryness = new Float32Array(g.height.length); g.snowSlope = new Float32Array(g.height.length).fill(0.6);
  const plateau = new Float32Array(g.height.length);
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
      const regionalSnow = mountainSnowline(p.lat, p.lng);
      g.climateDryness[i] = mountainClimateAt(p);
      if (p.lat <= 36 && p.lng >= 78 && p.lng <= 100) plateau[i] = smooth01((p.lat - 28.5) / 0.8);
      if (p.lat >= 44 && p.lat <= 49 && p.lng >= 4 && p.lng <= 17) g.snowSlope[i] = 0.8;
      g.height[i] = Math.max(0, elevation(p));
      g.snowline[i] = (regionalSnow ?? snowlineM(p.lat)) + snowlineVariation(along, side) * (regionalSnow === null ? 1 : 0.4);
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
    const t = Math.max(0, Math.min(1, (distance[i] - g.step) / (g.step * 2)));
    g.height[i] *= t * t * (3 - 2 * t);
  }
  // A high plateau is a local climate datum, not a whole snow-capped summit. Raise its snow limit
  // above the broad 32km neighbourhood, leaving Nepal/Everest and the ranges rising above it snowy.
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    const i = r * g.cols + c; if (!land[i] || plateau[i] === 0) continue;
    let total = 0, count = 0;
    const stride = Math.max(1, Math.round(8 / g.step));
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const row = Math.max(0, Math.min(g.rows - 1, r + dr * stride)), col = Math.max(0, Math.min(g.cols - 1, c + dc * stride));
      const j = row * g.cols + col; if (!land[j]) continue;
      total += g.height[j]; count++;
    }
    const limit = count ? total / count + 700 : g.snowline[i];
    g.snowline[i] += Math.max(0, limit - g.snowline[i]) * plateau[i];
  }
  return smoothElevation(g);
}

/** Existing locally loaded high-ground data remains usable when no whole-route strip is available. */
export function surfaceFromHighGround(h: HighGround): SurfaceGrid {
  const g = emptyGrid(h.ahead0, h.side0, h.step, h.rows, h.cols);
  g.height.set(h.height);
  for (let i = 0; i < h.height.length; i++) g.snowline[i] = (h.snow[i] ? h.height[i] - 100 : 10000) + snowlineVariation(g.ahead0 + Math.floor(i / g.cols) * g.step, g.side0 + i % g.cols * g.step);
  return smoothElevation(g);
}

export function sampleHeight(g: SurfaceGrid, ahead: number, side: number): number {
  const r = (ahead - g.ahead0) / g.step, c = (side - g.side0) / g.step;
  if (r < 0 || c < 0 || r >= g.rows - 1 || c >= g.cols - 1) return 0;
  const row = Math.floor(r), col = Math.floor(c), fy = r - row, fx = c - col, i = row * g.cols + col;
  return (g.height[i] * (1 - fx) + g.height[i + 1] * fx) * (1 - fy) +
    (g.height[i + g.cols] * (1 - fx) + g.height[i + g.cols + 1] * fx) * fy;
}

export function surfacePeakAhead(g: SurfaceGrid, ahead: number, reach: number, halfWidth: number): number {
  const r0 = Math.max(0, Math.floor((ahead - g.ahead0) / (g.step * 8)));
  const r1 = Math.min(Math.ceil(g.rows / 8) - 1, Math.floor((ahead + reach - g.ahead0) / (g.step * 8)));
  const c0 = Math.max(0, Math.floor((-halfWidth - g.side0) / (g.step * 8)));
  const c1 = Math.min(g.blockCols - 1, Math.floor((halfWidth - g.side0) / (g.step * 8)));
  let peak = 0;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) peak = Math.max(peak, g.max[r * g.blockCols + c]);
  return peak;
}

export function hasSurfaceRelief(g: SurfaceGrid, ahead: number, reach: number, halfWidth: number): boolean {
  return surfacePeakAhead(g, ahead, reach, halfWidth) > 200;
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

export function textureChannel(tex: SurfaceTexture, u: number, v: number, channel: number): number {
  const x = Math.floor(u), y = Math.floor(v), fx = u - x, fy = v - y, n = tex.size;
  const a = (((y % n) + n) % n * n + ((x % n) + n) % n) * 4 + channel;
  const b = (((y % n) + n) % n * n + (((x + 1) % n) + n) % n) * 4 + channel;
  const c = (((((y + 1) % n) + n) % n) * n + ((x % n) + n) % n) * 4 + channel;
  const d = (((((y + 1) % n) + n) % n) * n + (((x + 1) % n) + n) % n) * 4 + channel;
  return (tex.pixels[a] * (1 - fx) + tex.pixels[b] * fx) * (1 - fy) + (tex.pixels[c] * (1 - fx) + tex.pixels[d] * fx) * fy;
}

type MaterialSources = Array<SurfaceTexture | undefined>;
const materialSources = (g: SurfaceGrid, textures: SurfaceTextures): MaterialSources =>
  [...g.materials.map(key => textures.get(key)), textures.get('__rock'), textures.get('__forest')];
const sameSources = (a: MaterialSources, b: MaterialSources) => a.length === b.length && a.every((source, i) => source === b[i]);

/** Mix the material colours of vertices [from, to). `textures` must hold the same textures as `sources`. */
function fillAlbedo(g: SurfaceGrid, textures: SurfaceTextures, sources: MaterialSources, fallback: number[], color: Float32Array, from: number, to: number) {
  for (let i = from; i < to; i++) {
    const ahead = g.ahead0 + Math.floor(i / g.cols) * g.step, side = g.side0 + i % g.cols * g.step;
    const dry = g.climateDryness?.[i] ?? 0;
    const height = g.height[i], line = g.snowline[i], treeLine = Math.max(1800, line - 1600);
    const slope = Math.hypot(g.slopeX?.[i] ?? 0, g.slopeZ?.[i] ?? 0);
    let total = 0;
    for (let k = 0; k < 4; k++) {
      const weight = g.weights[i * 4 + k]; if (weight < 0.005) continue;
      const id = g.kinds[i * 4 + k], paintedSnow = /^(mountains|ice)\|/.test(g.materials[id] ?? '');
      // Illustrated mountain/ice tiles carry painted white caps unrelated to this vertex's elevation.
      const green = dry < 0.5 && (height < 2200 || (height < 3000 && slope < 0.3));
      const tex = paintedSnow ? textures.get(green ? '__forest' : '__rock') : sources[id]; total += weight;
      const u = tex ? side * 400 * tex.size / tex.worldSize : 0, v = tex ? ahead * 400 * tex.size / tex.worldSize : 0;
      const stone = tex && paintedSnow && !green ? (textureChannel(tex, u, v, 0) + 2 * textureChannel(tex, u, v, 1) + textureChannel(tex, u, v, 2)) / 4 : 0;
      for (let c = 0; c < 3; c++) color[i * 3 + c] += weight * (tex ? stone > 0 ? stone * [1.04 + dry * 0.2, 1 + dry * 0.06, 0.93 - dry * 0.15][c] : textureChannel(tex, u, v, c) : fallback[c]);
    }
    if (total < 0.01) for (let c = 0; c < 3; c++) color[i * 3 + c] = fallback[c];
    else for (let c = 0; c < 3; c++) color[i * 3 + c] /= total;
    const high = smooth01((height - 2200) / 1100), steep = smooth01((slope - 0.4) / 0.35);
    const rock = Math.max(high * smooth01((slope - 0.12) / 0.45), steep) * 0.85;
    const arid = /desert|salt-flats/.test(g.materials[g.kinds[i * 4]] ?? '');
    const mountainCover = /^(mountains|ice)\|/.test(g.materials[g.kinds[i * 4]] ?? '');
    const forest = arid ? 0 : (mountainCover ? 1 - smooth01(dry / 0.65) : 1) * smooth01((height - 180) / 500) * (1 - smooth01((height - treeLine + 300) / 600)) * (1 - steep) * 0.7;
    for (const [name, weight] of [['__forest', forest], ['__rock', rock]] as const) {
      const tex = textures.get(name); if (!tex || weight < 0.001) continue;
      const u = side * 400 * tex.size / tex.worldSize, v = ahead * 400 * tex.size / tex.worldSize;
      const neutral = name === '__rock' ? (textureChannel(tex, u, v, 0) + 2 * textureChannel(tex, u, v, 1) + textureChannel(tex, u, v, 2)) / 4 : 0;
      const bare = name === '__rock' ? smooth01((height - 1800) / 1400) : 0;
      for (let c = 0; c < 3; c++) {
        const texel = textureChannel(tex, u, v, c), stone = neutral * [1.04, 1, 0.93][c];
        color[i * 3 + c] = color[i * 3 + c] * (1 - weight) + (texel + (stone - texel) * bare) * weight;
      }
    }
    // High bare ground must not inherit orange/purple SVG patches. Preserve luminance/texture, not those hues.
    const bare = high * 0.85 * (1 - dry * 0.6);
    const luminance = (color[i * 3] + 2 * color[i * 3 + 1] + color[i * 3 + 2]) / 4;
    for (let c = 0; c < 3; c++) color[i * 3 + c] += (luminance * [1.04, 1, 0.93][c] - color[i * 3 + c]) * bare;
  }
}

const albedoCache = new WeakMap<SurfaceGrid, { sources: MaterialSources; color: Float32Array }>();
/** Material filtering belongs to take-off/palette preparation, not to every visible ray sample. */
export function prepareSurfaceMaterials(g: SurfaceGrid, textures: SurfaceTextures, fallback: number[]): Float32Array {
  const sources = materialSources(g, textures), old = albedoCache.get(g);
  if (old && sameSources(old.sources, sources)) return old.color;
  const color = new Float32Array(g.height.length * 3);
  fillAlbedo(g, textures, sources, fallback, color, 0, g.height.length);
  albedoCache.set(g, { sources, color }); return color;
}

/**
 * The same colours without a freeze: when the textures change (they arrive in idle time after take-off, and again
 * when the light changes), the whole route is re-mixed in short slices while the previous colours stay on screen.
 * Mixing it in one go took 0.3-0.4 s on a long route. Before the first mix the ground uses the fallback colour.
 */
const progressive = new WeakMap<SurfaceGrid, { sources: MaterialSources; color: Float32Array; job?: { sources: MaterialSources } }>();
export function progressiveSurfaceMaterials(g: SurfaceGrid, textures: SurfaceTextures, fallback: number[]): Float32Array {
  const sources = materialSources(g, textures);
  let state = progressive.get(g);
  if (!state) {
    const flat = new Float32Array(g.height.length * 3);
    for (let i = 0; i < flat.length; i += 3) { flat[i] = fallback[0]; flat[i + 1] = fallback[1]; flat[i + 2] = fallback[2]; }
    state = { sources: [], color: flat };
    progressive.set(g, state);
  }
  if (sameSources(state.sources, sources) || (state.job && sameSources(state.job.sources, sources))) return state.color;
  // Snapshot the textures: the caller's map keeps changing while the slices run.
  const snapshot: SurfaceTextures = new Map(textures);
  const job = { sources }, color = new Float32Array(g.height.length * 3), st = state;
  st.job = job;
  let next = 0;
  const slice = () => {
    if (st.job !== job) return; // superseded by a newer texture set
    const until = performance.now() + 8;
    while (next < g.height.length && performance.now() < until) {
      const to = Math.min(g.height.length, next + 4096);
      fillAlbedo(g, snapshot, sources, fallback, color, next, to);
      next = to;
    }
    if (next < g.height.length) { setTimeout(slice, 0); return; }
    st.sources = sources; st.color = color; st.job = undefined;
  };
  setTimeout(slice, 0);
  return st.color;
}

const smooth01 = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
// The display curve is smooth over metres. A 4m lookup preserves its shape while avoiding repeated
// rational-curve/derivative evaluation for every ray; camera/landmark maths still use the same curve.
const displayHeight = new Float32Array(16385), displayGradient = new Float32Array(16385);
for (let i = 0; i < displayHeight.length; i++) {
  displayHeight[i] = terrainHeight(i * 4, 1); displayGradient[i] = terrainGradient(i * 4, 1);
}
export { surfaceSnow } from './terrain-shading';

export interface SurfaceView {
  width: number; height: number; horizon: number; focal: number; cameraHeight: number;
  /** Along coordinate of the camera and world units per geographic km; both use the existing one-clock frame. */
  ahead: number; alongScale: number; sideScale: number; textureZ: number;
  far: number; near: number; sunX: number; sunY: number; dark: boolean;
  sunDirection?: [number, number, number];
  exaggeration?: number;
  haze: number[]; fallback: number[]; snow: number[]; cloudCover: number; seconds: number;
  /** Re-mix material colours in slices (live flights) instead of all at once when textures change. */
  progressiveMaterials?: boolean;
}

/** Front-to-back voxel-space columns. The caller uploads only this reduced-resolution result. */
export function drawSurface(g: SurfaceGrid, textures: SurfaceTextures, view: SurfaceView, pixels: Uint8ClampedArray, depth: Float32Array): number {
  const { width: w, height: h, horizon, focal, cameraHeight, far, near } = view;
  pixels.fill(0); depth.fill(Infinity);
  const edges = beginTerrainEdges(pixels, w, h);
  const albedo = view.progressiveMaterials ? progressiveSurfaceMaterials(g, textures, view.fallback) : prepareSurfaceMaterials(g, textures, view.fallback);
  const materialCoverage = beginMaterialCoverage(pixels), attributes = materialCoverage.attributes;
  const sunUp = Math.max(0.05, view.sunDirection?.[2] ?? 1 - view.sunY);
  const sunSide = view.sunDirection?.[0] ?? (view.sunX - 0.5) * 1.5, sunAhead = view.sunDirection?.[1] ?? 0.4;
  const lightLength = Math.hypot(sunSide, sunAhead, sunUp);
  const snowWarm = smooth01((0.35 - sunUp) / 0.3);
  const exaggeration = view.exaggeration ?? TERRAIN_GAIN;
  // Geographic planes share all depth-dependent work across columns. No heightfield rebuild during Fly.
  // Cap projected depth spacing too: short routes are stretched along the flight frame, so a fixed
  // geographic step otherwise creates large saw teeth even with a smooth height texture.
  const coarseMarch = Math.min(g.step * 0.5, 200 / view.alongScale), march = coarseMarch / 3;
  const first = Math.ceil((view.ahead + near / view.alongScale) / march) * march;
  const fogRows: number[] = [];
  const planes: Array<{ z: number; projection: number; contribution: number; columnStep: number; ahead: number; row: number; fy: number; contourRow: number; contourFy: number; blend: number; low: Float32Array; high: Float32Array }> = [];
  for (let ahead = first; ; ahead += march) {
    const z = (ahead - view.ahead) * view.alongScale;
    if (z >= far) break;
    const fog = view.dark || sunUp < 0.35 ? Math.min(0.96, 1 - Math.exp(-2.6 * z / far)) : Math.min(0.88, (z / far) ** 0.9 * 0.82);
    const mountainFog = 1 - Math.exp(-1.3 * (Math.max(0, z / far - 0.12) / 0.88) ** 1.8);
    fogRows.push(fog, mountainFog);
    // Geographic lattices do not move with the camera. Supplemental rows join their coarser
    // neighbours continuously over 6,000 depth units, including their colour/depth history.
    const coarse = Math.abs(ahead / coarseMarch - Math.round(ahead / coarseMarch)) < 0.01;
    const farCoarse = Math.abs(ahead / (coarseMarch * 2) - Math.round(ahead / (coarseMarch * 2))) < 0.01;
    const contribution = !coarse ? 1 - smooth01((z - 30000) / 6000) : !farCoarse ? 1 - smooth01((z - 36000) / 6000) : 1;
    if (contribution === 0) continue;
    const r = (ahead - g.ahead0) / g.step;
    if (r < 1 || r >= g.rows - 2) continue;
    const lod = smooth01((z / far - 0.65) / 0.35) * 0.22;
    planes.push({ z, contribution, projection: focal / z, columnStep: z / (focal * view.sideScale * g.step), ahead, row: Math.floor(r), fy: r - Math.floor(r), contourRow: Math.floor(r * CONTOUR_SCALE), contourFy: r * CONTOUR_SCALE - Math.floor(r * CONTOUR_SCALE), blend: lod,
      low: g.height, high: lod === 0 ? g.height : g.distanceHeight?.[1] ?? g.height });
  }
  const contourCols = (g.cols - 1) * CONTOUR_SCALE + 1, skyline = new Float64Array(w).fill(h);
  const shading = { g, view, albedo, displayGradient, sunUp, sunSide, sunAhead, lightLength, snowWarm, exaggeration, contourCols };
  const shaded = new Float64Array(5);
  let drawn = 0;
  const rowColumn = new Float64Array(w), sideColumn = new Float64Array(w), hasSample = new Uint8Array(w);
  const accumulation = edges.accumulation;
  // March all geometric rows, but accumulate world coordinates instead of repeatedly shading
  // sub-pixel slivers. Material/normal evaluation happens once at the final covered pixel.
  for (let plane = 0; plane < planes.length; plane++) {
    const { z, contribution, projection, columnStep, row, fy, contourRow, contourFy, low, high, blend: blendLevel } = planes[plane];
    for (let x = 0; x < w; x++) {
      const top = skyline[x]; if (top <= 0) continue;
      const c = (x + 0.5 - w / 2) * columnStep - g.side0 / g.step;
      if (c < 1 || c >= g.cols - 2) continue;
      const col = Math.floor(c), fx = c - col, i = row * g.cols + col;
      const cc = c * CONTOUR_SCALE, contourCol = Math.floor(cc);
      const ceiling = blendLevel === 0 && g.contourCeiling ? g.contourCeiling[contourRow * contourCols + contourCol] : g.ceiling?.[i];
      if (g.ceiling && ceiling !== undefined && horizon + (cameraHeight - ceiling * exaggeration * HEIGHT_UNITS) * projection >= top) continue;
      const h0 = interiorSample(low, i, g.cols, fx, fy), h1 = low === high ? h0 : interiorSample(high, i, g.cols, fx, fy);
      const contour = g.contourHeight ? interiorSample(g.contourHeight, contourRow * contourCols + contourCol, contourCols, cc - contourCol, contourFy) : h0;
      const heightM = contour + (h1 - contour) * blendLevel;
      const heightIndex = Math.min(displayHeight.length - 2, heightM * 0.25), hi = Math.floor(heightIndex), hf = heightIndex - hi;
      const raised = (displayHeight[hi] + (displayHeight[hi + 1] - displayHeight[hi]) * hf) * exaggeration;
      const projectedY = Math.max(0, horizon + (cameraHeight - raised * HEIGHT_UNITS) * projection);
      if (projectedY >= top) continue;
      const y = top + (projectedY - top) * contribution;
      if (heightM < 2) {
        for (let yy = Math.ceil(y); yy < top; yy++) depth[yy * w + x] = z;
        edges.previous[x] = 0; skyline[x] = y; continue;
      }
      const previousDepth = edges.previous[x], gapThreshold = Math.max(300, previousDepth * 0.045);
      const ridgeStrength = hasSample[x] && previousDepth > 0 ? smooth01(((z - previousDepth) / gapThreshold - 0.6) / 0.8) * (1 - smooth01((previousDepth - 30000) / 6000)) * contribution : 0;
      if (ridgeStrength > 0) recordTerrainEdge(edges, x, top, previousDepth, z, 0, 0, 0, 0, 0, 0, ridgeStrength);
      const span = Math.max(1, top - y), r = row + fy;
      for (let yy = Math.floor(y); yy < Math.ceil(top); yy++) {
        if (yy < 0 || yy >= h) continue;
        const cell = yy * w + x, p = cell * 4;
        const coverage = Math.min(yy + 1, top) - Math.max(yy, y);
        const previous = accumulation[p + 3], add = Math.min(1 - previous, Math.max(0, coverage)), alpha = previous + add;
        if (add <= 0 || alpha < 0.001) continue;
        const neighbour = previousDepth > 0 ? 1 - smooth01(((z - previousDepth) / gapThreshold - 0.6) / 0.8) : 1;
        const blend = hasSample[x] ? Math.max(0, Math.min(1, (yy + 0.5 - y) / span)) * neighbour : 0;
        // Coordinates on opposite sides of an occluding ridge must not be averaged into a
        // hidden valley. Retain the near material coordinate; edge coverage joins the colours.
        const frontGap = Math.max(300, depth[cell] * 0.045), distance = z - depth[cell];
        const continuity = previous === 0 || distance <= frontGap * 0.6 ? 1 : 1 - smooth01((distance / frontGap - 0.6) / 0.8);
        const attributeAdd = add * continuity;
        accumulation[p] += (r + (rowColumn[x] - r) * blend) * attributeAdd;
        accumulation[p + 1] += (c + (sideColumn[x] - c) * blend) * attributeAdd;
        accumulation[p + 2] += attributeAdd;
        accumulation[p + 3] = alpha; depth[cell] = Math.min(depth[cell], z);
      }
      rowColumn[x] = hasSample[x] ? rowColumn[x] + (r - rowColumn[x]) * contribution : r;
      sideColumn[x] = hasSample[x] ? sideColumn[x] + (c - sideColumn[x]) * contribution : c; hasSample[x] = 1;
      edges.previous[x] = previousDepth > 0 ? previousDepth + (z - previousDepth) * contribution : z;
      drawn += top - y; skyline[x] = y;
    }
  }
  const fragment = { low: g.height, high: g.height, blend: 0, fy: 0, z: 0, fog: 0, mountainFog: 0, ahead: 0, contourRow: 0, contourFy: 0 };
  // Fog has no sharp features: interpolate the already-computed geographic planes, never
  // evaluate exponentials for every pixel. Row indices are anchored to the same lattice.
  for (let p = 0; p < pixels.length; p += 4) {
    const alpha = accumulation[p + 3]; if (alpha <= 0) continue;
    const weight = accumulation[p + 2];
    const r = accumulation[p] / weight, c = accumulation[p + 1] / weight;
    const row = Math.floor(r), col = Math.floor(c), fy = r - row, fx = c - col, i = row * g.cols + col;
    const ahead = g.ahead0 + r * g.step, z = (ahead - view.ahead) * view.alongScale;
    const fogPosition = Math.max(0, Math.min(fogRows.length / 2 - 1.00001, (ahead - first) / march));
    const fogIndex = Math.floor(fogPosition) * 2, fogMix = fogPosition - Math.floor(fogPosition);
    fragment.fog = fogRows[fogIndex] + (fogRows[fogIndex + 2] - fogRows[fogIndex]) * fogMix;
    fragment.mountainFog = fogRows[fogIndex + 1] + (fogRows[fogIndex + 3] - fogRows[fogIndex + 1]) * fogMix;
    const blendLevel = smooth01((z / far - 0.65) / 0.35) * 0.22;
    fragment.high = blendLevel === 0 ? g.height : g.distanceHeight?.[1] ?? g.height;
    fragment.blend = blendLevel; fragment.fy = fy; fragment.z = z; fragment.ahead = ahead;
    const cr = r * CONTOUR_SCALE, cc = c * CONTOUR_SCALE, contourCol = Math.floor(cc);
    fragment.contourRow = Math.floor(cr); fragment.contourFy = cr - fragment.contourRow;
    const h0 = interiorSample(g.height, i, g.cols, fx, fy), h1 = fragment.high === g.height ? h0 : interiorSample(fragment.high, i, g.cols, fx, fy);
    const contour = g.contourHeight ? interiorSample(g.contourHeight, fragment.contourRow * contourCols + contourCol, contourCols, cc - contourCol, fragment.contourFy) : h0;
    const heightM = contour + (h1 - contour) * blendLevel;
    const index = Math.min(displayHeight.length - 2, heightM * 0.25), hi = Math.floor(index), hf = index - hi;
    shadeSurfaceSample(shading, fragment, c, i, fx, contourCol, heightM, h0, hi, hf, shaded);
    pixels[p] = shaded[0]; pixels[p + 1] = shaded[1]; pixels[p + 2] = shaded[2]; pixels[p + 3] = alpha * 255;
    const m = p / 2; attributes[m] = shaded[3] * alpha; attributes[m + 1] = shaded[4] * alpha;
  }
  filterMaterialCoverage(materialCoverage, pixels, depth, w, h);
  for (let n = 0; n < edges.count; n++) {
    const cell = edges.cells[n], x = cell % w, y = Math.floor(edges.y[cell]);
    const front = (Math.min(h - 1, y + 1) * w + x) * 4, back = (Math.max(0, y - 1) * w + x) * 4, color = cell * 3;
    edges.strength[cell] *= Math.min(pixels[front + 3], pixels[back + 3]) / 255;
    for (let channel = 0; channel < 3; channel++) { edges.front[color + channel] = pixels[front + channel]; edges.back[color + channel] = pixels[back + channel]; }
  }
  coverTerrainEdges(edges, pixels);
  // Integrate the silhouette's pixel coverage across each column; no colour/height blur across ridges.
  for (let x = 1; x < w - 1; x++) {
    const centre = skyline[x], left = (skyline[x - 1] + centre) / 2, right = (centre + skyline[x + 1]) / 2;
    const source = (Math.max(0, Math.min(h - 1, Math.floor(centre))) * w + x) * 4;
    if (!pixels[source + 3]) continue;
    const red = pixels[source], green = pixels[source + 1], blue = pixels[source + 2];
    for (let y = Math.max(0, Math.floor(Math.min(left, centre, right))); y < Math.min(h, Math.ceil(Math.max(left, centre, right))); y++) {
      const cover = (value: number) => Math.max(0, Math.min(1, y + 1 - value));
      const alpha = (cover(left) + 4 * cover(centre) + cover(right)) / 6, p = (y * w + x) * 4;
      if (!pixels[p + 3]) { pixels[p] = red; pixels[p + 1] = green; pixels[p + 2] = blue; }
      pixels[p + 3] = alpha * 255;
    }
  }
  return drawn;
}
