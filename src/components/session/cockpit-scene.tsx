'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GaugeCluster, RadarScreen, SystemsChecklist, RadarContact } from './microevent-beats';

// Forward cloud rush: clouds emanate from the vanishing point (centre) and
// accelerate outward past the camera, so it reads as flying STRAIGHT INTO the
// cloud field. This is the view out the windscreen.
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

// Soft cockpit interior framing the view — a vignette + darkened sides/top (the
// windscreen surround) and a glareshield/dashboard the instruments sit on. Soft
// gradients (not hard pillars) so it reads as "looking out", not a cartoon frame.
function CockpitInterior() {
  return (
    <>
      {/* glass glare streak */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(118deg, transparent 44%, rgba(255,255,255,0.045) 50%, transparent 56%)' }} />
      {/* window vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 86% at 50% 38%, transparent 50%, rgba(5,8,14,0.6) 100%)' }} />
      {/* side surrounds (soft A-pillars) */}
      <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ width: '15%', background: 'linear-gradient(to right, rgba(7,10,16,0.9), transparent)' }} />
      <div className="absolute inset-y-0 right-0 pointer-events-none" style={{ width: '15%', background: 'linear-gradient(to left, rgba(7,10,16,0.9), transparent)' }} />
      {/* top frame */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: '13%', background: 'linear-gradient(to bottom, rgba(6,9,15,0.92), transparent)' }} />
      {/* glareshield / dashboard with a gently curved cowling top */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
        <defs>
          <linearGradient id="cockpit-dash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(26,31,42)" />
            <stop offset="0.5" stopColor="rgb(13,17,25)" />
            <stop offset="1" stopColor="rgb(6,8,13)" />
          </linearGradient>
        </defs>
        <path d="M0,100 L0,68 Q50,79 100,68 L100,100 Z" fill="url(#cockpit-dash)" />
        <path d="M0,68 Q50,79 100,68" stroke="rgba(150,180,210,0.16)" strokeWidth="0.5" fill="none" />
      </svg>
    </>
  );
}

// Accuracy beat as a cockpit POV: view out the windscreen (forward cloud rush) +
// soft cockpit interior + the instruments set on the glareshield.
export function FlightCheckScene({ variant }: { variant: 'instrument' | 'radar' }) {
  const isRadar = variant === 'radar';
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ForwardCloudRush />
      <CockpitInterior />

      {/* HUD title up in the windscreen */}
      <motion.div
        className={`absolute left-1/2 top-[12%] -translate-x-1/2 text-sm font-bold tracking-[0.3em] ${isRadar ? 'text-emerald-300' : 'text-cyan-200'}`}
        style={{ textShadow: '0 1px 12px rgba(0,0,0,0.7)' }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {isRadar ? 'RADAR' : 'INSTRUMENT CHECK'}
      </motion.div>

      {/* status chrome just above the glareshield */}
      <div className="absolute bottom-[31%] left-1/2 -translate-x-1/2">
        {isRadar ? <RadarContact /> : <SystemsChecklist />}
      </div>

      {/* instruments set on the glareshield */}
      <div className="absolute bottom-[3%] left-1/2" style={{ transform: 'translateX(-50%) scale(0.68)', transformOrigin: 'bottom center' }}>
        {isRadar ? <RadarScreen /> : <GaugeCluster />}
      </div>
    </div>
  );
}
