import { BLEED_X, CONTENT_W, VIEWBOX } from '../types';

// The vintage postcard finish (Oct 2026, gallery first): the colours pulled toward an old print, warm and slightly
// faded, paper grain, a vignette, and a cream border with rounded corners like a real postcard. Still overlays on top
// of the whole scene, so they cost nothing per frame.

const CREAM = '#f1e6cf';
/** The border's width inside the 16:9 view, and the picture's corner radius. */
const BORDER = 22;
const RADIUS = 18;

export function PostcardFinish({ idPrefix, night }: { idPrefix: string; night: boolean }) {
  const id = `${idPrefix}-postcard`;
  const cx = BLEED_X + CONTENT_W / 2;
  // The picture window: the 16:9 view inset by the border. On wider screens the cream simply carries on outward,
  // like a card on a table.
  const x0 = BLEED_X + BORDER, y0 = BORDER, x1 = BLEED_X + CONTENT_W - BORDER, y1 = VIEWBOX.h - BORDER;
  const r = RADIUS;
  const hole = `M ${x0 + r} ${y0} H ${x1 - r} Q ${x1} ${y0} ${x1} ${y0 + r} V ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} H ${x0 + r} Q ${x0} ${y1} ${x0} ${y1 - r} V ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;
  return (
    <g aria-hidden style={{ pointerEvents: 'none' }}>
      <defs>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.33  0 0 0 0 0.26  0 0 0 0 0.18  0 0 0 1 0" />
        </filter>
        <radialGradient id={`${id}-vignette`} cx={cx} cy={VIEWBOX.h * 0.48} r={CONTENT_W * 0.6} gradientUnits="userSpaceOnUse">
          <stop offset="0.5" stopColor="#3a2614" stopOpacity="0" />
          <stop offset="1" stopColor="#3a2614" stopOpacity={night ? 0.42 : 0.32} />
        </radialGradient>
        <clipPath id={`${id}-pic`}><path d={hole} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-pic)`}>
        {/* the colours pulled toward an old sepia print */}
        <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="#b48a55" opacity={night ? 0.07 : 0.1} style={{ mixBlendMode: 'color' }} />
        {/* warm, slightly faded: darks lifted, light warmed */}
        <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="#f0d9ac" opacity={night ? 0.06 : 0.12} style={{ mixBlendMode: 'multiply' }} />
        <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="#ffe9c4" opacity={night ? 0.05 : 0.12} style={{ mixBlendMode: 'screen' }} />
        {/* paper grain */}
        <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} filter={`url(#${id}-grain)`} opacity={night ? 0.15 : 0.18} style={{ mixBlendMode: 'multiply' }} />
        <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill={`url(#${id}-vignette)`} />
      </g>
      {/* the cream card border, with a fine printed edge around the picture */}
      <path d={`M -200 -200 H ${VIEWBOX.w + 200} V ${VIEWBOX.h + 200} H -200 Z ${hole}`} fill={CREAM} fillRule="evenodd" />
      <path d={hole} fill="none" stroke="#c9b48f" strokeWidth={1.5} />
      <path d={hole} fill="none" stroke="#3a2614" strokeOpacity={0.18} strokeWidth={6} transform={`translate(0 1.5)`} style={{ mixBlendMode: 'multiply' }} clipPath={`url(#${id}-pic)`} />
      {/* the card itself has grain too */}
      <path d={`M -200 -200 H ${VIEWBOX.w + 200} V ${VIEWBOX.h + 200} H -200 Z ${hole}`} fillRule="evenodd" filter={`url(#${id}-grain)`} opacity={0.18} style={{ mixBlendMode: 'multiply' }} />
    </g>
  );
}
