'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ScenePalette } from '@/components/world-flight/arrival-scene/types';
import { hexToRgb, mixRgb } from '@/components/live-room/flight/cockpit-sky';
import { tileFor, type Terrain } from '@/components/live-room/flight/cockpit-ground';
import { farmTexture, macroTexture } from '@/components/live-room/flight/ground-texture';

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
interface Peak { x: number; z: number; h: number; w: number; tone: number; hill: boolean }

interface Layer {
  terrain: Terrain;
  region: string | null;
  /** The terrain texture at full, half, quarter… detail (mip levels), as patterns. */
  patterns: CanvasPattern[];
  macroAlpha: number;
  /** World depth where this terrain begins (the previous one ends). */
  startZ: number;
  peaks: Peak[];
  land: RGB;
  rock: RGB;
  snow: RGB;
  night: boolean;
}

const CAM_HEIGHT = 3200;     // cruise: well above the highest peaks, looking down on them
const HORIZON = 0.58;        // horizon line, fraction of the canvas height
const Z_FAR = 60000;
const Z_NEAR = 900;
const CRUISE_SPEED = 4200;   // world units per second at speed 1
const TILE_WORLD = 14;       // one texture pixel covers this many world units
const MACRO_WORLD = 14 * 41; // the light/dark layer: a scale unrelated to the ground's, so no repeat lines up
const SHORE = 4200;          // world units over which one terrain blends into the next

/** Full detail plus halved copies, so distant ground never shimmers (mip levels). */
const textureCache = new Map<string, HTMLCanvasElement[]>();

function mipChain(src: CanvasImageSource & { width: number; height: number }): HTMLCanvasElement[] {
  const levels: HTMLCanvasElement[] = [];
  let w = src.width, h = src.height;
  let prev: CanvasImageSource = src;
  for (let k = 0; k < 6 && w >= 8 && h >= 8; k++) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    g.drawImage(prev, 0, 0, w, h);
    levels.push(c);
    prev = c;
    w = Math.floor(w / 2); h = Math.floor(h / 2);
  }
  return levels;
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
}

const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

export function CockpitWorld({ terrain, region, palette, night, speed }: { terrain: Terrain; region?: string | null; palette: ScenePalette; night: boolean; speed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const live = useRef({ speed });
  live.current = { speed };
  const cam = useRef(0);
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
    const rockBase: RGB = mixRgb(land, [92, 90, 98], 0.7);
    const style = {
      land,
      rock: night ? mixRgb(rockBase, [10, 14, 28], 0.55) : rockBase,
      snow: (night ? [150, 160, 185] : [244, 247, 252]) as RGB,
      night,
    };

    const newest = layers.current[layers.current.length - 1];
    const same = !!newest && newest.terrain === terrain && newest.region === reg;
    const layer: Layer = same ? newest : {
      terrain,
      region: reg,
      patterns: [],
      macroAlpha: terrain === 'ocean' ? 0.22 : terrain === 'ice' ? 0.18 : 0.4,
      startZ: newest ? cam.current + Z_FAR : -Infinity,
      peaks: [],
      ...style,
    };
    Object.assign(layer, style);

    // Texture: generated farmland/city, or the terrain's SVG tile; cached.
    const key = `${terrain}|${reg}|${night}|${palette.terrainTop}|${palette.waterTop}|${palette.foliage}`;
    const apply = (levels: HTMLCanvasElement[]) => {
      layer.patterns = levels.map((c) => ctx.createPattern(c, 'repeat')).filter((p): p is CanvasPattern => !!p);
    };
    const cached = textureCache.get(key);
    if (cached) apply(cached);
    else if (terrain === 'farmland' || terrain === 'hills') {
      const levels = mipChain(farmTexture(reg, palette, night));
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
        const levels = mipChain(c);
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
          const pk: Peak = { x: 0, z: 0, h: 0, w: 0, tone: 0, hill };
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

    let w = 0, h = 0;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let drawnSpeed = live.current.speed;

    const paintRow = (layer: Layer, y: number, z: number, F: number, camZ: number, alpha: number, withMacro = true) => {
      if (!layer.patterns.length) return;
      const s = (F / z) * TILE_WORLD;              // screen px per full-detail texel
      // Pick the detail level whose texels are about a pixel wide.
      let lvl = 0;
      while (lvl < layer.patterns.length - 1 && s * (1 << lvl) < 0.8) lvl++;
      const pat = layer.patterns[lvl];
      const k = s * (1 << lvl);
      // Offset sideways so the texture's wrap line (a farm lane) isn't dead ahead.
      pat.setTransform(new DOMMatrix([k, 0, 0, k, w / 2 - 330 * s, y - ((camZ + z) / TILE_WORLD) * s]));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pat;
      ctx.fillRect(0, y, w, 2);
      if (macro && withMacro) {
        const m = (F / z) * MACRO_WORLD;
        macro.setTransform(new DOMMatrix([m, 0, 0, m, w / 2 + 3100 * (F / z), y - ((camZ + z) / MACRO_WORLD) * m]));
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = alpha * layer.macroAlpha;
        ctx.fillStyle = macro;
        ctx.fillRect(0, y, w, 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
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
        for (let y = Math.ceil(horizonY) + 1; y < h; y += 2) {
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
          // Aerial perspective. At night the air is dark: lights shine through further.
          const fog = Math.min(1, z / Z_FAR);
          ctx.fillStyle = `rgba(${haze[0]},${haze[1]},${haze[2]},${Math.pow(fog, dark ? 0.9 : 0.55) * (dark ? 0.7 : 0.92)})`;
          ctx.fillRect(0, y, w, 2);
        }
      }

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
        const tone = mixRgb(layer.rock, [128, 124, 116], p.tone * 0.25);
        const lit = mixRgb(mixRgb(tone, [236, 228, 212], 0.3), haze, fog);
        const shade = mixRgb(mixRgb(tone, [18, 20, 32], 0.4), haze, fog * 0.9);
        const cap = mixRgb(layer.snow, haze, fog * 0.8);
        ctx.globalAlpha = fade;
        ctx.fillStyle = css(lit);
        ctx.beginPath(); ctx.moveTo(cx - half, baseY); ctx.lineTo(cx, topY); ctx.lineTo(cx, baseY); ctx.fill();
        ctx.fillStyle = css(shade);
        ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx + half, baseY); ctx.lineTo(cx, baseY); ctx.fill();
        // snow cap on the upper third, with a ragged snow line
        const k = 0.32;
        const sy = topY + (baseY - topY) * k;
        ctx.fillStyle = css(cap);
        ctx.beginPath();
        ctx.moveTo(cx - half * k, sy);
        ctx.lineTo(cx, topY);
        ctx.lineTo(cx + half * k, sy);
        ctx.lineTo(cx + half * k * 0.45, sy - (sy - topY) * 0.18);
        ctx.lineTo(cx, sy + (baseY - topY) * 0.04);
        ctx.lineTo(cx - half * k * 0.5, sy - (sy - topY) * 0.22);
        ctx.fill();
        ctx.globalAlpha = 1;
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
