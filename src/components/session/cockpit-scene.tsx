'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { WeatherCondition } from '@/components/world-flight/arrival-scene/types';
import { WEATHER_PROFILE } from '@/components/world-flight/arrival-scene/weather';

// Stylized cockpit HUD for the accuracy-check beats — "Top Gun HUD + sci-fi dash
// + SVG simplicity." One big glowing hero (PFD for Instrument Check, radar scope
// for Radar), a soft dark cockpit silhouette + vignette, sparse HUD tapes, the
// forward cloud rush as the view, scan/glow. Drawn in a 1120×640 viewBox over a
// transparent windscreen so it composites onto the live sky/weather.

const CYAN = 'rgb(120,224,236)';
const GREEN = 'rgb(120,240,170)';

// Cloud-rush tint per weather — grey/dark for worse skies, bright for snow.
const RUSH_TINT: Record<WeatherCondition, string> = {
  clear: '236,244,255',
  overcast: '150,160,178',
  rain: '128,140,162',
  storm: '92,102,122',
  snow: '228,238,250',
  aurora: '178,222,210',
};

// Forward cloud rush: clouds emanate from the vanishing point (centre) and
// accelerate outward past the camera — flying STRAIGHT INTO the cloud field.
// Denser + more opaque (and grey) in rainy/overcast weather.
export function ForwardCloudRush({ weather = 'clear' }: { weather?: WeatherCondition } = {}) {
  const p = WEATHER_PROFILE[weather];
  const tint = RUSH_TINT[weather];
  const count = 16 + Math.round(p.cloudCover * 18);
  const maxOp = 0.45 + p.cloudCover * 0.42;
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2 + (i % 3) * 0.4;
        return {
          dx: Math.cos(ang) * (58 + (i % 4) * 12),
          dy: Math.sin(ang) * (44 + (i % 3) * 10),
          dur: 1.5 + (i % 5) * 0.32,
          delay: (i / count) * 2.4,
          w: 14 + (i % 4) * 5,
        };
      }),
    [count],
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map((c, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${c.w}vw`,
            height: `${c.w * 0.6}vw`,
            marginLeft: `${-c.w / 2}vw`,
            marginTop: `${-c.w * 0.3}vw`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(${tint},0.85) 0%, rgba(${tint},0.42) 45%, transparent 72%)`,
            filter: 'blur(8px)',
          }}
          initial={{ x: '0vw', y: '0vh', scale: 0.12, opacity: 0 }}
          animate={{ x: `${c.dx}vw`, y: `${c.dy}vh`, scale: 3, opacity: [0, maxOp, 0] }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// Aurora — wispy vertical curtains, not solid bands. Thin green→teal drapes along
// a wavy baseline, each shimmering (opacity + height ripple) at its own pace, the
// whole field drifting slowly. Soft + screen-blended so it glows. Gaps between
// drapes keep it airy rather than a solid sheet.
function AuroraRibbons() {
  const strips = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        x: (i / 44) * 1180 - 30,
        top: 60 + Math.sin(i * 0.55) * 46 + (i % 3) * 12,
        h: 150 + (i % 5) * 70,
        o: 0.1 + (i % 5) * 0.05,
        dur: 2.4 + (i % 6) * 0.7,
        delay: (i % 9) * 0.3,
      })),
    [],
  );
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1120 640" preserveAspectRatio="none" style={{ mixBlendMode: 'screen' }} aria-hidden>
      <defs>
        <linearGradient id="aurora-curtain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(120,255,180,0)" />
          <stop offset="0.45" stopColor="rgba(120,255,166,0.7)" />
          <stop offset="0.8" stopColor="rgba(96,205,255,0.42)" />
          <stop offset="1" stopColor="rgba(150,160,255,0)" />
        </linearGradient>
        <filter id="aurora-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <g filter="url(#aurora-soft)">
        <animateTransform attributeName="transform" type="translate" values="-24 0;24 0;-24 0" dur="26s" repeatCount="indefinite" />
        {strips.map((s, i) => (
          <rect key={i} x={s.x} y={s.top} width={11} height={s.h} rx="5" fill="url(#aurora-curtain)" opacity={s.o}>
            <animate attributeName="opacity" values={`${s.o};${s.o * 2.2};${s.o * 0.4};${s.o}`} dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
            <animate attributeName="height" values={`${s.h};${s.h * 1.2};${s.h}`} dur={`${s.dur * 1.3}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
          </rect>
        ))}
      </g>
    </svg>
  );
}

// Weather on the windscreen. On a forward-flying aircraft, rain HITS the glass and
// the slipstream pushes it up + outward (it doesn't fall) — so drops impact then
// slowly streak across. Snow drifts past but some flakes stick to the glass.
// Behind the HUD so the instruments stay clear.
function WindscreenWeather({ weather }: { weather: WeatherCondition }) {
  const p = WEATHER_PROFILE[weather];
  // rain behaves like the snow: drops fall past the glass (faster, motion-blurred
  // into short streaks) — individual particles, not a line sheet.
  const rainFall = useMemo(
    () =>
      p.rain === 0
        ? []
        : Array.from({ length: Math.round(44 * p.rain) }, (_, i) => ({ x: (i * 41 + 7) % 100, delay: (i % 7) * 0.35, dur: 0.75 + (i % 4) * 0.28, len: 12 + (i % 4) * 9, drift: (i % 2 ? 1 : -1) * (2 + (i % 3) * 2) })),
    [p.rain],
  );
  // some drops bead on the glass and fade (like stuck snow)
  const rainStick = useMemo(
    () =>
      p.rain === 0
        ? []
        : Array.from({ length: Math.round(12 * p.rain) }, (_, i) => ({ x: ((i * 59 + 13) % 88) + 6, y: ((i * 37 + 7) % 66) + 8, r: 2.4 + (i % 3) * 1.6, delay: (i % 5) * 0.6, dur: 1.6 + (i % 3) * 0.5 })),
    [p.rain],
  );
  const driftFlakes = useMemo(
    () =>
      p.snow === 0
        ? []
        : Array.from({ length: Math.round(18 * p.snow) }, (_, i) => ({ x: (i * 47 + 5) % 100, delay: (i % 6) * 0.7, dur: 5 + (i % 5), size: 3 + (i % 4) * 2, sway: (i % 2 ? 1 : -1) * (12 + (i % 3) * 8) })),
    [p.snow],
  );
  // flakes that stick to the glass and fade
  const stuckFlakes = useMemo(
    () =>
      p.snow === 0
        ? []
        : Array.from({ length: Math.round(8 * p.snow) }, (_, i) => ({ x: ((i * 59 + 13) % 88) + 6, y: ((i * 37 + 7) % 66) + 8, size: 4 + (i % 3) * 2, delay: (i % 5) * 0.8, dur: 2 + (i % 3) })),
    [p.snow],
  );
  if (p.rain === 0 && p.snow === 0 && !p.lightning && !p.aurora && p.dim === 0) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {p.dim > 0 && <div className="absolute inset-0" style={{ background: 'rgb(9,15,28)', opacity: p.dim * 0.72 }} />}
      {p.aurora && <AuroraRibbons />}

      {/* heavy grey murk — flying through thick cloud */}
      {p.cloudCover > 0.45 && (
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 100% 92% at 50% 42%, rgba(122,132,152,${0.3 * p.cloudCover}), rgba(82,92,112,${0.5 * p.cloudCover}) 100%)` }} />
      )}
      {/* rain falling past the glass (like the snow) */}
      {rainFall.map((d, i) => (
        <motion.div
          key={`rf${i}`}
          className="absolute"
          style={{ left: `${d.x}%`, top: '-8%', width: 2.2, height: d.len, borderRadius: 2, background: 'linear-gradient(to bottom, transparent, rgba(208,226,250,0.75))', filter: 'blur(0.5px)' }}
          animate={{ y: ['0vh', '114vh'], x: [0, d.drift, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* some drops bead + fade on the glass */}
      {rainStick.map((s, i) => (
        <motion.div
          key={`rs${i}`}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2.2, background: 'radial-gradient(circle at 36% 30%, rgba(255,255,255,0.92), rgba(186,206,232,0.5) 58%, transparent 78%)', filter: 'blur(0.4px)' }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0.4, 1, 1, 1] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, repeatDelay: 1.4, ease: 'easeOut' }}
        />
      ))}

      {driftFlakes.map((f, i) => (
        <motion.div
          key={`df${i}`}
          className="absolute rounded-full"
          style={{ left: `${f.x}%`, top: '-5%', width: f.size, height: f.size, background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0.3) 60%, transparent)', filter: 'blur(0.5px)' }}
          animate={{ y: ['0vh', '110vh'], x: [0, f.sway, 0] }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* flakes that stick to the glass */}
      {stuckFlakes.map((f, i) => (
        <motion.div
          key={`sf${i}`}
          className="absolute rounded-full"
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.size, height: f.size, background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(235,242,255,0.4) 60%, transparent)', filter: 'blur(0.4px)' }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.95, 0.95, 0], scale: [0.4, 1, 1, 1] }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, repeatDelay: 1.6, ease: 'easeOut' }}
        />
      ))}
      {p.lightning && <div className="lc-lightning-flash absolute inset-0" />}
    </div>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="hud-dash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgb(20,26,38)" />
        <stop offset="0.5" stopColor="rgb(9,13,21)" />
        <stop offset="1" stopColor="rgb(4,6,11)" />
      </linearGradient>
      <radialGradient id="hud-vignette" cx="0.5" cy="0.42" r="0.75">
        <stop offset="42%" stopColor="rgba(2,7,18,0)" />
        <stop offset="100%" stopColor="rgba(2,7,18,0.72)" />
      </radialGradient>
      <filter id="hud-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="hud-noise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="n" />
        <feColorMatrix in="n" type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.06" />
        </feComponentTransfer>
      </filter>
      <clipPath id="hud-window">
        <rect x="0" y="0" width="1120" height="520" />
      </clipPath>
    </defs>
  );
}

function CockpitFrame() {
  return (
    <>
      {/* faint horizon/terrain silhouette behind the dash */}
      <path d="M0 470 C200 448 320 490 520 470 C720 450 880 494 1120 464 L1120 520 L0 520 Z" fill="rgba(6,12,24,0.5)" clipPath="url(#hud-window)" />
      {/* window vignette */}
      <rect x="0" y="0" width="1120" height="640" fill="url(#hud-vignette)" />
      {/* dashboard / glareshield — thin band so the windscreen dominates */}
      <path d="M0 516 C300 552 820 552 1120 516 L1120 640 L0 640 Z" fill="url(#hud-dash)" />
      <path d="M0 516 C300 552 820 552 1120 516" stroke="rgba(150,185,215,0.18)" strokeWidth="1.4" fill="none" />
    </>
  );
}

function HudLabel({ x, y, label, value, anchor = 'start', color = CYAN }: { x: number; y: number; label: string; value: string; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <g fontFamily="ui-monospace, monospace" filter="url(#hud-glow)">
      <text x={x} y={y} fontSize="13" letterSpacing="2" fill={color.replace('rgb', 'rgba').replace(')', ',0.7)')} textAnchor={anchor}>
        {label}
      </text>
      <text x={x} y={y + 22} fontSize="22" fontWeight="700" fill={color} textAnchor={anchor}>
        {value}
      </text>
    </g>
  );
}

// ── Instrument Check: PFD HUD hero ───────────────────────────────────────────
function PfdHud() {
  const cx = 560;
  const cy = 300;
  const ladder = [-86, -56, 56, 86];
  return (
    <g>
      <g filter="url(#hud-glow)" stroke={CYAN} strokeWidth="2.6" fill="none">
        <g>
          <line x1={cx - 250} y1={cy} x2={cx - 80} y2={cy} />
          <line x1={cx + 80} y1={cy} x2={cx + 250} y2={cy} />
          {ladder.map((p) => (
            <line key={p} x1={cx - 58} y1={cy + p} x2={cx + 58} y2={cy + p} strokeWidth="1.8" opacity="0.7" />
          ))}
          <animateTransform attributeName="transform" type="rotate" values={`-20 ${cx} ${cy};13 ${cx} ${cy};-5 ${cx} ${cy};0 ${cx} ${cy}`} keyTimes="0;0.4;0.72;1" dur="1.7s" fill="freeze" />
        </g>
      </g>
      <g stroke={CYAN} strokeWidth="3.4" fill="none" filter="url(#hud-glow)" strokeLinecap="round">
        <path d={`M${cx - 76} ${cy} h32 l10 14`} />
        <path d={`M${cx + 76} ${cy} h-32 l-10 14`} />
        <circle cx={cx} cy={cy} r="3.4" fill={CYAN} stroke="none" />
      </g>
    </g>
  );
}

// ── Radar: scope HUD hero ────────────────────────────────────────────────────
function RadarHud() {
  const cx = 560;
  const cy = 308;
  const R = 192;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={R} fill="rgba(10,30,20,0.42)" stroke="rgba(110,235,160,0.55)" strokeWidth="1.8" filter="url(#hud-glow)" />
      {[R * 0.34, R * 0.67].map((r) => (
        <circle key={r} r={r} fill="none" stroke="rgba(110,235,160,0.22)" strokeWidth="1" />
      ))}
      <line x1={-R} y1="0" x2={R} y2="0" stroke="rgba(110,235,160,0.22)" strokeWidth="1" />
      <line x1="0" y1={-R} x2="0" y2={R} stroke="rgba(110,235,160,0.22)" strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={Math.sin(a) * (R - 9)} y1={-Math.cos(a) * (R - 9)} x2={Math.sin(a) * R} y2={-Math.cos(a) * R} stroke="rgba(110,235,160,0.5)" strokeWidth="1.4" />;
      })}
      <g filter="url(#hud-glow)">
        <path d={`M0 0 L0 ${-R} A ${R} ${R} 0 0 1 ${R * 0.62} ${-R * 0.78} Z`} fill="rgba(120,255,170,0.18)" />
        <line x1="0" y1="0" x2="0" y2={-R} stroke="rgba(140,255,185,0.9)" strokeWidth="2.2" />
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2.4s" repeatCount="indefinite" />
      </g>
      <circle cx="32" cy="-46" r="5.5" fill={GREEN} filter="url(#hud-glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="r" values="5.5;9;5.5" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <line x1="38" y1="-46" x2="72" y2="-72" stroke="rgba(150,255,190,0.6)" strokeWidth="1" />
      <text x="76" y="-68" fontSize="13" fill={GREEN} fontFamily="ui-monospace, monospace">LCN-0420</text>
    </g>
  );
}

