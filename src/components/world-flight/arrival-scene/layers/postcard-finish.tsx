import { Josefin_Sans } from 'next/font/google';
import { BLEED_X, CONTENT_W, VIEWBOX } from '../types';

// The landing card's lettering, so the postcard and the card read as one set
const deco = Josefin_Sans({ subsets: ['latin'], weight: ['600', '700'] });

// The vintage postcard finish (Oct 2026, gallery first): the colours pulled toward an old print, warm and slightly
// faded, paper grain, a vignette, and a cream border with rounded corners like a real postcard. Still overlays on top
// of the whole scene, so they cost nothing per frame.

const CREAM = '#f1e6cf';
/** The border's width inside the 16:9 view, and the picture's corner radius. */
const BORDER = 22;
const RADIUS = 18;

export function PostcardFinish({ idPrefix, night, title }: {
  idPrefix: string;
  night: boolean;
  /** The postcard's lettering: WELCOME TO, the city, the country. Shown once the plane is down. */
  title?: { city: string; country: string } | null;
}) {
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
        {title && <Title city={title.city} country={title.country} id={id} night={night} />}
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

/** Big postcard lettering across the top of the picture: printed ink, so the grain and fade above sit on it too. */
function Title({ city, country, id, night }: { city: string; country: string; id: string; night: boolean }) {
  const cx = BLEED_X + CONTENT_W / 2;
  const name = city.toUpperCase();
  // Long names shrink to fit about two thirds of the width
  const size = Math.min(150, (CONTENT_W * 0.66) / Math.max(4, name.length * 0.72));
  const ink = '#1d2340';
  const cream = '#fbf0d6';
  const font = { fontFamily: deco.style.fontFamily, fontWeight: 700 } as const;
  const y = 84 + size * 0.95;
  return (
    <g style={{ animation: 'lc-pc-in 1.4s ease-out both' }}>
      <style>{'@keyframes lc-pc-in{0%{opacity:0;transform:translateY(-12px)}100%{opacity:1;transform:translateY(0)}}'}</style>
      <defs>
        <linearGradient id={`${id}-letter`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cream} />
          <stop offset="1" stopColor={night ? '#e8cf9c' : '#f3d9a4'} />
        </linearGradient>
      </defs>
      <text x={cx} y={76} textAnchor="middle" fontSize={34} letterSpacing={16} fill={cream} stroke={ink} strokeWidth={7} paintOrder="stroke" style={{ ...font, fontWeight: 600 }}>WELCOME TO</text>
      {/* the printed drop shadow, offset down and right like a two-colour print */}
      <text x={cx + 7} y={y + 7} textAnchor="middle" fontSize={size} letterSpacing={size * 0.08} fill={ink} opacity={0.55} style={font}>{name}</text>
      <text x={cx} y={y} textAnchor="middle" fontSize={size} letterSpacing={size * 0.08} fill={`url(#${id}-letter)`} stroke={ink} strokeWidth={Math.max(4, size * 0.05)} paintOrder="stroke" style={font}>{name}</text>
      <text x={cx} y={y + 52} textAnchor="middle" fontSize={32} letterSpacing={14} fill={cream} stroke={ink} strokeWidth={7} paintOrder="stroke" style={{ ...font, fontWeight: 600 }}>{country.toUpperCase()}</text>
    </g>
  );
}
