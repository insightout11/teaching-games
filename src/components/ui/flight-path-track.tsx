'use client';

// ── Shared SVG flight-path primitive ─────────────────────────────────────────
// Renders bezier connectors + node circles + optional animated plane marker.
// Used by the lesson planner (FlightPathSVG) and the session stage bar
// (FlightStageBar in flight-session-view). Neither caller renders SVG path
// logic directly — all drawing lives here.

export interface PathSegmentConfig {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  /** Tailwind / CSS class applied to the <path> (e.g. "text-lc-border") */
  className?: string;
}

export interface PathNodeConfig {
  r: number;
  /** Inline SVG fill. Ignored when fillClassName is set. */
  fill?: string;
  /** Tailwind fill-* class (overrides inline fill via CSS specificity). */
  fillClassName?: string;
  stroke?: string;
  strokeWidth?: number;
  /** Pulsing ambient glow ring behind the node. */
  glow?: boolean;
  glowFill?: string;
  /** ✓ check mark drawn inside the node. */
  showCheck?: boolean;
  checkStroke?: string;
  /** Transparent hit-area circle radius (wider than the visible node). */
  hitRadius?: number;
  onClick?: () => void;
}

interface FlightPathTrackProps {
  /** Total number of nodes. */
  count: number;
  nodeSpacing: number;
  paddingX: number;
  /** y-coordinate of the track centre line. */
  cy: number;
  svgHeight: number;
  /** Bezier control-point offset as a fraction of segment length. Default 0.35. */
  cpFraction?: number;
  /** Bezier vertical deviation in px. Default 12. */
  cpDeviation?: number;
  /**
   * Segment configs, indexed 0…(count-2).
   * Index 0 = gap between node 0 and node 1.
   */
  segments?: PathSegmentConfig[];
  /** Node configs, indexed 0…(count-1). */
  nodes?: PathNodeConfig[];
  /** When set, renders a ✈ marker at this node index, animating on change. */
  planeNodeIndex?: number;
  /** y baseline for the plane character. Defaults to cy - 16. */
  planeY?: number;
  planeFill?: string;
  className?: string;
}

export function FlightPathTrack({
  count,
  nodeSpacing,
  paddingX,
  cy,
  svgHeight,
  cpFraction = 0.35,
  cpDeviation = 12,
  segments,
  nodes,
  planeNodeIndex,
  planeY,
  planeFill = 'rgba(34,211,238,0.92)',
  className,
}: FlightPathTrackProps) {
  const svgWidth = paddingX * 2 + (count - 1) * nodeSpacing;
  const xs = Array.from({ length: count }, (_, i) => paddingX + i * nodeSpacing);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ minWidth: svgWidth, display: 'block' }}
      className={className}
    >
      {/* Bezier path segments */}
      {segments?.map((seg, i) => {
        const x1 = xs[i];
        const x2 = xs[i + 1];
        if (x1 === undefined || x2 === undefined) return null;
        const cp = (x2 - x1) * cpFraction;
        return (
          <path
            key={`seg-${i}`}
            d={`M ${x1} ${cy} C ${x1 + cp} ${cy - cpDeviation}, ${x2 - cp} ${cy + cpDeviation}, ${x2} ${cy}`}
            fill="none"
            stroke={seg.stroke ?? 'currentColor'}
            strokeWidth={seg.strokeWidth ?? 2}
            strokeDasharray={seg.strokeDasharray}
            className={seg.className}
          />
        );
      })}

      {/* Nodes */}
      {nodes?.map((node, i) => {
        const cx = xs[i];
        if (cx === undefined) return null;
        const hasClick = !!node.onClick;

        return (
          <g
            key={`node-${i}`}
            onClick={node.onClick}
            style={hasClick ? { cursor: 'pointer' } : undefined}
          >
            {/* Ambient glow ring */}
            {node.glow && (
              <circle
                cx={cx} cy={cy}
                r={node.r + 7}
                fill={node.glowFill ?? 'rgba(34,211,238,0.13)'}
                className="animate-pulse"
              />
            )}

            {/* Transparent hit area for easier clicking */}
            {hasClick && node.hitRadius !== undefined && (
              <circle cx={cx} cy={cy} r={node.hitRadius} fill="transparent" />
            )}

            {/* Visible node circle */}
            <circle
              cx={cx} cy={cy} r={node.r}
              fill={node.fillClassName ? undefined : (node.fill ?? 'transparent')}
              stroke={node.stroke ?? 'none'}
              strokeWidth={node.strokeWidth ?? 1.5}
              className={node.fillClassName}
            />

            {/* Check mark for completed stages */}
            {node.showCheck && (
              <path
                d={`M ${cx - node.r * 0.44} ${cy + node.r * 0.06} l ${node.r * 0.33} ${node.r * 0.28} l ${node.r * 0.61} ${-node.r * 0.61}`}
                fill="none"
                stroke={node.checkStroke ?? 'rgba(34,211,238,0.85)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}

      {/* Animated plane marker — slides along x when planeNodeIndex changes */}
      {planeNodeIndex !== undefined && xs[planeNodeIndex] !== undefined && (
        <text
          x={0}
          y={planeY ?? cy - 16}
          textAnchor="middle"
          fontSize="16"
          fill={planeFill}
          style={{
            transform: `translateX(${xs[planeNodeIndex]}px)`,
            transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          ✈
        </text>
      )}
    </svg>
  );
}
