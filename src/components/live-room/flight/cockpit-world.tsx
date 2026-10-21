'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ScenePalette } from '@/components/world-flight/arrival-scene/types';
import { hexToRgb, mixRgb } from '@/components/live-room/flight/cockpit-sky';
import { drawPeak, peakStyle, type PeakKind } from '@/components/live-room/flight/peak-art';
import { CLOUD_Y_MAX, CLOUD_Y_MIN, cloudLight, drawSkyCloud, skyClouds, type SkyCloud } from '@/components/live-room/flight/sky-clouds';
import { drawWorldLandmark, LANDMARK_SIZE, type WorldLandmark, type WorldLandmarkKind } from '@/components/live-room/flight/world-landmarks';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import type { Waters } from '@/lib/live-room/waters-ahead';
import type { Coast } from '@/lib/live-room/coast-ahead';
import { clipCoastLine, clipCoastView, groundMixAt, type CoastStrip } from '@/lib/live-room/coast-strip';
import { highGroundAt, type HighGround } from '@/lib/live-room/elevation-ahead';
import { drawSceneEvent, realEvents, type EventKind, type SceneEvent } from '@/components/live-room/flight/event-art';
import { desertTexture, farmTexture, forestTexture, groundRelief, nightLights, realCoast, realRelief, realWaters, softEdges, iceTexture, macroTexture, mountainTexture, naturalTexture, oceanTexture, rangeFor, reliefTexture, type RangeMix } from '@/components/live-room/flight/ground-texture';

/**
 * The world below the cockpit, drawn through ONE camera so everything moves
 * with the same physics:
 *  - ground: perspective-correct, row by row ("Mode 7"): each screen row below
 *    the horizon samples the terrain texture at its true depth
 *  - mountains and hills: 3D shapes (x, z, height, width) whose bases sit on
 *    that same ground and which approach at exactly the ground's speed
 *  - haze: colour fades to the horizon with distance
 * When the terrain below changes, the new terrain appears at the horizon and
 * its edge (a coastline, the start of a desert) travels toward the plane.
 * One render loop runs for the whole flight; nothing restarts on changes.
 */

type RGB = [number, number, number];
interface Peak { x: number; z: number; h: number; w: number; tone: number; roll: number; hill: boolean; /** From real elevation: its kind, and whether its top holds snow. */ kind?: PeakKind; snowy?: boolean }

interface Layer {
  terrain: Terrain;
  region: string | null;
  /** The terrain texture pre-shrunk every way it will be seen (see ripChain), as patterns. */
  rip: Rip | null;
  macroAlpha: number;
  /** World depth where this terrain begins (the previous one ends). */
  startZ: number;
  peaks: Peak[];
  land: RGB;
  rock: RGB;
  snow: RGB;
  leaf: RGB;
  range: RangeMix;
  night: boolean;
  /** The ground texture's real average colour: mountains and hills are blended toward it, so they belong to the land. */
  ground?: RGB;
}

/** A big city within about 150 km of the plane, in kilometres: ahead of it, to its side (negative left, positive right), and its radius. */
export interface DistantCity { id: string; ahead: number; lateral: number; size: number }

/** World units per kilometre for cities: 150 km ahead sits at the far edge of the view, and the cruise height is about 8 km. */
const CITY_UNITS_PER_KM = 400;

/** Sun (or moon) glitter on the sea: where the light is on the screen (0 to 1 across), how strong, and its colour. */
export interface SeaGlint { x: number; strength: number; color: RGB }

// A fixed scatter for the glitter: each spark has a place across the path, a depth, a size and its own flicker.
const SPARKS = (() => {
  let r = 20260412;
  const rnd = () => { r = (Math.imul(r, 1664525) + 1013904223) >>> 0; return r / 4294967296; };
  return Array.from({ length: 240 }, () => ({ u: Math.pow(rnd(), 1.5), dx: rnd() * 2 - 1, sz: 0.6 + rnd() * 0.9, ph: rnd() * 6.28, sp: 1.5 + rnd() * 3.5 }));
})();

function drawSeaGlint(ctx: CanvasRenderingContext2D, gl: SeaGlint, k: number, seconds: number, w: number, h: number, horizonY: number) {
  const depth = h - horizonY;
  const half0 = w * 0.012, half1 = w * 0.17;
  const [r, g, b] = gl.color;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // The soft sheen along the path, narrow at the horizon and spreading toward the viewer. Built from a few nested layers
  // so its edges fade out instead of ending in a hard line.
  const sheen = ctx.createLinearGradient(0, horizonY, 0, h);
  sheen.addColorStop(0, `rgba(${r},${g},${b},${gl.strength * k})`);
  sheen.addColorStop(1, `rgba(${r},${g},${b},${0.2 * gl.strength * k})`);
  ctx.fillStyle = sheen;
  for (let i = 0; i < 6; i++) {
    const f = 1 - i * 0.16;
    ctx.globalAlpha = 0.07;
    ctx.beginPath();
    ctx.moveTo(gl.x * w - half0 * f, horizonY); ctx.lineTo(gl.x * w + half0 * f, horizonY);
    ctx.lineTo(gl.x * w + half1 * f, h); ctx.lineTo(gl.x * w - half1 * f, h);
    ctx.closePath(); ctx.fill();
  }
  // The sparkle of light on the wave faces.
  for (const s of SPARKS) {
    const d = Math.pow(s.u, 1.7);
    const half = half0 + (half1 - half0) * d;
    const twinkle = Math.pow(0.5 + 0.5 * Math.sin(seconds * s.sp + s.ph), 3);
    const size = 1 + d * 3.2 * s.sz;
    ctx.globalAlpha = Math.min(1, twinkle * gl.strength * k * (0.55 + 0.45 * (1 - d * 0.4)));
    ctx.fillStyle = `rgb(${Math.round((255 + r) / 2)},${Math.round((250 + g) / 2)},${Math.round((240 + b) / 2)})`;
    ctx.fillRect(gl.x * w + s.dx * half, horizonY + d * depth, size * 1.7, size * 0.7);
  }
  ctx.restore();
}

const CAM_HEIGHT = 3200;     // cruise: well above the highest peaks, looking down on them
const HORIZON = 0.58;        // horizon line, fraction of the canvas height
const Z_FAR = 60000;
const Z_NEAR = 900;
const CRUISE_SPEED = 4200;   // world units per second at speed 1
const TILE_WORLD = 14;       // one texture pixel covers this many world units
/** World size of one tile of the relief pattern (hills a few kilometres across). */
const RELIEF_WORLD = 30000;
const MACRO_WORLD = 14 * 41; // the light/dark layer: a scale unrelated to the ground's, so no repeat lines up
const SHORE = 4200;          // world units over which one terrain blends into the next
/** Softer edges between two land types: a band four times as deep, the new ground arriving in patches. */
const SOFT_SHORE = 17000;
const PATCH_WORLD = 6500;     // size of the patches (world units)
const PATCH_SEGMENTS = 40;    // pieces per row inside the band
const COAST_BUCKET = 2500;    // depth slices for finding coast edges quickly (world units)

// ── Night lights ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Towns scattered over the land on a fixed grid (the same stretch always has the same towns), more of them and brighter
// where the land is busy (farmland, rice paddies; Europe, South and East Asia), almost none over desert, ice or deep
// forest; faint strings of light along the roads between neighbouring towns.
const TOWN_CELL = 5200;       // one possible town per cell (world units; about 13 km)
const BUILT: Partial<Record<string, number>> = {
  farmland: 1, paddies: 1.15, grassland: 0.45, savanna: 0.35, hills: 0.7, forest: 0.28, wetlands: 0.25, mountains: 0.22,
  rainforest: 0.08, desert: 0.07, tundra: 0.05, 'salt-flats': 0.02, ice: 0, ocean: 0,
};
function regionBusy(region: string | null): number {
  const r = region ?? '';
  if (/city:|town:/.test(r)) return 1.3;
  if (/Europe/.test(r)) return 1.25;
  if (/Asia|Japan|India|China/.test(r)) return 1.1;
  if (/North America/.test(r)) return 1;
  if (/South America/.test(r)) return 0.7;
  if (/Africa|Madagascar/.test(r)) return 0.5;
  if (/Australia/.test(r)) return 0.3;
  return 0.8;
}
/** A town's glow, made once and drawn scaled (a gradient per town per frame was the costly part). */
let glowSprite: HTMLCanvasElement | null = null;
function townGlow(): HTMLCanvasElement {
  if (glowSprite) return glowSprite;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,190,110,0.9)'); r.addColorStop(0.4, 'rgba(255,170,90,0.35)'); r.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }
  glowSprite = c;
  return c;
}
const cellHash = (i: number, j: number, k: number) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };

/** Chaikin corner cutting: the map's kinks become curves (each pass doubles the points, the ends stay put). */
function smoothLine(pts: Array<[number, number]>): Array<[number, number]> {
  if (pts.length < 3) return pts;
  const out: Array<[number, number]> = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Chaikin for a closed outline (a lake's shore): every corner rounded, the ring stays closed. */
function smoothRing(pts: Array<[number, number]>): Array<[number, number]> {
  const ring = pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1] ? pts.slice(0, -1) : pts;
  if (ring.length < 3) return pts;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % ring.length];
    out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
  }
  return out;
}

/** Cut a closed outline where it passes behind the plane (z below `near`), so nothing is squashed onto one line. */
function clipRingNear(ring: Array<[number, number]>, near: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const ain = a[1] >= near, bin = b[1] >= near;
    if (ain) out.push(a);
    if (ain !== bin) { const t = (near - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, near]); }
  }
  return out;
}

/** Smooth value noise (0..1) for the patches: the same place always has the same patch. */
function patchNoise(x: number, z: number): number {
  const h = (i: number, j: number) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1);
  const n1 = a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  // a second, finer layer so patch edges are ragged, not round
  const i2 = Math.floor(x * 2.7 + 5), j2 = Math.floor(z * 2.7 + 9), gx = x * 2.7 + 5 - i2, gz = z * 2.7 + 9 - j2;
  const vx = gx * gx * (3 - 2 * gx), vz = gz * gz * (3 - 2 * gz);
  const e = h(i2, j2), f = h(i2 + 1, j2), g = h(i2, j2 + 1), k = h(i2 + 1, j2 + 1);
  const n2 = e + (f - e) * vx + (g - e) * vz + (e - f - g + k) * vx * vz;
  return n1 * 0.72 + n2 * 0.28;
}

/**
 * Ground seen at a shallow angle is squashed far more in depth than sideways: one screen row near the horizon covers
 * dozens of texture rows while each texel is still nearly a pixel wide. Sampling that from one "half size" copy
 * either blurs the ground sideways or lets it shimmer and crawl as it scrolls. So the texture is pre-shrunk
 * separately in each direction (a ripmap): levels[i][j] is 1/2^i wide and 1/2^j tall; each row picks the pair it needs.
 */
