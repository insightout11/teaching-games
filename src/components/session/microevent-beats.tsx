'use client';

import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Accuracy-check micro-event beats (realistic aviation, no magic): a cockpit
// INSTRUMENT CHECK and an ATC RADAR scope. Both calm/precise — the deliberate
// contrast to the chaotic turbulence beat (opinion pulse). Composite over a sky.
//
// All gauge needles / the radar sweep rotate via native SVG <animateTransform>
// with an explicit centre `… 0 0`, so they pivot exactly on the gauge centre
// instead of drifting around their bounding box (which CSS/framer rotation does).
// ─────────────────────────────────────────────────────────────────────────────

const CYAN = 'rgb(120,220,235)';
const RIM = 'rgba(150,180,210,0.5)';
const FACE = 'rgb(14,22,34)';
const SWEEP_KEYTIMES = '0;0.4;0.72;1';

// ── Instrument Check ─────────────────────────────────────────────────────────
function GaugeBezel({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="-50 -50 100 100" width="150" height="150" aria-hidden>
      <circle r="48" fill={FACE} stroke={RIM} strokeWidth="2.5" />
      <circle r="44" fill="none" stroke="rgba(120,150,180,0.18)" strokeWidth="1" />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i * 10 * Math.PI) / 180;
        const r1 = i % 3 === 0 ? 38 : 41;
        return (
          <line
            key={i}
            x1={Math.sin(a) * r1}
            y1={-Math.cos(a) * r1}
            x2={Math.sin(a) * 44}
            y2={-Math.cos(a) * 44}
            stroke="rgba(150,180,210,0.4)"
            strokeWidth={i % 3 === 0 ? 1.4 : 0.7}
          />
        );
      })}
      {children}
    </svg>
  );
}

function NeedleSweep({ values, dur = 1.6 }: { values: string; dur?: number }) {
  return (
    <animateTransform
      attributeName="transform"
      type="rotate"
      values={values}
      keyTimes={SWEEP_KEYTIMES}
      dur={`${dur}s`}
      fill="freeze"
    />
  );
}

function AttitudeGauge() {
  return (
    <GaugeBezel>
      <defs>
        <clipPath id="att-clip">
          <circle r="40" />
        </clipPath>
      </defs>
      <g clipPath="url(#att-clip)">
        <g>
          <rect x="-70" y="-70" width="140" height="70" fill="rgb(42,92,150)" />
          <rect x="-70" y="0" width="140" height="70" fill="rgb(110,80,50)" />
          <line x1="-70" y1="0" x2="70" y2="0" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" />
          <NeedleSweep values="-24 0 0;17 0 0;-6 0 0;0 0 0" />
        </g>
      </g>
      <path d="M -18 0 L -6 0 M 6 0 L 18 0" stroke={CYAN} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle r="2" fill={CYAN} />
    </GaugeBezel>
  );
}

function HeadingGauge() {
  return (
    <GaugeBezel>
      {([['N', 0], ['E', 90], ['S', 180], ['W', 270]] as const).map(([t, deg]) => {
        const a = (deg * Math.PI) / 180;
        return (
          <text key={t} x={Math.sin(a) * 31} y={-Math.cos(a) * 31 + 3} textAnchor="middle" fontSize="8" fill="rgba(200,220,235,0.75)">
            {t}
          </text>
        );
      })}
      <g>
        <polygon points="0,-34 4,2 0,9 -4,2" fill={CYAN} />
        <polygon points="0,30 4,2 -4,2" fill="rgba(210,90,90,0.85)" />
        <NeedleSweep values="0 0 0;540 0 0;300 0 0;348 0 0" />
      </g>
      <circle r="3" fill="rgb(40,60,80)" stroke={RIM} strokeWidth="1" />
    </GaugeBezel>
  );
}

function VerticalGauge() {
  return (
    <GaugeBezel>
      <g>
        <polygon points="0,-36 3,2 -3,2" fill={CYAN} />
        <NeedleSweep values="-120 0 0;150 0 0;24 0 0;70 0 0" dur={1.5} />
      </g>
      <circle r="3" fill="rgb(40,60,80)" stroke={RIM} strokeWidth="1" />
    </GaugeBezel>
  );
}

