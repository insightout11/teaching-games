'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Stylized cockpit HUD for the accuracy-check beats — "Top Gun HUD + sci-fi dash
// + SVG simplicity." NOT realistic cockpit art. One big glowing hero (PFD for
// Instrument Check, radar scope for Radar), a soft dark cockpit silhouette +
// vignette, sparse HUD tapes, slow cloud drift, scan/glow. Drawn in a 1120×640
// viewBox; composites over whatever sky is behind (transparent windscreen).
//
// Animations use native SVG <animate>/<animateTransform> (around explicit
// centres) so nothing drifts off-pivot the way CSS/framer rotation does.

const CYAN = 'rgb(120,224,236)';
const GREEN = 'rgb(120,240,170)';

// Forward cloud rush: clouds emanate from the vanishing point (centre) and
// accelerate outward past the camera — flying STRAIGHT INTO the cloud field. The
// view out the windscreen.
export function ForwardCloudRush() {
  const clouds = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2 + (i % 3) * 0.4;
        return {
          dx: Math.cos(ang) * (60 + (i % 4) * 12),
          dy: Math.sin(ang) * (46 + (i % 3) * 10),
          dur: 1.5 + (i % 5) * 0.32,
          delay: (i / 16) * 2.4,
          w: 14 + (i % 4) * 5,
        };
      }),
    [],
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
            background: 'radial-gradient(ellipse at center, rgba(236,244,255,0.85) 0%, rgba(236,244,255,0.4) 45%, transparent 72%)',
            filter: 'blur(8px)',
          }}
          initial={{ x: '0vw', y: '0vh', scale: 0.12, opacity: 0 }}
          animate={{ x: `${c.dx}vw`, y: `${c.dy}vh`, scale: 3, opacity: [0, 0.5, 0] }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
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
        <rect x="0" y="0" width="1120" height="470" />
      </clipPath>
    </defs>
  );
}

function CockpitFrame() {
  return (
    <>
      {/* faint horizon/terrain silhouette behind the dash */}
      <path d="M0 372 C200 350 320 392 520 372 C720 352 880 396 1120 366 L1120 470 L0 470 Z" fill="rgba(6,12,24,0.5)" clipPath="url(#hud-window)" />
      {/* window vignette */}
      <rect x="0" y="0" width="1120" height="640" fill="url(#hud-vignette)" />
      {/* dashboard / glareshield */}
      <path d="M0 430 C300 472 820 472 1120 430 L1120 640 L0 640 Z" fill="url(#hud-dash)" />
      <path d="M0 430 C300 472 820 472 1120 430" stroke="rgba(150,185,215,0.18)" strokeWidth="1.4" fill="none" />
    </>
  );
}

