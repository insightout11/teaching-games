import type { LandmarkLayerProps } from '../types';

// Eiffel Tower (Paris) — foreground slot. Slender silhouette with splayed open
// legs, a light base arch, two platforms and an antenna. The gap between the
// legs is open (shows sky). Base-center origin, built upward.
export function EiffelLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  return (
    <g aria-hidden>
      {/* legs — thin curved struts with an open gap between them */}
      <path d="M -82 0 L -58 0 C -48 -74 -34 -114 -18 -136 L -28 -136 C -46 -106 -68 -52 -82 0 Z" fill={f} />
      <path d="M 82 0 L 58 0 C 48 -74 34 -114 18 -136 L 28 -136 C 46 -106 68 -52 82 0 Z" fill={f} />
      {/* base arch — slim crescent, leaves the legs reading as four */}
      <path d="M -58 0 C -46 -46 -22 -70 0 -70 C 22 -70 46 -46 58 0 L 46 0 C 36 -38 18 -56 0 -56 C -18 -56 -36 -38 -46 0 Z" fill={f} />
      {/* first platform */}
      <rect x={-58} y={-142} width={116} height={11} fill={f} />
      {/* mid body taper (thinner) + faint inner lattice hint */}
      <path d="M -26 -142 L -13 -262 L 13 -262 L 26 -142 Z" fill={f} />
      <path d="M -6 -152 L -3.5 -256 L 3.5 -256 L 6 -152 Z" fill={a} opacity={0.16} />
      {/* second platform */}
      <rect x={-23} y={-270} width={46} height={9} fill={f} />
      {/* upper tower + antenna (taller, more graceful) */}
      <path d="M -11 -270 L -4 -380 L 4 -380 L 11 -270 Z" fill={f} />
      <rect x={-2} y={-440} width={4} height={60} fill={f} />
      <circle cx={0} cy={-444} r={4} fill={a} />
      {/* faint lattice cross-braces */}
      <path d="M -52 -42 L 52 -42" stroke={a} strokeWidth={2.5} opacity={0.3} />
      <path d="M -22 -210 L 22 -210" stroke={a} strokeWidth={2} opacity={0.26} />
    </g>
  );
}
