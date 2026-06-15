'use client';

import { motion } from 'framer-motion';
import { GaugeCluster, RadarScreen, RadarContact, SystemsChecklist } from './microevent-beats';

// Cockpit POV scene for the accuracy-check beats: you cut to the flight deck. The
// windscreen shows clouds streaming past (forward motion = it reads as a real
// transition, not a floating panel); the dashboard along the bottom houses the
// instruments / radar. Transparent windscreen so it composites over the live
// SkyBackground; opaque frame + dashboard occlude around it.

const FRAME = 'rgb(15,19,27)';

// Cloud streaks ripping across the windscreen — fast + shallow for forward speed.
function StreamingClouds() {
  const streaks = [
    { top: '11%', w: 42, h: 9, dur: 1.7, delay: 0, op: 0.5 },
    { top: '25%', w: 58, h: 13, dur: 1.25, delay: 0.4, op: 0.66 },
    { top: '40%', w: 50, h: 11, dur: 1.05, delay: 0.15, op: 0.56 },
    { top: '19%', w: 34, h: 8, dur: 2.0, delay: 0.8, op: 0.4 },
    { top: '47%', w: 40, h: 9, dur: 0.95, delay: 0.6, op: 0.5 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden">
      {streaks.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: s.top,
            height: `${s.h}vh`,
            width: `${s.w}vw`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(238,245,255,${s.op}) 0%, rgba(238,245,255,${s.op * 0.55}) 45%, transparent 72%)`,
            filter: 'blur(10px)',
          }}
          initial={{ x: '112vw' }}
          animate={{ x: '-64vw' }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// The dark flight-deck frame: top rail, A-pillars, centre post, glareshield/dash.
function CockpitFrame() {
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="cockpit-dash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(36,42,54)" />
          <stop offset="1" stopColor="rgb(9,12,18)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="160" height="7" fill={FRAME} />
      <polygon points="0,7 22,7 12,58 0,58" fill={FRAME} />
      <polygon points="160,7 138,7 148,58 160,58" fill={FRAME} />
      <rect x="78.5" y="7" width="3" height="50" fill={FRAME} />
      <path d="M0,56 Q80,64 160,56 L160,90 L0,90 Z" fill="url(#cockpit-dash)" />
      <path d="M0,56 Q80,64 160,56" stroke="rgba(150,180,210,0.16)" strokeWidth="0.6" fill="none" />
    </svg>
  );
}

export function CockpitScene({ variant }: { variant: 'instrument' | 'radar' }) {
  const isRadar = variant === 'radar';
  return (
    <div className="absolute inset-0 overflow-hidden">
      <StreamingClouds />
      {/* glass glare */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.05) 50%, transparent 58%)' }} />
      <CockpitFrame />

      {/* HUD title on the glass */}
      <motion.div
        className={`absolute left-1/2 top-[9%] -translate-x-1/2 text-sm font-bold tracking-[0.3em] ${isRadar ? 'text-emerald-300' : 'text-cyan-200'}`}
        style={{ textShadow: '0 1px 12px rgba(0,0,0,0.7)' }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {isRadar ? 'RADAR' : 'INSTRUMENT CHECK'}
      </motion.div>

      {/* instruments set into the dashboard */}
      <div className="absolute bottom-[3%] left-1/2" style={{ transform: 'translateX(-50%) scale(0.6)', transformOrigin: 'bottom center' }}>
        {isRadar ? <RadarScreen /> : <GaugeCluster />}
      </div>

      {/* status chrome just above the dashboard */}
      <div className="absolute bottom-[36%] left-1/2 -translate-x-1/2">
        {isRadar ? <RadarContact /> : <SystemsChecklist />}
      </div>
    </div>
  );
}
