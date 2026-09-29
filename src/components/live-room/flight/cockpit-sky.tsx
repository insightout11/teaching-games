'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ScenePalette, TimeOfDay } from '@/components/world-flight/arrival-scene/types';

/**
 * The sky seen from the cockpit, graded from the SAME palette the arrival and
 * departure scenes use for this time of day, so cutting between the outside
 * camera and the cockpit keeps one look. Deepens toward the zenith with
 * altitude, keeps a warm band at the horizon, and places the sun or moon where
 * that time of day puts it.
 */

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.slice(0, 6);
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** Cloud colour for this light: bright white by day, warm at dawn/dusk, blue-grey at night. */
export function cockpitCloudTint(palette: ScenePalette, timeOfDay: TimeOfDay): RGB {
  const glow = hexToRgb(palette.horizonGlow.startsWith('#') ? palette.horizonGlow : '#ffffff');
  if (timeOfDay === 'night') return mixRgb(hexToRgb(palette.skyBottom), [150, 165, 200], 0.55);
  if (timeOfDay === 'day') return [240, 246, 255];
  return mixRgb([255, 244, 236], glow, 0.35);
}

const LIGHT_POS: Record<TimeOfDay, { x: string; y: string; size: number }> = {
  dawn: { x: '22%', y: '62%', size: 90 },
  day: { x: '30%', y: '18%', size: 70 },
  dusk: { x: '76%', y: '60%', size: 110 },
  night: { x: '72%', y: '20%', size: 56 },
};

export function CockpitSky({ palette, timeOfDay, altitude, spot }: {
  palette: ScenePalette;
  timeOfDay: TimeOfDay;
  altitude: number;
  /** Real sun/moon placement; without it, a fixed spot per time of day. */
  spot?: { x: string; y: string; size: number; visible: boolean };
}) {
  const reduce = useReducedMotion();
  const top = hexToRgb(palette.skyTop);
  const mid = hexToRgb(palette.skyMid);
  const bottom = hexToRgb(palette.skyBottom);
  // Higher up, the zenith deepens and the horizon band thins.
  const zenith = mixRgb(top, [4, 10, 30], Math.min(0.45, altitude * 0.35));
  const light = hexToRgb(palette.lightColor.startsWith('#') ? palette.lightColor : '#fff6d8');
  const pos = spot ?? { ...LIGHT_POS[timeOfDay], visible: true };
  const glide = reduce ? undefined : 'left 14s linear, top 14s linear, width 14s linear, height 14s linear';
  const stars = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ x: (i * 137.5) % 100, y: ((i * 61.8) % 60), r: i % 7 === 0 ? 1.6 : 1, o: 0.35 + ((i * 29) % 50) / 100 })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(180deg, ${css(zenith)} 0%, ${css(mid)} 52%, ${css(bottom)} 78%, ${css(mixRgb(bottom, [255, 255, 255], 0.18))} 100%)` }}
        transition={{ duration: reduce ? 0 : 1.2 }}
      />
      {/* Horizon glow band */}
      <div
        className="absolute inset-x-0"
        style={{ top: '55%', height: '45%', background: `radial-gradient(ellipse 80% 60% at ${pos.x} 30%, ${palette.horizonGlow} 0%, transparent 70%)`, opacity: timeOfDay === 'day' ? 0.35 : 0.8 }}
      />
      {palette.light === 'moon' && stars.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, opacity: s.o }} />
      ))}
      {/* Sun / moon with a soft bloom */}
      {pos.visible && <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ transition: glide, left: pos.x, top: pos.y, width: pos.size * 5, height: pos.size * 5, background: `radial-gradient(circle, ${css(light, palette.light === 'moon' ? 0.25 : 0.55)} 0%, transparent 60%)` }}
      />}
      {pos.visible && <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ transition: glide, left: pos.x, top: pos.y, width: pos.size, height: pos.size, background: palette.light === 'moon' ? `radial-gradient(circle at 40% 40%, #f4f6ff, ${css(light)} 70%)` : `radial-gradient(circle, #fffdf0 0%, ${css(light)} 60%, ${css(light, 0)} 100%)`, boxShadow: `0 0 ${pos.size}px ${css(light, 0.5)}` }}
      />}
    </div>
  );
}
