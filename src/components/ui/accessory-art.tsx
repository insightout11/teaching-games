import type { ReactNode } from 'react';
import type { AccessoryType } from '@/lib/accessories';

// Accessories drawn on the crew character (its 100x100 box: head centre 50,48 radius 23; shoulders from y 74).
// Sticker style like the character: flat colours, a thin dark line where it helps. `behind` parts draw before the
// head (umbrella canopy, bag strap behind), the rest after it.

const INK = '#1b2233';

export function accessoryBehind(type: AccessoryType, [a, b]: [string, string]): ReactNode {
  if (type === 'umbrella') {
    return (
      <g>
        <path d="M60 6 Q88 2 98 26 Q90 22 84 26 Q78 20 72 26 Q66 20 60 24 Q56 14 60 6Z" fill={a} />
        <path d="M66 10 Q74 14 76 25 M80 8 Q86 14 87 25" stroke={b} strokeWidth="2.4" fill="none" />
        <path d="M80 25 L70 74" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

export function accessoryFront(type: AccessoryType, [a, b]: [string, string]): ReactNode {
  switch (type) {
    case 'sun-hat':
      return (
        <g>
          <ellipse cx="50" cy="31" rx="38" ry="9" fill={a} />
          <path d="M30 31 Q30 12 50 11 Q70 12 70 31Z" fill={a} />
          <path d="M30 27 Q50 32 70 27 L70 31 Q50 36 30 31Z" fill={b} />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M27 36 Q27 14 50 13 Q73 14 73 36Z" fill={a} />
          <path d="M27 34 Q16 36 12 40 Q26 42 40 38Z" fill={b} />
          <circle cx="50" cy="14" r="2.6" fill={b} />
        </g>
      );
    case 'scarf':
      return (
        <g>
          <path d="M32 70 Q50 80 68 70 L70 79 Q50 89 30 79Z" fill={a} />
          <path d="M34 74 Q50 82 66 74" stroke={b} strokeWidth="2.2" fill="none" strokeDasharray="4 3" />
          <path d="M58 78 L63 96 L56 95 L53 80Z" fill={a} />
          <path d="M58 86 L62 87" stroke={b} strokeWidth="2" />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          <rect x="31" y="44" width="16" height="11" rx="4" fill={a} />
          <rect x="53" y="44" width="16" height="11" rx="4" fill={a} />
          <path d="M47 48 L53 48 M31 47 L26 45 M69 47 L74 45" stroke={b} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M34 46 L38 46" stroke="#fff" strokeWidth="1.5" opacity=".7" strokeLinecap="round" />
        </g>
      );
    case 'bag':
      return (
        <g>
          <path d="M30 76 L64 100" stroke={b} strokeWidth="4" strokeLinecap="round" />
          <rect x="60" y="86" width="22" height="14" rx="3" fill={a} />
          <path d="M60 91 L82 91" stroke={b} strokeWidth="2" />
        </g>
      );
    case 'bracelet':
      // the avatar shows head and shoulders, so wrist beads are worn as a bead necklace here
      return (
        <g>
          {[[36, 76], [41, 80], [46, 82], [51, 82.5], [56, 82], [61, 80], [66, 76]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.8" fill={i % 2 ? b : a} />
          ))}
        </g>
      );
    case 'badge':
      return (
        <g>
          <circle cx="66" cy="88" r="7" fill={a} stroke={INK} strokeWidth="1.2" />
          <circle cx="66" cy="88" r="3.2" fill={b} />
        </g>
      );
    default:
      return null;
  }
}
