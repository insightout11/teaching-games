import { motion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';
import { LAYOUT, type ArrivalPhase, type SceneLayerProps } from '../types';

const PW = 480;
const PH = 240;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface PlaneFrame {
  cx: number;
  cyBase: number;
  rot: number;
  flying: boolean;
  depthScale: number;
}

// Departure path: the plane rolls right along the runway, rotates and climbs
// toward the upper-right. It shrinks gently as it leaves the close foreground.
function computeDepartureFrame(p: number): PlaneFrame {
  const runway = LAYOUT.runwayY;
  if (p < 0.45) {
    return { cx: lerp(300, 860, p / 0.45), cyBase: runway, rot: 0, flying: false, depthScale: 1 };
  }

  const t = (p - 0.45) / 0.55;
  return {
    cx: lerp(860, 1520, t),
    cyBase: lerp(runway, 150, t),
    rot: lerp(0, -12, t),
    flying: true,
    depthScale: lerp(1, 0.76, t),
  };
}

// Pure function: phase + progress -> exact side-profile frame. `cyBase` is the
// wheel line; the image is drawn above it. Approach scaling creates a subtle
// move toward camera before the full-size touchdown and taxi views.
function computeFrame(phase: ArrivalPhase, p: number): PlaneFrame {
  const runway = LAYOUT.runwayY;
  switch (phase) {
    case 'approach':
      return {
        cx: lerp(-120, 660, p),
        cyBase: lerp(470, runway, p),
        rot: lerp(-4, -1, p),
        flying: true,
        depthScale: lerp(0.76, 1, p),
      };
    case 'touchdown': {
      const bounce = Math.sin(p * Math.PI) * 9 * (1 - p);
      return {
        cx: lerp(660, 800, p),
        cyBase: runway - bounce,
        rot: lerp(-2, 0, p),
        flying: false,
        depthScale: 1,
      };
    }
    case 'taxi':
      return { cx: lerp(800, 1120, p), cyBase: runway, rot: 0, flying: false, depthScale: 1 };
    case 'landed':
    default:
      return { cx: 1130, cyBase: runway, rot: 0, flying: false, depthScale: 1 };
  }
}

export function PlaneLayer({ planeKey, phase, progress, ambient, mode }: SceneLayerProps & { planeKey?: string | null }) {
  const plane = getPlaneAsset(planeKey);
  const p = Math.min(1, Math.max(0, progress));
  const { cx, cyBase, rot, flying, depthScale } = mode === 'departure' ? computeDepartureFrame(p) : computeFrame(phase, p);

  const meta = plane.displayMeta;
  const scale = (flying ? meta.flyingScale : meta.parkedScale) * depthScale;
  const yOffset = flying ? meta.transitionYOffset : meta.runwayYOffset;

  const x = cx - PW / 2;
  const y = cyBase - PH - yOffset;

  const img = (
    <image
      href={plane.webp}
      x={x}
      y={y}
      width={PW}
      height={PH}
      preserveAspectRatio="xMidYMax meet"
      style={{ transformBox: 'fill-box', transformOrigin: 'center bottom', transform: `rotate(${rot}deg) scale(${scale})` }}
    />
  );

  // Engine bob is ambient-only and cosmetic; phase/progress own the flight path.
  if (!ambient) {
    return <g aria-hidden>{img}</g>;
  }
  return (
    <motion.g
      aria-hidden
      animate={{ y: flying ? [0, -3, 0] : [0, -1.6, 0] }}
      transition={{ duration: flying ? 3.4 : 4.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {img}
    </motion.g>
  );
}