export function FlightCheckScene({ variant, weather = 'clear' }: { variant: 'instrument' | 'radar'; weather?: WeatherCondition }) {
  const isRadar = variant === 'radar';
  const hero = isRadar ? GREEN : CYAN;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ForwardCloudRush weather={weather} />
      <WindscreenWeather weather={weather} />
      <svg viewBox="0 0 1120 640" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <Defs />
        <CockpitFrame />

        {isRadar ? <RadarHud /> : <PfdHud />}

        <HudLabel x={70} y={150} label="SPD" value="420" />
        <HudLabel x={1050} y={150} label="ALT" value="34000" anchor="end" />
        <HudLabel x={560} y={86} label="HDG" value="087" anchor="middle" />

        <text x="560" y="48" textAnchor="middle" fontSize="20" fontWeight="700" letterSpacing="7" fill={hero} fontFamily="ui-sans-serif, system-ui" filter="url(#hud-glow)">
          {isRadar ? 'RADAR' : 'INSTRUMENT CHECK'}
        </text>

        {isRadar ? (
          <text x="560" y="588" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="2" fill={GREEN} fontFamily="ui-monospace, monospace" opacity="0">
            RADAR CONTACT — IDENT
            <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.55;0.7" dur="2.4s" fill="freeze" />
          </text>
        ) : (
          <g fontFamily="ui-monospace, monospace" fontSize="16" fontWeight="700" fill={GREEN}>
            {['ALTITUDE', 'HEADING', 'SYSTEMS'].map((it, i) => (
              <text key={it} x={420 + i * 150} y="588" textAnchor="middle" opacity="0">
                ✓ {it}
                <animate attributeName="opacity" values="0;1" dur="0.3s" begin={`${0.7 + i * 0.35}s`} fill="freeze" />
              </text>
            ))}
          </g>
        )}

        {/* glass noise */}
        <rect x="0" y="0" width="1120" height="640" filter="url(#hud-noise)" opacity="0.5" />
      </svg>
    </div>
  );
}
