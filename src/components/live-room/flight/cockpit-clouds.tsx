'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Pilot's-eye cloud layer: clouds approach from the horizon and slide past the
 * edges of the windscreen, leaving a clear corridor ahead. Drawn on a canvas
 * over the house SkyBackground. Each cloud is a pre-rendered sprite (soft
 * overlapping puffs, like the sky's CloudShape) so the frame loop only scales
 * and blits bitmaps: smooth even with many clouds.
 */
export interface CockpitCloudsProps {
  /** 0 = parked, 1 = cruise, >1 = take-off roll. */
  speed: number;
  /** Cloud tint (the scene's cloud fill for the current light). */
  tint: [number, number, number];
  /** 0..1 — fewer, fainter clouds while an activity is on screen. */
  density?: number;
  /** Where the horizon sits, 0..1 of the height. */
  horizon?: number;
  /** Descending into the cloud layer: clouds come straight at the windscreen. */
  dive?: boolean;
}

interface Cloud { x: number; y: number; z: number; size: number; sprite: number }

const SPRITES = 6;
const FOCAL = 0.6;

function makeSprite(tint: [number, number, number], seed: number): HTMLCanvasElement {
  // A cumulus in the house style: a flat base, a few overlapping domes on top,
  // heavily softened so it reads as vapour rather than bubbles.
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 140;
  const g = c.getContext('2d')!;
  let r = seed * 7919;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const [cr, cg, cb] = tint;
  g.filter = 'blur(9px)';
  g.fillStyle = `rgb(${cr},${cg},${cb})`;
  const base = 104;
  g.beginPath();
  g.ellipse(160, base, 128, 18, 0, 0, Math.PI * 2);
  g.fill();
  const domes = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < domes; i++) {
    const t = (i + 0.5) / domes;
    const dx = 60 + t * 200 + (rnd() - 0.5) * 24;
    const dr = (26 + rnd() * 22) * (1 - Math.abs(t - 0.5) * 0.9);
    g.beginPath();
    g.arc(dx, base - dr * 0.55, dr, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = 'none';
  // Light from above, shadow underneath.
  g.globalCompositeOperation = 'source-atop';
  const shade = g.createLinearGradient(0, 30, 0, 130);
  shade.addColorStop(0, 'rgba(255,255,255,0.35)');
  shade.addColorStop(0.55, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(60,72,104,0.28)');
  g.fillStyle = shade;
  g.fillRect(0, 0, 320, 140);
  return c;
}

function spawn(c: Cloud, far: boolean, dive = false) {
  const side = Math.random() < 0.5 ? -1 : 1;
  if (dive) {
    // No clear corridor: the plane is flying into the layer.
    c.x = (Math.random() * 2 - 1) * 1100;
    c.y = (Math.random() * 2 - 1) * 260;
  } else {
    c.x = side * (650 + Math.random() * 2600);
    c.y = Math.random() < 0.7 ? 80 + Math.random() * 380 : -(140 + Math.random() * 360);
  }
  c.z = far ? 1900 + Math.random() * 1300 : 400 + Math.random() * 2700;
  c.size = 200 + Math.random() * 220;
  c.sprite = Math.floor(Math.random() * SPRITES);
}

export function CockpitClouds({ speed, tint, density = 1, horizon = 0.55, dive = false }: CockpitCloudsProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const live = useRef({ speed, density, horizon, tint, dive });
  live.current = { speed, density, horizon, tint, dive };

  const tintKey = tint.join(',');
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sprites = Array.from({ length: SPRITES }, (_, i) => makeSprite(live.current.tint, i + 1));
    const clouds: Cloud[] = Array.from({ length: 20 }, () => {
      const c = { x: 0, y: 0, z: 0, size: 0, sprite: 0 };
      spawn(c, false);
      return c;
    });
    let w = 0;
    let h = 0;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const drawn = { speed: 0 };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = live.current;
      drawn.speed += (target.speed - drawn.speed) * Math.min(1, dt * 1.2);
      ctx.clearRect(0, 0, w, h);
      const vz = (140 + drawn.speed * 820) * (reduce ? 0.15 : 1);
      const cx = w / 2;
      const cy = h * target.horizon - h * 0.06;
      const F = w * FOCAL;
      const visible = Math.round(clouds.length * Math.max(0, Math.min(1, target.density)));
      clouds.sort((a, b) => b.z - a.z);
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.z -= vz * dt;
        if (c.z < 120) {
          spawn(c, true, target.dive);
          continue;
        }
        if (i >= visible) continue;
        const scale = F / c.z;
        const sw = c.size * scale * 2;
        const sh = sw * (140 / 320);
        const px = cx + c.x * scale - sw / 2;
        const py = cy + c.y * scale - sh / 2;
        if (px > w || px + sw < 0) continue;
        const near = Math.min(1, Math.max(0, (c.z - 120) / 700));
        const far = Math.min(1, (3200 - c.z) / 1100);
        ctx.globalAlpha = Math.max(0, Math.min(near, far)) * 0.75;
        ctx.drawImage(sprites[c.sprite], px, py, sw, sh);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // Sprites are rebuilt only when the tint changes (light/weather shifts).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tintKey, reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
