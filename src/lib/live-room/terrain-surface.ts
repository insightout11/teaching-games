import { elevationAt, loadElevation } from './elevation';
import { loadTerrarium } from './terrarium';
import { sharpenTerrainSummits } from './terrain-landmarks';
import { blurElevation, interiorSample, terrainHeight, terrainGradient, TERRAIN_GAIN, snowlineVariation } from './terrain-filter';
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
  /** Unmodified source metres for snow; two prefiltered display levels for distant samples. */
  trueHeight?: Float32Array; distanceHeight?: [Float32Array, Float32Array];
  source?: 'terrarium' | 'mixed' | 'coarse'; tiles?: number; failedTiles?: number;
  /** Four normalized material weights at each vertex, rather than nearest-cell colour changes. */
  materials: string[]; kinds: Uint16Array; weights: Float32Array;
  max: Float32Array; blockCols: number; peak?: number; slopeX?: Float32Array; slopeZ?: Float32Array;
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
  g.slopeX = new Float32Array(g.height.length); g.slopeZ = new Float32Array(g.height.length);
  for (let r = 1; r < g.rows - 1; r++) for (let c = 1; c < g.cols - 1; c++) {
    const i = r * g.cols + c;
    g.slopeX[i] = (g.height[i + 1] - g.height[i - 1]) / (g.step * 2000);
    g.slopeZ[i] = (g.height[i + g.cols] - g.height[i - g.cols]) / (g.step * 2000);
  }
  g.peak = g.max.reduce((a, b) => Math.max(a, b), 0);
  const blur = (values: Float32Array) => blurElevation(values, g.rows, g.cols);
  const middle = blur(g.height);
  g.distanceHeight = [middle, blur(blur(middle))];
  return g;
}

