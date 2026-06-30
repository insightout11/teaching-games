'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, CircleDot, ChevronLeft, ChevronRight, Cog, Mic, CheckCircle2 } from 'lucide-react';

/**
 * LessonCaptain — Premium Flight Plan UI
 *
 * SVG route with elegant quadratic segments, evenly spaced nodes,
 * cards above route anchors, parked plane at takeoff, premium radar background.
 */

export type FlightPlanStep = {
  id: string;
  type: string;
  name: string;
  kind: 'terminal' | 'module' | 'checkpoint';
};

type FlightPlanMode = 'planner' | 'runtime';

/**
 * How densely the route's stage labels render, derived from how much horizontal
 * room each node gets (see {@link getLabelMode}):
 *  - `full`    — every stage card labeled (wide / projector)
 *  - `compact` — only current + immediate neighbors labeled, smaller cards
 *  - `minimal` — only the current stage labeled; everything else is a bare dot
 * Micro-event pips are always unlabeled regardless of mode.
 */
type LabelMode = 'full' | 'compact' | 'minimal';

/** Horizontal inset (px, in viewBox units) reserved at each end of the route. */
function getRouteInset(width: number, isRuntime: boolean) {
  return clamp(width * 0.1, 32, isRuntime ? 140 : 200);
}

/** Even spacing (px) between adjacent nodes for the given viewBox width + count. */
function getNodeSpacing(width: number, count: number, isRuntime: boolean) {
  if (count <= 1) return width;
  const inset = getRouteInset(width, isRuntime);
  return Math.max(0, width - inset * 2) / (count - 1);
}

/** Pick the label density from the room each node actually gets. */
function getLabelMode(width: number, count: number, isRuntime: boolean): LabelMode {
  if (count <= 1) return 'full';
  const spacing = getNodeSpacing(width, count, isRuntime);
  // full + compact both label every stage; they differ only in card density. Only the
  // genuinely tight `minimal` regime drops to current-stage-only + tappable dots.
  if (spacing >= 116) return 'full';
  if (spacing >= 64) return 'compact';
  return 'minimal';
}

interface LessonCaptainFlightPlanProps {
  steps?: FlightPlanStep[];
  width?: number;
  height?: number;
  className?: string;
  mode?: FlightPlanMode;
  activeIndex?: number;
  onNodeClick?: (stepId: string) => void;
  onMoveModule?: (index: number, direction: 'left' | 'right') => void;
  slotBudgets?: number[];
  pacingIndex?: number;
  /** Render in the bright "engaged" state permanently (no hover needed) — used on marketing. */
  forceEmphasis?: boolean;
  /**
   * On narrow (phone) screens, trade the wide thin-strip aspect for a taller, squarer
   * panel so the route, active card and plane don't collapse into an unreadable sliver.
   * Opt-in (default false) so the in-session strip stays compact. Uses the caller's
   * `height` as the cap, so it only grows tall where a generous height was provided.
   */
  growOnNarrow?: boolean;
  /**
   * Tall "showcase" layout for marketing surfaces: ~2× the height, and stage cards
   * zig-zag above/below the route so they never collide. Opt-in (default false) so the
   * compact in-session strip is unaffected. Disabled automatically on narrow screens.
   */
  showcase?: boolean;
}

const DEFAULT_STEPS: FlightPlanStep[] = [
  { id: 'takeoff', type: 'Takeoff', name: 'Mission Selector', kind: 'terminal' },
  { id: 'm1', type: 'Presentation', name: 'Prediction Round', kind: 'module' },
  { id: 'm2', type: 'Production', name: 'Hot Take Arena', kind: 'module' },
  { id: 'm3', type: 'Practice', name: 'Vocab Sprint', kind: 'module' },
  { id: 'landing', type: 'Landing', name: 'Final Answer', kind: 'terminal' },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const segmentProgress = (index: number, activeIndex: number) => {
  if (activeIndex <= index) return 0;
  if (activeIndex >= index + 1) return 1;
  return clamp(activeIndex - index, 0, 1);
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function buildRadarRings(cx: number, cy: number, radii: number[], start = 210, end = 330) {
  return radii.map((r, i) => {
    const startP = polarToCartesian(cx, cy, r, end);
    const endP = polarToCartesian(cx, cy, r, start);
    const largeArcFlag = end - start <= 180 ? 0 : 1;
    return {
      id: `ring-${i}`,
      d: `M ${startP.x} ${startP.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${endP.x} ${endP.y}`,
    };
  });
}

type NodePoint = FlightPlanStep & {
  index: number;
  t: number;
  x: number;
  y: number;
  xPercent: number;
  yPercent: number;
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  cardXPercent: number;
  cardYPercent: number;
  cardWidthPercent: number;
  /** Zig-zag: whether this node's card sits above (true) or below (false) the route. */
  cardAbove: boolean;
};

function isCheckpoint(point: FlightPlanStep) {
  return point.kind === 'checkpoint';
}

function computeNodeLayout(
  steps: FlightPlanStep[],
  width: number,
  height: number,
  mode: FlightPlanMode = 'planner',
  labelMode: LabelMode = 'full',
  zigzag = false,
): NodePoint[] {
  const isRuntime = mode === 'runtime';
  const inset = getRouteInset(width, isRuntime);
  const left = inset;
  const right = width - inset;
  const span = right - left;
  const count = steps.length;

  // Zig-zag centres the route so cards have room both above and below it.
  const baseY = zigzag ? height * 0.52 : height * (isRuntime ? 0.72 : 0.66);
  const arcLift = zigzag
    ? clamp(16 + count * 1.5, 18, 38)
    : isRuntime ? clamp(28 + count * 3, 36, 56) : clamp(42 + count * 4, 54, 82);
  const cardRowY = isRuntime ? clamp(height * 0.12, 14, 40) : clamp(height * 0.18, 80, 100);
  // Zig-zag: cards alternate above/below the route, so neighbours sit a full 2× spacing
  // apart and never collide. cardSlot counts only card-bearing (non-checkpoint) nodes so
  // the alternation stays even regardless of where micro-event pips fall.
  const zCardHeight = zigzag ? 56 : isRuntime ? 44 : 62;
  const aboveCardTop = zigzag ? clamp(height * 0.05, 8, 44) : cardRowY;
  const belowCardTop = clamp(height * 0.6, height * 0.5, height - zCardHeight - 8);
  let cardSlot = 0;

  // Cards are sized in viewBox px (which equal CSS px once measured), so they stay
  // a comfortable physical size on every screen; only the horizontal spread changes.
  // CRITICAL: keep cardWidth strictly NARROWER than node spacing so neighbouring cards
  // never collide — the previous `spacing + 8` made every card wider than its slot, so
  // adjacent stage cards always overlapped (~16px). A negative margin leaves a clean gap.
  const baseCardWidth = isRuntime ? 124 : 180;
  const spacing = getNodeSpacing(width, count, isRuntime);
  const cardWidth =
    labelMode === 'full'
      ? clamp(spacing - 20, 92, baseCardWidth)
      : labelMode === 'compact'
        ? clamp(spacing - 14, 56, baseCardWidth)
        : clamp(width * 0.45, 120, isRuntime ? 220 : baseCardWidth);

  return steps.map((step, index) => {
    const t = count === 1 ? 0 : index / (count - 1);
    const x = left + span * t;
    const liftFactor = 4 * t * (1 - t);
    const y = baseY - arcLift * liftFactor;
    const cardHeight = zCardHeight;

    const isCp = step.kind === 'checkpoint';
    let cardAbove = true;
    let cardY = cardRowY;
    if (zigzag && !isCp) {
      cardAbove = cardSlot % 2 === 0;
      cardY = cardAbove ? aboveCardTop : belowCardTop;
      cardSlot += 1;
    } else if (zigzag) {
      cardY = aboveCardTop;
    }

    return {
      ...step,
      index,
      t,
      x,
      y,
      xPercent: (x / width) * 100,
      yPercent: (y / height) * 100,
      cardX: x,
      cardY,
      cardWidth,
      cardHeight,
      cardAbove,
      cardXPercent: (x / width) * 100,
      cardYPercent: (cardY / height) * 100,
      cardWidthPercent: (cardWidth / width) * 100,
    };
  });
}

function buildSmoothPath(points: NodePoint[]) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const cy = Math.min(p0.y, p1.y) - 10;
    d += ` Q ${mx} ${cy} ${p1.x} ${p1.y}`;
  }
  return d;
}