interface RipCanvases { w: number; h: number; levels: HTMLCanvasElement[][] }
interface Rip { w: number; h: number; levels: Array<Array<{ pat: CanvasPattern; w: number; h: number }>> }
const textureCache = new Map<string, RipCanvases>();
const RIP_X = 5;
const RIP_Y = 8;

function shrink(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, w, h);
  return c;
}

function ripChain(src: HTMLCanvasElement): RipCanvases {
  const levels: HTMLCanvasElement[][] = [];
  let col = src;
  for (let i = 0; i < RIP_X && col.width >= 16; i++) {
    const row: HTMLCanvasElement[] = [col];
    for (let j = 1; j < RIP_Y && row[j - 1].height >= 8; j++) row.push(shrink(row[j - 1], col.width, row[j - 1].height >> 1));
    levels.push(row);
    col = shrink(col, col.width >> 1, col.height);
  }
  return { w: src.width, h: src.height, levels };
}

function spawnPeak(p: Peak, camZ: number, far: boolean) {
  p.x = (Math.random() * 2 - 1) * 42000;
  p.z = camZ + (far ? Z_FAR * (0.8 + Math.random() * 0.2) : 3000 + Math.random() * Z_FAR);
  if (p.hill) {
    p.h = 380 + Math.random() * 700;          // low, broad, rounded
    p.w = p.h * (4.5 + Math.random() * 3.5);
  } else {
    p.h = peakStyle() === 'new' ? 750 + Math.random() * 1250 : 900 + Math.random() * 1800; // always well below the camera (3200): we fly over them
    p.w = p.h * (peakStyle() === 'new' ? 2.3 + Math.random() * 1.6 : 1.6 + Math.random() * 1.2);
  }
  p.tone = Math.random();
  p.roll = Math.random();
}

const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** The ground texture for a terrain (real land cover: rainforest is a deeper, denser canopy; savanna and rice paddies
 *  use the farm patterns made for them; open ground has its own texture). */
function terrainCanvas(terrain: Terrain, reg: string | null, palette: ScenePalette, night: boolean, floor: RangeMix['floor']): HTMLCanvasElement {
  return terrain === 'desert' ? desertTexture(palette, night)
    : terrain === 'ocean' ? oceanTexture(palette, night)
      : terrain === 'mountains' ? mountainTexture(palette, night, floor)
        : terrain === 'forest' ? forestTexture(palette, night)
          : terrain === 'rainforest' ? deepCanopy(forestTexture({ ...palette, foliage: '#1d5a2c' }, night))
            : terrain === 'ice' ? iceTexture(palette, night)
              : terrain === 'savanna' ? farmTexture('Africa', palette, night)
                : terrain === 'paddies' ? farmTexture('Asia', palette, night)
                  : terrain === 'grassland' || terrain === 'tundra' || terrain === 'wetlands' || terrain === 'salt-flats' ? naturalTexture(terrain, palette, night)
                    : farmTexture(reg, palette, night);
}

/** The average colour of a (small) canvas: the ground texture's overall colour. */
function averageColour(c: HTMLCanvasElement): RGB | null {
  try {
    const g = c.getContext('2d');
    if (!g || !c.width || !c.height) return null;
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let r = 0, gr = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 8) continue; r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++; }
    return n ? [Math.round(r / n), Math.round(gr / n), Math.round(b / n)] : null;
  } catch { return null; }
}

/** A city's lights, laid out once: a cluster thick in the middle and thinning to the edge, the same every time. */
function cityDots(id: string) {
  let seed = 2166136261;
  for (let i = 0; i < id.length; i++) seed = Math.imul(seed ^ id.charCodeAt(i), 16777619);
  let r = (seed >>> 0) || 1;
  const rnd = () => { r = (Math.imul(r, 1664525) + 1013904223) >>> 0; return r / 4294967296; };
  return Array.from({ length: 70 }, () => {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 1.3);
    return { u: Math.cos(a) * d, v: Math.sin(a) * d, b: rnd(), warm: rnd() };
  });
}

/** Rainforest: the forest canopy, deeper and greener (an unbroken, humid green from the air). */
function deepCanopy(c: HTMLCanvasElement): HTMLCanvasElement {
  const g = c.getContext('2d');
  if (!g) return c;
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = 'rgb(120,170,110)';
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-over';
  return c;
}

/** Is this point inside the real land outlines? (Counts the outline crossings to its left: odd is land.) */
function landAt(cw: { edges: number[]; buckets: Map<number, number[]> }, x: number, z: number): boolean {
  let n = 0;
  for (const k of cw.buckets.get(Math.floor(z / COAST_BUCKET)) ?? []) {
    const x1 = cw.edges[k * 4], z1 = cw.edges[k * 4 + 1], x2 = cw.edges[k * 4 + 2], z2 = cw.edges[k * 4 + 3];
    if ((z1 <= z && z < z2) || (z2 <= z && z < z1)) {
      if (x1 + ((z - z1) * (x2 - x1)) / (z2 - z1) < x) n++;
    }
  }
  return n % 2 === 1;
}

/** Where the plane really is along its route: `t` (0-1) at time `at`, advancing `perMs` per millisecond. */
export interface RouteClock { at: number; t: number; perMs: number; /** The route's length (km), for things placed along it. */ km?: number }

/** The view's own pace (world units a second): the scenery's cruise speed as it always was (0.55 x CRUISE_SPEED). A
 *  lesson's flight is paced by the class, so the route (coast, landmarks, real mountains, rivers) is spread out to
 *  match this pace: everything moves together at the old speed and still arrives at the flight's real progress. */
export const VIEW_UNITS_PER_SEC = 0.55 * 4200;
/** How much the route is spread out along the view (1 for a fast flight; more for a slow one). */
export function routeSpread(rc: RouteClock | null | undefined): number {
  if (!rc?.km || !rc.perMs) return 1;
  const realUps = rc.km * CITY_UNITS_PER_KM * rc.perMs * 1000;
  return Math.max(1, VIEW_UNITS_PER_SEC / Math.max(1e-6, realUps));
}

