import { VIEWBOX, type SceneLayerProps } from '../types';

export function CinematicOverlay({ mode, phase, progress, idPrefix }: SceneLayerProps) {
  if (mode !== 'arrival') return null;

  const vignetteId = `${idPrefix}-cinematic-vignette`;
  const edgeId = `${idPrefix}-cinematic-edge`;
  const p = Math.min(1, Math.max(0, progress));
  const speedOpacity = phase === 'touchdown'
    ? 0.08 * Math.sin(p * Math.PI)
    : phase === 'taxi'
      ? 0.045 * Math.sin(p * Math.PI)
      : 0;
  const speedOffset = -((p * 420) % 180);

  return (
    <g aria-hidden pointerEvents="none">
      <defs>
        <radialGradient id={vignetteId} cx="50%" cy="46%" r="72%">
          <stop offset="58%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
        <linearGradient id={edgeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(0,0,0,0.38)" />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>

      {speedOpacity > 0 && (
        <g transform={`translate(${speedOffset},0)`} opacity={speedOpacity}>
          {Array.from({ length: 19 }, (_, index) => {
            const x = -240 + index * 180;
            const y = 748 + (index % 4) * 34;
            return <path key={index} d={`M${x} ${y} h${72 + (index % 3) * 28}`} stroke="rgba(220,235,255,0.8)" strokeWidth={2 + (index % 2)} strokeLinecap="round" />;
          })}
        </g>
      )}

      <rect width={VIEWBOX.w} height={VIEWBOX.h} fill={`url(#${vignetteId})`} opacity={0.42} />
      <rect width={VIEWBOX.w} height={72} fill={`url(#${edgeId})`} />
      <rect y={VIEWBOX.h - 58} width={VIEWBOX.w} height={58} fill={`url(#${edgeId})`} transform={`rotate(180 ${VIEWBOX.w / 2} ${VIEWBOX.h - 29})`} opacity={0.72} />
    </g>
  );
}
