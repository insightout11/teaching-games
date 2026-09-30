'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CrewWalker } from '@/components/ui/crew-walker';
import { resolveLook } from '@/lib/crew-look';
import { getPlaneAsset } from '@/lib/plane-progression';

export interface Boarder {
  id: string;
  name: string;
  seed: string | null;
  /** Late arrivals jog. */
  late?: boolean;
}

const WALK_MS = 4200;
const GAP_MS = 900;

// Scene box (the container keeps this aspect, so % maps exactly to these units).
const W = 600;
const H = 160;
const GROUND = 134;
const PLANE_H = 150;

/**
 * Where each plane's boarding door is on its side "ground" art, as fractions of
 * the image: door x, door-sill y, and the wheels' bottom y (so the plane sits on
 * the tarmac). Measured by eye from public/assets/flight/planes/*-ground.png.
 */
const DOORS: Record<string, { x: number; sill: number; wheels: number }> = {
  'starter-biplane': { x: 0.62, sill: 0.57, wheels: 0.77 }, // LC Cadet: cabin door under the wing
  'comet-jet': { x: 0.7, sill: 0.63, wheels: 0.76 },
  'cargo-cruiser': { x: 0.77, sill: 0.66, wheels: 0.83 },
  'aurora-glider': { x: 0.78, sill: 0.55, wheels: 0.74 }, // climbs into the cockpit
};
const DEFAULT_DOOR = { x: 0.64, sill: 0.6, wheels: 0.78 };

/**
 * Big-screen boarding: each arriving student walks across the tarmac, climbs
 * the steps and boards the CLASS'S OWN plane (the same art as the lobby and
 * take-off). Arrivals queue into a little parade. `onBoarded` fires as each
 * one steps inside (the cabin seat lights up then).
 */
export function BoardingLane({ arrivals, onBoarded, planeKey }: { arrivals: Boarder[]; onBoarded?: (id: string) => void; planeKey?: string | null }) {
  const reduce = useReducedMotion();
  const plane = getPlaneAsset(planeKey);
  const door = DOORS[plane.key] ?? DEFAULT_DOOR;
  const [aspect, setAspect] = useState(1.9);
  const [walking, setWalking] = useState<Array<Boarder & { key: string }>>([]);
  const seen = useRef<Set<string>>(new Set());
  const nextStart = useRef(0);

  useEffect(() => {
    const fresh = arrivals.filter((a) => !seen.current.has(a.id));
    if (!fresh.length) return;
    for (const a of fresh) {
      seen.current.add(a.id);
      const now = Date.now();
      const startAt = Math.max(now, nextStart.current);
      nextStart.current = startAt + GAP_MS;
      const dur = a.late ? WALK_MS * 0.65 : WALK_MS;
      window.setTimeout(() => {
        setWalking((w) => [...w, { ...a, key: `${a.id}-${startAt}` }]);
        window.setTimeout(() => {
          setWalking((w) => w.filter((x) => x.id !== a.id));
          onBoarded?.(a.id);
        }, reduce ? 300 : dur);
      }, startAt - now);
    }
  }, [arrivals, onBoarded, reduce]);

  // Plane placement: nose to the right, wheels on the tarmac.
  const pw = PLANE_H * aspect;
  const px = W - pw + 40;
  const py = GROUND - PLANE_H * door.wheels;
  const doorX = px + pw * door.x;
  const doorY = py + PLANE_H * door.sill;
  const rise = Math.max(0, GROUND - doorY);
  const steps = Math.max(2, Math.round(rise / 9));
  const stairFoot = doorX - rise * 1.1;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div className="relative mx-auto aspect-[600/160] max-h-36 w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="#1C2A44" />
        <path d={`M0 ${GROUND + 12} L${W} ${GROUND + 12}`} stroke="#F6C177" strokeWidth="2" strokeDasharray="18 14" opacity=".5" />
        <image
          href={plane.groundWebp ?? plane.webp}
          x={px}
          y={py}
          width={pw}
          height={PLANE_H}
          preserveAspectRatio="xMidYMid meet"
        />
        {/* steps up to the door, sized to this plane */}
        <path d={`M${doorX - 2} ${doorY + 1} L${stairFoot - 6} ${GROUND} L${stairFoot + 6} ${GROUND} L${doorX + 8} ${doorY + 1}Z`} fill="#6F7F9C" />
        {Array.from({ length: steps }, (_, i) => {
          const t = (i + 1) / (steps + 1);
          const x = doorX + (stairFoot - doorX) * t;
          const y = doorY + (GROUND - doorY) * t;
          return <path key={i} d={`M${x - 6} ${y} l12 0`} stroke="#A9B7D0" strokeWidth="2" />;
        })}
        <path d={`M${doorX + 10} ${doorY - 10} L${stairFoot + 4} ${GROUND - 12}`} stroke="#A9B7D0" strokeWidth="2" />
      </svg>
      {/* hidden probe: learn the art's real aspect so the door lines up */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={plane.groundPng ?? plane.png}
        alt=""
        className="hidden"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) setAspect(img.naturalWidth / img.naturalHeight);
        }}
      />

      {walking.map((b) => {
        const dur = (b.late ? WALK_MS * 0.65 : WALK_MS) / 1000;
        return (
          <motion.div
            key={b.key}
            className="absolute flex flex-col items-center"
            style={{ translateX: '-50%', translateY: '-100%' }}
            initial={{ left: '-4%', top: pct(GROUND, H), opacity: 1, scale: 1 }}
            animate={reduce ? { left: pct(doorX, W), top: pct(doorY, H), opacity: 0 } : {
              left: ['-4%', pct(stairFoot, W), pct(doorX, W), pct(doorX + 4, W)],
              top: [pct(GROUND, H), pct(GROUND, H), pct(doorY, H), pct(doorY, H)],
              opacity: [1, 1, 1, 0],
              scale: [1, 1, 0.9, 0.78],
            }}
            transition={{ duration: reduce ? 0.3 : dur, times: [0, 0.62, 0.9, 1], ease: 'linear' }}
          >
            <span className="mb-0.5 whitespace-nowrap rounded-full bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
              {b.name}
            </span>
            <CrewWalker look={resolveLook(b.seed, b.name)} height={56} />
          </motion.div>
        );
      })}
    </div>
  );
}
