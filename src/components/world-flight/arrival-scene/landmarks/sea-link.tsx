import type { LandmarkLayerProps } from '../types';

// Bandra–Worli Sea Link (Mumbai) — foreground slot. Cable-stayed bridge with a
// pair of fan-stayed pylons over a strip of water. Base-center origin, upward.
export function SeaLinkLandmark({ palette }: LandmarkLayerProps) {
  const f = palette.landmarkFill;
  const a = palette.landmarkAccent;
  const deckY = -40;

  const Pylon = ({ x }: { x: number }) => (
    <g>
      {/* tower */}
      <polygon points={`${x - 7} ${deckY}, ${x - 3} ${deckY - 150}, ${x + 3} ${deckY - 150}, ${x + 7} ${deckY}`} fill={f} />
      {/* fan stays */}
      {[-120, -80, -40, 40, 80, 120].map((dx) => (
        <line key={dx} x1={x} y1={deckY - 148} x2={x + dx} y2={deckY} stroke={a} strokeWidth={2} opacity={0.55} />
      ))}
    </g>
  );

  return (
    <g aria-hidden>
      {/* water strip + glints */}
      <rect x={-260} y={deckY} width={520} height={40} fill={a} opacity={0.12} />
      {[-200, -120, -20, 90, 180].map((x) => (
        <rect key={x} x={x} y={deckY + 16 + (x % 20)} width={36} height={2} fill={a} opacity={0.3} />
      ))}
      {/* deck */}
      <rect x={-260} y={deckY - 6} width={520} height={8} fill={f} />
      {/* piers */}
      {[-220, -160, 160, 220].map((x) => (
        <rect key={x} x={x - 4} y={deckY} width={8} height={40} fill={f} />
      ))}
      <Pylon x={-70} />
      <Pylon x={70} />
    </g>
  );
}
