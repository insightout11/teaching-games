'use client';

import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ScenePalette } from '@/components/world-flight/arrival-scene/types';
import { hexToRgb, mixRgb } from '@/components/live-room/flight/cockpit-sky';

/**
 * The ground far below the cockpit at cruise. A tiled texture on a plane tilted
 * in 3D (so it recedes to the horizon) that scrolls toward the viewer; the
 * tile's colours come from the same scene palette as the rest of the flight.
 * Mountains add layered ridgelines with snow along the horizon.
 * The real route (later) picks the terrain for each stretch of the flight.
 */
export type Terrain = 'ocean' | 'mountains' | 'forest' | 'desert' | 'ice' | 'farmland';

type RGB = [number, number, number];
const hex = (c: RGB) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

function rng(seed: number) {
  let r = seed * 9301 + 49297;
  return () => ((r = (r * 9301 + 49297) % 233280) / 233280);
}

/** A 256×256 seamless-ish tile per terrain, as an SVG data URI. */
function tileFor(terrain: Terrain, p: ScenePalette, night: boolean): string {
  const land = hexToRgb(p.terrainTop);
  const landDeep = hexToRgb(p.terrainBottom);
  const water = hexToRgb(p.waterTop);
  const waterDeep = hexToRgb(p.waterBottom);
  const leaf = hexToRgb(p.foliage);
  const dim = (c: RGB) => (night ? mixRgb(c, [8, 12, 26], 0.55) : c);
  const R = rng(terrain.length * 17);
  const shapes: string[] = [];
  let base: RGB;

  switch (terrain) {
    case 'ocean': {
      base = dim(mixRgb(water, waterDeep, 0.4));
      for (let i = 0; i < 26; i++) {
        const x = R() * 256, y = R() * 256, w = 12 + R() * 40;
        shapes.push(`<path d="M${x} ${y} q${w / 2} -3 ${w} 0" stroke="${hex(dim(mixRgb(water, [255, 255, 255], 0.35)))}" stroke-width="1.6" fill="none" opacity="${0.35 + R() * 0.4}"/>`);
      }
      break;
    }
    case 'desert': {
      const sand: RGB = mixRgb(land, [214, 170, 110], 0.7);
      base = dim(sand);
      for (let i = 0; i < 9; i++) {
        const y = i * 29 + R() * 10;
        shapes.push(`<path d="M0 ${y} C64 ${y - 14} 128 ${y + 14} 192 ${y} S256 ${y - 6} 256 ${y}" stroke="${hex(dim(mixRgb(sand, [120, 80, 40], 0.35)))}" stroke-width="3" fill="none" opacity="0.55"/>`);
        shapes.push(`<path d="M0 ${y + 3} C64 ${y - 11} 128 ${y + 17} 192 ${y + 3} S256 ${y - 3} 256 ${y + 3}" stroke="${hex(dim(mixRgb(sand, [255, 240, 210], 0.4)))}" stroke-width="2" fill="none" opacity="0.5"/>`);
      }
      break;
    }
    case 'forest': {
      base = dim(mixRgb(leaf, landDeep, 0.45));
      for (let i = 0; i < 70; i++) {
        const x = R() * 256, y = R() * 256, r = 6 + R() * 12;
        shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${hex(dim(mixRgb(leaf, R() < 0.5 ? [10, 30, 10] : [120, 170, 90], 0.25 + R() * 0.2)))}" opacity="0.85"/>`);
      }
      break;
    }
    case 'ice': {
      base = dim([222, 234, 246]);
      for (let i = 0; i < 14; i++) {
        const x = R() * 256, y = R() * 256;
        shapes.push(`<path d="M${x} ${y} l${20 + R() * 40} ${R() * 30 - 15} l${R() * 30} ${10 + R() * 20}" stroke="${hex(dim([150, 185, 220]))}" stroke-width="1.4" fill="none" opacity="0.7"/>`);
      }
      break;
    }
    case 'mountains': {
      base = dim(mixRgb(land, [104, 98, 92], 0.7));
      for (let i = 0; i < 22; i++) {
        const x = R() * 256, y = R() * 256, w = 50 + R() * 70;
        shapes.push(`<path d="M${x} ${y} l${w / 2} -${w * 0.45} l${w / 2} ${w * 0.45}z" fill="${hex(dim(mixRgb(land, [60, 64, 72], 0.6)))}" opacity="0.8"/>`);
        shapes.push(`<path d="M${x + w * 0.36} ${y - w * 0.32} l${w * 0.14} -${w * 0.13} l${w * 0.14} ${w * 0.13}z" fill="${hex(dim([240, 244, 250]))}" opacity="0.9"/>`);
      }
      break;
    }
    default: {
      // farmland: a quilt of fields
      base = dim(mixRgb(land, leaf, 0.35));
      for (let gx = 0; gx < 4; gx++) {
        for (let gy = 0; gy < 4; gy++) {
          const tint = mixRgb(land, R() < 0.5 ? leaf : [200, 170, 90], 0.3 + R() * 0.4);
          shapes.push(`<rect x="${gx * 64 + 2}" y="${gy * 64 + 2}" width="60" height="60" rx="3" fill="${hex(dim(tint))}" opacity="0.9"/>`);
        }
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${hex(base)}"/>${shapes.join('')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function ridgePath(seed: number, amp: number, base: number): string {
  const R = rng(seed);
  let d = `M0 ${base}`;
  for (let x = 0; x <= 1000; x += 25) {
    const n = Math.abs(Math.sin(x * 0.011 + seed)) * 0.65 + R() * 0.35;
    d += ` L${x} ${base - n * amp}`;
  }
  return `${d} L1000 120 L0 120 Z`;
}

export function CockpitGround({ terrain, palette, night, speed }: { terrain: Terrain; palette: ScenePalette; night: boolean; speed: number }) {
  const reduce = useReducedMotion();
  const tile = useMemo(() => tileFor(terrain, palette, night), [terrain, palette, night]);
  const haze = palette.skyBottom;
  const land = hexToRgb(palette.terrainTop);
  const ridges = useMemo(() => [0, 1, 2].map((i) => ridgePath(i * 7 + 3, 95 - i * 22, 116 - i * 4)), []);
  const duration = Math.max(6, 40 / Math.max(0.2, speed));

  return (
    <>
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ top: '58%', perspective: '420px', perspectiveOrigin: '50% 0%' }}>
      <div
        className="absolute left-[-150%] top-0 h-[400%] w-[400%] origin-top"
        style={{
          transform: 'rotateX(78deg)',
          backgroundImage: tile,
          backgroundSize: '256px 256px',
          animation: reduce ? undefined : `cockpit-ground-scroll ${duration}s linear infinite`,
        }}
      />
      {/* Aerial perspective: the ground fades into the horizon haze */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${haze} 0%, ${haze}cc 12%, ${haze}33 45%, transparent 75%)` }} />
      <style>{'@keyframes cockpit-ground-scroll{from{background-position:0 0}to{background-position:0 1024px}}'}</style>
    </div>
      {terrain === 'mountains' && (
        // Ridges stand on the horizon line (the ground plane starts at 58%), nearest last.
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 w-full" style={{ top: '42%', height: '18%' }} viewBox="0 0 1000 120" preserveAspectRatio="none">
          {ridges.map((d, i) => {
            const rock = mixRgb(mixRgb(land, [86, 84, 92], 0.7), hexToRgb(haze), 0.6 - i * 0.22).map((v) => (night ? Math.round(v * 0.45) : v)) as RGB;
            return (
              <g key={i}>
                <path d={d} fill={hex(rock)} />
                <path d={d} fill={night ? '#9aa4bd' : '#f4f7fb'} opacity={0.85 - i * 0.2} style={{ clipPath: 'inset(0 0 72% 0)' }} />
              </g>
            );
          })}
        </svg>
      )}
    </>
  );
}