export function CockpitWorld({ terrain, region, palette, night, speed, paused = false, cities, landmarks, glint, altitude = 1, cloudCover, waters, coast, highGround, events, coastStrip = null, routeClock = null }: { /** The whole route's coast, worked out once at take-off (preferred over `coast`). */ coastStrip?: CoastStrip | null; /** Where the plane really is on the route: `t` (0-1) at time `at`, moving `perMs` each millisecond. */ routeClock?: RouteClock | null; /** Real natural events in view (NASA EONET): smoke, ash, storm clouds. */ events?: SceneEvent[]; /** Real high ground around the plane (elevation grid): where mountains and hills stand. */ highGround?: HighGround; /** Real land outlines around the plane, in its frame (the coastline). */ coast?: Coast; /** Real rivers and lakes around the plane, in its frame (km ahead, km right). */ waters?: Waters; /** Real cloud cover (0-100): how full the sea of clouds below is. */ cloudCover?: number; /** 1 = cruise height; lower during the descent (the ground comes closer). */ altitude?: number; /** Landmarks standing in the scenery ahead (they approach and pass like the ground). */ landmarks?: WorldLandmark[]; terrain: Terrain; region?: string | null; palette: ScenePalette; night: boolean; speed: number; paused?: boolean; cities?: DistantCity[]; glint?: SeaGlint }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const live = useRef({ speed, paused, glint, altitude, cloudCover, routeClock });
  const coastStripRef = useRef(coastStrip);
  coastStripRef.current = coastStrip;
  live.current = { speed, paused, glint, altitude, cloudCover, routeClock };
  /** The plane's real place on the route, in world units along the coast strip (moves smoothly between updates). */
  const routeBase = useRef<number | null>(null);
  const routeNowU = useRef(0);
  const holdDrift = useRef(0);
  const spreadRef = useRef(1);
  const routeUnits = (cw: { route: boolean; routeKm: number } | null): number => (cw?.route && live.current.routeClock?.km ? routeNowU.current : 0);
  // The sea of clouds below: fixed in the world (they pass with the ground), as many as the cloud cover says.
  const skyCloudList = useRef<SkyCloud[]>([]);
  const cam = useRef(0);
  // Cities seen in the distance, fixed on the ground once they come into range, so they scroll with it.
  const cityWorld = useRef(new Map<string, { z: number; x: number; r: number; dots: ReturnType<typeof cityDots> }>());
  useEffect(() => {
    const map = cityWorld.current;
    const keep = new Set<string>();
    for (const c of cities ?? []) {
      keep.add(c.id);
      if (!map.has(c.id)) map.set(c.id, { z: cam.current + c.ahead * CITY_UNITS_PER_KM * spreadRef.current, x: c.lateral * CITY_UNITS_PER_KM * 0.7, r: c.size * CITY_UNITS_PER_KM, dots: cityDots(c.id) });
    }
    for (const id of Array.from(map.keys())) if (!keep.has(id)) map.delete(id);
  }, [cities]);
  // Landmarks, fixed on the ground once they come into range (as the cities).
  const landmarkWorld = useRef(new Map<string, { kind: WorldLandmarkKind; z: number; x: number; along?: number }>());
  const photoChance = useRef<string | null>(null);
  useEffect(() => {
    const map = landmarkWorld.current;
    const keep = new Set<string>();
    for (const l of landmarks ?? []) {
      keep.add(l.id);
      if (!map.has(l.id)) map.set(l.id, { kind: l.kind, z: cam.current + l.ahead * CITY_UNITS_PER_KM * spreadRef.current, x: l.lateral * CITY_UNITS_PER_KM * 0.7, along: l.along });
    }
    // kept until the view has passed it: the scenery moves slower than the real flight, so the route list drops a
    // landmark (the plane is really over it) while it is still far ahead here (Fuji vanished after Tokyo)
    for (const [id, l] of Array.from(map.entries())) if (!keep.has(id) && l.z < cam.current) map.delete(id);
  }, [landmarks]);
  // Real natural events, fixed on the ground once they come into range (as the landmarks)
  const eventWorld = useRef(new Map<string, { kind: EventKind; z: number; x: number; seed: number }>());
  useEffect(() => {
    const map = eventWorld.current;
    const keep = new Set<string>();
    for (const e of events ?? []) {
      keep.add(e.id);
      if (!map.has(e.id)) map.set(e.id, { kind: e.kind, z: cam.current + e.ahead * CITY_UNITS_PER_KM * spreadRef.current, x: e.lateral * CITY_UNITS_PER_KM * 0.7, seed: (e.id.length * 97 + e.id.charCodeAt(0)) % 1000 });
    }
    for (const [id, e] of Array.from(map.entries())) if (!keep.has(id) && e.z < cam.current) map.delete(id);
  }, [events]);
  // Real rivers and lakes, fixed on the ground once they come into range (as the cities); a river or lake already
  // lying ahead is not added again, a passed one can come back when the route still follows it.
  const waterSeen = useRef(false);
  const waterWorld = useRef<Array<{ name: string; lake: boolean; width: number; rings: Array<Array<[number, number]>>; born: number }>>([]);
  useEffect(() => {
    if (!waters) return;
    const list = waterWorld.current;
    const camZ = cam.current;
    // drop what has fully passed under the plane
    for (let i = list.length - 1; i >= 0; i--) if (list[i].rings.every((r) => r.every(([, z]) => z < camZ))) list.splice(i, 1);
    const ahead = new Set(list.map((w) => `${w.lake ? 'L' : 'R'}:${w.name}`));
    const toWorld = ([a, side]: [number, number]): [number, number] => [side * CITY_UNITS_PER_KM * 0.7, camZ + a * CITY_UNITS_PER_KM * spreadRef.current];
    // new water comes in from the distance (never right in front of the plane) and fades in
    const nearest = camZ + Z_FAR * 0.55;
    const born = performance.now();
    const firstFill = list.length === 0 && !waterSeen.current;
    waterSeen.current = true;
    for (const r of waters.rivers) {
      if (ahead.has(`R:${r.name}`)) continue;
      let pts = smoothLine(smoothLine(r.points.map(toWorld)));
      if (!firstFill) pts = pts.filter(([, z]) => z >= nearest);
      if (pts.length < 2) continue;
      list.push({ name: r.name, lake: false, width: r.widthClass === 1 ? 170 : r.widthClass === 2 ? 110 : 70, rings: [pts], born });
    }
    for (const l of waters.lakes) {
      if (ahead.has(`L:${l.name}`)) continue;
      const rings = l.rings.map((ring) => smoothRing(smoothRing(ring.map(toWorld))));
      if (!firstFill && rings.some((ring) => ring.some(([, z]) => z < nearest))) continue;
      list.push({ name: l.name, lake: true, width: 0, rings, born });
    }
    // names added this time count as ahead for the rest of this batch
  }, [waters]);
  // Real coastline: the land outlines fixed on the ground (as the cities), with their edges filed by depth so each
  // strip of ground can find where it crosses the coast. A new set is taken only once the last one has mostly passed.
  const coastWorld = useRef<{ edges: number[]; buckets: Map<number, number[]>; landRings: Array<{ points: Array<[number, number]>; shore: boolean[]; minX: number; maxX: number; minZ: number; maxZ: number }>; rings: Array<Array<[number, number]>>; shores: number[][]; real: boolean[][]; zMin: number; zMax: number; route: boolean; routeKm: number } | null>(null);
  /** Build the land edges (filed by depth), the beach lines and which beach pieces are real, from points already in
   *  the world frame (x across, z along). */
  const buildCoast = (lineRings: Array<Array<[number, number]>>, lineShores: number[][], landPts: Array<Array<[number, number]>>) => {
    const rings = lineRings.map((r) => smoothLine(r)); // the data's straight runs, rounded off
    // shore kinds follow the smoothing (it doubles the points: each original point's kind for its two new ones)
    const shores = lineRings.map((r, ri) => { const k = lineShores[ri] ?? []; const out = [k[0] ?? 1]; for (let i = 0; i < r.length - 1; i++) out.push(k[i] ?? 1, k[i + 1] ?? 1); out.push(k[r.length - 1] ?? 1); return out; });
    const edges: number[] = [];
    const buckets = new Map<number, number[]>();
    // the land as closed outlines: a strip is land between an odd and the next even crossing (counting, never the
    // lines' direction, which flickered land and sea where pieces of coastline started and ended)
    const landRings = landPts.map((r) => smoothRing(r));
    for (const ring of landRings) {
      for (let i = 0; i < ring.length; i++) {
        const [x1, z1] = ring[i], [x2, z2] = ring[(i + 1) % ring.length];
        if (z1 === z2) continue;
        const k = edges.length / 4;
        edges.push(x1, z1, x2, z2);
        for (let b = Math.floor(Math.min(z1, z2) / COAST_BUCKET); b <= Math.floor(Math.max(z1, z2) / COAST_BUCKET); b++) {
          const list = buckets.get(b);
          if (list) list.push(k); else buckets.set(b, [k]);
        }
      }
    }
    // A beach line is drawn only where the land fill really meets the sea: the coastline lines and the land outlines
    // come from different data, and where they disagree a beach floated in the open sea
    const probe = { edges, buckets };
    const real = rings.map((ring) => ring.slice(0, -1).map(([xa, za], i) => {
      const [xb, zb] = ring[i + 1];
      const mx = (xa + xb) / 2, mz = (za + zb) / 2, dx = xb - xa, dz = zb - za, len = Math.hypot(dx, dz) || 1;
      const d = 600; // a little way to each side of the line
      const nx = (-dz / len) * d, nz = (dx / len) * d;
      return landAt(probe, mx + nx, mz + nz) !== landAt(probe, mx - nx, mz - nz);
    }));
    const boundedLand = landRings.map((points) => ({ points,
      shore: points.map(([x, z], i) => {
        const [xb, zb] = points[(i + 1) % points.length];
        const dx = xb - x, dz = zb - z, len = Math.hypot(dx, dz) || 1;
        const mx = (x + xb) / 2, mz = (z + zb) / 2;
        // Shared/internal outline edges and tiny collapsed rings have no beach.
        const nx = -dz / len * 40, nz = dx / len * 40;
        return landAt(probe, mx + nx, mz + nz) !== landAt(probe, mx - nx, mz - nz);
      }),
      minX: Math.min(...points.map(([x]) => x)), maxX: Math.max(...points.map(([x]) => x)),
      minZ: Math.min(...points.map(([, z]) => z)), maxZ: Math.max(...points.map(([, z]) => z)),
    }));
    return { edges, buckets, landRings: boundedLand, rings, shores, real };
  };
  // The whole route's coast (worked out once at take-off): placed by km along the route, read at the plane's real place
  useEffect(() => {
    if (!coastStrip) return;
    const k = routeSpread(routeClock);
    spreadRef.current = k;
    const toWorld = ([along, side]: [number, number]): [number, number] => [side * CITY_UNITS_PER_KM * 0.7, along * CITY_UNITS_PER_KM * k];
    if (!coastStrip.land.length && !coastStrip.lines.length) { coastWorld.current = null; return; }
    const built = buildCoast(coastStrip.lines.map((r) => r.map(toWorld)), coastStrip.shores, coastStrip.land.map((r) => r.map(toWorld)));
    coastWorld.current = { ...built, zMin: -400 * CITY_UNITS_PER_KM * k, zMax: (coastStrip.routeKm + 400) * CITY_UNITS_PER_KM * k, route: true, routeKm: coastStrip.routeKm };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coastStrip, Math.round(routeSpread(routeClock) * 4)]);
  useEffect(() => {
    if (!coast || coastStrip) return;
    const camZ = cam.current;
    const cur = coastWorld.current;
    if (cur && cur.zMax - camZ > Z_FAR * 0.55) return; // the current stretch still fills the view
    if (!coast.rings.length) { coastWorld.current = null; return; }
    const toWorld = ([a, side]: [number, number]): [number, number] => [side * CITY_UNITS_PER_KM * 0.7, camZ + a * CITY_UNITS_PER_KM * spreadRef.current];
    const built = buildCoast(coast.rings.map((r) => r.map(toWorld)), coast.shores ?? [], (coast.land ?? []).map((r) => r.map(toWorld)));
    coastWorld.current = { ...built, zMin: camZ - coast.reachKm * CITY_UNITS_PER_KM, zMax: camZ + coast.reachKm * CITY_UNITS_PER_KM * 0.95, route: false, routeKm: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coast, coastStrip]);
  // Real high ground: the latest elevation grid, anchored where the plane was when it arrived; mountains and hills
  // spawned from it stay where they were put (a new grid never moves them).
  const highGroundRef = useRef<{ g: HighGround; camZ: number } | null>(null);
  useEffect(() => { if (highGround) highGroundRef.current = { g: highGround, camZ: cam.current }; }, [highGround]);
  const reliefPeaks = useRef<Peak[]>([]);
  // The sea's texture and the land's (the latest land under the route), for painting both sides of a real coast.
  const seaRip = useRef<Rip | null>(null);
  const landRip = useRef<{ rip: Rip; terrain: Terrain } | null>(null);
  // The coast's land painted as what is really there (it all borrowed the last land crossed: desert as far as Italy):
  // one texture per kind of land along the route, made when the route's coast strip arrives
  const stripRips = useRef(new Map<string, Rip>());
  useEffect(() => {
    stripRips.current = new Map();
    const ctx = ref.current?.getContext('2d');
    if (!coastStrip || !ctx) return;
    const kinds = new Map<string, { terrain: Terrain; region: string | null }>();
    for (const row of coastStrip.ground) for (const c of row) if (c) kinds.set(`${c.terrain}|${c.region}`, c);
    kinds.forEach((c, k) => {
      const key = `${c.terrain}|${c.region}|${night}|${palette.terrainTop}|${palette.waterTop}|${palette.foliage}`;
      const levels = textureCache.get(key) ?? ripChain(terrainCanvas(c.terrain, c.region, palette, night, rangeFor(c.region).floor));
      textureCache.set(key, levels);
      stripRips.current.set(k, { w: levels.w, h: levels.h, levels: levels.levels.map((row) => row.flatMap((cv) => { const pat = ctx.createPattern(cv, 'repeat'); return pat ? [{ pat, w: cv.width, h: cv.height }] : []; })) });
    });
  }, [coastStrip, palette, night]);
  // Terrains along the route, oldest first.
  const layers = useRef<Layer[]>([]);
  const look = useRef<{ haze: RGB; night: boolean; glow: RGB; water: RGB }>({ haze: [159, 184, 208], night, glow: [220, 200, 180], water: [60, 110, 140] });

  // ── Build (or restyle) the terrain layer when what's below changes ─────
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const reg = region ?? null;
    look.current = { haze: hexToRgb(palette.skyBottom.startsWith('#') ? palette.skyBottom : '#9fb8d0'), night, glow: hexToRgb(palette.horizonGlow?.startsWith('#') ? palette.horizonGlow : '#dcc8b4'), water: hexToRgb(palette.waterTop?.startsWith('#') ? palette.waterTop : '#3c6e8c') };
    const land = hexToRgb(palette.terrainTop);
    const range = rangeFor(reg);
    const rockBase: RGB = range.floor === 'arid' ? mixRgb(land, [178, 96, 60], 0.88) : mixRgb(land, [92, 90, 98], 0.7);
    const style = {
      land,
      rock: night ? mixRgb(rockBase, [10, 14, 28], 0.55) : rockBase,
      snow: (night ? [150, 160, 185] : [244, 247, 252]) as RGB,
      leaf: hexToRgb(palette.foliage),
      range,
      night,
    };

    const newest = layers.current[layers.current.length - 1];
    const same = !!newest && newest.terrain === terrain && newest.region === reg;
    const layer: Layer = same ? newest : {
      terrain,
      region: reg,
      rip: null,
      macroAlpha: terrain === 'ocean' ? 0.1 : terrain === 'ice' ? 0.18 : 0.4,
      startZ: newest ? cam.current + Z_FAR : -Infinity,
      peaks: [],
      ...style,
    };
    Object.assign(layer, style);

    // Texture: generated farmland/city, or the terrain's SVG tile; cached.
    const key = `${terrain}|${reg}|${night}|${palette.terrainTop}|${palette.waterTop}|${palette.foliage}`;
    const apply = (rc: RipCanvases) => {
      // the ground's real colour (its smallest copy, averaged): mountains and hills take some of it, so a blue-grey
      // peak no longer stands on brown desert
      const tiny = rc.levels[rc.levels.length - 1]?.[rc.levels[rc.levels.length - 1].length - 1];
      const ground = tiny ? averageColour(tiny) : null;
      if (ground) {
        layer.ground = ground;
        const share = range.floor === 'arid' ? 0.5 : terrain === 'ice' ? 0.25 : 0.38;
        layer.rock = mixRgb(style.rock, ground, share);
        layer.leaf = mixRgb(style.leaf, ground, 0.3);
      }
      layer.rip = {
        w: rc.w,
        h: rc.h,
        levels: rc.levels.map((row) => row.flatMap((c) => {
          const pat = ctx.createPattern(c, 'repeat');
          return pat ? [{ pat, w: c.width, h: c.height }] : [];
        })),
      };
    };
    // the sea for real coasts (always), and this land as the coast's land side
    const seaKey = `ocean|${night}|${palette.waterTop}`;
    const toRip = (rc: RipCanvases): Rip => ({ w: rc.w, h: rc.h, levels: rc.levels.map((row) => row.flatMap((c) => { const pat = ctx.createPattern(c, 'repeat'); return pat ? [{ pat, w: c.width, h: c.height }] : []; })) });
    const seaLevels = textureCache.get(seaKey) ?? ripChain(oceanTexture(palette, night));
    textureCache.set(seaKey, seaLevels);
    seaRip.current = toRip(seaLevels);
    if (!landRip.current && terrain === 'ocean') landRip.current = { rip: toRip(ripChain(farmTexture(reg, palette, night))), terrain: 'farmland' };
    const cached = textureCache.get(key);
    if (cached) apply(cached);
    else {
      // Real land cover: rainforest is a deeper, denser canopy; savanna and rice paddies use the farm patterns made
      // for them; open ground (steppe, tundra, wetlands, salt flats) has its own texture.
      const levels = ripChain(terrainCanvas(terrain, reg, palette, night, range.floor));
      textureCache.set(key, levels);
      apply(levels);
    }
    if (terrain !== 'ocean' && layer.rip) landRip.current = { rip: layer.rip, terrain };
    if (textureCache.size > 24) {
      const oldest = textureCache.keys().next().value;
      if (oldest) textureCache.delete(oldest);
    }

    if (!same) {
      if (terrain === 'mountains' || terrain === 'hills') {
        const hill = terrain === 'hills';
        for (let i = 0; i < (hill ? 190 : peakStyle() === 'new' ? 230 : 160); i++) {
          const pk: Peak = { x: 0, z: 0, h: 0, w: 0, tone: 0, roll: 0, hill };
          spawnPeak(pk, cam.current, false);
          // A terrain we're flying into only has peaks beyond its edge.
          if (Number.isFinite(layer.startZ)) pk.z = layer.startZ + Math.random() * Z_FAR;
          layer.peaks.push(pk);
        }
      }
      layers.current.push(layer);
    }
  }, [terrain, region, palette, night]);

  // ── One continuous render loop ─────────────────────────────────────────
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // Light and shade over the ground (the soft light/dark blotches and the hills) are large and soft: they are painted
    // on a small canvas a quarter of the size, in strips four rows tall, then laid over the ground in one go. Painting
    // them full size, row by row, was most of the cost of a frame.
    const shade = document.createElement('canvas');
    const sctx = shade.getContext('2d');
    if (!sctx) return;
    const SHADE = 4;
    const macro = sctx.createPattern(macroTexture(), 'repeat');
    const relief = sctx.createPattern(reliefTexture(), 'repeat');

    // Mix terrain textures through small, smoothly interpolated weight masks. The final coast remains full resolution.
    const terrainSurface = document.createElement('canvas'), mixedLand = document.createElement('canvas');
    const tctx = terrainSurface.getContext('2d'), mctx = mixedLand.getContext('2d');
    const landShade = document.createElement('canvas'), lsctx = landShade.getContext('2d');
    const coastMask = document.createElement('canvas'), cmctx = coastMask.getContext('2d');
    const mask = document.createElement('canvas');
    mask.width = 64; mask.height = 48;
    const maskCtx = mask.getContext('2d');
    if (!tctx || !mctx || !maskCtx || !lsctx || !cmctx) return;
    const weightMasks = new Map<string, { image: ImageData; terrain: Terrain; region: string | null; used: boolean; canvas: HTMLCanvasElement }>();
    let nextMaskAt = 0;

    let w = 0, h = 0, rowH = 2;
    // Camera height: eases toward the cruise height times `altitude` (the descent brings it down slowly).
    let camH = CAM_HEIGHT * Math.max(0.2, live.current.altitude);
    // One matrix reused for every row (a new one per row, twice, kept the garbage collector busy mid-flight).
    const mtx = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    let hazeKey = '';
    let hazeFill: CanvasGradient | null = null;
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      // The ground is soft, hazy and always moving: it never needs a sharp display's full resolution (the new look: at most
      // 1200 pixels across, since painting the ground strips is nearly all the cost of a frame), and drawing
      // four times the pixels every frame is what made the flight stutter on big or high-density screens.
      const dpr = Math.max(0.5, Math.min(1.25, window.devicePixelRatio || 1, (peakStyle() === 'new' ? 1200 : 1600) / Math.max(1, w)));
      // Rows exactly 2 device pixels tall, so neighbouring rows never overlap
      // on half-pixels (overlaps doubled the haze into faint lines).
      rowH = 2 / dpr;
      hazeKey = ''; nextMaskAt = 0;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const surface of [terrainSurface, mixedLand, coastMask]) { surface.width = canvas.width; surface.height = canvas.height; }
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cmctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      shade.width = Math.max(1, Math.ceil((w * dpr) / SHADE)); shade.height = Math.max(1, Math.ceil((h * dpr) / SHADE));
      sctx.setTransform(dpr / SHADE, 0, 0, dpr / SHADE, 0, 0);
      landShade.width = shade.width; landShade.height = shade.height;
      lsctx.setTransform(dpr / SHADE, 0, 0, dpr / SHADE, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let drawnSpeed = live.current.speed;
    // How much haze lies over the ground and how much sea glitter shows: both ease as the plane crosses a coast.
    let hazeScale = 1;
    let glintK = 0;

    const paintRow = (layer: Layer, y: number, z: number, F: number, camZ: number, alpha: number, withMacro = true, patch?: { t: number; wz: number }, xr?: [number, number], target = ctx, shadeTarget = sctx) => {
      const x0 = xr ? Math.max(0, xr[0]) : 0, x1 = xr ? Math.min(w, xr[1]) : w;
      if (x1 <= x0) return;
      const rip = layer.rip;
      if (!rip || !rip.levels.length) return;
      const s = (F / z) * TILE_WORLD;              // screen px per full-detail texel, sideways
      // Sideways: the copy whose texels are about a pixel wide.
      let li = 0;
      while (li < rip.levels.length - 1 && s * (1 << li) < 0.8) li++;
      const row = rip.levels[li];
      // In depth: this row covers `span` texture rows; use the copy already averaged over about that many.
      const span = (z * z * rowH) / (camH * F * TILE_WORLD);
      let lj = 0;
      while (lj < row.length - 1 && span > 1.5 * (1 << lj)) lj++;
      const lv = row[lj];
      const sx = rip.w / lv.w, sy = rip.h / lv.h;  // full-detail texels per texel of this copy
      const ky = (rowH / span) * sy;                // screen px per texel of this copy, in depth
      // Depth wrapped to one tile so the numbers stay small (large offsets lose precision and judder).
      const v = (((camZ + z) / TILE_WORLD) % rip.h) / sy;
      mtx.a = s * sx; mtx.d = -ky;                  // texture depth runs up the screen
      // Offset sideways so the texture's wrap line (a farm lane) isn't dead ahead.
      mtx.e = w / 2 - 330 * s; mtx.f = y + v * ky;
      lv.pat.setTransform(mtx);
      target.fillStyle = lv.pat;
      if (patch) {
        // Inside a soft edge: the row in pieces, each showing the new ground where its patch has "arrived"
        const seg = w / PATCH_SEGMENTS;
        for (let k = 0; k < PATCH_SEGMENTS; k++) {
          const wx = ((k + 0.5) * seg - w / 2) * (z / F);
          const n = patchNoise(wx / PATCH_WORLD, patch.wz / PATCH_WORLD);
          const a = Math.max(0, Math.min(1, (patch.t * 1.3 - 0.15 - n) * 5));
          if (a < 0.02) continue;
          target.globalAlpha = a;
          target.fillRect(k * seg, y, seg + 0.5, rowH);
        }
      } else {
        target.globalAlpha = alpha;
        target.fillRect(x0, y, x1 - x0, rowH);
      }
      target.globalAlpha = 1;
      // light and shade: every fourth row, on the small canvas, four rows tall
      if (!withMacro || Math.round(y / rowH) % SHADE !== 0) return;
      const sh = rowH * SHADE;
      if (macro) {
        const m = (F / z) * MACRO_WORLD;
        mtx.a = m; mtx.d = m; mtx.e = w / 2 + 3100 * (F / z); mtx.f = y - (((camZ + z) / MACRO_WORLD) % 256) * m;
        macro.setTransform(mtx);
        shadeTarget.globalAlpha = alpha * layer.macroAlpha;
        shadeTarget.fillStyle = macro;
        shadeTarget.fillRect(x0, y, x1 - x0, sh);
      }
      // Relief: hills and valleys lit from the sun's side, laid over all land (not open sea), shrinking with distance.
      if (relief && groundRelief() && layer.terrain !== 'ocean') {
        const m = (F / z) * RELIEF_WORLD;
        mtx.a = m; mtx.d = m; mtx.e = w / 2 + 1700 * (F / z); mtx.f = y - (((camZ + z) / RELIEF_WORLD) % 512) * m;
        relief.setTransform(mtx);
        shadeTarget.globalAlpha = alpha * (layer.terrain === 'mountains' ? 0.75 : layer.terrain === 'ice' ? 0.4 : 0.65) * (1 - Math.min(0.6, z / (Z_FAR * 1.2)));
        shadeTarget.fillStyle = relief;
        shadeTarget.fillRect(x0, y, x1 - x0, sh);
      }
      shadeTarget.globalAlpha = 1;
    };

    const frame = (now: number) => {
      camH += (CAM_HEIGHT * Math.max(0.2, Math.min(1, live.current.altitude)) - camH) * 0.01;
      // A video is playing (or a video is full screen; the whole room in full screen keeps moving): the scenery holds still so the video gets the whole machine.
      if (live.current.paused || (document.fullscreenElement && document.fullscreenElement !== document.documentElement)) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      drawnSpeed += (live.current.speed - drawnSpeed) * Math.min(1, dt * 1.2);
      // ONE clock for everything (21 Oct 2026): in a flight the camera is the real plane's place on the route, so the
      // ground, mountains, hills, coast and landmarks move together at real speed (the scenery used to run five times
      // faster than the coast and landmarks, and mountains floated across islands). Before take-off, and in the
      // galleries, it moves at its own speed as before; while holding near the destination it drifts slowly.
      const rcNow = live.current.routeClock;
      let camZ: number;
      if (rcNow?.km) {
        if (rcNow.perMs > 0) spreadRef.current = routeSpread(rcNow);
        const realU = Math.max(0, Math.min(1, rcNow.t + (Date.now() - rcNow.at) * rcNow.perMs)) * rcNow.km * CITY_UNITS_PER_KM * spreadRef.current;
        if (rcNow.perMs === 0) holdDrift.current += drawnSpeed * CRUISE_SPEED * dt * 0.12;
        // continuity: the route clock starts from wherever the scenery already was (no jump at take-off)
        if (routeBase.current === null) routeBase.current = cam.current - realU - holdDrift.current;
        routeNowU.current = realU + holdDrift.current;
        camZ = routeBase.current + routeNowU.current;
      } else {
        routeBase.current = null;
        camZ = cam.current + drawnSpeed * CRUISE_SPEED * dt * (reduce ? 0.1 : 1);
      }
      cam.current = camZ;
      const L = layers.current;
      // Forget terrains the plane has fully left behind.
      while (L.length > 1 && L[1].startZ + SOFT_SHORE < camZ) L.shift();

      const { haze, night: dark } = look.current;
      const horizonY = h * HORIZON;
      const F = w * 0.9;
      ctx.clearRect(0, 0, w, h);

      // ── Ground, row by row at its true depth ───────────────────────────
      if (L.length) {
        // mid-grey is "no change" when laid on with 'overlay'
        sctx.globalAlpha = 1;
        sctx.fillStyle = '#808080';
        sctx.fillRect(0, 0, w, h);
        const y0 = (Math.ceil((horizonY + 1) / rowH)) * rowH;
        // A real coast: land and sea from the closed land outlines (cut to a box wider than the view)
        const cw0 = realCoast() ? coastWorld.current : null;
        const routeU = routeUnits(cw0);
        for (let y = y0; y < h; y += rowH) {
          const z = (camH * F) / (y - horizonY);   // world depth of this row
          const wz = camZ + z;
          // A real coast in reach: the sea everywhere, then the land where this strip is inside the land outlines
          const cw = cw0;
          // the route strip is read at the plane's real place on the route; the older coast at the scenery's own depth
          const cz = cw?.route ? routeU + z : wz; // (camZ = route base + routeU: the same clock)
          if (cw && seaRip.current && landRip.current && cz >= cw.zMin && cz <= cw.zMax) {
            const top = L[L.length - 1];
            const sea: Layer = { ...top, terrain: 'ocean', rip: seaRip.current, macroAlpha: 0.1 };
            paintRow(sea, y, z, F, camZ, 1);
            continue;
          }
          let i = L.length - 1;
          while (i > 0 && L[i].startZ > wz) i--;
          // Land to land (not the coast): a soft, patchy edge when switched on; the coast keeps its narrow blend.
          const soft = softEdges() && i > 0 && L[i].terrain !== 'ocean' && L[i - 1].terrain !== 'ocean';
          const t = i > 0 ? (wz - L[i].startZ) / (soft ? SOFT_SHORE : SHORE) : 1;
          if (t < 1 && i > 0) {
            // Shoreline: the old terrain, the new one fading in, one overlay pass.
            paintRow(L[i - 1], y, z, F, camZ, 1);
            if (soft) paintRow(L[i], y, z, F, camZ, 1, false, { t, wz });
            else paintRow(L[i], y, z, F, camZ, t * t * (3 - 2 * t), false);
          } else {
            paintRow(L[i], y, z, F, camZ, 1);
          }
        }
        // Texture rows cover the whole view; a single projected path defines the coast, independently of rowH.
        // The same smoothed outlines still supply landAt's depth buckets for peaks and town lights.
        const landPath = new Path2D();
        let visibleLand = false;
        const coastBase = cw0?.route ? routeU : camZ;
        if (cw0 && landRip.current && seaRip.current) {
          const near = Math.max(Z_NEAR * 0.6, camH * F / (h - horizonY));
          const halfSlope = w / (2 * F);
          for (const ring of cw0.landRings) {
            if (ring.maxZ < coastBase + near || ring.minZ > coastBase + Z_FAR ||
                ring.minX > Z_FAR * halfSlope || ring.maxX < -Z_FAR * halfSlope) continue;
            const pts = clipCoastView(ring.points, coastBase, near, Z_FAR, halfSlope);
            if (pts.length < 3) continue;
            pts.forEach(([x, z], i) => {
              const scale = F / (z - coastBase);
              const px = w / 2 + x * scale, py = horizonY + camH * scale;
              if (i === 0) landPath.moveTo(px, py); else landPath.lineTo(px, py);
            });
            landPath.closePath();
            visibleLand = true;
          }
          if (visibleLand) {
            lsctx.fillStyle = '#808080';
            lsctx.fillRect(0, 0, w, h);
            const top = L[L.length - 1];
            if (now >= nextMaskAt) {
              nextMaskAt = now + 125;
              for (const entry of Array.from(weightMasks.values())) { entry.image.data.fill(0); entry.used = false; }
              const strip = cw0.route ? coastStripRef.current : null;
              // Sample at pixel centres in the small mask, in the same world frame as the texture and coast.
              for (let my = 0; my < mask.height; my++) {
                const py = y0 + (my + 0.5) / mask.height * (h - y0);
                const z = camH * F / (py - horizonY);
                if (z > Z_FAR) continue;
                for (let mx = 0; mx < mask.width; mx++) {
                  const x = ((mx + 0.5) / mask.width * w - w / 2) * z / F;
                  const along = (coastBase + z) / (CITY_UNITS_PER_KM * spreadRef.current);
                  const side = x / (CITY_UNITS_PER_KM * 0.7);
                  // A small world-anchored warp softens the grid's straight transition contours.
                  const warp = (patchNoise(side / 35, along / 35) - 0.5) * 12;
                  const weights = strip ? groundMixAt(strip, along + warp, side + warp) : [];
                  if (!weights.length) weights.push({ terrain: landRip.current.terrain, region: top.region, weight: 1 });
                  for (const cell of weights) {
                    const key = `${cell.terrain}|${cell.region}`;
                    let entry = weightMasks.get(key);
                    if (!entry) {
                      const canvas = document.createElement('canvas'); canvas.width = mask.width; canvas.height = mask.height;
                      entry = { image: maskCtx.createImageData(mask.width, mask.height), terrain: cell.terrain, region: cell.region, used: false, canvas };
                      weightMasks.set(key, entry);
                    }
                    const k = (my * mask.width + mx) * 4;
                    entry.image.data[k] = entry.image.data[k + 1] = entry.image.data[k + 2] = 255;
                    entry.image.data[k + 3] = Math.round(cell.weight * 255);
                    entry.used = true;
                  }
                }
              }
              for (const entry of Array.from(weightMasks.values())) {
                if (entry.used) entry.canvas.getContext('2d')?.putImageData(entry.image, 0, 0);
              }
            }
            mctx.clearRect(0, 0, w, h);
            let shaded = false;
            for (const [key, entry] of Array.from(weightMasks)) {
              if (!entry.used) continue;
              tctx.clearRect(0, 0, w, h);
              const land: Layer = { ...top, terrain: entry.terrain, rip: stripRips.current.get(key) ?? landRip.current.rip, macroAlpha: 0.4 };
              for (let y = y0; y < h; y += rowH) {
                const z = camH * F / (y - horizonY);
                if (z > Z_FAR) continue;
                const fogT = Math.max(0, Math.min(1, (z / Z_FAR - 0.5) * 2));
                const farLand = 1 - fogT * fogT * (3 - 2 * fogT);
                paintRow(land, y, z, F, camZ, farLand, !shaded, undefined, undefined, tctx, lsctx);
              }
              shaded = true;
              tctx.globalCompositeOperation = 'destination-in';
              tctx.drawImage(entry.canvas, 0, y0, w, h - y0);
              tctx.globalCompositeOperation = 'source-over';
              // Premultiplied weighted colours sum to one, avoiding dark seams between kinds.
              mctx.globalCompositeOperation = 'lighter';
              mctx.drawImage(terrainSurface, 0, 0, w, h);
            }
            mctx.globalCompositeOperation = 'source-over';
            // Rasterize the silhouette once. A complex vector clip around drawImage forces a costly software fallback.
            cmctx.clearRect(0, 0, w, h);
            cmctx.fillStyle = '#fff'; cmctx.fill(landPath, 'evenodd');
            mctx.globalCompositeOperation = 'destination-in';
            mctx.drawImage(coastMask, 0, 0, w, h);
            mctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(mixedLand, 0, 0, w, h);
            lsctx.globalCompositeOperation = 'destination-in';
            lsctx.drawImage(coastMask, 0, 0, w, h);
            lsctx.globalCompositeOperation = 'source-over';
            sctx.drawImage(landShade, 0, 0, w, h);
          }
        }
        // Sand and shallows follow the exact smoothed land boundary, never the separately sampled coast lines.
        // Stroke original segments only: frustum clipping must not invent beaches along the horizon or window edge.
        if (cw0 && visibleLand) {
          const near = Math.max(Z_NEAR * 0.6, camH * F / (h - horizonY));
          const seaBase = mixRgb(look.current.water, [110, 210, 205], 0.35);
          const sand: RGB = dark ? [80, 78, 72] : [206, 196, 165];
          tctx.clearRect(0, 0, w, h);
          tctx.lineCap = 'round'; tctx.lineJoin = 'round';
          // Nested faint strokes give the shallow band a soft outer edge; the land mask removes its inland half.
          for (const pass of [0, 1, 2, 3]) {
            for (const ring of cw0.landRings) {
              if (ring.maxZ < coastBase + near || ring.minZ > coastBase + Z_FAR ||
                  ring.minX > Z_FAR * w / (2 * F) || ring.maxX < -Z_FAR * w / (2 * F)) continue;
              for (let i = 0; i < ring.points.length; i++) {
                if (!ring.shore[i]) continue;
                const pts = clipCoastLine(ring.points[i], ring.points[(i + 1) % ring.points.length], coastBase, near, Z_FAR, w / (2 * F));
                if (pts.length !== 2) continue;
                const rz = (pts[0][1] + pts[1][1]) / 2 - coastBase;
                const fadeT = Math.max(0, Math.min(1, (rz / Z_FAR - 0.5) * 2));
                const fade = 1 - fadeT * fadeT * (3 - 2 * fadeT);
                if (fade < 0.01) continue;
                const wide = Math.min(2, Math.max(0.35, 45 * F / rz));
                tctx.strokeStyle = css(mixRgb(pass === 3 ? sand : dark ? mixRgb(seaBase, [10, 16, 30], 0.62) : seaBase, haze, (1 - fade) * 0.7));
                tctx.globalAlpha = fade * (pass === 3 ? 0.5 : 0.065);
                tctx.lineWidth = wide * [6, 4, 2.5, 0.8][pass];
                tctx.beginPath();
                pts.forEach(([x, z], n) => {
                  const scale = F / (z - coastBase);
                  if (n === 0) tctx.moveTo(w / 2 + x * scale, horizonY + camH * scale);
                  else tctx.lineTo(w / 2 + x * scale, horizonY + camH * scale);
                });
                tctx.stroke();
              }
            }
          }
          tctx.globalAlpha = 1;
          tctx.globalCompositeOperation = 'destination-out';
          tctx.drawImage(coastMask, 0, 0, w, h);
          tctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(terrainSurface, 0, 0, w, h);
        }
        // Real rivers and lakes on the ground: water in the scene's light, a pale shore, greying into the haze far off
        if (realWaters() && waterWorld.current.length) {
          // deep water (the palette's sea colour darkened), and a green strip of fields along the banks
          const base = mixRgb(look.current.water, [30, 56, 64], 0.7); // deep and a little muddy, never bright cyan
          const waterCol = dark ? mixRgb(base, [6, 10, 22], 0.6) : mixRgb(base, look.current.glow, 0.08);
          const bankLeaf = L[L.length - 1]?.leaf ?? ([70, 110, 60] as RGB);
          const shoreCol = dark ? mixRgb(bankLeaf, [6, 10, 18], 0.75) : mixRgb(bankLeaf, [52, 96, 48], 0.45);
          const at = ([x, z]: [number, number]): [number, number] | null => {
            const rz = z - camZ;
            if (rz < Z_NEAR * 0.6 || rz > Z_FAR) return null;
            const s = F / rz;
            return [w / 2 + x * s, horizonY + camH * s];
          };
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const nowMs = performance.now();
          for (const wt of waterWorld.current) {
            const appear = Math.min(1, (nowMs - wt.born) / 4000);
            if (wt.lake) {
              for (const ring of wt.rings) {
                // cut where the shore passes behind the plane (squashing it onto one line made straight edges and corners)
                const pts = clipRingNear(ring, camZ + Z_NEAR * 0.6).map(([x, z]) => at([x, Math.min(camZ + Z_FAR, z)])).filter((q): q is [number, number] => !!q);
                if (pts.length < 3) continue;
                const midZ = ring.reduce((t, [, z]) => t + z, 0) / ring.length - camZ;
                const fog = Math.min(0.85, Math.max(0, midZ / Z_FAR));
                ctx.beginPath();
                pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
                ctx.closePath();
                // green shores fading out into the land in small steps (no hard pale edge), then deep water
                const shoreW = Math.max(2, Math.min(18, (900 * F) / Math.max(Z_NEAR, midZ)));
                ctx.strokeStyle = css(mixRgb(shoreCol, haze, fog * 0.6));
                for (const k of [1, 0.75, 0.5, 0.3]) { ctx.globalAlpha = 0.1 * appear; ctx.lineWidth = shoreW * k; ctx.stroke(); }
                ctx.globalAlpha = 0.9 * appear;
                ctx.fillStyle = css(mixRgb(waterCol, haze, fog * 0.6));
                ctx.fill();
                ctx.globalAlpha = 1;
              }
              continue;
            }
            // one continuous ribbon per visible stretch: the green banks first, then the water on top
            const ring = wt.rings[0];
            const runs: Array<Array<{ x: number; y: number; half: number; fog: number }>> = [];
            let run: Array<{ x: number; y: number; half: number; fog: number }> = [];
            for (const pt of ring) {
              const q = at(pt);
              if (!q) { if (run.length > 1) runs.push(run); run = []; continue; }
              const rz = pt[1] - camZ;
              // thin from cruise height: about a kilometre wide at most, never a road across the window
              run.push({ x: q[0], y: q[1], half: Math.min(13, Math.max(0.5, (wt.width * F) / rz / 2)), fog: Math.min(0.85, Math.max(0, rz / Z_FAR)) });
            }
            if (run.length > 1) runs.push(run);
            const ribbon = (pts: Array<{ x: number; y: number; half: number }>, k: number) => {
              const left: Array<[number, number]> = [], right: Array<[number, number]> = [];
              for (let n = 0; n < pts.length; n++) {
                const a = pts[Math.max(0, n - 1)], b = pts[Math.min(pts.length - 1, n + 1)];
                let dx = b.x - a.x, dy = b.y - a.y;
                const len = Math.hypot(dx, dy) || 1;
                dx /= len; dy /= len;
                // the river narrows away at both ends of what is drawn (no square stop)
                const ends = Math.min(n, pts.length - 1 - n) / Math.max(1, Math.min(14, pts.length * 0.2));
                // natural width: wider and narrower along the way, not a road
                const wobble = 0.8 + 0.35 * Math.sin(n * 0.7 + pts.length) * Math.sin(n * 0.23);
                const hw = pts[n].half * k * Math.min(1, ends) * wobble;
                left.push([pts[n].x - dy * hw, pts[n].y + dx * hw]);
                right.push([pts[n].x + dy * hw, pts[n].y - dx * hw]);
              }
              ctx.beginPath();
              left.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
              for (let n = right.length - 1; n >= 0; n--) ctx.lineTo(right[n][0], right[n][1]);
              ctx.closePath();
              ctx.fill();
            };
            for (const r of runs) {
              const fog = r.reduce((t, p) => t + p.fog, 0) / r.length;
              // soft banks: a wide faint green fading into the land, a closer stronger green, then the water
              // banks fading out in many small steps (two hard bands looked like a road's verges)
              ctx.fillStyle = css(mixRgb(shoreCol, haze, fog * 0.6));
              for (const k of [6, 4.8, 3.8, 3, 2.3, 1.7]) { ctx.globalAlpha = 0.09 * appear; ribbon(r, k); }
              ctx.fillStyle = css(mixRgb(waterCol, haze, fog * 0.6));
              ctx.globalAlpha = 0.45 * appear; ribbon(r, 1.25);
              ctx.globalAlpha = 0.8 * appear; ribbon(r, 0.9);
              ctx.globalAlpha = 1;
            }
          }
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'overlay';
        ctx.imageSmoothingEnabled = true;
        // the ground only (laid on the empty sky it would turn grey)
        const sy0 = (y0 / h) * shade.height;
        ctx.drawImage(shade, 0, sy0, shade.width, shade.height - sy0, 0, y0, w, h - y0);
        ctx.globalCompositeOperation = 'source-over';
        // Aerial perspective, in one pass. At night the air is dark: lights shine through further.
        let under = L.length - 1;
        while (under > 0 && L[under].startZ > camZ) under--;
        const overSea = L[under].terrain === 'ocean';
        hazeScale += ((overSea ? 0.5 : 1) - hazeScale) * Math.min(1, dt * 0.9);
        glintK += ((overSea ? 1 : 0) - glintK) * Math.min(1, dt * 0.9);
        const key = `${haze.join(',')}|${dark}|${h}|${w}|${hazeScale.toFixed(2)}`;
        if (key !== hazeKey || !hazeFill) {
          hazeKey = key;
          hazeFill = ctx.createLinearGradient(0, horizonY, 0, h);
          const STOPS = 28;
          for (let k = 0; k <= STOPS; k++) {
            // Stops crowd toward the horizon, where the haze changes fastest.
            const t = Math.pow(k / STOPS, 2.2);
            const zAt = (camH * F) / Math.max(0.5, t * (h - horizonY));
            const fog = Math.min(1, zAt / Z_FAR);
            hazeFill.addColorStop(t, `rgba(${haze[0]},${haze[1]},${haze[2]},${Math.pow(fog, dark ? 1.1 : 0.55) * (dark ? 0.5 : 0.92) * hazeScale})`);
          }
        }
        ctx.fillStyle = hazeFill;
        ctx.fillRect(0, y0, w, h - y0);
        const gl = live.current.glint;
        if (gl && glintK > 0.02) drawSeaGlint(ctx, gl, glintK, now / 1000, w, h, horizonY);
      }

      // ── Night lights: towns and roads across the land ────────────────────────────────────────────────────────
      if (dark && nightLights() && L.length) {
        const layerAt = (wz: number) => { let i = L.length - 1; while (i > 0 && L[i].startZ > wz) i--; return L[i]; };
        // from just under the nose (towns stay lit until they slide off the bottom of the window) to the horizon
        const z0 = Math.floor((camZ + Z_NEAR * 0.5) / TOWN_CELL) - 1, z1 = Math.floor((camZ + Z_FAR * 0.95) / TOWN_CELL);
        const town = (ci: number, cj: number) => {
          const wz = (ci + 0.5) * TOWN_CELL, lyr = layerAt(wz);
          const p = (BUILT[lyr.terrain] ?? 0.3) * regionBusy(lyr.region) * 0.55;
          if (cellHash(ci, cj, 1) > p) return null;
          const tx = (cj + 0.2 + cellHash(ci, cj, 2) * 0.6) * TOWN_CELL, tz0 = (ci + 0.2 + cellHash(ci, cj, 3) * 0.6) * TOWN_CELL;
          // no towns on the sea of a real coast (lights floated on the water leaving Rome)
          const cwT = realCoast() ? coastWorld.current : null;
          if (cwT) {
            const pz = cwT.route ? tz0 - camZ + routeUnits(cwT) : tz0;
            if (pz >= cwT.zMin && pz <= cwT.zMax && !landAt(cwT, tx, pz)) return null;
          }
          return { x: tx, z: tz0, size: 0.4 + cellHash(ci, cj, 4) * cellHash(ci, cj, 5) * 1.8, seed: ci * 7919 + cj * 104729 };
        };
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const glowPic = townGlow();
        // all roads in one dotted stroke per frame
        const roads = new Path2D();
        let roadFade = 0;
        for (let ci = z1; ci >= z0; ci--) {
          const rz = Math.max(Z_NEAR * 0.5, (ci + 0.5) * TOWN_CELL - camZ);
          const span = Math.ceil(((w / 2) * rz) / F / TOWN_CELL) + 1;
          const fade = Math.min(1, (Z_FAR - rz) / 9000) * (1 - Math.min(0.75, rz / Z_FAR));
          for (let cj = -span; cj <= span; cj++) {
            const t = town(ci, cj);
            if (!t) continue;
            const tz = t.z - camZ;
            if (tz <= Z_NEAR * 0.5) continue;
            const s = F / tz, cx = w / 2 + t.x * s, cy = horizonY + camH * s;
            // keep the town until its whole glow has left the window (its centre leaves first: the land went dark early)
            const reach = t.size * 900 * s * 1.6;
            if (cx + reach < 0 || cx - reach > w || cy - reach * 0.6 > h) continue;
            // roads to the town ahead and the town to the right: dotted sodium light
            for (const [ni, nj] of [[ci + 1, cj], [ci, cj + 1]] as const) {
              const n = town(ni, nj);
              if (!n || n.z - camZ <= Z_NEAR * 0.5) continue;
              const ns = F / (n.z - camZ);
              roads.moveTo(cx, cy);
              roads.lineTo(w / 2 + n.x * ns, horizonY + camH * ns);
              roadFade = Math.max(roadFade, fade);
            }
            // the town: a cluster of warm lights, a brighter centre
            const r = t.size * 900 * s, dots = 6 + Math.floor(t.size * 14);
            ctx.globalAlpha = 0.32 * fade;
            ctx.drawImage(glowPic, cx - r * 1.6, cy - r * 0.9, r * 3.2, r * 1.8);
            ctx.globalAlpha = 1;
            for (let k = 0; k < dots; k++) {
              const a = cellHash(t.seed, k, 6) * Math.PI * 2, d = Math.sqrt(cellHash(t.seed, k, 7));
              const dx = Math.cos(a) * d * r, dy = Math.sin(a) * d * r * (camH * s) / Math.max(1, F * 0.4) * 0.35;
              const b = 0.45 + cellHash(t.seed, k, 8) * 0.55;
              ctx.fillStyle = `rgba(255,${200 + Math.floor(cellHash(t.seed, k, 9) * 40)},${120 + Math.floor(cellHash(t.seed, k, 10) * 60)},${b * fade})`;
              const sz = Math.max(0.8, Math.min(2.4, s * 160));
              ctx.fillRect(cx + dx, cy + dy, sz, sz);
            }
          }
        }
        if (roadFade > 0) {
          ctx.strokeStyle = 'rgba(255,186,110,0.22)';
          ctx.lineWidth = 1;
          ctx.setLineDash([1, 3]);
          ctx.stroke(roads);
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // ── Cities in the distance: lights by night, streets and small buildings by day. Seen through the air, so they fade with
      // distance, and the mountains drawn after them stand in front. ───────────────────────────────────────────────
      cityWorld.current.forEach((c, id) => {
        const rz = c.z - camZ;
        if (rz < Z_NEAR * 6 || rz > Z_FAR) return;
        const s = F / rz;
        const cx = w / 2 + c.x * s, cy = horizonY + camH * s;
        const rx = c.r * s, ry = Math.max(1.5, rx * (camH / rz) * 1.3);
        if (cx + rx < 0 || cx - rx > w || cy - ry > h) return;
        const fog = Math.min(1, rz / Z_FAR);
        // Appear gently at the far edge, and melt away as the plane comes right up to it.
        const fade = Math.min(1, (Z_FAR - rz) / 8000) * Math.min(1, (rz - Z_NEAR * 6) / 9000);
        ctx.save();
        ctx.globalAlpha = fade;
        // The city's own uneven outline (lobes, never an oval), the same by day and by night.
        const ph1 = c.dots[0].b * 6.283, ph2 = c.dots[1].warm * 6.283, ph3 = c.dots[2].b * 6.283;
        const shaped = c.dots.map((d) => {
          const a = Math.atan2(d.v, d.u);
          const k = 1 + 0.4 * Math.sin(2 * a + ph1) + 0.22 * Math.sin(3 * a + ph2) + 0.12 * Math.sin(5 * a + ph3);
          return { x: cx + d.u * k * rx, y: cy + d.v * k * ry, b: d.b, warm: d.warm };
        });
        if (dark) {
          // A soft glow built from several pools of light where the lights are, then the lights themselves.
          const pool = Math.max(4, rx * 0.42);
          for (let i = 0; i < shaped.length; i += 7) {
            const pt = shaped[i];
            // Each pool is flattened like the ground it lies on.
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.scale(1, Math.max(0.15, ry / (rx || 1)));
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, pool);
            glow.addColorStop(0, `rgba(255,186,108,${0.16 * (1 - fog * 0.45)})`);
            glow.addColorStop(1, 'rgba(255,170,90,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(-pool, -pool, pool * 2, pool * 2);
            ctx.restore();
          }
          ctx.globalCompositeOperation = 'lighter';
          const n = Math.min(shaped.length, Math.max(12, Math.round(rx * 0.9)));
          const size = Math.max(1, 1.7 * (1 - fog * 0.4));
          for (let i = 0; i < n; i++) {
            const d = shaped[i];
            ctx.fillStyle = `rgba(255,${200 + Math.round(d.warm * 40)},${120 + Math.round(d.warm * 70)},${(0.45 + d.b * 0.5) * (1 - fog * 0.4)})`;
            ctx.fillRect(d.x, d.y, size, size * 0.8);
          }
        } else {
          // By day: the city's own uneven shape (each city's outline is pulled into lobes, never an oval), a patchwork
          // of streets and blocks flat on the ground, greying into the haze with distance. No standing buildings: sized
          // from the city they grew into giant white towers the plane flew through on the way down.
          const mist = 1 - fog * 0.6;
          const pts = [...shaped].sort((p, q) => p.y - q.y);
          const bw0 = Math.max(2, rx * 0.15), bh0 = Math.max(1, ry * 0.2);
          for (const pt of pts) {
            const g = mixRgb([150 + pt.b * 28, 144 + pt.b * 24, 134 + pt.warm * 18] as RGB, haze, fog * 0.7);
            ctx.fillStyle = `rgba(${g[0] | 0},${g[1] | 0},${g[2] | 0},${0.3 * mist})`;
            ctx.fillRect(pt.x - bw0 / 2, pt.y - bh0 / 2, bw0 * (0.6 + pt.warm * 0.8), bh0);
          }
        }
        ctx.restore();
        void id;
      });

      // ── Mountains and hills standing on that ground ────────────────────
      const coastHere = realCoast() ? coastWorld.current : null;
      const all: Array<{ p: Peak; layer: Layer; lm?: WorldLandmarkKind; cloud?: SkyCloud; ev?: { kind: EventKind; seed: number } }> = [];
      // Landmarks placed along the route come and pass with the real plane (in the faster scenery they rushed past in
      // seconds while their Look card stayed up for minutes: Everest 40 km away was never seen)
      const rcl = live.current.routeClock;
      if (rcl?.km) {
        const nowKm = Math.max(0, Math.min(1, rcl.t + (Date.now() - rcl.at) * rcl.perMs)) * rcl.km;
        landmarkWorld.current.forEach((l) => { if (l.along != null) l.z = camZ + (l.along - nowKm) * CITY_UNITS_PER_KM * spreadRef.current; });
      }
      const lms = Array.from(landmarkWorld.current.values()).filter((l) => l.z - camZ > Z_NEAR * 2 && l.z - camZ < Z_FAR);
      // Photo mode: the landmark in good view right now (close enough, inside the window), for the Take photo button
      let chance: string | null = null, chanceZ = Infinity;
      landmarkWorld.current.forEach((l, id) => {
        const rz = l.z - camZ;
        if (rz < Z_NEAR * 4 || rz > 44000 || Math.abs((l.x * F) / rz) > w * 0.42) return;
        if (rz < chanceZ) { chance = id; chanceZ = rz; }
      });
      if (chance !== photoChance.current) {
        photoChance.current = chance;
        window.dispatchEvent(new CustomEvent('lc-photo-chance', { detail: { id: chance } }));
      }
      // ordinary mountains keep clear of a landmark (Fuji stands alone; the pyramids on open sand)
      const nearLandmark = (p: Peak) => lms.some((l) => Math.abs(p.z - l.z) < LANDMARK_SIZE[l.kind].clear && Math.abs(p.x - l.x) < LANDMARK_SIZE[l.kind].clear * 1.4);
      L.forEach((layer, li) => {
        const newest = li === L.length - 1;
        for (let k = layer.peaks.length - 1; k >= 0; k--) {
          const p = layer.peaks[k];
          if (p.z - camZ < Z_NEAR) {
            // Only the terrain we're heading into keeps growing peaks.
            if (newest) spawnPeak(p, camZ, true);
            else { layer.peaks.splice(k, 1); continue; }
          }
          if (!nearLandmark(p) && !(realRelief() && highGroundRef.current)) all.push({ p, layer });
        }
      });
      // Mountains and hills where the real land is high and rugged (and nowhere else), from the elevation grid
      const hg = realRelief() ? highGroundRef.current : null;
      if (hg) {
        const list = reliefPeaks.current;
        const place = (p: Peak, far: boolean) => {
          p.z = camZ + (far ? Z_FAR * (0.85 + Math.random() * 0.15) : Z_NEAR * 3 + Math.random() * Z_FAR);
          const half = ((w / 2) * (p.z - camZ)) / F;
          p.x = (Math.random() * 2 - 1) * (half * 1.25 + 2000);
          p.h = 0;
          const cell = highGroundAt(hg.g, (p.z - hg.camZ) / CITY_UNITS_PER_KM, p.x / (CITY_UNITS_PER_KM * 0.7));
          if (!cell) return;
          // how mountainous: rising far above the ground around it, or simply very high
          const m = Math.max(Math.min(1, Math.max(0, (cell.rugged - 150) / 900)), Math.min(1, Math.max(0, (cell.height - 900) / 2200)) * 0.8);
          p.roll = Math.random(); p.tone = Math.random();
          if (Math.random() < m * 0.95) {
            p.hill = false;
            p.h = 500 + m * 1300 + Math.random() * 300;
            p.w = p.h * (2.3 + Math.random() * 1.6);
            p.snowy = cell.snow;
            p.kind = cell.snow && Math.random() < 0.75 ? 'snow' : Math.random() < 0.55 ? 'forest' : 'bare';
          } else if (cell.rugged > 70 && cell.rugged < 450 && Math.random() < 0.4) {
            p.hill = true; p.kind = undefined; p.snowy = false;
            p.h = 380 + Math.random() * 600;
            p.w = p.h * (4.5 + Math.random() * 3.5);
          }
        };
        const filling = list.length === 0;
        while (list.length < 200) { const p: Peak = { x: 0, z: 0, h: 0, w: 0, tone: 0, roll: 0, hill: false }; place(p, !filling); list.push(p); }
        for (const p of list) {
          if (p.z - camZ < Z_NEAR) place(p, true);
          if (p.h > 0 && !nearLandmark(p)) all.push({ p, layer: L[L.length - 1] });
        }
      }
      const under = L[L.length - 1];
      for (const l of lms) {
        const sz = LANDMARK_SIZE[l.kind];
        all.push({ p: { x: l.x, z: l.z, h: sz.h, w: sz.w, tone: 0, roll: 0, hill: false }, layer: under, lm: l.kind });
      }
      // the sea of clouds: keep as many as the cover asks for, spread over the view; passed ones go back to the horizon
      if (skyClouds() && camH > CAM_HEIGHT * 0.6) {
        const cover = Math.max(0, Math.min(100, live.current.cloudCover ?? 30));
        const want = Math.round((cover / 100) * 130);
        const list = skyCloudList.current;
        const place = (c: SkyCloud, far: boolean) => {
          // a few close below the plane, the rest a band towards the horizon; passed ones return to the horizon
          c.z = camZ + (far ? Z_FAR * (0.85 + Math.random() * 0.15) : Z_NEAR * 4 + Math.random() * Z_FAR);
          const halfView = ((w / 2) * (c.z - camZ)) / F;
          c.x = (Math.random() * 2 - 1) * (halfView * 1.3 + 3000);
          c.y = CLOUD_Y_MIN + Math.random() * (CLOUD_Y_MAX - CLOUD_Y_MIN);
          c.size = 1800 + Math.random() * Math.random() * 5200;
          c.seed = Math.floor(Math.random() * 1e6);
        };
        // the first ten close below the plane, the rest at the horizon (they come through as the plane flies)
        while (list.length < want) { const c = { x: 0, z: 0, y: 0, size: 0, seed: 0 }; place(c, list.length > 10); list.push(c); }
        if (list.length > want) list.length = Math.max(want, list.length - 2); // thin out gently
        for (const c of list) {
          if (c.z - camZ < 500) place(c, true); // gone under the nose: back to the horizon
          all.push({ p: { x: c.x, z: c.z, h: 0, w: 0, tone: 0, roll: 0, hill: false }, layer: L[L.length - 1], cloud: c });
        }
      }
      if (realEvents()) eventWorld.current.forEach((e) => {
        if (e.z - camZ > Z_NEAR * 2 && e.z - camZ < Z_FAR) all.push({ p: { x: e.x, z: e.z, h: 0, w: 0, tone: 0, roll: 0, hill: false }, layer: L[L.length - 1], ev: { kind: e.kind, seed: e.seed } });
      });
      all.sort((a, b) => b.p.z - a.p.z);
      const skyLight = cloudLight(dark, look.current.glow, haze);
      const proj = (x: number, z: number, y = 0): [number, number] => {
        const rz = Math.max(Z_NEAR, z - camZ), s = F / rz;
        return [w / 2 + x * s, horizonY + (camH - y) * s];
      };
      // smoke, ash and storm clouds are drawn after the horizon's haze band (it would cut a line through them)
      const lateEvents: (readonly [{ kind: EventKind; seed: number }, number, number, number])[] = [];
      for (const { p, layer, lm, cloud, ev } of all) {
        const rz = p.z - camZ;
        if (rz > Z_FAR) continue;
        const s = F / rz;
        const baseY = horizonY + camH * s;
        if (ev) {
          // a volcano stands as the shared volcano landmark, its plume rising from the summit
          if (ev.kind === 'volcano') drawWorldLandmark(ctx, 'volcano', { night: layer.night, snow: layer.snow, leaf: layer.leaf, rock: layer.rock }, { x: p.x, z: p.z, cx: w / 2 + p.x * s, baseY, s }, proj, Math.pow(Math.min(1, rz / Z_FAR), 0.7), haze, Math.min(1, (Z_FAR - rz) / 8000));
          const evArgs = [ev, p.x, p.z, rz] as const;
          lateEvents.push(evArgs);
          continue;
        }
        if (cloud) {
          drawSkyCloud(ctx, cloud, proj, camZ, F, skyLight, haze, Math.pow(Math.min(1, rz / Z_FAR), 0.8), Math.min(1, (Z_FAR - rz) / 7000), dark);
          continue;
        }
        if (lm) {
          const lfog = Math.pow(Math.min(1, rz / Z_FAR), 0.7);
          const lfade = Math.min(1, (Z_FAR - rz) / 8000);
          // during the descent a landmark shrinks with the camera (as the mountains do), keeping its shape, so it
          // never towers over the cockpit
          const k = Math.min(1, (camH * 0.85) / Math.max(1, LANDMARK_SIZE[lm].h));
          const lproj: typeof proj = k < 1 ? (x, z, y = 0) => proj(p.x + (x - p.x) * k, p.z + (z - p.z) * k, y * k) : proj;
          drawWorldLandmark(ctx, lm, { night: layer.night, snow: layer.snow, leaf: layer.leaf, rock: layer.rock }, { x: p.x, z: p.z, cx: w / 2 + p.x * s, baseY, s }, lproj, lfog, haze, lfade);
          continue;
        }
        // On a real coast, mountains and hills stand only on the land (they stood in the open sea)
        const pz = coastHere?.route ? p.z - camZ + routeUnits(coastHere) : p.z;
        if (coastHere && coastHere.zMin <= pz && pz <= coastHere.zMax && !landAt(coastHere, p.x, pz)) continue;
        // Always well below the plane: during the descent (the camera comes down to a fifth of its height) mountains and
        // hills shrink with it, keeping their shape, instead of towering over the cockpit.
        const shrink = Math.min(1, (camH * 0.7) / p.h);
        // low in the descent they also grow broader and fewer: shrunk evenly they read as rows of sharp cones from
        // close to the ground
        const low = Math.max(0, 1 - camH / (CAM_HEIGHT * 0.95));
        if (low > 0 && !p.hill && ((p.roll * 997) % 1) < low * 0.55) continue;
        const topY = baseY - p.h * shrink * (1 - low * 0.35) * s;
        const cx = w / 2 + p.x * s;
        const half = (p.w / 2) * Math.sqrt(shrink) * (1 + low * 0.3) * s;
        if (cx + half < 0 || cx - half > w || topY > h) continue;
        const fog = Math.pow(Math.min(1, rz / Z_FAR), 0.7);
        const fade = Math.min(1, (Z_FAR - rz) / 8000); // appear gently at the far edge
        if (p.hill) {
          // A soft dome in the colour of the ground it stands on (sand in the desert, green in farmland, white in snow;
          // it was always grassy teal, pasted onto brown desert), darkened at night like the mountains, with a few soft
          // ridges down its shaded side so it matches their faceted style.
          const t = layer.terrain;
          const under = layer.ground ?? layer.land;
          const groundTone: RGB = layer.ground ? mixRgb(under, t === 'ice' || t === 'tundra' ? layer.snow : layer.rock, 0.12 + p.tone * 0.12)
            : t === 'desert' || t === 'salt-flats' || layer.range.floor === 'arid' ? mixRgb(layer.land, layer.rock, 0.25 + p.tone * 0.15)
            : t === 'ice' || t === 'tundra' ? mixRgb(layer.snow, layer.rock, 0.18 + p.tone * 0.1)
              : t === 'mountains' ? mixRgb(layer.rock, layer.leaf, 0.3 + p.tone * 0.2)
                : mixRgb(layer.land, layer.leaf, 0.45 + p.tone * 0.25);
          const g = layer.night ? mixRgb(groundTone, [10, 14, 28], 0.55) : groundTone;
          const crest = mixRgb(mixRgb(g, [224, 232, 176], 0.34), haze, fog * 0.85);
          const foot = mixRgb(g, haze, Math.min(1, fog + 0.15));
          const dome = new Path2D();
          dome.moveTo(cx - half, baseY);
          dome.bezierCurveTo(cx - half * 0.62, baseY, cx - half * 0.5, topY, cx, topY);
          dome.bezierCurveTo(cx + half * 0.5, topY, cx + half * 0.62, baseY, cx + half, baseY);
          dome.closePath();
          const body = ctx.createLinearGradient(0, topY, 0, baseY);
          body.addColorStop(0, css(crest));
          body.addColorStop(0.7, css(mixRgb(crest, foot, 0.6)));
          body.addColorStop(1, `rgba(${foot[0]},${foot[1]},${foot[2]},0.35)`);
          ctx.globalAlpha = fade;
          ctx.fillStyle = body;
          ctx.fill(dome);
          const flank = ctx.createLinearGradient(cx - half * 0.2, 0, cx + half, 0);
          flank.addColorStop(0, 'rgba(18,28,24,0)');
          flank.addColorStop(1, `rgba(18,28,24,${0.45 * (1 - fog)})`);
          ctx.fillStyle = flank;
          ctx.fill(dome);
          // soft ridges, like gentle versions of the mountains' facets: from near the crest down the shaded side
          ctx.save();
          ctx.clip(dome);
          const ridge = mixRgb(g, [8, 12, 20], 0.35);
          ctx.strokeStyle = `rgba(${ridge[0]},${ridge[1]},${ridge[2]},${0.28 * (1 - fog)})`;
          ctx.lineWidth = Math.max(1, half * 0.035);
          ctx.lineCap = 'round';
          const H = baseY - topY;
          for (let k = 0; k < 4; k++) {
            const u = (((p.roll * 9973 + k * 0.29) % 1) - 0.35) * 1.3; // -0.45 .. 0.85 of the half width: mostly the shaded side
            const sx = cx + u * half * 0.35, sy = topY + H * (0.12 + Math.abs(u) * 0.18);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + u * half * 0.25, sy + H * 0.45, sx + u * half * 0.7, baseY);
            ctx.stroke();
          }
          // and the lit side catches a little light along its upper edge
          const lit = ctx.createLinearGradient(cx - half, 0, cx, 0);
          lit.addColorStop(0, 'rgba(255,255,255,0)');
          lit.addColorStop(1, `rgba(255,255,255,${(layer.night ? 0.05 : 0.1) * (1 - fog)})`);
          ctx.fillStyle = lit;
          ctx.fillRect(cx - half, topY, half, H * 0.5);
          ctx.restore();
          ctx.globalAlpha = 1;
          continue;
        }
        const kind: PeakKind = p.kind ?? (p.roll < layer.range.snow ? 'snow' : p.roll < layer.range.snow + layer.range.green ? 'forest' : 'bare');
        // A peak's kind comes from its own roll; shape detail uses a second, independent one.
        drawPeak(ctx, kind, (p.roll * 7919) % 1, p.tone, { rock: layer.rock, leaf: layer.night ? mixRgb(layer.leaf, [10, 14, 28], 0.55) : layer.leaf, snow: layer.snow, warm: layer.range.floor === 'arid', night: layer.night, capped: p.snowy ?? layer.range.snow >= 0.2 }, cx, baseY, topY, half, fog, haze, fade);
      }

      // Soft band where the land meets the sky
      const band = ctx.createLinearGradient(0, horizonY - 6, 0, horizonY + h * 0.06);
      band.addColorStop(0, `rgba(${haze[0]},${haze[1]},${haze[2]},0)`);
      band.addColorStop(0.4, `rgba(${haze[0]},${haze[1]},${haze[2]},0.55)`);
      band.addColorStop(1, `rgba(${haze[0]},${haze[1]},${haze[2]},0)`);
      ctx.fillStyle = band;
      ctx.fillRect(0, horizonY - 6, w, h * 0.06 + 6);
      for (const [ev, ex, ez, rz] of lateEvents) {
        drawSceneEvent(ctx, ev.kind, ev.seed, ex, ez, proj, (zz) => F / Math.max(Z_NEAR, zz - camZ), now / 1000, dark, haze, Math.pow(Math.min(1, rz / Z_FAR), 0.8), Math.min(1, (Z_FAR - rz) / 8000), LANDMARK_SIZE.volcano.h);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
