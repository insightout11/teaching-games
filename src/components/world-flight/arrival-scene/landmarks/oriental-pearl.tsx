import { motion } from 'framer-motion';
import type { LandmarkLayerProps } from '../types';

// Oriental Pearl Tower (Shanghai) — foreground slot. The city's unmistakable
// icon: a tripod of splayed columns carrying two ruby spheres on a slender
// shaft, a small upper "space module" sphere, and an antenna mast with a
// pulsing aviation beacon (ambient). The structure reads as silhouette; the
// spheres carry the contrast — radial shading (no flat blobs) + a lit equator
// of windows + a soft halo. Base-center origin, built upward.
export function OrientalPearlLandmark({ palette, idPrefix, ambient }: LandmarkLayerProps) {
  const f = 'rgb(62,104,135)';
  const litEdge = 'rgb(144,205,214)';
  const fShade = 'rgba(19,39,65,0.46)';
  const sphereGrad = `${idPrefix}-op-sphere`;
  const haloGrad = `${idPrefix}-op-halo`;

  // Equatorial band of lit windows ringing a sphere (cx, cy, r).
  const equator = (cy: number, r: number, count: number, key: string) => {
    const cells: React.ReactNode[] = [];
    const span = r * 1.5;
    const step = span / (count - 1);
    for (let i = 0; i < count; i += 1) {
      const x = -span / 2 + i * step;
      cells.push(
        <rect
          key={`${key}-${i}`}
          x={x - 1.4}
          y={cy - 3}
          width={2.8}
          height={6}
          rx={1}
          fill={i % 2 === 0 ? palette.windowWarm : palette.windowCool}
          opacity={0.92}
        />,
      );
    }
    return cells;
  };

  return (
    <g aria-hidden>
      <defs>
        {/* Ruby sphere shading — highlight to upper-left, deep shade lower-right. */}
        <radialGradient id={sphereGrad} cx="0.5" cy="0.5" r="0.62" fx="0.36" fy="0.32">
          <stop offset="0%" stopColor="rgb(255,182,202)" />
          <stop offset="42%" stopColor="rgb(214,92,120)" />
          <stop offset="100%" stopColor="rgb(138,38,64)" />
        </radialGradient>
        {/* Soft glow behind the spheres so they pop against a dark night skyline. */}
        <radialGradient id={haloGrad} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,140,168,0.45)" />
          <stop offset="100%" stopColor="rgba(255,140,168,0)" />
        </radialGradient>
      </defs>

      {/* Tripod — three splayed support columns (two outer obliques + a center). */}
      <polygon points="-52 0, -38 0, -10 -104, -16 -104" fill={f} />
      <polygon points="52 0, 38 0, 10 -104, 16 -104" fill={f} />
      <rect x={-7} y={-150} width={14} height={150} fill={f} />
      <rect x={0} y={-150} width={7} height={150} fill={fShade} />
      {/* lit inner edge on the central column */}
      <rect x={-7} y={-150} width={3} height={150} fill={litEdge} />
      {/* small spheres riding the lower legs (real tower detail) */}
      <circle cx={-30} cy={-70} r={9} fill={f} />
      <circle cx={30} cy={-70} r={9} fill={f} />

      {/* Lower (large) sphere */}
      <circle cx={0} cy={-152} r={56} fill={`url(#${haloGrad})`} opacity={0.9} />
      <circle cx={0} cy={-152} r={50} fill={`url(#${sphereGrad})`} />
      <path d="M -44 -174 A 50 50 0 0 1 22 -198" fill="none" stroke="rgba(255,210,222,0.6)" strokeWidth={2} strokeLinecap="round" />
      {equator(-152, 50, 13, 'low')}

      {/* shaft between spheres */}
      <rect x={-9} y={-262} width={18} height={62} fill={f} />
      <rect x={0} y={-262} width={9} height={62} fill={fShade} />
      <rect x={-9} y={-262} width={3.5} height={62} fill={litEdge} />

      {/* Upper (mid) sphere */}
      <circle cx={0} cy={-292} r={34} fill={`url(#${haloGrad})`} opacity={0.9} />
      <circle cx={0} cy={-292} r={30} fill={`url(#${sphereGrad})`} />
      <path d="M -26 -305 A 30 30 0 0 1 14 -320" fill="none" stroke="rgba(255,210,222,0.6)" strokeWidth={1.6} strokeLinecap="round" />
      {equator(-292, 30, 9, 'mid')}

      {/* upper shaft + small "space module" sphere */}
      <rect x={-5} y={-372} width={10} height={50} fill={f} />
      <rect x={0} y={-372} width={5} height={50} fill={fShade} />
      <rect x={-5} y={-372} width={2.2} height={50} fill={litEdge} />
      <circle cx={0} cy={-388} r={14} fill={`url(#${sphereGrad})`} />
      {equator(-388, 14, 5, 'top')}

      {/* antenna mast + beacon */}
      <polygon points="-3 -402, -1 -494, 1 -494, 3 -402" fill={f} />
      {ambient ? (
        <motion.circle
          cx={0}
          cy={-496}
          r={4.5}
          fill="rgba(255,90,90,0.95)"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <circle cx={0} cy={-496} r={4} fill="rgba(255,90,90,0.95)" />
      )}
    </g>
  );
}
