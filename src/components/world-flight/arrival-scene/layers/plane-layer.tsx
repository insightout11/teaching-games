import { motion } from 'framer-motion';
import { getPlaneAsset, getPlaneViewAsset } from '@/lib/plane-progression';
import { LAYOUT, type ArrivalPhase, type SceneLayerProps } from '../types';
import { departureCalibrationBlend, departurePlaneFrame, type PlaneFrame } from '../cinematic-motion';

const PW = 480;
const PH = 240;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Quadratic ease-out (brisk start, settling to zero velocity at the end). Used to
// take the abrupt edges off the landing: a descent flare into touchdown and a
// braking ground roll that eases to a smooth stop instead of halting hard.
const easeOut = (p: number) => 1 - (1 - p) * (1 - p);

// Touchdown and taxi are ONE continuous ground roll; this is touchdown's share of
// it, from the arrivalTimeline phase widths (touchdown 0.52–0.72 = 0.20, taxi
// 0.72–0.94 = 0.22, total 0.42). Mapping both phases onto a single eased-out cx
// over 660→1130 makes the plane brake to a smooth stop with no velocity jump at
// the touchdown→taxi or taxi→landed seams.
const ROLL_TOUCHDOWN_SHARE = 0.2 / 0.42;
const ROLL_FROM = 660;
const ROLL_TO = 1130;

// Pure function: phase + progress -> exact side-profile frame. `cyBase` is the
// wheel line; the image is drawn above it. Approach scaling creates a subtle
// move toward camera before the full-size touchdown and taxi views.
function computeFrame(phase: ArrivalPhase, p: number): PlaneFrame {
  const runway = LAYOUT.runwayY;
  switch (phase) {
    case 'approach':
      return {
        cx: lerp(-120, ROLL_FROM, p),
        // Flare: descent rate and pitch ease off as the wheels near the runway, so
        // there's no vertical-velocity kink at the moment of touchdown.
        cyBase: lerp(470, runway, easeOut(p)),
        rot: lerp(-4, -1, easeOut(p)),
        flying: true,
        depthScale: lerp(0.76, 1, p),
      };
    case 'touchdown': {
      const g = p * ROLL_TOUCHDOWN_SHARE;
      return {
        cx: lerp(ROLL_FROM, ROLL_TO, easeOut(g)),
        cyBase: runway,
        rot: lerp(-1, 0, easeOut(p)),
        flying: false,
        depthScale: 1,
      };
    }
    case 'taxi': {
      const g = ROLL_TOUCHDOWN_SHARE + p * (1 - ROLL_TOUCHDOWN_SHARE);
      return { cx: lerp(ROLL_FROM, ROLL_TO, easeOut(g)), cyBase: runway, rot: 0, flying: false, depthScale: 1 };
    }
    case 'landed':
    default:
      return { cx: ROLL_TO, cyBase: runway, rot: 0, flying: false, depthScale: 1 };
  }
}

export function PlaneLayer({ planeKey, phase, progress, ambient, mode, idPrefix }: SceneLayerProps & { planeKey?: string | null }) {
  const plane = getPlaneAsset(planeKey);
  const runwayPlaneSrc = getPlaneViewAsset(planeKey, 'ground');
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
        href={runwayPlaneSrc}
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
