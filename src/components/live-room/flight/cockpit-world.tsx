'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ScenePalette } from '@/components/world-flight/arrival-scene/types';
import { hexToRgb, mixRgb } from '@/components/live-room/flight/cockpit-sky';
import { drawPeak, type PeakKind } from '@/components/live-room/flight/peak-art';
import { tileFor, type Terrain } from '@/components/live-room/flight/cockpit-ground';
import { desertTexture, farmTexture, forestTexture, iceTexture, macroTexture, mountainTexture, oceanTexture, rangeFor, type RangeMix } from '@/components/live-room/flight/ground-texture';

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
interface Peak { x: number; z: number; h: number; w: number; tone: number; roll: number; hill: boolean }

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
const MACRO_WORLD = 14 * 41; // the light/dark layer: a scale unrelated to the ground's, so no repeat lines up
const SHORE = 4200;          // world units over which one terrain blends into the next

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
    p.h = 900 + Math.random() * 1800;        // always below the camera
    p.w = p.h * (1.6 + Math.random() * 1.2);
  }
  p.tone = Math.random();
  p.roll = Math.random();
}

const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

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

export function CockpitWorld({ terrain, region, palette, night, speed, paused = false, cities, glint }: { terrain: Terrain; region?: string | null; palette: ScenePalette; night: boolean; speed: number; paused?: boolean; cities?: DistantCity[]; glint?: SeaGlint }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const live = useRef({ speed, paused, glint });
  live.current = { speed, paused, glint };
  const cam = useRef(0);
  // Cities seen in the distance, fixed on the ground once they come into range, so they scroll with it.
  const cityWorld = useRef(new Map<string, { z: number; x: number; r: number; dots: ReturnType<typeof cityDots> }>());
  useEffect(() => {
    const map = cityWorld.current;
    const keep = new Set<string>();
    for (const c of cities ?? []) {
      keep.add(c.id);
      if (!map.has(c.id)) map.set(c.id, { z: cam.current + c.ahead * CITY_UNITS_PER_KM, x: c.lateral * CITY_UNITS_PER_KM * 0.7, r: c.size * CITY_UNITS_PER_KM, dots: cityDots(c.id) });
    }
    for (const id of Array.from(map.keys())) if (!keep.has(id)) map.delete(id);
  }, [cities]);
  // Terrains along the route, oldest first.
  const layers = useRef<Layer[]>([]);
  const look = useRef<{ haze: RGB; night: boolean }>({ haze: [159, 184, 208], night });

  // ── Build (or restyle) the terrain layer when what's below changes ─────
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const reg = region ?? null;
    look.current = { haze: hexToRgb(palette.skyBottom.startsWith('#') ? palette.skyBottom : '#9fb8d0'), night };
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
      layer.rip = {
        w: rc.w,
        h: rc.h,
        levels: rc.levels.map((row) => row.flatMap((c) => {
          const pat = ctx.createPattern(c, 'repeat');
          return pat ? [{ pat, w: c.width, h: c.height }] : [];
        })),
      };
    };
    const cached = textureCache.get(key);
    if (cached) apply(cached);
    else if (terrain === 'farmland' || terrain === 'hills' || terrain === 'desert' || terrain === 'ocean' || terrain === 'mountains' || terrain === 'forest' || terrain === 'ice') {
      const levels = ripChain(terrain === 'desert' ? desertTexture(palette, night) : terrain === 'ocean' ? oceanTexture(palette, night) : terrain === 'mountains' ? mountainTexture(palette, night, range.floor) : terrain === 'forest' ? forestTexture(palette, night) : terrain === 'ice' ? iceTexture(palette, night) : farmTexture(reg, palette, night));
      textureCache.set(key, levels);
      apply(levels);
    } else {
      // SVG tiles are rasterised once: an SVG image used as a pattern can be
      // re-rendered on every fill, which froze the flight near coasts.
      const img = new Image();
      img.onload = () => {
        const size = Math.max(64, img.naturalWidth || 256);
        const c = document.createElement('canvas');
        c.width = size; c.height = Math.max(64, img.naturalHeight || size);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        const levels = ripChain(c);
        textureCache.set(key, levels);
        apply(levels);
      };
      img.src = tileFor(terrain, palette, night).replace(/^url\("/, '').replace(/"\)$/, '');
    }
    if (textureCache.size > 24) {
      const oldest = textureCache.keys().next().value;
      if (oldest) textureCache.delete(oldest);
    }

    if (!same) {
      if (terrain === 'mountains' || terrain === 'hills') {
        const hill = terrain === 'hills';
        for (let i = 0; i < (hill ? 190 : 160); i++) {
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
    const macro = ctx.createPattern(macroTexture(), 'repeat');

    let w = 0, h = 0, rowH = 2;
    // One matrix reused for every row (a new one per row, twice, kept the garbage collector busy mid-flight).
    const mtx = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    let hazeKey = '';
    let hazeFill: CanvasGradient | null = null;
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      // The ground is soft, hazy and always moving: it never needs a sharp display's full resolution, and drawing
      // four times the pixels every frame is what made the flight stutter on big or high-density screens.
      const dpr = Math.max(0.5, Math.min(1.25, window.devicePixelRatio || 1, 1600 / Math.max(1, w)));
      // Rows exactly 2 device pixels tall, so neighbouring rows never overlap
      // on half-pixels (overlaps doubled the haze into faint lines).
      rowH = 2 / dpr;
      hazeKey = '';
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    const paintRow = (layer: Layer, y: number, z: number, F: number, camZ: number, alpha: number, withMacro = true) => {
      const rip = layer.rip;
      if (!rip || !rip.levels.length) return;
      const s = (F / z) * TILE_WORLD;              // screen px per full-detail texel, sideways
      // Sideways: the copy whose texels are about a pixel wide.
      let li = 0;
      while (li < rip.levels.length - 1 && s * (1 << li) < 0.8) li++;
      const row = rip.levels[li];
      // In depth: this row covers `span` texture rows; use the copy already averaged over about that many.
      const span = (z * z * rowH) / (CAM_HEIGHT * F * TILE_WORLD);
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
      ctx.globalAlpha = alpha;
      ctx.fillStyle = lv.pat;
      ctx.fillRect(0, y, w, rowH);
      if (macro && withMacro) {
        const m = (F / z) * MACRO_WORLD;
        mtx.a = m; mtx.d = m; mtx.e = w / 2 + 3100 * (F / z); mtx.f = y - (((camZ + z) / MACRO_WORLD) % 256) * m;
        macro.setTransform(mtx);
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = alpha * layer.macroAlpha;
        ctx.fillStyle = macro;
        ctx.fillRect(0, y, w, rowH);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      // A video is playing (or a video is full screen; the whole room in full screen keeps moving): the scenery holds still so the video gets the whole machine.
      if (live.current.paused || (document.fullscreenElement && document.fullscreenElement !== document.documentElement)) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      drawnSpeed += (live.current.speed - drawnSpeed) * Math.min(1, dt * 1.2);
      const camZ = cam.current + drawnSpeed * CRUISE_SPEED * dt * (reduce ? 0.1 : 1);
      cam.current = camZ;
      const L = layers.current;
      // Forget terrains the plane has fully left behind.
      while (L.length > 1 && L[1].startZ + SHORE < camZ) L.shift();

      const { haze, night: dark } = look.current;
      const horizonY = h * HORIZON;
      const F = w * 0.9;
      ctx.clearRect(0, 0, w, h);

      // ── Ground, row by row at its true depth ───────────────────────────
      if (L.length) {
        const y0 = (Math.ceil((horizonY + 1) / rowH)) * rowH;
        for (let y = y0; y < h; y += rowH) {
          const z = (CAM_HEIGHT * F) / (y - horizonY);   // world depth of this row
          const wz = camZ + z;
          let i = L.length - 1;
          while (i > 0 && L[i].startZ > wz) i--;
          const t = i > 0 ? (wz - L[i].startZ) / SHORE : 1;
          if (t < 1 && i > 0) {
            // Shoreline: the old terrain, the new one fading in, one overlay pass.
            paintRow(L[i - 1], y, z, F, camZ, 1);
            paintRow(L[i], y, z, F, camZ, t * t * (3 - 2 * t), false);
          } else {
            paintRow(L[i], y, z, F, camZ, 1);
          }
        }
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
            const zAt = (CAM_HEIGHT * F) / Math.max(0.5, t * (h - horizonY));
            const fog = Math.min(1, zAt / Z_FAR);
            hazeFill.addColorStop(t, `rgba(${haze[0]},${haze[1]},${haze[2]},${Math.pow(fog, dark ? 1.1 : 0.55) * (dark ? 0.5 : 0.92) * hazeScale})`);
          }
        }
        ctx.fillStyle = hazeFill;
        ctx.fillRect(0, y0, w, h - y0);
        const gl = live.current.glint;
        if (gl && glintK > 0.02) drawSeaGlint(ctx, gl, glintK, now / 1000, w, h, horizonY);
      }

      // ── Cities in the distance: lights by night, streets and small buildings by day. Seen through the air, so they fade with
      // distance, and the mountains drawn after them stand in front. ───────────────────────────────────────────────
      cityWorld.current.forEach((c, id) => {
        const rz = c.z - camZ;
        if (rz < Z_NEAR * 6 || rz > Z_FAR) return;
        const s = F / rz;
        const cx = w / 2 + c.x * s, cy = horizonY + CAM_HEIGHT * s;
        const rx = c.r * s, ry = Math.max(1.5, rx * (CAM_HEIGHT / rz) * 1.3);
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
          // of streets and blocks on the ground, and small buildings standing up from it, back ones first. All of it
          // greys into the haze with distance.
          const mist = 1 - fog * 0.6;
          const pts = [...shaped].sort((p, q) => p.y - q.y);
          const bw0 = Math.max(2, rx * 0.15), bh0 = Math.max(1, ry * 0.2);
          for (const pt of pts) {
            const g = mixRgb([150 + pt.b * 28, 144 + pt.b * 24, 134 + pt.warm * 18] as RGB, haze, fog * 0.7);
            ctx.fillStyle = `rgba(${g[0] | 0},${g[1] | 0},${g[2] | 0},${0.3 * mist})`;
            ctx.fillRect(pt.x - bw0 / 2, pt.y - bh0 / 2, bw0 * (0.6 + pt.warm * 0.8), bh0);
          }
          const unit = Math.max(0.8, rx * 0.03);
          for (const pt of pts) {
            if (pt.b < 0.4) continue;
            // Taller towards the middle of the city, as real skylines are.
            const centre = 1 - Math.min(1, Math.hypot((pt.x - cx) / (rx || 1), (pt.y - cy) / (ry || 1)));
            const tall = unit * (1.2 + pt.b * pt.b * 4 + centre * 5);
            const wide = Math.max(1, unit * (0.9 + pt.warm * 1.1));
            const lit = mixRgb([206, 212, 220], haze, fog * 0.75);
            const side = mixRgb([140, 148, 160], haze, fog * 0.75);
            ctx.fillStyle = `rgba(${lit[0] | 0},${lit[1] | 0},${lit[2] | 0},${0.85 * mist})`;
            ctx.fillRect(pt.x - wide / 2, pt.y - tall, wide * 0.6, tall);
            ctx.fillStyle = `rgba(${side[0] | 0},${side[1] | 0},${side[2] | 0},${0.85 * mist})`;
            ctx.fillRect(pt.x - wide / 2 + wide * 0.6, pt.y - tall, wide * 0.4, tall);
          }
        }
        ctx.restore();
        void id;
      });

      // ── Mountains and hills standing on that ground ────────────────────
      const all: Array<{ p: Peak; layer: Layer }> = [];
      L.forEach((layer, li) => {
        const newest = li === L.length - 1;
        for (let k = layer.peaks.length - 1; k >= 0; k--) {
          const p = layer.peaks[k];
          if (p.z - camZ < Z_NEAR) {
            // Only the terrain we're heading into keeps growing peaks.
            if (newest) spawnPeak(p, camZ, true);
            else { layer.peaks.splice(k, 1); continue; }
          }
          all.push({ p, layer });
        }
      });
      all.sort((a, b) => b.p.z - a.p.z);
      for (const { p, layer } of all) {
        const rz = p.z - camZ;
        if (rz > Z_FAR) continue;
        const s = F / rz;
        const baseY = horizonY + CAM_HEIGHT * s;
        const topY = baseY - p.h * s;
        const cx = w / 2 + p.x * s;
        const half = (p.w / 2) * s;
        if (cx + half < 0 || cx - half > w || topY > h) continue;
        const fog = Math.pow(Math.min(1, rz / Z_FAR), 0.7);
        const fade = Math.min(1, (Z_FAR - rz) / 8000); // appear gently at the far edge
        if (p.hill) {
          // A soft dome: one smooth silhouette, lit from above, melting into the
          // fields at its foot, with the shaded flank away from the light.
          const grass = mixRgb(layer.land, [86, 118, 64], 0.5 + p.tone * 0.25);
          const g = layer.night ? mixRgb(grass, [10, 14, 28], 0.55) : grass;
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
          ctx.globalAlpha = 1;
          continue;
        }
        const kind: PeakKind = p.roll < layer.range.snow ? 'snow' : p.roll < layer.range.snow + layer.range.green ? 'forest' : 'bare';
        // A peak's kind comes from its own roll; shape detail uses a second, independent one.
        drawPeak(ctx, kind, (p.roll * 7919) % 1, p.tone, { rock: layer.rock, leaf: layer.night ? mixRgb(layer.leaf, [10, 14, 28], 0.55) : layer.leaf, snow: layer.snow, warm: layer.range.floor === 'arid', night: layer.night }, cx, baseY, topY, half, fog, haze, fade);
      }

      // Soft band where the land meets the sky
      const band = ctx.createLinearGradient(0, horizonY - 6, 0, horizonY + h * 0.06);
      band.addColorStop(0, `rgba(${haze[0]},${haze[1]},${haze[2]},0)`);
      band.addColorStop(0.4, `rgba(${haze[0]},${haze[1]},${haze[2]},0.55)`);
      band.addColorStop(1, `rgba(${haze[0]},${haze[1]},${haze[2]},0)`);
      ctx.fillStyle = band;
      ctx.fillRect(0, horizonY - 6, w, h * 0.06 + 6);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
