import { Josefin_Sans, Yellowtail } from 'next/font/google';
import { BLEED_X, CONTENT_W, VIEWBOX } from '../types';

// The landing card's lettering, so the postcard and the card read as one set
const deco = Josefin_Sans({ subsets: ['latin'], weight: ['600', '700'] });
// The cursive 'Greetings from' of the classic large-letter postcards
const script = Yellowtail({ subsets: ['latin'], weight: '400' });

// The vintage postcard finish (Oct 2026, gallery first): the scene's own colours (no sepia: the owner found the brown
// tint too much), a very light paper grain, a gentle vignette, and a cream border with rounded corners like a postcard. Still overlays on top
// of the whole scene, so they cost nothing per frame.

const CREAM = '#f1e6cf';
/** The border's width inside the 16:9 view, and the picture's corner radius. */
const BORDER = 22;
const RADIUS = 18;

export function PostcardFinish({ idPrefix, night, title, ambient = true }: {
  idPrefix: string;
  night: boolean;
  /** False for still frames: the lettering is simply there, with no fade-in. */
  ambient?: boolean;
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
          <stop offset="1" stopColor="#1d2340" stopOpacity={night ? 0.3 : 0.18} />
        </radialGradient>
        <clipPath id={`${id}-pic`}><path d={hole} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-pic)`}>
        {title && <Title city={title.city} country={title.country} id={id} night={night} fadeIn={ambient} />}
        {/* paper grain */}
        <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} filter={`url(#${id}-grain)`} opacity={night ? 0.08 : 0.1} style={{ mixBlendMode: 'multiply' }} />
        <rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill={`url(#${id}-vignette)`} />
      </g>
      {/* the cream card border, with a fine printed edge around the picture */}
      <path d={`M -200 -200 H ${VIEWBOX.w + 200} V ${VIEWBOX.h + 200} H -200 Z ${hole}`} fill={CREAM} fillRule="evenodd" />
      <path d={hole} fill="none" stroke="#c9b48f" strokeWidth={1.5} />
      <path d={hole} fill="none" stroke="#3a2614" strokeOpacity={0.18} strokeWidth={6} transform={`translate(0 1.5)`} style={{ mixBlendMode: 'multiply' }} clipPath={`url(#${id}-pic)`} />
      {/* the card itself has grain too */}
      <path d={`M -200 -200 H ${VIEWBOX.w + 200} V ${VIEWBOX.h + 200} H -200 Z ${hole}`} fillRule="evenodd" filter={`url(#${id}-grain)`} opacity={0.18} style={{ mixBlendMode: 'multiply' }} />
      {title && <Stamp city={title.city} id={id} night={night} animate={ambient} />}
    </g>
  );
}

