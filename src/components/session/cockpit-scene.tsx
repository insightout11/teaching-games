'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { InstrumentCheck, RadarScope } from './microevent-beats';

// Forward cloud rush: clouds emanate from the vanishing point (centre) and
// accelerate outward past the camera, so it reads as flying STRAIGHT INTO the
// cloud field — not sideways drift. This supplies the motion that makes the
// accuracy beat feel like a transition; the instruments sit on top as a HUD.
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

// Accuracy beat = forward cloud rush (motion) + the instrument/radar HUD on top.
export function FlightCheckScene({ variant }: { variant: 'instrument' | 'radar' }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ForwardCloudRush />
      {variant === 'instrument' ? <InstrumentCheck /> : <RadarScope />}
    </div>
  );
}
