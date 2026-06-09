import type { LandmarkLayerProps } from '../types';

// Giza pyramids (Cairo) — background slot. Two large pyramids + a smaller one,
// each with a lit and a shadowed face. Base-center origin, built upward.
export function PyramidsLandmark({ palette }: LandmarkLayerProps) {
  const Pyr = ({ x, w, h, flip = false }: { x: number; w: number; h: number; flip?: boolean }) => (
    <g transform={`translate(${x} 0)`}>
      <polygon points={`${-w} 0, 0 ${-h}, ${w} 0`} fill={palette.landmarkFill} />
      {/* sunlit face */}
      <polygon
        points={flip ? `0 ${-h}, ${w} 0, 0 0` : `${-w} 0, 0 ${-h}, 0 0`}
        fill={palette.landmarkAccent}
        opacity={0.28}
      />
    </g>
  );
  return (
    <g aria-hidden>
      <Pyr x={-150} w={230} h={250} />
      <Pyr x={170} w={190} h={210} flip />
      <Pyr x={360} w={110} h={120} />
    </g>
  );
}
