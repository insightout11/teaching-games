'use client';

import { useEffect, useState } from 'react';

/**
 * Real things in the night sky over the windscreen (Oct 2026): a bright planet at its real place, and on the nights of a
 * meteor shower the odd shooting star. Calm: a planet is a steady point (no twinkle, which is how you tell it from a
 * star); shooting stars are rare, thin and quick.
 */

/** A planet where it really is: `rel` is degrees from straight ahead (negative: left), `elevation` above the horizon. */
export function PlanetPoint({ rel, elevation, bright, name, highlight = false }: { rel: number; elevation: number; bright: boolean; name?: string; highlight?: boolean }) {
  if (Math.abs(rel) > 48 || elevation > 60) return null;
  const x = 50 + rel, y = 56 - elevation * 0.9;
  const size = bright ? 5 : 4;
  return (
    <div aria-hidden className="pointer-events-none absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: size, height: size, background: bright ? '#fffbe8' : '#ffe9d0', boxShadow: `0 0 ${bright ? 8 : 6}px ${bright ? 3 : 2}px rgba(255,250,225,${bright ? 0.7 : 0.55})` }} />
      {/* while its Look label is up: a soft ring and its name, so the class can find it */}
      {highlight && (
        <>
          <style>{'@keyframes planet-ring{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.75}50%{transform:translate(-50%,-50%) scale(1.25);opacity:.35}}'}</style>
          <div className="absolute h-7 w-7 rounded-full border border-amber-100/80" style={{ animation: 'planet-ring 2.4s ease-in-out infinite', transform: 'translate(-50%,-50%)' }} />
          {name && <span className="absolute left-4 top-[-7px] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-amber-100/90">{name}</span>}
        </>
      )}
    </div>
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
