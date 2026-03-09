'use client';

import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plane, CircleDot, ChevronLeft, ChevronRight } from 'lucide-react';

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
  kind: 'terminal' | 'module';
};

type FlightPlanMode = 'planner' | 'runtime';

interface LessonCaptainFlightPlanProps {
  steps?: FlightPlanStep[];
  width?: number;
  height?: number;
  className?: string;
  mode?: FlightPlanMode;
  activeIndex?: number;
  onNodeClick?: (stepId: string) => void;
  onMoveModule?: (index: number, direction: 'left' | 'right') => void;
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
};

function computeNodeLayout(steps: FlightPlanStep[], width: number, height: number): NodePoint[] {
  const left = 160;
  const right = width - 160;
  const span = right - left;
  const count = steps.length;

  const baseY = height * 0.66;
  const arcLift = clamp(42 + count * 4, 54, 82);
  const cardRowY = clamp(height * 0.18, 80, 100);
  const cardWidth = 188;

  return steps.map((step, index) => {
    const t = count === 1 ? 0 : index / (count - 1);
    const x = left + span * t;
    const liftFactor = 4 * t * (1 - t);
    const y = baseY - arcLift * liftFactor;
    const cardHeight = 62;

    return {
      ...step,
      index,
      t,
      x,
      y,
      xPercent: (x / width) * 100,
      yPercent: (y / height) * 100,
      cardX: x,
      cardY: cardRowY,
      cardWidth,
      cardHeight,
      cardXPercent: (x / width) * 100,
      cardYPercent: (cardRowY / height) * 100,
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function BackgroundLayer({ width, height }: { width: number; height: number }) {
  const radarRings = buildRadarRings(width * 0.16, height * 0.8, [110, 170, 230, 290]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[28px]">
      <div className="absolute inset-0 bg-[#07111f]" />

      <div
        className="absolute inset-0 opacity-[0.11]"
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

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(63, 139, 255, 0.16), transparent 30%), radial-gradient(circle at 18% 70%, rgba(71, 222, 255, 0.11), transparent 35%), radial-gradient(circle at 82% 24%, rgba(118, 92, 255, 0.10), transparent 28%)',
        }}
      />

      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`} fill="none">
        <defs>
          <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(102,241,255,0.14)" />
            <stop offset="100%" stopColor="rgba(102,241,255,0)" />
          </radialGradient>
        </defs>

        <circle cx={width * 0.16} cy={height * 0.8} r="320" fill="url(#radarPulse)" />

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
}: {
  width: number;
  height: number;
  points: NodePoint[];
  mode?: FlightPlanMode;
  activeIndex?: number;
  ids: LayerIds;
}) {
  const fullPath = useMemo(() => buildSmoothPath(points), [points]);
  const segmentPaths = useMemo(() => buildSegmentPaths(points), [points]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _contrailPath = useMemo(() => buildContrailPath(points, activeIndex), [points, activeIndex]);

  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={ids.routeGradient} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5FE2FF" />
          <stop offset="45%" stopColor="#71A6FF" />
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
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${ids.routeBloom})`}
        initial={{ pathLength: 0, opacity: 0.25 }}
        animate={{ pathLength: 1, opacity: 0.9 }}
        transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.path
        d={fullPath}
        stroke={`url(#${ids.routeGradient})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${ids.routeGlow})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.path
        d={fullPath}
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.55 }}
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
                stroke="rgba(183, 239, 255, 0.88)"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: progress, opacity: progress > 0 ? 0.95 : 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.35 }}
              strokeDasharray="6 8"
            />
            <motion.path
              d={_contrailPath}
              stroke="rgba(95, 226, 255, 0.24)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
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
  onClick,
  onMoveLeft,
  onMoveRight,
}: {
  point: NodePoint;
  delay?: number;
  onClick?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const isClickable = !!onClick;
  const showMoveButtons = !!(onMoveLeft || onMoveRight);

  return (
    <motion.div
      className="absolute -translate-x-1/2"
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
        className={`relative w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.28)] ${
          isClickable ? 'cursor-pointer hover:border-cyan-300/30 hover:bg-white/[0.10] transition-colors' : ''
        }`}
        onClick={onClick}
      >
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] pointer-events-none" />
        <div className="absolute -inset-px rounded-2xl opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(111,225,255,0.18),transparent_45%)]" />

        <div className="relative flex items-start gap-2">
          <div className="mt-0.5 rounded-full border border-white/10 bg-white/[0.08] p-1.5">
            <CircleDot className="h-3.5 w-3.5 text-cyan-200/90" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
              {point.type}
            </div>
            <div className="mt-1 text-sm font-medium leading-tight text-white/[0.92]">{point.name}</div>
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

function NodeLayer({
  width,
  height,
  points,
  mode = 'planner',
  activeIndex = 0,
  ids,
  onNodeClick,
  onMoveModule,
}: {
  width: number;
  height: number;
  points: NodePoint[];
  mode?: FlightPlanMode;
  activeIndex?: number;
  ids: LayerIds;
  onNodeClick?: (stepId: string) => void;
  onMoveModule?: (index: number, direction: 'left' | 'right') => void;
}) {
  // Module points only (excluding terminals) for move-button boundary logic
  const modulePoints = points.filter((p) => p.kind === 'module');
  const firstModuleId = modulePoints[0]?.id;
  const lastModuleId = modulePoints[modulePoints.length - 1]?.id;

  return (
    <>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
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
          return (
            <g key={point.id}>
              <motion.line
                x1={point.x}
                y1={point.y - 12}
                x2={point.x}
                y2={point.cardY + point.cardHeight}
                stroke={isCompleted || isActive ? 'rgba(192, 240, 255, 0.42)' : 'rgba(170, 225, 255, 0.18)'}
                strokeWidth={isCompleted || isActive ? '1.5' : '1.2'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.52 + i * 0.12, duration: 0.28 }}
              />

              <motion.circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 22 : 17}
                fill={isCompleted ? 'rgba(175, 244, 255, 0.18)' : 'rgba(95, 226, 255, 0.10)'}
                filter={`url(#${ids.nodePulseGlow})`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                  mode === 'runtime'
                    ? {
                        opacity: isActive ? [0.2, 0.58, 0.2] : isCompleted ? [0.22, 0.36, 0.22] : [0.12, 0.22, 0.12],
                        scale: isActive ? [0.96, 1.22, 0.96] : [0.92, 1.1, 0.92],
                      }
                    : { opacity: [0.18, 0.44, 0.18], scale: [0.92, 1.16, 0.92] }
                }
                transition={{ delay: 0.68 + i * 0.12, duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              />

              <motion.circle
                cx={point.x}
                cy={point.y}
                r={isCompleted ? 13 : 11}
                fill={isCompleted ? 'rgba(170, 246, 255, 0.34)' : 'rgba(95, 226, 255, 0.18)'}
                filter={`url(#${ids.nodeGlow})`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.34 + i * 0.12, duration: 0.32 }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              />

              <motion.circle
                cx={point.x}
                cy={point.y}
                r="5.3"
                fill={isCompleted ? '#ffffff' : '#dff9ff'}
                stroke={isCompleted ? 'rgba(225, 250, 255, 1)' : 'rgba(95, 226, 255, 0.85)'}
                strokeWidth="2"
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
        const canClick = isModule && !!onNodeClick;
        const canMove = isModule && !!onMoveModule;

        return (
          <NodeCard
            key={point.id}
            point={point}
            delay={0.54 + i * 0.12}
            onClick={canClick ? () => onNodeClick!(point.id) : undefined}
            onMoveLeft={canMove && point.id !== firstModuleId ? () => onMoveModule!(i, 'left') : undefined}
            onMoveRight={canMove && point.id !== lastModuleId ? () => onMoveModule!(i, 'right') : undefined}
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
}: {
  width: number;
  height: number;
  points: NodePoint[];
  takeoffPoint: NodePoint | undefined;
  mode?: FlightPlanMode;
  activeIndex?: number;
  ids: LayerIds;
}) {
  if (!takeoffPoint) return null;

  const planeState = getPlaneState(points, activeIndex) ?? { x: takeoffPoint.x, y: takeoffPoint.y, angle: -12 };
  const isPlanner = mode === 'planner';
  const planeX = isPlanner ? takeoffPoint.x : planeState.x;
  const planeY = isPlanner ? takeoffPoint.y : planeState.y;
  const planeAngle = isPlanner ? -12 : planeState.angle;

  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <filter id={ids.planeGlow} x="-200%" y="-200%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <motion.g
        initial={{ opacity: 0, scale: 0.88, x: -6 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 1.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.ellipse
          cx={planeX - 8}
          cy={planeY - 16}
          rx={isPlanner ? 24 : 21}
          ry={isPlanner ? 12 : 10}
          fill="rgba(95, 226, 255, 0.20)"
          filter={`url(#${ids.planeGlow})`}
          animate={isPlanner ? { opacity: [0.16, 0.28, 0.16], scale: [0.94, 1.08, 0.94] } : { opacity: 0.24, scale: 1 }}
          transition={isPlanner ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.35 }}
          style={{ transformOrigin: `${planeX - 8}px ${planeY - 16}px` }}
        />

        <foreignObject x={planeX - 30} y={planeY - 40} width="60" height="60">
          <motion.div
            className="flex h-full w-full items-center justify-center"
            animate={
              isPlanner
                ? { y: [0, -2.5, 0], rotate: [-1.2, 0.4, -1.2] }
                : { y: [0, -1.2, 0], rotate: planeAngle }
            }
            transition={isPlanner ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: '50% 50%' }}
          >
            <div className="rounded-full border border-cyan-300/25 bg-[#0d1d32]/85 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <Plane className="h-6 w-6 text-cyan-200" strokeWidth={2.2} />
            </div>
          </motion.div>
        </foreignObject>
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
}: LessonCaptainFlightPlanProps) {
  const safeSteps = useMemo(() => {
    if (!Array.isArray(steps) || steps.length < 3) return DEFAULT_STEPS;
    return steps;
  }, [steps]);

  const points = useMemo(() => computeNodeLayout(safeSteps, width, height), [safeSteps, width, height]);
  const takeoffPoint = points[0];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const rawIds = [useId(), useId(), useId(), useId(), useId(), useId(), useId()];
  const ids: LayerIds = useMemo(() => ({
    routeGradient: rawIds[0].replace(/:/g, ''),
    routeGlow: rawIds[1].replace(/:/g, ''),
    routeBloom: rawIds[2].replace(/:/g, ''),
    routeHighlight: rawIds[3].replace(/:/g, ''),
    nodeGlow: rawIds[4].replace(/:/g, ''),
    nodePulseGlow: rawIds[5].replace(/:/g, ''),
    planeGlow: rawIds[6].replace(/:/g, ''),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const derivedActiveIndex = useMemo(() => {
    if (mode === 'planner') return 0;
    if (typeof controlledActiveIndex === 'number') {
      return clamp(controlledActiveIndex, 0, Math.max(points.length - 1, 0));
    }
    return Math.min(2.35, Math.max(points.length - 1, 0));
  }, [mode, controlledActiveIndex, points.length]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f] shadow-[0_20px_80px_rgba(0,0,0,0.45)] ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <BackgroundLayer width={width} height={height} />

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

        <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/65 backdrop-blur-xl">
          {safeSteps.length - 2} Modules
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/[0.06]" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[27px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01)_18%,transparent_34%)]" />

      <PathLayer width={width} height={height} points={points} mode={mode} activeIndex={derivedActiveIndex} ids={ids} />
      <NodeLayer width={width} height={height} points={points} mode={mode} activeIndex={derivedActiveIndex} ids={ids} onNodeClick={onNodeClick} onMoveModule={onMoveModule} />
      <PlaneLayer width={width} height={height} points={points} takeoffPoint={takeoffPoint} mode={mode} activeIndex={derivedActiveIndex} ids={ids} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050b15] to-transparent" />
    </div>
  );
}