function buildSegmentPaths(points: NodePoint[]) {
  const segments: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const cy = Math.min(p0.y, p1.y) - 10;
    segments.push(`M ${p0.x} ${p0.y} Q ${mx} ${cy} ${p1.x} ${p1.y}`);
  }
  return segments;
}

function buildContrailPath(points: NodePoint[], activeIndex: number) {
  if (!points.length) return '';
  const maxPointIndex = clamp(activeIndex, 0, points.length - 1);
  const wholeSegments = Math.floor(maxPointIndex);
  const partial = maxPointIndex - wholeSegments;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < Math.min(wholeSegments, points.length - 1); i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const cy = Math.min(p0.y, p1.y) - 10;
    d += ` Q ${mx} ${cy} ${p1.x} ${p1.y}`;
  }

  if (partial > 0 && wholeSegments < points.length - 1) {
    const p0 = points[wholeSegments];
    const p1 = points[wholeSegments + 1];
    const mx = (p0.x + p1.x) / 2;
    const cy = Math.min(p0.y, p1.y) - 10;

    const qx = (1 - partial) * (1 - partial) * p0.x + 2 * (1 - partial) * partial * mx + partial * partial * p1.x;
    const qy = (1 - partial) * (1 - partial) * p0.y + 2 * (1 - partial) * partial * cy + partial * partial * p1.y;
    const cx = p0.x + partial * (mx - p0.x);
    const cy2 = p0.y + partial * (cy - p0.y);
    d += ` Q ${cx} ${cy2} ${qx} ${qy}`;
  }

  return d;
}

type Point2D = { x: number; y: number };

function pointOnQuadratic(p0: Point2D, p1: Point2D, c: Point2D, t: number): Point2D {
  return {
    x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
    y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y,
  };
}

function tangentOnQuadratic(p0: Point2D, p1: Point2D, c: Point2D, t: number): Point2D {
  return {
    x: 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p1.x - c.x),
    y: 2 * (1 - t) * (c.y - p0.y) + 2 * t * (p1.y - c.y),
  };
}

function getPlaneState(points: NodePoint[], activeIndex: number) {
  if (!points.length) return null;
  const safeIndex = clamp(activeIndex, 0, points.length - 1);
  const whole = Math.floor(safeIndex);
  const partial = safeIndex - whole;

  if (whole >= points.length - 1) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2] ?? last;
    const angle = Math.atan2(last.y - prev.y, last.x - prev.x) * (180 / Math.PI);
    return { x: last.x, y: last.y, angle };
  }

  const p0 = points[whole];
  const p1 = points[whole + 1];
  const c = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 10 };
  const pos = pointOnQuadratic(p0, p1, c, partial);
  const tan = tangentOnQuadratic(p0, p1, c, partial);
  const angle = Math.atan2(tan.y, tan.x) * (180 / Math.PI);
  return { ...pos, angle };
}