/** Big postcard lettering across the top of the picture: printed ink, so the grain and fade above sit on it too. */
function Title({ city, country, id, night, fadeIn }: { city: string; country: string; id: string; night: boolean; fadeIn: boolean }) {
  const cx = BLEED_X + CONTENT_W / 2;
  const name = city.toUpperCase();
  // Long names shrink to fit just over half the width, clear of the branch in the top right corner
  const size = Math.min(140, (CONTENT_W * 0.56) / Math.max(4, name.length * 0.72));
  const ink = '#1d2340';
  const cream = '#fbf0d6';
  const font = { fontFamily: deco.style.fontFamily, fontWeight: 700 } as const;
  const y = 118 + size * 0.86;
  const edge = Math.max(5, size * 0.07);
  // The 3D block: the letters' side, stepped down and to the right like the classic large-letter cards
  const depth = Math.round(Math.max(6, size * 0.1));
  const steps = Array.from({ length: depth }, (_, i) => depth - i);
  const big = { x: cx, textAnchor: 'middle' as const, fontSize: size, letterSpacing: size * 0.08, style: font };
  return (
    <g style={fadeIn ? { animation: 'lc-pc-in 1.4s ease-out both' } : undefined}>
      {fadeIn && <style>{'@keyframes lc-pc-in{0%{opacity:0;transform:translateY(-12px)}100%{opacity:1;transform:translateY(0)}}'}</style>}
      <defs>
        {/* warm terracotta letters, lighter at the top: reads on a pale day sky and a dark night alike */}
        <linearGradient id={`${id}-letter`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? '#f2a65a' : '#ee8a4a'} />
          <stop offset="1" stopColor={night ? '#d8643a' : '#c4502f'} />
        </linearGradient>
      </defs>
      {/* soft shadow under the whole block */}
      <text {...big} x={cx + depth + 6} y={y + depth + 8} fill={ink} stroke={ink} strokeWidth={edge * 2.2} opacity={0.35}>{name}</text>
      {/* the extruded side: ink outline, then the deep red-brown side itself */}
      {steps.map((d) => <text key={`o${d}`} {...big} x={cx + d} y={y + d} fill={ink} stroke={ink} strokeWidth={edge * 2.2}>{name}</text>)}
      {steps.map((d) => <text key={`s${d}`} {...big} x={cx + d} y={y + d} fill={night ? '#7a2e2a' : '#8e3324'}>{name}</text>)}
      {/* the letter face: ink edge, cream outline, terracotta */}
      <text {...big} y={y} fill={ink} stroke={ink} strokeWidth={edge * 2.2}>{name}</text>
      <text {...big} y={y} fill={`url(#${id}-letter)`} stroke={cream} strokeWidth={edge} paintOrder="stroke">{name}</text>
      {/* 'Greetings from' in script, tucked over the top left of the big letters */}
      <text x={cx - size * name.length * 0.26} y={y - size * 0.78} textAnchor="start" fontSize={Math.max(46, size * 0.5)} fill={cream} stroke={ink} strokeWidth={7} paintOrder="stroke" transform={`rotate(-6 ${cx - size * name.length * 0.26} ${y - size * 0.78})`} style={{ fontFamily: script.style.fontFamily }}>Greetings from</text>
      <text x={cx} y={y + depth + 46} textAnchor="middle" fontSize={30} letterSpacing={14} fill={ink} stroke={cream} strokeWidth={8} paintOrder="stroke" style={{ ...font, fontWeight: 600 }}>{country.toUpperCase()}</text>
    </g>
  );
}

/**
 * The arrival stamp (Oct 2026, gallery first): a perforated airmail stamp drops onto the bottom right of the card a
 * moment after the lettering, then a round postmark lands across it with the city, today's date and LANDED. It is the
 * "you have arrived" beat; it could become the stamp students collect in their passport.
 */
