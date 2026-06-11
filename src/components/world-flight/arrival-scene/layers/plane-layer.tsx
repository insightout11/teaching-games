import { motion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';
import { LAYOUT, type ArrivalPhase, type SceneLayerProps } from '../types';

const PW = 286;
const PH = 150;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Departure path (takeoff): the plane rolls right along the runway, rotates and
// climbs out toward the upper-right. Single 0→1 progress; phase is ignored.
function computeDepartureFrame(p: number): { cx: number; cyBase: number; rot: number; flying: boolean } {
  const runway = LAYOUT.runwayY;
  if (p < 0.45) {
    // ground roll — accelerating down the runway
    return { cx: lerp(300, 860, p / 0.45), cyBase: runway, rot: 0, flying: false };
  }
  // rotate + climb out
  const t = (p - 0.45) / 0.55;
  return { cx: lerp(860, 1520, t), cyBase: lerp(runway, 150, t), rot: lerp(0, -12, t), flying: true };
}

// Pure function: phase + progress → exact frame. Side-profile path — plane
// descends diagonally from the upper-left, touches the horizontal runway, taxis
// right, then parks. `cyBase` is the wheel/base line; the image is drawn above it.
function computeFrame(phase: ArrivalPhase, p: number): { cx: number; cyBase: number; rot: number; flying: boolean } {
  const runway = LAYOUT.runwayY;
  switch (phase) {
    case 'approach':
      return {
        cx: lerp(180, 660, p),
        cyBase: lerp(250, runway, p),
        rot: lerp(-7, -2, p),
        flying: true,
      };
    case 'touchdown': {
      // small settle bounce as the wheels meet the tarmac
      const bounce = Math.sin(p * Math.PI) * 9 * (1 - p);
      return { cx: lerp(660, 800, p), cyBase: runway - bounce, rot: lerp(-2, 0, p), flying: false };
    }
    case 'taxi':
      return { cx: lerp(800, 1120, p), cyBase: runway, rot: 0, flying: false };
    case 'landed':
    default:
      return { cx: 1130, cyBase: runway, rot: 0, flying: false };
  }
}

export function PlaneLayer({ planeKey, phase, progress, ambient, mode }: SceneLayerProps & { planeKey?: string | null }) {
  const plane = getPlaneAsset(planeKey);
  const p = Math.min(1, Math.max(0, progress));
  const { cx, cyBase, rot, flying } = mode === 'departure' ? computeDepartureFrame(p) : computeFrame(phase, p);

  const meta = plane.displayMeta;
  const scale = flying ? meta.flyingScale : meta.parkedScale;
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

  // Engine bob is ambient-only and purely cosmetic (±2px); it never moves the
  // plane along its arrival path (that is governed solely by phase/progress).
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
