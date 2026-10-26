import { useId, type ReactNode } from 'react';
import type { MascotLook } from '@/lib/mascot';

// The class mascot, full body, in a 120x120 box, in the crew sticker style: flat colour shapes, a dark ink line for
// faces, and one fat white outline around the whole figure (an SVG filter), so it reads like a sticker at any size.

const INK = '#1b2233';

function shade(hex: string, amount: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Things behind the body. */
function back(look: MascotLook, c: string): ReactNode {
  switch (look.extra) {
    case 'wings':
      return (
        <g fill="#f8fafc" stroke={shade(c, -0.25)} strokeWidth="2">
          <path d="M34 66 Q10 52 8 72 Q14 70 18 78 Q22 74 30 80Z" />
          <path d="M86 66 Q110 52 112 72 Q106 70 102 78 Q98 74 90 80Z" />
        </g>
      );
    case 'tail':
      return <path d="M84 92 Q104 96 106 78 Q112 80 110 88 Q106 104 86 100Z" fill={shade(c, -0.15)} />;
    case 'cape':
      return <path d="M38 58 Q60 64 82 58 L94 106 Q60 114 26 106Z" fill="#ef4444" />;
    case 'jetpack':
      return (
        <g>
          <rect x="24" y="58" width="14" height="30" rx="5" fill="#94a3b8" />
          <rect x="82" y="58" width="14" height="30" rx="5" fill="#94a3b8" />
          <path d="M26 88 L31 102 L36 88Z M84 88 L89 102 L94 88Z" fill="#F59E0B" />
        </g>
      );
    default:
      return null;
  }
}

/** The body. Every body keeps its eye line near y=58 and the top of its head near y=34. */
function body(look: MascotLook, c: string): ReactNode {
  const belly = shade(c, 0.35);
  switch (look.body) {
    case 'bird':
      return (
        <g>
          <ellipse cx="60" cy="72" rx="28" ry="34" fill={c} />
          <ellipse cx="60" cy="82" rx="17" ry="20" fill={belly} />
          <path d="M54 66 L60 76 L66 66Z" fill="#F59E0B" />
          <path d="M50 104 L50 112 M70 104 L70 112" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'dragon':
      return (
        <g>
          <path d="M40 40 L46 30 L52 38 L60 28 L68 38 L74 30 L80 40Z" fill={shade(c, -0.2)} />
          <path d="M32 70 Q32 36 60 36 Q88 36 88 70 L90 100 Q60 110 30 100Z" fill={c} />
          <ellipse cx="60" cy="88" rx="16" ry="14" fill={belly} />
          <ellipse cx="60" cy="72" rx="12" ry="7" fill={shade(c, 0.15)} />
          <circle cx="56" cy="71" r="1.6" fill={INK} /><circle cx="64" cy="71" r="1.6" fill={INK} />
        </g>
      );
    case 'robot':
      return (
        <g>
          <rect x="32" y="36" width="56" height="68" rx="12" fill={c} />
          <rect x="42" y="80" width="36" height="16" rx="4" fill={INK} />
          <path d="M46 88 L52 84 L58 90 L64 84 L70 90 L74 87" stroke="#2FE59B" strokeWidth="2" fill="none" />
          <circle cx="36" cy="40" r="2" fill={shade(c, -0.3)} /><circle cx="84" cy="40" r="2" fill={shade(c, -0.3)} />
        </g>
      );
    case 'cat':
      return (
        <g>
          <path d="M36 50 L34 26 L52 38Z M84 50 L86 26 L68 38Z" fill={c} />
          <path d="M38 44 L37 32 L47 39Z M82 44 L83 32 L73 39Z" fill={shade(c, 0.45)} />
          <ellipse cx="60" cy="72" rx="30" ry="34" fill={c} />
          <ellipse cx="60" cy="86" rx="16" ry="16" fill={belly} />
          <path d="M40 70 L28 68 M40 74 L28 76 M80 70 L92 68 M80 74 L92 76" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case 'alien':
      return (
        <g>
          <path d="M60 30 Q90 30 88 62 Q86 86 74 104 Q60 110 46 104 Q34 86 32 62 Q30 30 60 30Z" fill={c} />
          <ellipse cx="60" cy="90" rx="12" ry="12" fill={belly} />
        </g>
      );
    default: // blob
      return (
        <g>
          <path d="M60 32 Q90 34 92 76 Q94 106 60 106 Q26 106 28 76 Q30 34 60 32Z" fill={c} />
          <ellipse cx="60" cy="88" rx="18" ry="13" fill={belly} />
        </g>
      );
  }
}

function eyes(look: MascotLook): ReactNode {
  const y = look.body === 'dragon' ? 54 : 58;
  const pupil = (x: number, r = 7) => (
    <g key={x}>
      <circle cx={x} cy={y} r={r} fill="#fff" />
      <circle cx={x + 1} cy={y + 1} r={r * 0.5} fill={INK} />
      <circle cx={x + 2.5} cy={y - 1.5} r={r * 0.18} fill="#fff" />
    </g>
  );
  switch (look.eyes) {
    case 'cyclops':
      return pupil(60, 12);
    case 'three':
      return <>{pupil(46, 6)}{pupil(60, 6.5)}{pupil(74, 6)}</>;
    case 'sleepy':
      return <path d={`M42 ${y} Q48 ${y + 5} 54 ${y} M66 ${y} Q72 ${y + 5} 78 ${y}`} stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />;
    case 'sparkly':
      return (
        <>
          {pupil(48, 8)}{pupil(72, 8)}
          <path d={`M44 ${y - 5} l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5Z M68 ${y - 5} l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5Z`} fill="#fde68a" />
        </>
      );
    case 'googly':
      return <>{pupil(47, 9)}{pupil(73, 5.5)}</>;
    default:
      return <>{pupil(48)}{pupil(72)}</>;
  }
}

function mouth(look: MascotLook): ReactNode {
  if (look.body === 'bird' || look.body === 'dragon') return null;
  if (look.body === 'robot') return <rect x="50" y="70" width="20" height="4" rx="2" fill={INK} />;
  return <path d="M50 70 Q60 79 70 70" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />;
}

function head(look: MascotLook): ReactNode {
  const top = look.body === 'cat' ? 34 : 32;
  switch (look.head) {
    case 'horns':
      return <path d={`M42 ${top + 6} Q36 ${top - 10} 44 ${top - 14} Q44 ${top - 2} 50 ${top + 2}Z M78 ${top + 6} Q84 ${top - 10} 76 ${top - 14} Q76 ${top - 2} 70 ${top + 2}Z`} fill="#fef3c7" />;
    case 'antenna':
      return (
        <g>
          <path d={`M52 ${top + 2} L46 ${top - 14} M68 ${top + 2} L74 ${top - 14}`} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="46" cy={top - 16} r="4" fill="#F59E0B" /><circle cx="74" cy={top - 16} r="4" fill="#F59E0B" />
        </g>
      );
    case 'propeller':
      return (
        <g>
          <path d={`M44 ${top + 4} Q44 ${top - 8} 60 ${top - 8} Q76 ${top - 8} 76 ${top + 4}Z`} fill="#ef4444" />
          <path d={`M60 ${top - 8} L60 ${top - 14}`} stroke={INK} strokeWidth="2.5" />
          <ellipse cx="51" cy={top - 15} rx="9" ry="3" fill="#4DA3FF" /><ellipse cx="69" cy={top - 15} rx="9" ry="3" fill="#F59E0B" />
        </g>
      );
    case 'pilot-cap':
      return (
        <g>
          <path d={`M40 ${top + 6} Q40 ${top - 10} 60 ${top - 10} Q80 ${top - 10} 80 ${top + 6}Z`} fill={INK} />
          <rect x="36" y={top + 3} width="48" height="6" rx="3" fill="#0f172a" />
          <circle cx="60" cy={top - 2} r="3.5" fill="#fcd34d" />
        </g>
      );
    case 'flower':
      return (
        <g transform={`translate(74 ${top + 2})`}>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-7" rx="4.5" ry="7" fill="#f9a8d4" transform={`rotate(${a})`} />)}
          <circle r="4.5" fill="#fcd34d" />
        </g>
      );
    case 'crown':
      return <path d={`M44 ${top + 4} L44 ${top - 10} L52 ${top - 2} L60 ${top - 14} L68 ${top - 2} L76 ${top - 10} L76 ${top + 4}Z`} fill="#fcd34d" stroke="#d97706" strokeWidth="1.5" />;
    case 'party-hat':
      return (
        <g>
          <path d={`M50 ${top + 4} L60 ${top - 22} L70 ${top + 4}Z`} fill="#a78bfa" />
          <path d={`M53 ${top - 4} L67 ${top - 4} M56 ${top - 12} L64 ${top - 12}`} stroke="#fcd34d" strokeWidth="2.5" />
          <circle cx="60" cy={top - 23} r="3.5" fill="#f9a8d4" />
        </g>
      );
    case 'astronaut':
      return <ellipse cx="60" cy="62" rx="40" ry="38" fill="rgba(186,230,253,0.28)" stroke="#e2e8f0" strokeWidth="4" />;
    default:
      return null;
  }
}

/** Things in front of the body. */
function front(look: MascotLook): ReactNode {
  switch (look.extra) {
    case 'scarf':
      return (
        <g fill="#ef4444">
          <path d="M36 76 Q60 86 84 76 L84 84 Q60 94 36 84Z" />
          <path d="M70 84 L78 104 L68 102 L64 86Z" />
        </g>
      );
    case 'camera':
      return (
        <g>
          <path d="M44 72 Q60 90 76 72" stroke={INK} strokeWidth="2" fill="none" />
          <rect x="50" y="84" width="20" height="14" rx="3" fill="#334155" />
          <circle cx="60" cy="91" r="4.5" fill="#93c5fd" stroke="#0f172a" strokeWidth="1.5" />
        </g>
      );
    default:
      return null;
  }
}

export function MascotFigure({ look, size = 120, title, className }: { look: MascotLook; size?: number; title?: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const c = look.color;
  return (
    <svg viewBox="0 2 120 116" width={size} height={size} className={className} role="img" aria-label={title ?? 'Class mascot'}>
      {title && <title>{title}</title>}
      <defs>
        {/* the sticker outline: the figure's silhouette grown by a few units, in white, under the figure */}
        <filter id={`mascot-outline-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="grown" />
          <feFlood floodColor="#ffffff" />
          <feComposite in2="grown" operator="in" result="outline" />
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.25" in="outline" result="shadowed" />
          <feMerge><feMergeNode in="shadowed" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#mascot-outline-${id})`}>
        {back(look, c)}
        {body(look, c)}
        {eyes(look)}
        {mouth(look)}
        {front(look)}
        {head(look)}
      </g>
    </svg>
  );
}
