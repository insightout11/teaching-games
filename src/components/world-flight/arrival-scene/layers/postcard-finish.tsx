import { BLEED_X, CONTENT_W, VIEWBOX } from '../types';

// The vintage postcard finish (Oct 2026, gallery first): soft paper grain, a gentle warm fade like an old print, and a
// vignette toward the edges of the view. One still overlay on top of the whole scene, so it costs nothing per frame.
export function PostcardFinish({ idPrefix, night }: { idPrefix: string; night: boolean }) {
  const id = `${idPrefix}-postcard`;
  const cx = BLEED_X + CONTENT_W / 2;
  return (
    <g aria-hidden style={{ pointerEvents: 'none' }}>
      <defs>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.9 0" />
        </filter>
        <radialGradient id={`${id}-vignette`} cx={cx} cy={VIEWBOX.h * 0.48} r={CONTENT_W * 0.62} gradientUnits="userSpaceOnUse">
          <stop offset="0.55" stopColor="#2a1c10" stopOpacity="0" />
          <stop offset="1" stopColor="#2a1c10" stopOpacity={night ? 0.42 : 0.3} />
        </radialGradient>
      </defs>
      {/* a warm, slightly faded print */}
      <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="#f2dfb8" opacity={night ? 0.05 : 0.11} style={{ mixBlendMode: 'multiply' }} />
      <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="#fff4dc" opacity={night ? 0.03 : 0.07} style={{ mixBlendMode: 'screen' }} />
      {/* paper grain */}
      <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} filter={`url(#${id}-grain)`} opacity={night ? 0.16 : 0.2} style={{ mixBlendMode: 'multiply' }} />
      <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill={`url(#${id}-vignette)`} />
    </g>
  );
}
