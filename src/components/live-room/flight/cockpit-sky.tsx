'use client';

import { useMemo } from 'react';
import { moonLitPath } from '@/components/world-flight/arrival-scene/layers/atmosphere-layer';
import { motion, useReducedMotion } from 'framer-motion';
import type { ScenePalette, TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';

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

/** The cloud deck under the plane in bad weather: white and bright in snow, flat grey in overcast, dark and bruised in rain and storm. */
export function weatherDeckTint(tint: RGB, weather: WeatherCondition): RGB {
  if (weather === 'storm') return mixRgb(tint, [58, 66, 88], 0.7);
  if (weather === 'rain') return mixRgb(tint, [96, 108, 128], 0.5);
  if (weather === 'overcast') return mixRgb(tint, [150, 158, 172], 0.25);
  if (weather === 'snow') return mixRgb(tint, [255, 255, 255], 0.5);
  return tint;
}

/** How completely the cloud deck below hides the ground at cruise: bad weather is a full deck, whatever the real cover says. */
export function weatherUndercast(weather: WeatherCondition, cover: number): number {
  if (weather === 'rain' || weather === 'storm') return 1;
  if (weather === 'snow') return 0.9;
  if (weather === 'overcast') return 0.8;
  return Math.max(0, (cover - 65) / 35);
}

/** Cloud colour for this light: bright white by day, warm at dawn/dusk, blue-grey at night. */
export function cockpitCloudTint(palette: ScenePalette, timeOfDay: TimeOfDay): RGB {
  const glow = hexToRgb(palette.horizonGlow.startsWith('#') ? palette.horizonGlow : '#ffffff');
  if (timeOfDay === 'night') return mixRgb(hexToRgb(palette.skyBottom), [150, 165, 200], 0.55);
  if (timeOfDay === 'day') return [240, 246, 255];
  return mixRgb([255, 244, 236], glow, 0.35);
}

export const LIGHT_POS: Record<TimeOfDay, { x: string; y: string; size: number }> = {
  dawn: { x: '22%', y: '62%', size: 90 },
  day: { x: '30%', y: '18%', size: 70 },
  dusk: { x: '76%', y: '60%', size: 110 },
  night: { x: '72%', y: '20%', size: 56 },
};

/** The upgraded sky (sunset glow, high cirrus and vapour trails, the Milky Way; approved by the owner 20 Oct 2026). */
let SKY_V2 = true;
export function setSkyV2(on: boolean) { SKY_V2 = on; }

/** The Milky Way: thousands of faint specks in a soft diagonal band (made once, a few hundred kB of nothing). */
function milkyWayDots() {
  const out: Array<{ x: number; y: number; r: number; o: number }> = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 420; i++) {
    const t = rnd(), across = (rnd() + rnd() + rnd() - 1.5) * 0.16; // bunched along the band
    const x = 4 + t * 92, y = 6 + t * 40 + across * 100;
    if (y < 0 || y > 52) continue;
    out.push({ x, y, r: rnd() < 0.08 ? 1.1 : 0.55, o: 0.25 + rnd() * 0.45 });
  }
  return out;
}

