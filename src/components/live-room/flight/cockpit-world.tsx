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
 *  - mountains: 3D peaks (x, z, height, width) whose bases sit on that same
 *    ground and which approach at exactly the ground's speed
 *  - haze: colour fades to the horizon with distance
 * Anything at the horizon is effectively infinitely far away, so it stays put.
 */

type RGB = [number, number, number];
interface Peak { x: number; z: number; h: number; w: number; tone: number }

const CAM_HEIGHT = 3200;     // cruise: well above the highest peaks, looking down on them
const HORIZON = 0.58;        // horizon line, fraction of the canvas height
const Z_FAR = 60000;
const Z_NEAR = 900;
const CRUISE_SPEED = 4200;   // world units per second at speed 1
const TILE_WORLD = 14;       // one texture pixel covers this many world units
const MACRO_WORLD = 14 * 41; // the light/dark layer: a scale unrelated to the ground's, so no repeat lines up

function spawnPeak(p: Peak, camZ: number, far: boolean) {
  p.x = (Math.random() * 2 - 1) * 42000;
  p.z = camZ + (far ? Z_FAR * (0.8 + Math.random() * 0.2) : 3000 + Math.random() * Z_FAR);
  p.h = 900 + Math.random() * 1800;          // always below the camera
  p.w = p.h * (1.6 + Math.random() * 1.2);
  p.tone = Math.random();
}

const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

export function CockpitWorld({ terrain, region, palette, night, speed }: { terrain: Terrain; region?: string | null; palette: ScenePalette; night: boolean; speed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const live = useRef({ speed });
  // Kept across texture rebuilds (time of day, region) so the ground never jumps.
  const cam = useRef(0);
  live.current = { speed };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Terrain texture → pattern. Farmland is generated for the region below;
    // other terrains use their SVG tile.
    let pattern: CanvasPattern | null = null;
    if (terrain === 'farmland') {
      pattern = ctx.createPattern(farmTexture(region, palette, night), 'repeat');
    } else {
      const img = new Image();
      img.onload = () => { pattern = ctx.createPattern(img, 'repeat'); };
      img.src = tileFor(terrain, palette, night).replace(/^url\("/, '').replace(/"\)$/, '');
    }
    const macro = ctx.createPattern(macroTexture(), 'repeat');
    const macroAlpha = terrain === 'ocean' ? 0.22 : terrain === 'ice' ? 0.18 : 0.4;

    const haze = hexToRgb(palette.skyBottom.startsWith('#') ? palette.skyBottom : '#9fb8d0');
    const land = hexToRgb(palette.terrainTop);
    const rockBase: RGB = mixRgb(land, [92, 90, 98], 0.7);
    const rock: RGB = night ? mixRgb(rockBase, [10, 14, 28], 0.55) : rockBase;
    const snow: RGB = night ? [150, 160, 185] : [244, 247, 252];

    const peaks: Peak[] = [];
    if (terrain === 'mountains') {
      for (let i = 0; i < 160; i++) {
        const p = { x: 0, z: 0, h: 0, w: 0, tone: 0 };
        spawnPeak(p, 0, false);
        peaks.push(p);
      }
    }

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

    let camZ = cam.current;
    let raf = 0;
    let last = performance.now();
    let drawnSpeed = live.current.speed;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      drawnSpeed += (live.current.speed - drawnSpeed) * Math.min(1, dt * 1.2);
      camZ += drawnSpeed * CRUISE_SPEED * dt * (reduce ? 0.1 : 1);
      cam.current = camZ;

      const horizonY = h * HORIZON;
      const F = w * 0.9;
      ctx.clearRect(0, 0, w, h);

      // ── Ground, row by row at its true depth ───────────────────────────
      const ROW = 2;
      for (let y = Math.ceil(horizonY) + 1; y < h; y += ROW) {
        const dy = y - horizonY;
        const z = (CAM_HEIGHT * F) / dy;            // world depth of this row
        const fog = Math.min(1, z / Z_FAR);
        if (pattern) {
          const s = (F / z) * TILE_WORLD;           // texture → screen scale at this depth
          // Offset sideways so the texture's wrap line (a farm lane) isn't dead ahead.
          pattern.setTransform(new DOMMatrix([s, 0, 0, s, w / 2 - 330 * s, y - ((camZ + z) / TILE_WORLD) * s]));
          ctx.fillStyle = pattern;
          ctx.fillRect(0, y, w, ROW);
          if (macro) {
            const m = (F / z) * MACRO_WORLD;
            macro.setTransform(new DOMMatrix([m, 0, 0, m, w / 2 + 3100 * (F / z), y - ((camZ + z) / MACRO_WORLD) * m]));
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = macroAlpha;
            ctx.fillStyle = macro;
            ctx.fillRect(0, y, w, ROW);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
          }
        }
        // aerial perspective
        ctx.fillStyle = `rgba(${haze[0]},${haze[1]},${haze[2]},${Math.pow(fog, 0.55) * 0.92})`;
        ctx.fillRect(0, y, w, ROW);
      }

      // ── Mountains: 3D peaks standing on that ground ────────────────────
      if (peaks.length) {
        peaks.sort((a, b) => b.z - a.z);
        for (const p of peaks) {
          const rz = p.z - camZ;
          if (rz < Z_NEAR) { spawnPeak(p, camZ, true); continue; }
          const s = F / rz;
          const baseY = horizonY + CAM_HEIGHT * s;
          const topY = baseY - p.h * s;
          const cx = w / 2 + p.x * s;
          const half = (p.w / 2) * s;
          if (cx + half < 0 || cx - half > w || topY > h) continue;
          const fog = Math.pow(Math.min(1, rz / Z_FAR), 0.7);
          const fade = Math.min(1, (Z_FAR - rz) / 8000); // appear gently at the far edge
          const tone = mixRgb(rock, [128, 124, 116], p.tone * 0.25);
          const lit = mixRgb(mixRgb(tone, [236, 228, 212], 0.3), haze, fog);
          const shade = mixRgb(mixRgb(tone, [18, 20, 32], 0.4), haze, fog * 0.9);
          const cap = mixRgb(snow, haze, fog * 0.8);
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
  }, [terrain, region, palette, night, reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
