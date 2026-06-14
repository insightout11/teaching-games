import type { LandmarkLayerProps } from '../types';

// Puerta de Alcalá (Madrid) — foreground slot. A neoclassical granite gate with
// three central arches flanked by two rectangular openings, an engaged-column
// order and a sculpted attic. Base-center origin, built upward.
export function PuertaAlcalaLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  const open = palette.light === 'moon' ? 'rgba(255,212,130,0.3)' : 'rgba(0,0,0,0.34)';
  return (
    <g aria-hidden>
      {/* main body */}
      <rect x={-180} y={-204} width={360} height={204} fill={f} />
      {/* three central arches */}
      {[-70, 0, 70].map((x) => (
        <path key={x} d={`M ${x - 26} 0 L ${x - 26} -118 Q ${x} -150 ${x + 26} -118 L ${x + 26} 0 Z`} fill={open} />
      ))}
      {/* two rectangular side openings */}
      {[-142, 142].map((x) => (
        <rect key={x} x={x - 15} y={-104} width={30} height={104} fill={open} />
      ))}
      {/* engaged columns */}
      {[-106, -34, 34, 106].map((x) => (
        <rect key={x} x={x - 3} y={-200} width={6} height={200} fill={a} opacity={0.22} />
      ))}
      {/* cornice + attic */}
      <rect x={-186} y={-214} width={372} height={10} fill={a} opacity={0.3} />
      <rect x={-150} y={-252} width={300} height={38} fill={f} />
      {/* attic sculpture group + flanking figures */}
      <rect x={-30} y={-274} width={60} height={22} fill={f} />
      {[-120, 120].map((x) => (
        <rect key={x} x={x - 7} y={-268} width={14} height={16} fill={f} />
      ))}
    </g>
  );
}
