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

// Bright aurora ribbons (night skies) — glowing green→teal bands drifting across
// the windscreen, screen-blended so they add light.
function AuroraRibbons() {
  const w = 1120;
  const band = (y: number, amp: number, h = 80) =>
    `M -60 ${y} C ${w * 0.2} ${y - amp} ${w * 0.32} ${y + amp} ${w * 0.5} ${y} S ${w * 0.82} ${y - amp} ${w + 60} ${y}` +
    ` L ${w + 60} ${y + h} C ${w * 0.82} ${y + h - amp} ${w * 0.5} ${y + h + amp} ${w * 0.5} ${y + h} S ${w * 0.2} ${y + h - amp} -60 ${y + h} Z`;
  const bands = [
    { y: 120, amp: 44, o: 0.85, dur: 14, dx: 50 },
    { y: 180, amp: 36, o: 0.7, dur: 18, dx: -40 },
    { y: 250, amp: 30, o: 0.55, dur: 22, dx: 36 },
  ];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1120 640" preserveAspectRatio="none" style={{ mixBlendMode: 'screen' }} aria-hidden>
      <defs>
        <linearGradient id="aurora-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(120,255,180,0)" />
          <stop offset="0.4" stopColor="rgba(115,255,172,0.9)" />
          <stop offset="0.75" stopColor="rgba(90,214,255,0.65)" />
          <stop offset="1" stopColor="rgba(150,160,255,0)" />
        </linearGradient>
        <filter id="aurora-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <g filter="url(#aurora-blur)">
        {bands.map((b, i) => (
          <path key={i} d={band(b.y, b.amp)} fill="url(#aurora-grad)" opacity={b.o}>
            <animateTransform attributeName="transform" type="translate" values={`${-b.dx} 0;${b.dx} 0;${-b.dx} 0`} dur={`${b.dur}s`} repeatCount="indefinite" />
          </path>
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
  // drops hit, then streak UP the glass in one consistent direction (the
  // slipstream blows the water up + slightly back — not falling, not diverging)
  const rainDrops = useMemo(
    () =>
      p.rain === 0
        ? []
        : Array.from({ length: Math.round(34 * p.rain) }, (_, i) => ({
            x: ((i * 37 + 5) % 92) + 4,
            y: ((i * 53 + 14) % 62) + 18,
            lean: 2 + (i % 3) * 0.8,
            rise: 14 + (i % 4) * 8,
            trail: 28 + (i % 4) * 18,
            dur: 1.4 + (i % 4) * 0.5,
            delay: (i % 9) * 0.32,
            gap: 0.25 + (i % 3) * 0.45,
          })),
    [p.rain],
  );
  // a few resting beads on the glass
  const restBeads = useMemo(
    () =>
      p.rain === 0
        ? []
        : Array.from({ length: Math.round(15 * p.rain) }, (_, i) => ({ x: ((i * 67 + 11) % 90) + 4, y: ((i * 43 + 5) % 74) + 5, r: 1.5 + (i % 3), o: 0.22 + (i % 3) * 0.08 })),
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

      {restBeads.map((d, i) => (
        <div
          key={`rb${i}`}
          className="absolute rounded-full"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.r * 2, height: d.r * 2, background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,${d.o + 0.3}), rgba(176,198,224,${d.o}) 58%, transparent 78%)`, filter: 'blur(0.5px)' }}
        />
      ))}
      {/* hit + streak up the glass */}
      {rainDrops.map((d, i) => (
        <motion.div
          key={`rd${i}`}
          className="absolute"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0.85, 0], x: [0, `${d.lean}vw`], y: [0, `-${d.rise}vh`] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, repeatDelay: d.gap, ease: 'easeOut' }}
        >
          {/* trail behind the head (drop streaks up, trail below) */}
          <div style={{ position: 'absolute', left: -1.25, top: 0, width: 2.5, height: d.trail, borderRadius: 2, background: 'linear-gradient(to bottom, rgba(225,238,255,0.55), transparent)', filter: 'blur(0.5px)' }} />
          {/* bright drop head — the impact you see */}
          <div style={{ position: 'absolute', left: -3.5, top: -3.5, width: 7, height: 7, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff, rgba(200,220,245,0.8) 55%, transparent)', boxShadow: '0 0 5px rgba(220,235,255,0.6)' }} />
        </motion.div>
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