// The 3-gauge row (no header / chrome) — reused by the plain beat and the cockpit.
export function GaugeCluster() {
  return (
    <motion.div className="flex items-center gap-6" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
      <AttitudeGauge />
      <HeadingGauge />
      <VerticalGauge />
    </motion.div>
  );
}

// Green checklist that ticks ALTITUDE · HEADING · SYSTEMS one by one.
export function SystemsChecklist() {
  const items = ['ALTITUDE', 'HEADING', 'SYSTEMS'];
  return (
    <div className="flex gap-5">
      {items.map((it, i) => (
        <motion.div
          key={it}
          className="flex items-center gap-1.5 text-xs font-semibold"
          initial={{ color: 'rgba(150,170,190,0.55)' }}
          animate={{ color: 'rgba(110,230,150,1)' }}
          transition={{ delay: 0.7 + i * 0.35, duration: 0.3 }}
        >
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 + i * 0.35, type: 'spring', stiffness: 420, damping: 14 }}>
            ✓
          </motion.span>
          {it}
        </motion.div>
      ))}
    </div>
  );
}

export function InstrumentCheck() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <motion.div
        className="mb-5 text-sm font-bold tracking-[0.3em] text-cyan-200"
        style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        INSTRUMENT CHECK
      </motion.div>
      <GaugeCluster />
      <div className="mt-5">
        <SystemsChecklist />
      </div>
    </div>
  );
}

// ── Radar Scope ──────────────────────────────────────────────────────────────
export function RadarScreen({ size = 300 }: { size?: number }) {
  return (
    <svg viewBox="-110 -110 220 220" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id="radar-face" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(24,64,42,0.92)" />
            <stop offset="1" stopColor="rgba(8,26,18,0.96)" />
          </radialGradient>
          <linearGradient id="radar-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(90,255,150,0)" />
            <stop offset="1" stopColor="rgba(90,255,150,0.32)" />
          </linearGradient>
        </defs>
        <circle r="100" fill="url(#radar-face)" stroke="rgba(90,220,140,0.5)" strokeWidth="1.5" />
        {[34, 67].map((r) => (
          <circle key={r} r={r} fill="none" stroke="rgba(90,220,140,0.22)" strokeWidth="1" />
        ))}
        <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(90,220,140,0.22)" strokeWidth="0.8" />
        <line x1="0" y1="-100" x2="0" y2="100" stroke="rgba(90,220,140,0.22)" strokeWidth="0.8" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return (
            <line key={i} x1={Math.sin(a) * 93} y1={-Math.cos(a) * 93} x2={Math.sin(a) * 100} y2={-Math.cos(a) * 100} stroke="rgba(90,220,140,0.45)" strokeWidth="1.2" />
          );
        })}
        <g>
          <path d="M 0 0 L 0 -100 A 100 100 0 0 1 64 -77 Z" fill="url(#radar-sweep)" />
          <line x1="0" y1="0" x2="0" y2="-100" stroke="rgba(130,255,180,0.9)" strokeWidth="1.6" />
          <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2.2s" repeatCount="indefinite" />
        </g>
        <circle cx="16" cy="-24" r="3.5" fill="rgb(160,255,190)">
          <animate attributeName="opacity" values="1;0.35;1" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="r" values="3.5;5.5;3.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <line x1="20" y1="-24" x2="38" y2="-38" stroke="rgba(160,255,190,0.6)" strokeWidth="0.8" />
        <text x="40" y="-36" fontSize="7" fill="rgb(160,255,190)" fontFamily="ui-monospace, monospace">LCN-0420</text>
        <text x="40" y="-28" fontSize="6" fill="rgba(160,255,190,0.7)" fontFamily="ui-monospace, monospace">FL340</text>
    </svg>
  );
}

// "RADAR CONTACT — IDENT" confirmation strip.
export function RadarContact() {
  return (
    <motion.div
      className="text-xs font-semibold tracking-wider text-emerald-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0, 1] }}
      transition={{ duration: 2.4, times: [0, 0.5, 0.62] }}
    >
      RADAR CONTACT — IDENT
    </motion.div>
  );
}

export function RadarScope() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <motion.div
        className="mb-3 text-sm font-bold tracking-[0.3em] text-emerald-300"
        style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        RADAR
      </motion.div>
      <RadarScreen />
      <div className="mt-3">
        <RadarContact />
      </div>
    </div>
  );
}
