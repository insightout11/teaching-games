'use client';

import { motion } from 'framer-motion';
import { ClassPlaneSprite } from '@/components/ui/class-plane-sprite';

interface HangarSceneProps {
  planeKey?: string | null;
  className?: string;
}

// ─── Hangar structure ────────────────────────────────────────────────────────
// Dark silhouette hangar with warm interior lighting.
// Plane sits inside on the floor. Designed for a single bay now;
// extend to multiple bays when plane selection is added.

function HangarStructure() {
  const exterior = 'rgba(6,10,16,0.96)';
  const interior = 'rgba(22,13,6,0.90)';
  const panelLine = 'rgba(255,255,255,0.045)';

  return (
    <svg
      viewBox="0 0 480 260"
      width="480"
      height="260"
      style={{ display: 'block', position: 'absolute', inset: 0 }}
      aria-hidden
    >
      <defs>
        {/* Ambient interior warm glow */}
        <filter id="hgr-ambient" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        {/* Overhead light spot */}
        <filter id="hgr-spot" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Subtle edge glow for opening */}
        <filter id="hgr-edge" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* ── Interior background ── */}
      <rect x="28" y="36" width="424" height="196" fill={interior} />

      {/* Rear wall horizontal beam lines */}
      <rect x="28" y="80"  width="424" height="2" fill={panelLine} />
      <rect x="28" y="130" width="424" height="2" fill={panelLine} />
      <rect x="28" y="176" width="424" height="2" fill={panelLine} />

      {/* Ambient warm glow in interior */}
      <ellipse cx="240" cy="160" rx="170" ry="90"
        fill="rgba(200,105,18,0.13)" filter="url(#hgr-ambient)" />

      {/* ── Overhead lights ── */}
      {/* Left fixture */}
      <rect x="108" y="37" width="40" height="5" rx="1"
        fill="rgba(255,210,90,0.90)" filter="url(#hgr-spot)" />
      <rect x="108" y="37" width="40" height="3" rx="1"
        fill="rgba(255,240,180,0.98)" />
      {/* Left light cone */}
      <polygon points="108,42 148,42 185,232 71,232"
        fill="rgba(255,165,40,0.055)" />

      {/* Right fixture */}
      <rect x="332" y="37" width="40" height="5" rx="1"
        fill="rgba(255,210,90,0.90)" filter="url(#hgr-spot)" />
      <rect x="332" y="37" width="40" height="3" rx="1"
        fill="rgba(255,240,180,0.98)" />
      {/* Right light cone */}
      <polygon points="332,42 372,42 409,232 295,232"
        fill="rgba(255,165,40,0.055)" />

      {/* ── Floor ── */}
      <rect x="28" y="232" width="424" height="28" fill="rgba(10,15,22,0.92)" />
      {/* Floor centerline stripe */}
      <rect x="212" y="234" width="56" height="2" rx="1"
        fill="rgba(255,255,255,0.10)" />
      {/* Floor ambient light pools below fixtures */}
      <ellipse cx="128" cy="234" rx="44" ry="6"
        fill="rgba(255,165,40,0.06)" filter="url(#hgr-ambient)" />
      <ellipse cx="352" cy="234" rx="44" ry="6"
        fill="rgba(255,165,40,0.06)" filter="url(#hgr-ambient)" />

      {/* ── Left wall ── */}
      <rect x="0" y="0" width="30" height="260" fill={exterior} />
      {/* Retracted door panel on left interior face */}
      <rect x="28" y="36" width="22" height="196" fill="rgba(10,15,22,0.82)" />
      <rect x="30" y="36" width="2"  height="196" fill={panelLine} />
      <rect x="36" y="36" width="2"  height="196" fill={panelLine} />
      <rect x="44" y="36" width="2"  height="196" fill={panelLine} />

      {/* ── Right wall ── */}
      <rect x="450" y="0" width="30" height="260" fill={exterior} />
      {/* Retracted door panel on right interior face */}
      <rect x="430" y="36" width="22" height="196" fill="rgba(10,15,22,0.82)" />
      <rect x="446" y="36" width="2"  height="196" fill={panelLine} />
      <rect x="438" y="36" width="2"  height="196" fill={panelLine} />
      <rect x="430" y="36" width="2"  height="196" fill={panelLine} />

      {/* ── Roof / ceiling ── */}
      <rect x="0" y="0" width="480" height="38" fill={exterior} />
      {/* Roof bottom edge — subtle highlight where ceiling meets interior */}
      <rect x="28" y="36" width="424" height="2"
        fill="rgba(255,200,80,0.10)" />
      {/* Roof panel seams */}
      <rect x="0" y="12" width="480" height="1.5" fill={panelLine} />
      <rect x="0" y="24" width="480" height="1.5" fill={panelLine} />
      {/* Roof outer edge line */}
      <rect x="0" y="0"  width="480" height="2"
        fill="rgba(255,255,255,0.06)" />

      {/* ── Opening edge glow — warm spill from interior to outside ── */}
      <rect x="26" y="36" width="4" height="196"
        fill="rgba(200,100,20,0.18)" filter="url(#hgr-edge)" />
      <rect x="450" y="36" width="4" height="196"
        fill="rgba(200,100,20,0.18)" filter="url(#hgr-edge)" />
    </svg>
  );
}

export function HangarScene({ planeKey, className }: HangarSceneProps) {
  return (
    <div
      className={`relative pointer-events-none ${className ?? ''}`}
      style={{ width: 480, height: 260 }}
    >
      <HangarStructure />

      {/* Plane — centered in bay, sits on floor (bottom: 28 = floor height) */}
      <motion.div
        style={{ position: 'absolute', bottom: 28, left: '50%', x: '-50%' }}
        animate={{ y: [0, -2, 0], rotate: [0, 0.2, 0, -0.2, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ClassPlaneSprite planeKey={planeKey} size="xl" variant="parked" />
      </motion.div>
    </div>
  );
}
