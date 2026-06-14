import { motion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';
import { LAYOUT, type ArrivalPhase, type SceneLayerProps } from '../types';
import { departureCalibrationBlend, departurePlaneFrame, type PlaneFrame } from '../cinematic-motion';

const PW = 480;
const PH = 240;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
      return {
        cx: lerp(660, 800, p),
        cyBase: runway,
        rot: lerp(-1, 0, p),
        flying: false,
        depthScale: 1,
      };
    }
    case 'taxi':
      return { cx: lerp(800, 1130, p), cyBase: runway, rot: 0, flying: false, depthScale: 1 };
    case 'landed':
    default:
      return { cx: 1130, cyBase: runway, rot: 0, flying: false, depthScale: 1 };
  }
}

export function PlaneLayer({ planeKey, phase, progress, ambient, mode, idPrefix }: SceneLayerProps & { planeKey?: string | null }) {
  const plane = getPlaneAsset(planeKey);
  const p = Math.min(1, Math.max(0, progress));
  const { cx, cyBase, rot, flying, depthScale } = mode === 'departure' ? departurePlaneFrame(p) : computeFrame(phase, p);

  const meta = plane.displayMeta;
  // Blend aircraft-specific display calibration so parked/flying scale & offset
  // differences never snap: across arrival touchdown (flying→parked over p), and
  // across the departure rotation boundary (DEP_ROLL) via the shared blend.
  const landingBlend =
    mode === 'departure'
      ? departureCalibrationBlend(p)
      : mode === 'arrival' && phase === 'touchdown'
        ? p
        : flying ? 0 : 1;
  const scale = lerp(meta.flyingScale, meta.parkedScale, landingBlend) * depthScale;
  const yOffset = lerp(meta.transitionYOffset, meta.runwayYOffset, landingBlend);

  const x = cx - PW / 2;
  const y = cyBase - PH - yOffset;
  const altitude = Math.max(0, LAYOUT.runwayY - cyBase);
  const shadowOpacity = Math.max(0, 0.25 * (1 - altitude / 420)) * depthScale;
  const shadowBlur = Math.min(10, 2 + altitude / 55);
  const shadowRx = PW * 0.3 * scale * (1 + altitude / 1000);
  const shadowRy = 7 + altitude / 55;
  const shadowId = `${idPrefix}-plane-shadow`;

  const art = (
    <>
      <defs>
        <filter id={shadowId} x="-30%" y="-150%" width="160%" height="400%">
          <feGaussianBlur stdDeviation={shadowBlur} />
        </filter>
      </defs>
      {shadowOpacity > 0 && (
        <ellipse
          cx={cx}
          cy={LAYOUT.runwayY + 7}
          rx={shadowRx}
          ry={shadowRy}
          fill="#05080d"
          opacity={shadowOpacity}
          filter={`url(#${shadowId})`}
        />
      )}
      <image
        href={plane.webp}
        x={x}
        y={y}
        width={PW}
        height={PH}
        preserveAspectRatio="xMidYMax meet"
        style={{ transformBox: 'fill-box', transformOrigin: 'center bottom', transform: `rotate(${rot}deg) scale(${scale})` }}
      />
    </>
  );

  // Engine bob is ambient-only and cosmetic; phase/progress own the flight path.
  if (!ambient) {
    return <g aria-hidden>{art}</g>;
  }
  return (
    <motion.g
      aria-hidden
      animate={{ y: flying ? [0, -3, 0] : [0, -1.6, 0] }}
      transition={{ duration: flying ? 3.4 : 4.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {art}
    </motion.g>
  );
}