function HudLabel({ x, y, label, value, anchor = 'start', color = CYAN }: { x: number; y: number; label: string; value: string; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <g fontFamily="ui-monospace, monospace" filter="url(#hud-glow)">
      <text x={x} y={y} fontSize="13" letterSpacing="2" fill={`${color.replace('rgb', 'rgba').replace(')', ',0.7)')}`} textAnchor={anchor}>
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
  const cy = 270;
  const ladder = [-60, -40, 40, 60];
  return (
    <g>
      {/* glowing artificial horizon + pitch ladder (rolls then levels) */}
      <g filter="url(#hud-glow)" stroke={CYAN} strokeWidth="2.4" fill="none">
        <g>
          <line x1={cx - 210} y1={cy} x2={cx - 70} y2={cy} />
          <line x1={cx + 70} y1={cy} x2={cx + 210} y2={cy} />
          {ladder.map((p) => (
            <line key={p} x1={cx - 46} y1={cy + p} x2={cx + 46} y2={cy + p} strokeWidth="1.6" opacity="0.7" />
          ))}
          <animateTransform attributeName="transform" type="rotate" values={`-20 ${cx} ${cy};13 ${cx} ${cy};-5 ${cx} ${cy};0 ${cx} ${cy}`} keyTimes="0;0.4;0.72;1" dur="1.7s" fill="freeze" />
        </g>
      </g>
      {/* fixed boresight reticle */}
      <g stroke={CYAN} strokeWidth="3" fill="none" filter="url(#hud-glow)" strokeLinecap="round">
        <path d={`M${cx - 64} ${cy} h26 l8 12`} />
        <path d={`M${cx + 64} ${cy} h-26 l-8 12`} />
        <circle cx={cx} cy={cy} r="3" fill={CYAN} stroke="none" />
      </g>
    </g>
  );
}

// ── Radar: scope HUD hero ────────────────────────────────────────────────────
function RadarHud() {
  const cx = 560;
  const cy = 275;
  const R = 170;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={R} fill="rgba(10,30,20,0.45)" stroke="rgba(110,235,160,0.55)" strokeWidth="1.6" filter="url(#hud-glow)" />
      {[R * 0.34, R * 0.67].map((r) => (
        <circle key={r} r={r} fill="none" stroke="rgba(110,235,160,0.22)" strokeWidth="1" />
      ))}
      <line x1={-R} y1="0" x2={R} y2="0" stroke="rgba(110,235,160,0.22)" strokeWidth="1" />
      <line x1="0" y1={-R} x2="0" y2={R} stroke="rgba(110,235,160,0.22)" strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={Math.sin(a) * (R - 8)} y1={-Math.cos(a) * (R - 8)} x2={Math.sin(a) * R} y2={-Math.cos(a) * R} stroke="rgba(110,235,160,0.5)" strokeWidth="1.4" />;
      })}
      {/* sweep */}
      <g filter="url(#hud-glow)">
        <path d={`M0 0 L0 ${-R} A ${R} ${R} 0 0 1 ${R * 0.62} ${-R * 0.78} Z`} fill="rgba(120,255,170,0.18)" />
        <line x1="0" y1="0" x2="0" y2={-R} stroke="rgba(140,255,185,0.9)" strokeWidth="2" />
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2.4s" repeatCount="indefinite" />
      </g>
      {/* contact blip */}
      <circle cx="28" cy="-40" r="5" fill={GREEN} filter="url(#hud-glow)">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="r" values="5;8;5" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <line x1="34" y1="-40" x2="64" y2="-64" stroke="rgba(150,255,190,0.6)" strokeWidth="1" />
      <text x="68" y="-60" fontSize="12" fill={GREEN} fontFamily="ui-monospace, monospace">LCN-0420</text>
    </g>
  );
}

export function FlightCheckScene({ variant }: { variant: 'instrument' | 'radar' }) {
  const isRadar = variant === 'radar';
  const hero = isRadar ? GREEN : CYAN;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ForwardCloudRush />
      <svg viewBox="0 0 1120 640" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <Defs />
        <CockpitFrame />

        {/* HUD hero */}
        {isRadar ? <RadarHud /> : <PfdHud />}

        {/* sparse HUD tapes */}
        <HudLabel x={70} y={150} label="SPD" value="420" />
        <HudLabel x={1050} y={150} label="ALT" value="3200" anchor="end" />
        <HudLabel x={560} y={92} label="HDG" value="087" anchor="middle" />

        {/* title */}
        <text x="560" y="56" textAnchor="middle" fontSize="20" fontWeight="700" letterSpacing="7" fill={hero} fontFamily="ui-sans-serif, system-ui" filter="url(#hud-glow)">
          {isRadar ? 'RADAR' : 'INSTRUMENT CHECK'}
        </text>

        {/* status chrome on the glareshield */}
        {isRadar ? (
          <text x="560" y="500" textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill={GREEN} fontFamily="ui-monospace, monospace" opacity="0">
            RADAR CONTACT — IDENT
            <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.55;0.7" dur="2.4s" fill="freeze" />
          </text>
        ) : (
          <g fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700" fill={GREEN}>
            {['ALTITUDE', 'HEADING', 'SYSTEMS'].map((it, i) => (
              <text key={it} x={420 + i * 150} y="500" textAnchor="middle" opacity="0">
                ✓ {it}
                <animate attributeName="opacity" values="0;1" dur="0.3s" begin={`${0.7 + i * 0.35}s`} fill="freeze" />
              </text>
            ))}
          </g>
        )}

        {/* scan line + glass noise */}
        <line x1="0" x2="1120" y1="0" y2="0" stroke={`${hero.replace('rgb', 'rgba').replace(')', ',0.10)')}`} strokeWidth="2">
          <animate attributeName="y1" values="60;430" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="y2" values="60;430" dur="2.6s" repeatCount="indefinite" />
        </line>
        <rect x="0" y="0" width="1120" height="640" filter="url(#hud-noise)" opacity="0.5" />
      </svg>
    </div>
  );
}
