import type { LandmarkLayerProps } from '../types';

// The Kaaba within Masjid al-Haram (Mecca) — foreground slot. The cube draped in
// the black kiswa with its gold band, framed by restrained minarets across the
// mataf. Treated respectfully: the sacred cube is rendered plainly and is NEVER
// animated. Base-center origin, built upward.
export function KaabaLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  // The kiswa is intentionally near-black regardless of palette; the gold band
  // is the single restrained accent. Both are meaningful, not decorative tints.
  const cloth = 'rgba(18,18,22,0.95)';
  const gold = 'rgba(198,160,74,0.9)';

  const Minaret = ({ x, h }: { x: number; h: number }) => (
    <g opacity={0.78}>
      <rect x={x - 6} y={-h} width={12} height={h} fill={f} />
      {/* balcony */}
      <rect x={x - 9} y={-h - 6} width={18} height={6} fill={f} />
      {/* finial spire */}
      <polygon points={`${x - 8} ${-h - 6}, ${x} ${-h - 40}, ${x + 8} ${-h - 6}`} fill={f} />
      <circle cx={x} cy={-h - 44} r={3} fill={gold} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* framing minarets (set back, restrained) */}
      <Minaret x={-138} h={300} />
      <Minaret x={138} h={300} />
      <Minaret x={-84} h={252} />
      <Minaret x={84} h={252} />
      {/* mataf courtyard floor */}
      <ellipse cx={0} cy={-4} rx={150} ry={15} fill={a} opacity={0.1} />
      {/* Kaaba — sacred, plain, static */}
      <rect x={-46} y={-94} width={92} height={94} fill={cloth} />
      {/* gold kiswa band */}
      <rect x={-46} y={-76} width={92} height={10} fill={gold} />
    </g>
  );
}
