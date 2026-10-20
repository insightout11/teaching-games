'use client';

import { useEffect, useState } from 'react';

/**
 * Real things in the night sky over the windscreen (Oct 2026): a bright planet at its real place, and on the nights of a
 * meteor shower the odd shooting star. Calm: a planet is a steady point (no twinkle, which is how you tell it from a
 * star); shooting stars are rare, thin and quick.
 */

/** A planet where it really is: `rel` is degrees from straight ahead (negative: left), `elevation` above the horizon. */
export function PlanetPoint({ rel, elevation, bright }: { rel: number; elevation: number; bright: boolean }) {
  if (Math.abs(rel) > 48 || elevation > 60) return null;
  const x = 50 + rel, y = 56 - elevation * 0.9;
  const size = bright ? 5 : 3.5;
  return (
    <div aria-hidden className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: bright ? '#fffbe8' : '#ffe9d0', boxShadow: `0 0 ${bright ? 8 : 5}px ${bright ? 3 : 1}px rgba(255,250,225,${bright ? 0.7 : 0.45})` }} />
  );
}

/** Shooting stars, one every 15 to 50 seconds, each crossing a different part of the sky. */
export function MeteorStreaks() {
  const [streak, setStreak] = useState<{ id: number; x: number; y: number; angle: number; len: number } | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        setStreak({ id: Date.now(), x: 10 + Math.random() * 75, y: 4 + Math.random() * 30, angle: 18 + Math.random() * 40, len: 8 + Math.random() * 10 });
        next();
      }, (15 + Math.random() * 35) * 1000);
    };
    next();
    return () => clearTimeout(t);
  }, []);
  if (!streak) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{'@keyframes meteor-run{0%{opacity:0;transform:translateX(0) scaleX(0.2)}15%{opacity:1}100%{opacity:0;transform:translateX(9vw) scaleX(1)}}'}</style>
      <div key={streak.id} className="absolute" style={{ left: `${streak.x}%`, top: `${streak.y}%`, transform: `rotate(${streak.angle}deg)`, transformOrigin: '0 50%' }}>
        <div style={{ width: `${streak.len}vw`, height: 1.5, transformOrigin: '100% 50%', background: 'linear-gradient(90deg, transparent, rgba(220,235,255,0.5) 60%, rgba(255,255,255,0.95))', borderRadius: 2, animation: 'meteor-run 0.9s ease-out 1 forwards' }} />
      </div>
    </div>
  );
}