function smoothElevation(g: SurfaceGrid): SurfaceGrid {
  g.trueHeight = g.height.slice();
  g.height = blurElevation(g.height, g.rows, g.cols);
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
export function loadSurfaceGrid(strip: CoastStrip): Promise<SurfaceGrid | null> {
  const cached = cache.get(strip); if (cached) return cached;
  const pending = (async () => {
    if (!strip.origin || !strip.destination) return null;
    await loadElevation();
    const from = strip.origin, to = strip.destination;
    function* band() {
      for (let a = -40; a <= strip.routeKm + 200; a += 12) for (let s = -160; s <= 160; s += 12)
        yield surfacePoint(from!, to!, a, s, strip.routeKm);
    }
    const tiles = await loadTerrarium(band());
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
  cache.set(strip, pending); return pending;
}

/** A regular route mesh preserves source metres; exaggeration belongs to the view, never snow altitude. */
export function buildSurfaceGrid(strip: CoastStrip, elevation: (p: LatLng) => number,
  options = { step: 4, halfWidth: 220, behind: 200, beyond: 200 }): SurfaceGrid {
  if (!strip.origin || !strip.destination) throw new Error('Surface route has no coordinates');
  const { step, halfWidth, behind, beyond } = options;
  const g = emptyGrid(-behind, -halfWidth, step, Math.ceil((strip.routeKm + behind + beyond) / step) + 1, Math.ceil(halfWidth * 2 / step) + 1);
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
      g.height[i] = Math.max(0, elevation(p)); g.snowline[i] = snowlineM(p.lat) + snowlineVariation(along, side);
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

const albedoCache = new WeakMap<SurfaceGrid, { sources: Array<SurfaceTexture | undefined>; color: Float32Array }>();
/** Material filtering belongs to take-off/palette preparation, not to every visible ray sample. */
export function prepareSurfaceMaterials(g: SurfaceGrid, textures: SurfaceTextures, fallback: number[]): Float32Array {
  const sources = [...g.materials.map(key => textures.get(key)), textures.get('__rock'), textures.get('__forest')], old = albedoCache.get(g);
  if (old && old.sources.length === sources.length && sources.every((source, i) => source === old.sources[i])) return old.color;
  const color = new Float32Array(g.height.length * 3);
  for (let i = 0; i < g.height.length; i++) {
    const ahead = g.ahead0 + Math.floor(i / g.cols) * g.step, side = g.side0 + i % g.cols * g.step;
    let total = 0;
    for (let k = 0; k < 4; k++) {
      const weight = g.weights[i * 4 + k]; if (weight < 0.005) continue;
      const tex = sources[g.kinds[i * 4 + k]]; total += weight;
      for (let c = 0; c < 3; c++) color[i * 3 + c] += weight * (tex ? textureChannel(tex, side * 280 * tex.size / tex.worldSize, ahead * 400 * tex.size / tex.worldSize, c) : fallback[c]);
    }
    if (total < 0.01) for (let c = 0; c < 3; c++) color[i * 3 + c] = fallback[c];
    else for (let c = 0; c < 3; c++) color[i * 3 + c] /= total;
    const slope = Math.hypot(g.slopeX?.[i] ?? 0, g.slopeZ?.[i] ?? 0), height = g.height[i], line = g.snowline[i];
    const rock = smooth01((height - 900) / 1400) * smooth01((slope - 0.08) / 0.3) * 0.85;
    const arid = /desert|salt-flats/.test(g.materials[g.kinds[i * 4]] ?? '');
    const treeLine = Math.max(1700, line - 1600);
    const forest = arid ? 0 : smooth01((height - 500) / 700) * (1 - smooth01((height - treeLine + 500) / 700)) * smooth01(slope / 0.3) * 0.45;
    for (const [name, weight] of [['__forest', forest], ['__rock', rock]] as const) {
      const tex = textures.get(name); if (!tex || weight < 0.001) continue;
      for (let c = 0; c < 3; c++) color[i * 3 + c] = color[i * 3 + c] * (1 - weight) + textureChannel(tex, side * 280 * tex.size / tex.worldSize, ahead * 400 * tex.size / tex.worldSize, c) * weight;
    }
  }
  albedoCache.set(g, { sources, color }); return color;
}

const smooth01 = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export function surfaceSnow(height: number, line: number, slope: number, illumination: number): number {
  return smooth01((height - line) / 1000) * smooth01((illumination + 0.15) / 0.85) * (1 - smooth01((slope - 0.25) / 0.55));
}

export interface SurfaceView {
  width: number; height: number; horizon: number; focal: number; cameraHeight: number;
  /** Along coordinate of the camera and world units per geographic km; both use the existing one-clock frame. */
  ahead: number; alongScale: number; sideScale: number; textureZ: number;
  far: number; near: number; sunX: number; sunY: number; dark: boolean;
  sunDirection?: [number, number, number];
  exaggeration?: number;
  haze: number[]; fallback: number[]; snow: number[]; cloudCover: number; seconds: number;
}

/** Front-to-back voxel-space columns. The caller uploads only this reduced-resolution result. */
export function drawSurface(g: SurfaceGrid, textures: SurfaceTextures, view: SurfaceView, pixels: Uint8ClampedArray, depth: Float32Array): number {
  const { width: w, height: h, horizon, focal, cameraHeight, far, near } = view;
  pixels.fill(0); depth.fill(Infinity);
  const albedo = prepareSurfaceMaterials(g, textures, view.fallback);
  const snowTexture = textures.get('__snow');
  const sunUp = Math.max(0.05, view.sunDirection?.[2] ?? 1 - view.sunY);
  const sunSide = view.sunDirection?.[0] ?? (view.sunX - 0.5) * 1.5, sunAhead = view.sunDirection?.[1] ?? 0.4;
  const lightLength = Math.hypot(sunSide, sunAhead, sunUp);
  const exaggeration = view.exaggeration ?? TERRAIN_GAIN;
  // Geographic planes share all depth-dependent work across columns. No heightfield rebuild during Fly.
  // Cap projected depth spacing too: short routes are stretched along the flight frame, so a fixed
  // geographic step otherwise creates large saw teeth even with a smooth height texture.
  const march = Math.min(g.step * 0.5, 200 / view.alongScale);
  const first = Math.ceil((view.ahead + near / view.alongScale) / march) * march;
  const planes: Array<{ z: number; ahead: number; row: number; fy: number; blend: number; low: Float32Array; high: Float32Array; fog: number }> = [];
  for (let ahead = first; ; ahead += march) {
    const z = (ahead - view.ahead) * view.alongScale;
    if (z >= far) break;
    const r = (ahead - g.ahead0) / g.step;
    if (r < 1 || r >= g.rows - 2) continue;
    const lod = smooth01(z / far) * 2, level = Math.min(1, Math.floor(lod));
    planes.push({ z, ahead, row: Math.floor(r), fy: r - Math.floor(r), blend: lod - level,
      low: level === 0 ? g.height : g.distanceHeight?.[0] ?? g.height, high: g.distanceHeight?.[level] ?? g.height,
      fog: Math.min(0.96, 1 - Math.exp(-2.6 * z / far)) });
  }
  let drawn = 0;
  for (let x = 0; x < w; x++) {
    let top = h, lastRed = 0, lastGreen = 0, lastBlue = 0, hasShade = false;
    // Fixed geographic planes: the camera slides continuously between samples instead of dragging the
    // sampling lattice through every ridge. Sub-cell spacing also prevents skipping narrow crests.
    for (let plane = 0; plane < planes.length && top > 0; plane++) {
      const { z, ahead, row, fy, low, high, blend: blendLevel, fog } = planes[plane];
      const worldX = (x + 0.5 - w / 2) * z / focal;
      const side = worldX / view.sideScale, c = (side - g.side0) / g.step;
      if (c < 1 || c >= g.cols - 2) continue;
      const col = Math.floor(c), fx = c - col, i = row * g.cols + col;
      // Crossfade cached Gaussian levels continuously, never switch detail at a tile or row boundary.
      const h0 = interiorSample(low, i, g.cols, fx, fy), h1 = interiorSample(high, i, g.cols, fx, fy);
      const heightM = h0 + (h1 - h0) * blendLevel;
      const y = Math.max(0, horizon + (cameraHeight - terrainHeight(heightM, exaggeration) * HEIGHT_UNITS) * focal / z);
      if (y >= top) continue;
      if (heightM < 2) {
        // Near sea/flat ground occludes distant relief too. Keep its existing coast/sea pixels underneath.
        for (let yy = Math.ceil(y); yy < top; yy++) depth[yy * w + x] = z;
        top = y; continue;
      }
      // CPU fragment equivalent: central differences at this visible height sample, not interpolated vertex normals.
      const dx0 = interiorSample(low, i + 1, g.cols, fx, fy) - interiorSample(low, i - 1, g.cols, fx, fy);
      const dx1 = interiorSample(high, i + 1, g.cols, fx, fy) - interiorSample(high, i - 1, g.cols, fx, fy);
      const dz0 = interiorSample(low, i + g.cols, g.cols, fx, fy) - interiorSample(low, i - g.cols, g.cols, fx, fy);
      const dz1 = interiorSample(high, i + g.cols, g.cols, fx, fy) - interiorSample(high, i - g.cols, g.cols, fx, fy);
      const dx = (dx0 + (dx1 - dx0) * blendLevel) / (g.step * 2000);
      const dz = (dz0 + (dz1 - dz0) * blendLevel) / (g.step * 2000);
      const normalScale = terrainGradient(heightM, exaggeration) * 2;
      const slopeSquared = dx * dx + dz * dz;
      const illumination = (-dx * normalScale * sunSide - dz * normalScale * sunAhead + sunUp) / (Math.sqrt(slopeSquared * normalScale * normalScale + 1) * lightLength);
      const cloud = view.cloudCover > 0 ? 1 - view.cloudCover / 100 * 0.15 * (0.5 + 0.5 * Math.sin(ahead * 0.15 + side * 0.2)) : 1;
      const light = (view.dark ? 0.32 : 0.30 + Math.max(0, illumination) * 0.85) * cloud;
      const a = i * 3, b = a + 3, c0 = (i + g.cols) * 3, d = c0 + 3;
      const red = (albedo[a] * (1 - fx) + albedo[b] * fx) * (1 - fy) + (albedo[c0] * (1 - fx) + albedo[d] * fx) * fy;
      const green = (albedo[a + 1] * (1 - fx) + albedo[b + 1] * fx) * (1 - fy) + (albedo[c0 + 1] * (1 - fx) + albedo[d + 1] * fx) * fy;
      const blue = (albedo[a + 2] * (1 - fx) + albedo[b + 2] * fx) * (1 - fy) + (albedo[c0 + 2] * (1 - fx) + albedo[d + 2] * fx) * fy;
      const total = 1;
      const snowline = (g.snowline[i] * (1 - fx) + g.snowline[i + 1] * fx) * (1 - fy) + (g.snowline[i + g.cols] * (1 - fx) + g.snowline[i + g.cols + 1] * fx) * fy;
      // The snow test uses unexaggerated metres. Back-facing slopes retain exposed rock rather than a white blanket.
      const trueHeight = interiorSample(g.trueHeight ?? g.height, i, g.cols, fx, fy);
      const snow = surfaceSnow(trueHeight, snowline, Math.sqrt(slopeSquared), illumination);
      let snowRed = view.snow[0], snowGreen = view.snow[1], snowBlue = view.snow[2];
      if (snowTexture) {
        // The ice tile's broad colour survives; tiny unfiltered white texels must not sparkle in distant snowfields.
        snowRed = snowRed * 0.65 + snowTexture.mean[0] * 0.35;
        snowGreen = snowGreen * 0.65 + snowTexture.mean[1] * 0.35;
        snowBlue = snowBlue * 0.65 + snowTexture.mean[2] * 0.35;
      }
      const rr = ((red / total * (1 - snow) + snowRed * snow) * light) * (1 - fog) + Math.max(0, view.haze[0] - 8) * fog;
      const gg = ((green / total * (1 - snow) + snowGreen * snow) * light) * (1 - fog) + view.haze[1] * fog;
      const bb = ((blue / total * (1 - snow) + snowBlue * snow) * light) * (1 - fog) + Math.min(255, view.haze[2] + 10) * fog;
      const span = Math.max(1, top - y);
      for (let yy = Math.floor(y); yy < Math.ceil(top); yy++) {
        if (yy < 0 || yy >= h) continue;
        const cell = yy * w + x, p = cell * 4;
        const coverage = Math.min(yy + 1, top) - Math.max(yy, y);
        const previous = pixels[p + 3] / 255, add = Math.min(1 - previous, Math.max(0, coverage)), alpha = previous + add;
        if (alpha < 0.001) continue;
        // Blend sample colours down each projected segment, with fractional coverage at its skyline.
        const blend = hasShade ? Math.max(0, Math.min(1, (yy + 0.5 - y) / span)) : 0;
        const r = rr + (lastRed - rr) * blend, g = gg + (lastGreen - gg) * blend, b = bb + (lastBlue - bb) * blend;
        pixels[p] = (pixels[p] * previous + r * add) / alpha;
        pixels[p + 1] = (pixels[p + 1] * previous + g * add) / alpha;
        pixels[p + 2] = (pixels[p + 2] * previous + b * add) / alpha;
        pixels[p + 3] = alpha * 255; depth[cell] = Math.min(depth[cell], z);
      }
      lastRed = rr; lastGreen = gg; lastBlue = bb; hasShade = true;
      drawn += top - y; top = y;
    }
  }
  return drawn;
}