function Stamp({ city, id, night, animate }: { city: string; id: string; night: boolean; animate: boolean }) {
  const ink = '#1d2340';
  const cream = '#fbf0d6';
  const font = { fontFamily: deco.style.fontFamily, fontWeight: 700 } as const;
  // Bottom right of the 16:9 view, inside the border, clear of the runway markings
  const cx = BLEED_X + CONTENT_W - 150, cy = VIEWBOX.h - 150;
  const w = 150, h = 180;
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const name = city.toUpperCase();
  // Perforations: little half-circles bitten out of every edge
  const holes: string[] = [];
  const step = 15, r = 5;
  for (let x = -w / 2; x <= w / 2 + 0.1; x += step) holes.push(`M ${x - r} ${-h / 2} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`, `M ${x - r} ${h / 2} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`);
  for (let y = -h / 2 + step; y < h / 2; y += step) holes.push(`M ${-w / 2 - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`, `M ${w / 2 - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`);
  const nameSize = Math.min(22, 175 / Math.max(4, name.length));
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {animate && (
        <style>{`
          @keyframes lc-stamp-in{0%{opacity:0;transform:translate(-30px,-60px) rotate(-16deg) scale(1.5)}70%{opacity:1;transform:rotate(-5deg) scale(.96)}100%{opacity:1;transform:rotate(-6deg) scale(1)}}
          @keyframes lc-post-in{0%{opacity:0;transform:scale(1.8)}60%{opacity:.9;transform:scale(.94)}100%{opacity:.85;transform:scale(1)}}
          .${id}-st{animation:lc-stamp-in .55s cubic-bezier(.3,1.3,.5,1) 1.8s both}
          .${id}-pm{transform-box:fill-box;transform-origin:center;animation:lc-post-in .35s ease-out 2.5s both}
        `}</style>
      )}
      <defs>
        <mask id={`${id}-perf`}>
          <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} fill="white" />
          <path d={holes.join(' ')} fill="black" />
        </mask>
        <linearGradient id={`${id}-stsky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? '#2b3d74' : '#5d8fd0'} />
          <stop offset="1" stopColor={night ? '#6b5a8e' : '#f2b77a'} />
        </linearGradient>
      </defs>
      <g className={animate ? `${id}-st` : undefined} transform={animate ? undefined : 'rotate(-6)'}>
        {/* a soft shadow, so it sits on the card */}
        <rect x={-w / 2 + 5} y={-h / 2 + 7} width={w} height={h} fill="#000" opacity={0.22} mask={`url(#${id}-perf)`} />
        <g mask={`url(#${id}-perf)`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={cream} />
          {/* the stamp picture: a sky with the sun and the little plane coming in */}
          <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 62} fill={`url(#${id}-stsky)`} />
          <circle cx={30} cy={-h / 2 + 46} r={16} fill={night ? '#f3ecd0' : '#ffe6a6'} />
          <path d={`M ${-w / 2 + 12} ${h / 2 - 54} q 30 -26 60 -8 q 34 -24 66 6 L ${w / 2 - 12} ${h / 2 - 50} Z`} fill={night ? '#1d2a4f' : '#4f7a5a'} />
          {/* the plane, side on */}
          <g transform="translate(-14 -4) rotate(-8)">
            <path d="M -30 0 q 30 -9 56 -2 q 6 2 4 6 q -30 6 -60 2 Z" fill="#ffffff" />
            <path d="M -2 -2 l -12 -14 l 8 0 l 18 14 Z M -26 -2 l -6 -10 l 5 0 l 8 9 Z" fill="#2a5fa8" />
            <path d="M -8 3 l -10 12 l 7 0 l 14 -11 Z" fill="#2a5fa8" />
          </g>
          <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 62} fill="none" stroke={ink} strokeWidth={2} />
          <text x={0} y={h / 2 - 30} textAnchor="middle" fontSize={nameSize} letterSpacing={2} fill={ink} style={font}>{name}</text>
          <text x={0} y={h / 2 - 14} textAnchor="middle" fontSize={11} letterSpacing={3} fill={ink} opacity={0.75} style={{ ...font, fontWeight: 600 }}>AIRMAIL · LC</text>
        </g>
      </g>
      {/* the postmark: a ring with the city and the date, LANDED across the middle, and wavy cancel lines */}
      <g className={animate ? `${id}-pm` : undefined} opacity={0.85} transform="translate(-92 -40) rotate(-14)">
        <circle r={58} fill="none" stroke={night ? '#c9d3ff' : '#1d2340'} strokeWidth={4} />
        <circle r={46} fill="none" stroke={night ? '#c9d3ff' : '#1d2340'} strokeWidth={2} />
        <path id={`${id}-pmarc`} d="M -50 0 A 50 50 0 0 1 50 0" fill="none" />
        <text fontSize={13} letterSpacing={3} fill={night ? '#c9d3ff' : '#1d2340'} style={font}><textPath href={`#${id}-pmarc`} startOffset="50%" textAnchor="middle">{name.slice(0, 16)}</textPath></text>
        <text y={6} textAnchor="middle" fontSize={17} letterSpacing={2} fill={night ? '#c9d3ff' : '#1d2340'} style={font}>LANDED</text>
        <text y={26} textAnchor="middle" fontSize={11} letterSpacing={1} fill={night ? '#c9d3ff' : '#1d2340'} style={{ ...font, fontWeight: 600 }}>{date}</text>
        <path d="M 64 -14 q 14 -8 28 0 t 28 0 t 28 0 M 64 0 q 14 -8 28 0 t 28 0 t 28 0 M 64 14 q 14 -8 28 0 t 28 0 t 28 0" fill="none" stroke={night ? '#c9d3ff' : '#1d2340'} strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
  );
}