export function CockpitSky({ palette, timeOfDay, altitude, spot }: {
  palette: ScenePalette;
  timeOfDay: TimeOfDay;
  altitude: number;
  /** Real sun/moon placement; without it, a fixed spot per time of day. */
  spot?: { x: string; y: string; size: number; visible: boolean; phase?: { illumination: number; litOnRight: boolean } };
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
    // Evenly scattered (a low-discrepancy R2 sequence), fading toward the horizon.
    () => Array.from({ length: 90 }, (_, i) => {
      const x = ((0.5 + i * 0.7548776662) % 1) * 100;
      const y = Math.pow((0.5 + i * 0.5698402910) % 1, 1.4) * 54;
      return { x, y, r: i % 9 === 0 ? 1.7 : i % 3 === 0 ? 1.2 : 0.8, o: (0.4 + ((i * 29) % 50) / 100) * (1 - y / 70), tw: 2.5 + (i % 7) * 0.7, d: (i % 11) * 0.4 };
    }),
    [],
  );

  const v2 = SKY_V2;
  const milky = useMemo(() => (v2 ? milkyWayDots() : []), [v2]);
  // the sun's (or moon's) place across the sky as a number, for the glow and the earth's shadow opposite
  const sunX = Math.max(0, Math.min(100, parseFloat(String(pos.x)) || 50));
  const isDusk = timeOfDay === 'dusk';
  const moonSmall = !pos.phase || pos.phase.illumination < 0.45;

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
      {v2 && isDusk && (
        <>
          {/* sunset or sunrise: a wide burning glow on the horizon under the sun */}
          <div className="absolute inset-x-0" style={{ top: '30%', height: '34%', background: `radial-gradient(ellipse 55% 70% at ${sunX}% 82%, ${css(light, 0.75)} 0%, ${palette.horizonGlow} 28%, transparent 72%)`, opacity: 0.85, mixBlendMode: 'screen' }} />
          {/* the earth's shadow on the other side: a pink band over a dusky blue */}
          <div className="absolute inset-x-0" style={{ top: '40%', height: '20%', background: `radial-gradient(ellipse 60% 55% at ${100 - sunX}% 85%, rgba(226,150,176,0.42) 0%, rgba(150,120,170,0.18) 45%, transparent 75%)` }} />
        </>
      )}
      {v2 && palette.light !== 'moon' && (
        <>
          <style>{'@keyframes cirrus-drift{from{transform:translateX(0)}to{transform:translateX(-12%)}}@keyframes contrail-cross{0%{transform:translateX(-30vw);opacity:0}6%{opacity:1}88%{opacity:1}100%{transform:translateX(130vw);opacity:0}}'}</style>
          {/* high, thin cirrus: faint streaks drifting slowly */}
          <div className="absolute inset-x-[-10%] top-[6%] h-[32%]" style={{ animation: reduce ? undefined : 'cirrus-drift 240s linear infinite alternate' }}>
            {[[8, 22, 34, 4, -6], [38, 12, 28, 3, -3], [60, 30, 40, 5, -8], [80, 16, 22, 3, -4]].map(([x, y, w, h, rot], i) => (
              <div key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, transform: `rotate(${rot}deg)`, background: `linear-gradient(90deg, transparent, ${isDusk ? 'rgba(255,214,190,0.32)' : 'rgba(255,255,255,0.28)'} 30%, ${isDusk ? 'rgba(255,200,180,0.22)' : 'rgba(255,255,255,0.18)'} 70%, transparent)`, filter: 'blur(5px)' }} />
            ))}
          </div>
          {/* now and then another plane far off, drawing its vapour trail across the sky: a tiny silhouette catching the
              light, two thin trails behind it that soften, spread and fade; the whole thing travels along its own line */}
          {!reduce && (
            <div className="absolute left-0 top-[16%] w-full" style={{ transform: 'rotate(-5deg)', transformOrigin: '0 50%' }}>
              <div className="relative h-4 w-[34vw]" style={{ animation: 'contrail-cross 80s linear 8s infinite' }}>
                <div className="absolute right-3 top-[5px] h-[1.5px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0.7) 100%)', filter: 'blur(0.6px)' }} />
                <div className="absolute right-3 top-[8px] h-[1.5px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.65) 100%)', filter: 'blur(0.6px)' }} />
                {/* the older part of the trail, spread out and soft */}
                <div className="absolute right-[40%] top-[2px] h-[10px] w-[60%]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 60%, transparent)', filter: 'blur(3px)' }} />
                <svg viewBox="0 0 24 10" className="absolute right-0 top-[2px] h-[10px] w-[16px]" aria-hidden>
                  <path d="M1 5 L17 4.2 L23 5 L17 5.8 Z M15 4.4 L10.5 0.6 L9 0.6 L11.5 4.4 Z M15 5.6 L10.5 9.4 L9 9.4 L11.5 5.6 Z M5 4.6 L2.4 2.4 L1.4 2.4 L2.6 4.6 Z" fill="rgba(245,248,255,0.95)" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}
      {v2 && palette.light === 'moon' && (
        // the Milky Way: a faint band of star dust, brighter when the moon is small
        <div className="absolute inset-0" style={{ opacity: moonSmall ? 0.9 : 0.45 }}>
          <div className="absolute" style={{ left: '-10%', top: '-6%', width: '120%', height: '40%', transform: 'rotate(24deg)', transformOrigin: '50% 50%', background: 'radial-gradient(ellipse 50% 22% at 50% 50%, rgba(190,200,235,0.16) 0%, rgba(150,160,210,0.07) 50%, transparent 80%)', filter: 'blur(6px)' }} />
          {milky.map((d, i) => <span key={i} className="absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.r * 2, height: d.r * 2, opacity: d.o }} />)}
        </div>
      )}
      {palette.light === 'moon' && (
        <>
          <style>{'@keyframes cockpit-twinkle{0%,100%{opacity:var(--o)}50%{opacity:calc(var(--o) * 0.35)}}'}</style>
          {stars.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, opacity: s.o, ['--o' as string]: s.o, animation: reduce || i % 3 ? undefined : `cockpit-twinkle ${s.tw}s ease-in-out ${s.d}s infinite` }}
            />
          ))}
        </>
      )}
      {/* Sun / moon with a soft bloom */}
      {pos.visible && <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ transition: glide, left: pos.x, top: pos.y, width: pos.size * 5, height: pos.size * 5, background: `radial-gradient(circle, ${css(light, palette.light === 'moon' ? 0.25 : 0.55)} 0%, transparent 60%)` }}
      />}
      {pos.visible && palette.light === 'moon' && pos.phase && (
        <svg
          className="absolute -translate-x-1/2 -translate-y-1/2"
          viewBox="-30 -30 60 60"
          style={{ transition: glide, left: pos.x, top: pos.y, width: pos.size, height: pos.size, filter: `drop-shadow(0 0 ${pos.size / 3}px ${css(light, 0.5)})` }}
        >
          {/* the real phase: a dim full disc with the lit part drawn over it, mirrored in the southern hemisphere */}
          <g transform={pos.phase.litOnRight ? undefined : 'scale(-1 1)'}>
            <circle r={30} fill="rgb(34,44,70)" opacity={0.55} />
            <path d={moonLitPath(30, pos.phase.illumination)} fill="rgb(238,243,255)" />
          </g>
        </svg>
      )}
      {pos.visible && !(palette.light === 'moon' && pos.phase) && <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ transition: glide, left: pos.x, top: pos.y, width: pos.size, height: pos.size, background: palette.light === 'moon' ? `radial-gradient(circle at 40% 40%, #f4f6ff, ${css(light)} 70%)` : `radial-gradient(circle, #fffdf0 0%, ${css(light)} 60%, ${css(light, 0)} 100%)`, boxShadow: `0 0 ${pos.size}px ${css(light, 0.5)}` }}
      />}
    </div>
  );
}
