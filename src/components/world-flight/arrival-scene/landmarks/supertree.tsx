import type { LandmarkLayerProps } from '../types';

// Supertree Grove (Singapore) — foreground slot. A cluster of trumpet-shaped
// vertical-garden towers with branching canopies. Base-center origin, upward.
export function SupertreeLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;

  const Tree = ({ x, h, s }: { x: number; h: number; s: number }) => (
    <g transform={`translate(${x} 0) scale(${s})`}>
      {/* trunk flares outward toward the top */}
      <path d={`M -10 0 L -22 ${-h} L 22 ${-h} L 10 0 Z`} fill={f} />
      {/* canopy disc */}
      <ellipse cx={0} cy={-h} rx={52} ry={16} fill={f} />
      {/* radiating branches */}
      {[-46, -24, 0, 24, 46].map((bx) => (
        <path key={bx} d={`M 0 ${-h} L ${bx} ${-h - 40}`} stroke={f} strokeWidth={5} />
      ))}
      {/* canopy glow */}
      <ellipse cx={0} cy={-h} rx={52} ry={16} fill={a} opacity={0.25} />
    </g>
  );

  return (
    <g aria-hidden>
      <Tree x={-72} h={150} s={0.8} />
      <Tree x={64} h={170} s={0.85} />
      <Tree x={-8} h={230} s={1} />
    </g>
  );
}