function getStepIcon(type: string, className: string) {
  const lower = type.toLowerCase();
  if (lower === 'takeoff' || lower === 'presentation') return <Plane className={className} strokeWidth={2} />;
  if (lower === 'practice') return <Cog className={className} strokeWidth={2} />;
  if (lower === 'production') return <Mic className={className} strokeWidth={2} />;
  if (lower === 'landing') return <CheckCircle2 className={className} strokeWidth={2} />;
  return <CircleDot className={className} strokeWidth={2} />;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type BgIds = { radarPulse: string; clipPath: string };

function BackgroundLayer({
  width,
  height,
  bgIds,
  emphasized = false,
}: {
  width: number;
  height: number;
  bgIds: BgIds;
  emphasized?: boolean;
}) {
  const radarRings = buildRadarRings(width * 0.16, height * 0.8, [110, 170, 230, 290]);

  // At wide/short aspect ratios (session strip) the height-based gR is too small and the
  // globe arc spans only a fraction of the width. Scale up gR so the arc always covers ~75% of width.
  const gRBase = height * 4.8;
  const ld = height * 0.14;
  const gR = Math.max(gRBase, ((width * 0.375) ** 2 / ld + ld) / 2);
  const gcx = width * 0.5;
  const gcy = height * 0.73 + gR;
  const landY = height * 0.73 + height * 0.14;
  const lcx = width * 0.22;
  const rcx = width * 0.78;
  const leftLandPath = `
    M ${lcx - width * 0.19} ${landY + height * 0.034}
    C ${lcx - width * 0.145} ${landY - height * 0.028}, ${lcx - width * 0.065} ${landY - height * 0.055}, ${lcx + width * 0.006} ${landY - height * 0.047}
    C ${lcx + width * 0.07} ${landY - height * 0.04}, ${lcx + width * 0.14} ${landY - height * 0.014}, ${lcx + width * 0.185} ${landY + height * 0.032}
    C ${lcx + width * 0.125} ${landY + height * 0.066}, ${lcx + width * 0.025} ${landY + height * 0.078}, ${lcx - width * 0.085} ${landY + height * 0.068}
    C ${lcx - width * 0.15} ${landY + height * 0.062}, ${lcx - width * 0.19} ${landY + height * 0.048}, ${lcx - width * 0.19} ${landY + height * 0.034}
    Z
  `;
  const leftLandRidgePath = `
    M ${lcx - width * 0.12} ${landY + height * 0.022}
    C ${lcx - width * 0.055} ${landY - height * 0.006}, ${lcx + width * 0.04} ${landY - height * 0.002}, ${lcx + width * 0.11} ${landY + height * 0.026}
    C ${lcx + width * 0.045} ${landY + height * 0.04}, ${lcx - width * 0.055} ${landY + height * 0.044}, ${lcx - width * 0.12} ${landY + height * 0.022}
    Z
  `;
  const rightLandPath = `
    M ${rcx - width * 0.155} ${landY + height * 0.04}
    C ${rcx - width * 0.105} ${landY - height * 0.018}, ${rcx - width * 0.025} ${landY - height * 0.038}, ${rcx + width * 0.06} ${landY - height * 0.025}
    C ${rcx + width * 0.13} ${landY - height * 0.014}, ${rcx + width * 0.17} ${landY + height * 0.006}, ${rcx + width * 0.18} ${landY + height * 0.032}
    C ${rcx + width * 0.11} ${landY + height * 0.056}, ${rcx + width * 0.02} ${landY + height * 0.064}, ${rcx - width * 0.075} ${landY + height * 0.058}
    C ${rcx - width * 0.13} ${landY + height * 0.054}, ${rcx - width * 0.158} ${landY + height * 0.047}, ${rcx - width * 0.155} ${landY + height * 0.04}
    Z
  `;
  const rightLandRidgePath = `
    M ${rcx - width * 0.075} ${landY + height * 0.018}
    C ${rcx - width * 0.02} ${landY + height * 0.002}, ${rcx + width * 0.07} ${landY + height * 0.003}, ${rcx + width * 0.13} ${landY + height * 0.026}
    C ${rcx + width * 0.06} ${landY + height * 0.038}, ${rcx - width * 0.026} ${landY + height * 0.04}, ${rcx - width * 0.075} ${landY + height * 0.018}
    Z
  `;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[28px]">
      <motion.div
        className="absolute inset-0 bg-[#07111f]"
        animate={{ opacity: emphasized ? 0.7 : 0.26 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="absolute -inset-x-20 inset-y-0"
        style={{
          background:
            'radial-gradient(ellipse 38% 16% at 28% 78%, rgba(47, 255, 158, 0.56), transparent 62%), radial-gradient(ellipse 32% 14% at 76% 79%, rgba(50, 222, 129, 0.35), transparent 66%), radial-gradient(ellipse 34% 28% at 44% 42%, rgba(67, 249, 220, 0.30), transparent 64%), radial-gradient(ellipse 36% 28% at 64% 36%, rgba(70, 214, 255, 0.28), transparent 64%), radial-gradient(ellipse 32% 30% at 80% 52%, rgba(119, 111, 255, 0.32), transparent 65%)',
        }}
        animate={{
          opacity: emphasized ? 0.9 : 0.13,
          x: emphasized ? ['-2%', '2%', '-2%'] : ['-1%', '1%', '-1%'],
        }}
        transition={{
          opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          x: { duration: emphasized ? 8 : 14, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.div
        className="absolute inset-y-0 -left-1/3 w-2/3 rotate-[-9deg]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(91, 255, 210, 0.18) 34%, rgba(93, 255, 158, 0.28) 48%, rgba(100, 218, 255, 0.20) 60%, transparent 100%)',
          filter: 'blur(16px)',
        }}
        animate={{
          opacity: emphasized ? 0.95 : 0.08,
          x: emphasized ? ['-12%', '95%'] : ['-8%', '38%'],
        }}
        transition={{
          opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          x: { duration: emphasized ? 7.5 : 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.045] transition-opacity duration-500 group-hover/flightplan:opacity-[0.20] group-focus-within/flightplan:opacity-[0.20]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(120,160,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(120,160,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(circle at center, black 35%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 35%, transparent 95%)',
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: emphasized ? 1 : 0.32 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            'radial-gradient(ellipse 34% 18% at 22% 70%, rgba(83, 255, 176, 0.18), transparent 64%), radial-gradient(ellipse 36% 28% at 50% 18%, rgba(63, 158, 255, 0.19), transparent 62%), radial-gradient(ellipse 32% 26% at 18% 70%, rgba(71, 237, 255, 0.13), transparent 66%), radial-gradient(ellipse 30% 28% at 82% 24%, rgba(132, 101, 255, 0.14), transparent 64%)',
        }}
      />

      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`} fill="none">
        <defs>
          <radialGradient id={bgIds.radarPulse} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(102,241,255,0.14)" />
            <stop offset="100%" stopColor="rgba(102,241,255,0)" />
          </radialGradient>
          <clipPath id={bgIds.clipPath}>
            <circle cx={gcx} cy={gcy} r={gR} />
          </clipPath>
          {/* Land terrain gradients — bright inland center fading to dark coastal edges */}
          <radialGradient id={`${bgIds.radarPulse}-ll`} cx={lcx} cy={landY} r={width * 0.17} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2a7040" />
            <stop offset="35%" stopColor="#19502a" />
            <stop offset="70%" stopColor="#0d2f17" />
            <stop offset="100%" stopColor="#061308" />
          </radialGradient>
          <radialGradient id={`${bgIds.radarPulse}-lr`} cx={lcx - width * 0.01} cy={landY - height * 0.04} r={width * 0.08} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#348a4e" />
            <stop offset="60%" stopColor="#1a5530" />
            <stop offset="100%" stopColor="#0a2214" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${bgIds.radarPulse}-rl`} cx={rcx} cy={landY} r={width * 0.16} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#267a3c" />
            <stop offset="35%" stopColor="#174b25" />
            <stop offset="70%" stopColor="#0c2c15" />
            <stop offset="100%" stopColor="#050f08" />
          </radialGradient>
          <radialGradient id={`${bgIds.radarPulse}-rr`} cx={rcx + width * 0.01} cy={landY - height * 0.02} r={width * 0.07} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#308046" />
            <stop offset="60%" stopColor="#175230" />
            <stop offset="100%" stopColor="#0a1f10" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Globe ocean */}
        <motion.circle
          cx={gcx}
          cy={gcy}
          r={gR}
          fill="#061525"
          animate={{ opacity: emphasized ? 0.82 : 0.22 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Stylized landmasses — gradient fills give brighter inland, darker coastal edges */}
        <motion.path d={leftLandPath} fill={`url(#${bgIds.radarPulse}-ll)`} clipPath={`url(#${bgIds.clipPath})`} animate={{ opacity: emphasized ? 0.95 : 0.18 }} transition={{ duration: 0.45 }} />
        <motion.path d={leftLandRidgePath} fill={`url(#${bgIds.radarPulse}-lr)`} clipPath={`url(#${bgIds.clipPath})`} animate={{ opacity: emphasized ? 0.55 : 0.10 }} transition={{ duration: 0.45 }} />
        <motion.path d={rightLandPath} fill={`url(#${bgIds.radarPulse}-rl)`} clipPath={`url(#${bgIds.clipPath})`} animate={{ opacity: emphasized ? 0.88 : 0.16 }} transition={{ duration: 0.45 }} />
        <motion.path d={rightLandRidgePath} fill={`url(#${bgIds.radarPulse}-rr)`} clipPath={`url(#${bgIds.clipPath})`} animate={{ opacity: emphasized ? 0.48 : 0.09 }} transition={{ duration: 0.45 }} />


        {/* Atmosphere rim */}
        <circle cx={gcx} cy={gcy} r={gR + 3} stroke="rgba(70,155,255,0.18)" strokeWidth={6} />
        <circle cx={gcx} cy={gcy} r={gR + 10} stroke="rgba(50,130,255,0.06)" strokeWidth={14} />

        <circle cx={width * 0.16} cy={height * 0.8} r="320" fill={`url(#${bgIds.radarPulse})`} />

        {radarRings.map((ring) => (
          <path
            key={ring.id}
            d={ring.d}
            stroke="rgba(113, 205, 255, 0.14)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="4 8"
          />
        ))}

        {[0, 1, 2].map((i) => {
          const angle = 228 + i * 20;
          const p1 = polarToCartesian(width * 0.16, height * 0.8, 40, angle);
          const p2 = polarToCartesian(width * 0.16, height * 0.8, 320, angle);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="rgba(113, 205, 255, 0.10)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
}

type LayerIds = {
  routeGradient: string;
  routeGlow: string;
  routeBloom: string;
  routeHighlight: string;
  nodeGlow: string;
  nodePulseGlow: string;
  planeGlow: string;
};

function PathLayer({
  width,
  height,
  points,
  mode = 'planner',
  activeIndex = 0,
  ids,
  emphasized = false,
}: {
  width: number;
  height: number;
  points: NodePoint[];
  mode?: FlightPlanMode;
  activeIndex?: number;
  ids: LayerIds;
  emphasized?: boolean;
}) {
  const fullPath = useMemo(() => buildSmoothPath(points), [points]);
  const segmentPaths = useMemo(() => buildSegmentPaths(points), [points]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _contrailPath = useMemo(() => buildContrailPath(points, activeIndex), [points, activeIndex]);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={ids.routeGradient} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#76FFD0" />
          <stop offset="34%" stopColor="#54F3FF" />
          <stop offset="64%" stopColor="#77A6FF" />
          <stop offset="100%" stopColor="#C38BFF" />
        </linearGradient>
        <filter id={ids.routeGlow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur1" />
          <feColorMatrix in="blur1" type="matrix" values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.75 0" />
        </filter>
        <filter id={ids.routeBloom} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <radialGradient id={ids.routeHighlight} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <path d={fullPath} stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round" fill="none" />

      <motion.path
        d={fullPath}
        stroke={`url(#${ids.routeGradient})`}
        strokeWidth={emphasized ? '13' : '6.5'}
        strokeLinecap="round"
        fill="none"
        filter={`url(#${ids.routeBloom})`}
        initial={{ pathLength: 0, opacity: 0.25 }}
        animate={{ pathLength: 1, opacity: emphasized ? 1 : 0.28 }}
        transition={{ duration: emphasized ? 0.6 : 1.35, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.path
        d={fullPath}
        stroke={`url(#${ids.routeGradient})`}
        strokeWidth={emphasized ? '4.4' : '2.1'}
        strokeLinecap="round"
        fill="none"
        filter={`url(#${ids.routeGlow})`}
        initial={{ pathLength: 0, opacity: 0.72 }}
        animate={{ pathLength: 1, opacity: emphasized ? 1 : 0.42 }}
        transition={{ duration: emphasized ? 0.6 : 1.35, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.path
        d={fullPath}
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: emphasized ? 0.82 : 0.24 }}
        transition={{ duration: 1.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      />

      {segmentPaths.map((d, i) => {
        const progress = segmentProgress(i, activeIndex);
        return (
          <g key={i}>
            <motion.path
              d={d}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.35 }}
            />
            {mode === 'runtime' && (
              <motion.path
                d={d}
                stroke={emphasized ? 'rgba(198, 255, 228, 0.96)' : 'rgba(183, 239, 255, 0.72)'}
                strokeWidth={emphasized ? '2.8' : '1.8'}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: progress, opacity: progress > 0 ? (emphasized ? 0.98 : 0.38) : 0 }}
                transition={{ duration: emphasized ? 0.7 : 1.6, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </g>
        );
      })}

      {mode === 'planner' ? (
        <motion.circle
          r="88"
          fill={`url(#${ids.routeHighlight})`}
          initial={{ opacity: 0, cx: points[0]?.x ?? 0, cy: points[0]?.y ?? 0 }}
          animate={{
            opacity: [0, 0.5, 0.22],
            cx: points.map((p) => p.x),
            cy: points.map((p) => p.y),
          }}
          transition={{
            delay: 0.55,
            duration: 3.8,
            ease: 'easeInOut',
            times: points.map((_, i) => (points.length === 1 ? 0 : i / (points.length - 1))),
          }}
        />
      ) : (
        _contrailPath && (
          <>
            <motion.path
              d={_contrailPath}
              stroke="rgba(222, 248, 255, 0.58)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: emphasized ? 0.92 : 0.32 }}
              transition={{ duration: 0.35 }}
              strokeDasharray="6 8"
            />
            <motion.path
              d={_contrailPath}
              stroke={emphasized ? 'rgba(85, 255, 177, 0.28)' : 'rgba(95, 226, 255, 0.16)'}
              strokeWidth={emphasized ? '10' : '6'}
              strokeLinecap="round"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: emphasized ? 0.48 : 0.1 }}
              transition={{ duration: 0.35 }}
            />
          </>
        )
      )}
    </svg>
  );
}

function NodeCard({
  point,
  delay = 0,
  isRuntime = false,
  nodeState = 'future',
  compact = false,
  onClick,
  onMoveLeft,
  onMoveRight,
  estimatedMinutes,
}: {
  point: NodePoint;
  delay?: number;
  isRuntime?: boolean;
  nodeState?: 'completed' | 'current' | 'future';
  /** Drop the type eyebrow + tighten padding when space is constrained. */
  compact?: boolean;
  onClick?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  estimatedMinutes?: number;
}) {
  const isClickable = !!onClick;
  const showMoveButtons = !!(onMoveLeft || onMoveRight);
  const iconSize = isRuntime ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const iconWrapSize = isRuntime ? 'p-1' : 'p-1.5';

  const cardOpacity = nodeState === 'completed' ? 'opacity-60' : nodeState === 'current' ? 'ring-1 ring-cyan-400/30' : '';

  return (
    <motion.div
      className="absolute -translate-x-1/2 overflow-hidden"
      style={{
        left: `${point.cardXPercent}%`,
        top: `${point.cardYPercent}%`,
        width: `min(${point.cardWidth}px, ${point.cardWidthPercent.toFixed(3)}%)`,
      }}
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`relative w-full rounded-2xl border border-white/[0.14] bg-[#0a1a2e]/85 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.45)] ${cardOpacity} ${
          compact ? 'px-2.5 py-1.5' : isRuntime ? 'px-3 py-2' : 'px-4 py-3'
        } ${
          isClickable ? 'cursor-pointer hover:border-cyan-300/30 hover:bg-[#0d2040]/90 transition-colors' : ''
        }`}
        onClick={onClick}
      >
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] pointer-events-none" />
        <div className="absolute -inset-px rounded-2xl opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(111,225,255,0.18),transparent_45%)]" />

        <div className="relative flex items-start gap-2">
          {!compact && (
            <div className={`mt-0.5 rounded-full border border-white/10 bg-white/[0.08] ${iconWrapSize}`}>
              {getStepIcon(point.type, `${iconSize} text-cyan-200/90`)}
            </div>
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            {!compact && (
              <div className={`uppercase tracking-[0.06em] font-semibold truncate ${
                isRuntime
                  ? 'text-[10px] text-cyan-200/70'
                  : 'text-[11px] text-cyan-200/65'
              }`}>
                {point.type}
              </div>
            )}
            <div className={`leading-tight text-white/[0.92] break-words ${
              compact ? 'text-xs font-medium' : isRuntime ? 'mt-0.5 text-xs font-medium' : 'mt-1 text-sm font-medium'
            }`}>{point.name}</div>
            {estimatedMinutes !== undefined && (
              <div className="mt-1 text-[9px] text-white/40 font-normal tracking-wide">
                ~{estimatedMinutes} min
              </div>
            )}
          </div>
        </div>

        {showMoveButtons && (
          <div className="relative flex items-center justify-center gap-1 mt-2 -mb-1">
            {onMoveLeft ? (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveLeft(); }}
                className="rounded-full p-0.5 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="w-[18px]" />
            )}
            {onMoveRight ? (
              <button
                onClick={(e) => { e.stopPropagation(); onMoveRight(); }}
                className="rounded-full p-0.5 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="w-[18px]" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CheckpointMarker({
  point,
  delay = 0,
  nodeState = 'future',
  revealed = false,
  onClick,
}: {
  point: NodePoint;
  delay?: number;
  nodeState?: 'completed' | 'current' | 'future';
  /** Force the label tooltip open (e.g. tapped on a narrow screen). */
  revealed?: boolean;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;
  const isCurrent = nodeState === 'current';
  const showLabel = isCurrent || revealed;

  return (
    <motion.div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${point.xPercent}%`,
        top: `${point.yPercent}%`,
      }}
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        aria-label={`${point.type}: ${point.name}`}
        title={`${point.type}: ${point.name}`}
        onClick={onClick}
        className={[
          'relative flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-colors',
          isCurrent
            ? 'border-cyan-200/75 bg-cyan-300/15 shadow-[0_0_18px_rgba(103,232,249,0.45)]'
            : nodeState === 'completed'
              ? 'border-cyan-200/35 bg-cyan-300/10'
              : 'border-cyan-200/20 bg-[#0a1a2e]/45 hover:border-cyan-200/45',
          isClickable ? 'cursor-pointer' : 'cursor-default',
        ].join(' ')}
      >
        <CircleDot className="h-3.5 w-3.5 text-cyan-100/85" strokeWidth={2.2} />
      </button>

      {showLabel && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-9 w-max max-w-[180px] -translate-x-1/2 rounded-full border border-cyan-200/20 bg-[#07111f]/90 px-3 py-1.5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.38)] backdrop-blur-md"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.08, duration: 0.24 }}
        >
          <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-cyan-200/70">
            {point.type}
          </span>
          <span className="text-[11px] font-semibold text-white/90">{point.name}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Transparent hit-area over a collapsed stage node (no card shown). Tapping reveals
 * the node's label as a floating pill (and navigates where wired). Used when the route
 * is too tight to show every stage card.
 */
function CollapsedNodeTarget({
  point,
  revealed = false,
  onClick,
}: {
  point: NodePoint;
  revealed?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
    >
      <button
        type="button"
        aria-label={`${point.type}: ${point.name}`}
        title={`${point.type}: ${point.name}`}
        onClick={onClick}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
      >
        <span className="sr-only">{point.name}</span>
      </button>

      {revealed && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-9 w-max max-w-[180px] -translate-x-1/2 rounded-full border border-cyan-200/20 bg-[#07111f]/90 px-3 py-1.5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.38)] backdrop-blur-md"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-cyan-200/70">
            {point.type}
          </span>
          <span className="text-[11px] font-semibold text-white/90">{point.name}</span>
        </motion.div>
      )}
    </div>
  );
}

function NodeLayer({
  width,
  height,
  points,
  mode = 'planner',
  activeIndex = 0,
  ids,
  onNodeClick,
  onMoveModule,
  slotBudgets,
  labelMode = 'full',
}: {
  width: number;
  height: number;
  points: NodePoint[];
  mode?: FlightPlanMode;
  activeIndex?: number;
  ids: LayerIds;
  onNodeClick?: (stepId: string) => void;
  onMoveModule?: (index: number, direction: 'left' | 'right') => void;
  slotBudgets?: number[];
  labelMode?: LabelMode;
}) {
  // Module points only (excluding terminals) for move-button boundary logic
  const modulePoints = points.filter((p) => p.kind === 'module');
  const firstModuleId = modulePoints[0]?.id;
  const lastModuleId = modulePoints[modulePoints.length - 1]?.id;

  // Narrow screens collapse most stage cards to dots; tapping reveals a node's label.
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const currentIndex = Math.round(activeIndex);
  // full + compact label every stage; minimal labels only the current one (others tap).
  const isLabeledStage = (i: number) => labelMode !== 'minimal' || i === currentIndex;

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
        <defs>
          <filter id={ids.nodeGlow} x="-200%" y="-200%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={ids.nodePulseGlow} x="-300%" y="-300%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {points.map((point, i) => {
          const isCompleted = mode === 'runtime' && activeIndex > i;
          const isActive = mode === 'runtime' && activeIndex >= i && activeIndex < i + 1;
          const isFuture = mode === 'runtime' && !isCompleted && !isActive;
          const checkpoint = isCheckpoint(point);
          return (
            <g key={point.id}>
              {!checkpoint && isLabeledStage(i) && (
                <motion.line
                  x1={point.x}
                  y1={point.cardAbove ? point.y - 12 : point.y + 12}
                  x2={point.x}
                  y2={point.cardAbove ? point.cardY + point.cardHeight : point.cardY}
                  stroke={isActive ? 'rgba(192, 240, 255, 0.50)' : isCompleted ? 'rgba(192, 240, 255, 0.30)' : 'rgba(170, 225, 255, 0.18)'}
                  strokeWidth={isActive ? '1.5' : '1.2'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.52 + i * 0.12, duration: 0.28 }}
                />
              )}

              <motion.circle
                cx={point.x}
                cy={point.y}
                r={checkpoint ? (isActive ? 16 : 10) : isActive ? 26 : 17}
                fill={isActive ? 'rgba(95, 226, 255, 0.18)' : isCompleted ? 'rgba(175, 244, 255, 0.10)' : 'rgba(95, 226, 255, 0.06)'}
                filter={`url(#${ids.nodePulseGlow})`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                  mode === 'runtime'
                    ? {
                        opacity: isActive ? [0.3, 0.7, 0.3] : isCompleted ? [0.15, 0.22, 0.15] : [0.08, 0.14, 0.08],
                        scale: isActive ? [0.96, 1.28, 0.96] : [0.95, 1.05, 0.95],
                      }
                    : { opacity: [0.18, 0.44, 0.18], scale: [0.92, 1.16, 0.92] }
                }
                transition={{ delay: 0.68 + i * 0.12, duration: isActive ? 2.0 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              />

              <motion.circle
                cx={point.x}
                cy={point.y}
                r={checkpoint ? (isActive ? 8 : 6.5) : isActive ? 14 : isCompleted ? 12 : 11}
                fill={isActive ? 'rgba(95, 226, 255, 0.32)' : isCompleted ? 'rgba(170, 246, 255, 0.20)' : isFuture ? 'rgba(95, 226, 255, 0.10)' : 'rgba(95, 226, 255, 0.18)'}
                filter={`url(#${ids.nodeGlow})`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.34 + i * 0.12, duration: 0.32 }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              />

              <motion.circle
                cx={point.x}
                cy={point.y}
                r={checkpoint ? (isActive ? '4.6' : '3.7') : isActive ? '6.5' : '5.3'}
                fill={isActive ? '#ffffff' : isCompleted ? '#c8edf5' : isFuture ? '#8ecdd9' : '#dff9ff'}
                stroke={isActive ? 'rgba(95, 226, 255, 1)' : isCompleted ? 'rgba(200, 237, 245, 0.70)' : isFuture ? 'rgba(95, 226, 255, 0.45)' : 'rgba(95, 226, 255, 0.85)'}
                strokeWidth={checkpoint ? (isActive ? '2' : '1.5') : isActive ? '2.5' : '2'}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.3 }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              />
            </g>
          );
        })}
      </svg>

      {points.map((point, i) => {
        const isModule = point.kind === 'module';
        const checkpoint = isCheckpoint(point);
        const canClick = (isModule || checkpoint) && !!onNodeClick;
        const canMove = isModule && !!onMoveModule;
        const isRuntime = mode === 'runtime';
        const nodeState: 'completed' | 'current' | 'future' =
          isRuntime && activeIndex > i ? 'completed' :
          isRuntime && activeIndex >= i && activeIndex < i + 1 ? 'current' : 'future';

        // Tapping a node reveals its label; where navigation is wired it also jumps there.
        const handleTap =
          canClick || labelMode !== 'full'
            ? () => {
                setRevealedId((prev) => (prev === point.id ? null : point.id));
                if (canClick) onNodeClick!(point.id);
              }
            : undefined;

        if (checkpoint) {
          return (
            <CheckpointMarker
              key={point.id}
              point={point}
              delay={0.5 + i * 0.12}
              nodeState={isRuntime ? nodeState : 'future'}
              revealed={revealedId === point.id}
              onClick={handleTap}
            />
          );
        }

        // Stage node with no room for its card → bare dot + tap-to-reveal.
        if (!isLabeledStage(i)) {
          return (
            <CollapsedNodeTarget
              key={point.id}
              point={point}
              revealed={revealedId === point.id}
              onClick={handleTap}
            />
          );
        }

        return (
          <NodeCard
            key={point.id}
            point={point}
            delay={0.54 + i * 0.12}
            isRuntime={isRuntime}
            nodeState={isRuntime ? nodeState : 'future'}
            compact={labelMode !== 'full'}
            onClick={canClick ? () => onNodeClick!(point.id) : undefined}
            onMoveLeft={canMove && point.id !== firstModuleId ? () => onMoveModule!(i, 'left') : undefined}
            onMoveRight={canMove && point.id !== lastModuleId ? () => onMoveModule!(i, 'right') : undefined}
            estimatedMinutes={slotBudgets?.[i]}
          />
        );
      })}
    </>
  );
}

function PlaneLayer({
  width,
  height,
  points,
  takeoffPoint,
  mode = 'planner',
  activeIndex = 0,
  ids,
  pacingIndex,
}: {
  width: number;
  height: number;
  points: NodePoint[];
  takeoffPoint: NodePoint | undefined;
  mode?: FlightPlanMode;
  activeIndex?: number;
  ids: LayerIds;
  pacingIndex?: number;
}) {
  if (!takeoffPoint) return null;

  const derivedActiveIndex = activeIndex;
  const planeState = getPlaneState(points, activeIndex) ?? { x: takeoffPoint.x, y: takeoffPoint.y, angle: -12 };
  const isPlanner = mode === 'planner';
  const rawPlaneX = isPlanner ? takeoffPoint.x : planeState.x;
  const rawPlaneY = isPlanner ? takeoffPoint.y : planeState.y;
  const planeX = typeof rawPlaneX === 'number' && isFinite(rawPlaneX) ? rawPlaneX : 0;
  const planeY = typeof rawPlaneY === 'number' && isFinite(rawPlaneY) ? rawPlaneY : 0;
  const planeAngle = (typeof planeState.angle === 'number' && isFinite(planeState.angle)) ? (isPlanner ? -12 : planeState.angle) : -12;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <filter id={ids.planeGlow} x="-200%" y="-200%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* Ghost pacing dot — only when teacher is behind pace */}
      {pacingIndex !== undefined && pacingIndex > derivedActiveIndex && mode === 'runtime' && (() => {
        const ghostState = getPlaneState(points, pacingIndex);
        if (!ghostState) return null;
        return (
          <motion.circle
            r={5}
            fill="white"
            fillOpacity={0.3}
            stroke="white"
            strokeOpacity={0.45}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            animate={{ cx: ghostState.x, cy: ghostState.y }}
            initial={false}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        );
      })()}

      <motion.g
        initial={isPlanner ? { opacity: 0, scale: 0.88, x: planeX, y: planeY } : { opacity: 1, x: planeX, y: planeY }}
        animate={isPlanner ? { opacity: 1, scale: 1, x: planeX, y: planeY } : { opacity: 1, x: planeX, y: planeY }}
        transition={isPlanner
          ? { opacity: { delay: 1.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }, scale: { delay: 1.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
          : { x: { duration: 4.0, ease: [0.22, 1, 0.36, 1] }, y: { duration: 4.0, ease: [0.22, 1, 0.36, 1] } }
        }
      >
        <ellipse
          cx={-8}
          cy={-16}
          rx={isPlanner ? 24 : 21}
          ry={isPlanner ? 12 : 10}
          fill="rgba(95, 226, 255, 0.20)"
          filter={`url(#${ids.planeGlow})`}
          opacity={isPlanner ? 0.22 : 0.24}
        />

        <motion.g
          animate={
            isPlanner
              ? { y: [0, -2.5, 0], rotate: [-1.2, 0.4, -1.2] }
              : { y: [0, -1.2, 0], rotate: planeAngle }
          }
          transition={isPlanner
            ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
            : { y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } }
          }
          style={{ transformOrigin: '0px -10px' }}
        >
          {/* Circle background */}
          <circle cx={0} cy={-10} r={22} fill="#0d1d32" fillOpacity={0.85} stroke="rgba(103,232,249,0.25)" strokeWidth={1} />
          {/* Plane icon — Lucide path scaled to fit circle (original viewBox 0 0 24 24, centered at 12,12, scaled ~0.9 and offset) */}
          <g transform="translate(-10.8, -22.8) scale(0.9)" stroke="rgb(165,243,252)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </g>
        </motion.g>
      </motion.g>
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function LessonCaptainFlightPlan({
  steps = DEFAULT_STEPS,
  width = 1280,
  height = 520,
  className = '',
  mode = 'planner',
  activeIndex: controlledActiveIndex,
  onNodeClick,
  onMoveModule,
  slotBudgets,
  pacingIndex,
  forceEmphasis = false,
  growOnNarrow = false,
  showcase = false,
}: LessonCaptainFlightPlanProps) {
  const safeSteps = useMemo(() => {
    if (!Array.isArray(steps) || steps.length < 3) return DEFAULT_STEPS;
    return steps;
  }, [steps]);

  // The route fills its container: the viewBox width is the *measured* pixel width,
  // so viewBox units == CSS px (the plane, nodes and cards stay a consistent physical
  // size on every screen; only the horizontal spread adapts). `width` is just the
  // pre-measurement / SSR fallback. Height is fixed by the caller.
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const vbW = measuredWidth ?? width;
  // Height tracks width (more square on narrow, a thin strip when wide) and is capped at
  // the caller's `height` so the route never gets absurdly tall on a large screen. The
  // viewBox always matches the rendered box aspect, so the HTML overlay stays aligned.
  // On phones the runtime strip collapses to an unreadable sliver; opt-in `growOnNarrow`
  // swaps to a squarer aspect so the active card + plane have room (capped by `height`).
  const isNarrow = vbW > 0 && vbW < 600;
  const grow = growOnNarrow && isNarrow;
  // Showcase: a tall, roomy marketing panel with zig-zag cards. Falls back to the normal
  // layout on narrow screens (no room for above+below cards on a phone).
  const useZigzag = showcase && !isNarrow;
  const targetAspect = useZigzag ? 2.9 : mode === 'runtime' ? (grow ? 1.5 : 9) : 4.8;
  const minHeight = useZigzag ? 300 : mode === 'runtime' ? (grow ? 220 : 88) : 150;
  const vbH = clamp(vbW / targetAspect, Math.min(minHeight, height), height);

  const labelMode = useMemo(
    () => (useZigzag ? 'full' : getLabelMode(vbW, safeSteps.length, mode === 'runtime')),
    [useZigzag, vbW, safeSteps.length, mode],
  );

  const points = useMemo(
    () => computeNodeLayout(safeSteps, vbW, vbH, mode, labelMode, useZigzag),
    [safeSteps, vbW, vbH, mode, labelMode, useZigzag],
  );
  const takeoffPoint = points[0];

  const baseId = useId();
  const ids: LayerIds = useMemo(() => {
    const s = baseId.replace(/:/g, '');
    return {
      routeGradient: `${s}-rg`,
      routeGlow: `${s}-rgw`,
      routeBloom: `${s}-rb`,
      routeHighlight: `${s}-rh`,
      nodeGlow: `${s}-ng`,
      nodePulseGlow: `${s}-npg`,
      planeGlow: `${s}-pg`,
    };
  }, [baseId]);

  const bgIds = useMemo(() => {
    const s = baseId.replace(/:/g, '');
    return { radarPulse: `${s}-bg-rp`, clipPath: `${s}-bg-gc` };
  }, [baseId]);

  const derivedActiveIndex = useMemo(() => {
    if (mode === 'planner') return 0;
    if (typeof controlledActiveIndex === 'number') {
      return clamp(controlledActiveIndex, 0, Math.max(points.length - 1, 0));
    }
    return Math.min(2.35, Math.max(points.length - 1, 0));
  }, [mode, controlledActiveIndex, points.length]);

  // Prevent SSR of framer-motion + SVG foreignObject content (causes hydration mismatch #418)
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  useEffect(() => setMounted(true), []);
  const isEngaged = forceEmphasis || isHovered || hasFocusWithin;

  // Track the rendered width so the route fits any container without horizontal scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = (w: number) => {
      if (w > 0) setMeasuredWidth((prev) => (prev !== null && Math.abs(prev - w) < 1 ? prev : w));
    };
    update(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className={`group/flightplan relative w-full overflow-hidden ${mode === 'runtime' ? 'rounded-2xl' : 'rounded-[28px]'} border border-white/[0.07] bg-[#07111f]/20 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-[1px] transition-all duration-500 hover:border-emerald-200/25 hover:shadow-[0_20px_95px_rgba(52,235,170,0.14),0_0_55px_rgba(34,211,238,0.10)] focus-within:border-emerald-200/25 focus-within:shadow-[0_20px_95px_rgba(52,235,170,0.14),0_0_55px_rgba(34,211,238,0.10)] ${className}`}
      style={{ aspectRatio: `${vbW} / ${vbH}` }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHasFocusWithin(false);
        }
      }}
    >
      {!mounted ? null : (
        <>
          <BackgroundLayer width={vbW} height={vbH} bgIds={bgIds} emphasized={isEngaged} />

          {mode !== 'runtime' && (
            <motion.div
              className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-8"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">LessonCaptain</div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">Flight Plan</h2>
              </div>
            </motion.div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/[0.04] transition-colors duration-500 group-hover/flightplan:ring-emerald-200/[0.16] group-focus-within/flightplan:ring-emerald-200/[0.16]" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[27px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.006)_18%,transparent_34%)] opacity-45 transition-opacity duration-500 group-hover/flightplan:opacity-100 group-focus-within/flightplan:opacity-100" />

          <PathLayer width={vbW} height={vbH} points={points} mode={mode} activeIndex={derivedActiveIndex} ids={ids} emphasized={isEngaged} />
          <NodeLayer width={vbW} height={vbH} points={points} mode={mode} activeIndex={derivedActiveIndex} ids={ids} onNodeClick={onNodeClick} onMoveModule={onMoveModule} slotBudgets={slotBudgets} labelMode={labelMode} />
          <PlaneLayer width={vbW} height={vbH} points={points} takeoffPoint={takeoffPoint} mode={mode} activeIndex={derivedActiveIndex} ids={ids} pacingIndex={pacingIndex} />

          <div className={`pointer-events-none absolute inset-x-0 bottom-0 ${mode === 'runtime' ? 'h-8' : 'h-28'} bg-gradient-to-t from-[#050b15] to-transparent`} />
        </>
      )}
    </div>
  );
}
