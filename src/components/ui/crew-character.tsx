import type { ReactNode } from 'react';
import { GEAR_COLORS, HAIR_COLORS, SHIRT_COLORS, SKIN_TONES, encodeLook, type CrewLook } from '@/lib/crew-look';

// Sticker-style crew character (head + shoulders), drawn in a 100×100 box.
// Every shape is drawn twice: once fat and white underneath (the sticker
// outline), once in colour on top. Keep geometry simple so it reads at 28px.

const INK = '#1b2233';
const OUTLINE = 7;

function darker(hex: string, amount = 0.22): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Hijab: drapes behind the head onto the shoulders (drawn before the head). */
const HIJAB_BACK = 'M19 52 Q17 13 50 11 Q83 13 81 52 L86 94 Q68 102 50 102 Q32 102 14 94Z';
/** Hijab front: frames the face (ring with the face cut out, evenodd). */
const HIJAB_FRONT = 'M50 17 A30 31 0 1 1 49.9 17Z M50 29 A18.5 22 0 1 0 50.1 29Z';

/** Hair drawn BEHIND the head (long styles). */
function hairBack(look: CrewLook, color: string): ReactNode {
  if (look.headgear === 'hijab') return null;
  switch (look.hair) {
    case 'long':
      return <path d="M24 44 Q22 20 50 18 Q78 20 76 44 L78 84 Q64 90 50 90 Q36 90 22 84Z" fill={color} />;
    case 'bob':
      return <path d="M25 46 Q23 20 50 19 Q77 20 75 46 L76 66 Q64 70 50 70 Q36 70 24 66Z" fill={color} />;
    case 'afro':
      return <circle cx="50" cy="38" r="31" fill={color} />;
    case 'braids':
      return (
        <>
          <rect x="22" y="44" width="9" height="40" rx="4.5" fill={color} />
          <rect x="69" y="44" width="9" height="40" rx="4.5" fill={color} />
        </>
      );
    case 'ponytail':
      return <path d="M68 30 Q90 34 84 62 Q80 50 70 44Z" fill={color} />;
    default:
      return null;
  }
}

/** Hair drawn ON the head (fringe / top). Hidden mostly under hats. */
function hairFront(look: CrewLook, color: string, hatted: boolean): ReactNode {
  if (look.hair === 'none' || look.headgear === 'hijab') return null;
  if (hatted) {
    // Just a little showing at the sides under a hat.
    return <path d="M27 46 Q27 38 31 36 L33 50Z M73 46 Q73 38 69 36 L67 50Z" fill={color} />;
  }
  switch (look.hair) {
    case 'spiky':
      return <path d="M27 42 L30 22 L38 30 L42 16 L50 27 L57 15 L62 29 L70 21 L73 42 Q64 32 50 32 Q36 32 27 42Z" fill={color} />;
    case 'curly':
      return (
        <g fill={color}>
          {[[31, 32], [39, 25], [49, 22], [59, 25], [68, 32], [35, 38], [65, 38]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" />
          ))}
        </g>
      );
    case 'afro':
      return <path d="M28 40 Q34 30 50 30 Q66 30 72 40 Q66 26 50 26 Q34 26 28 40Z" fill={darker(color, 0.15)} />;
    case 'bun':
      return (
        <>
          <circle cx="50" cy="15" r="9" fill={color} />
          <path d="M27 43 Q27 20 50 20 Q73 20 73 43 Q65 30 50 30 Q35 30 27 43Z" fill={color} />
        </>
      );
    case 'long':
    case 'bob':
      return <path d="M27 46 Q26 20 50 20 Q74 20 73 46 Q70 32 58 29 Q52 36 40 34 Q32 36 27 46Z" fill={color} />;
    default: // short, ponytail, braids
      return <path d="M27 43 Q27 20 50 20 Q73 20 73 43 Q66 30 50 30 Q34 30 27 43Z" fill={color} />;
  }
}

function gearFill(key: CrewLook['gearColor'], gradId: string): string {
  return GEAR_COLORS[key] === 'rainbow' ? `url(#${gradId})` : GEAR_COLORS[key];
}

/** Headgear shapes; `sil` = silhouette only (for the white outline pass). */
function headgear(look: CrewLook, fill: string, sil: boolean): ReactNode {
  const band = sil ? '#fff' : INK;
  const gold = sil ? '#fff' : '#F6C177';
  switch (look.headgear) {
    case 'captain':
      return (
        <g>
          {/* crown */}
          <path d="M18 28 Q20 12 50 10 Q80 12 82 28 Q80 34 50 34 Q20 34 18 28Z" fill={fill} />
          {/* band */}
          <rect x="26" y="30" width="48" height="9" rx="3" fill={band} />
          {!sil && <path d="M28 33 Q50 36 72 33" stroke={gold} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
          {/* visor */}
          <path d="M26 38 Q50 47 74 38 Q70 44 50 45 Q30 44 26 38Z" fill={band} />
          {/* badge */}
          {!sil && (
            <>
              <circle cx="50" cy="22" r="6" fill={gold} />
              <path d="M50 18.5 L51.3 21.2 L54.2 21.5 L52 23.4 L52.7 26.2 L50 24.7 L47.3 26.2 L48 23.4 L45.8 21.5 L48.7 21.2Z" fill={INK} />
            </>
          )}
        </g>
      );
    case 'helmet':
      return (
        <g>
          <path d="M22 50 Q20 16 50 14 Q80 16 78 50 L72 50 Q72 26 50 25 Q28 26 28 50Z" fill={fill} />
          {/* visor pushed up on the forehead */}
          <path d="M30 32 Q50 22 70 32 L68 38 Q50 30 32 38Z" fill={sil ? '#fff' : '#7dd3fc'} opacity={sil ? 1 : 0.85} />
          {!sil && <path d="M34 33 Q42 29 50 28" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".8" />}
          <rect x="20" y="44" width="9" height="14" rx="4" fill={fill} />
          <rect x="71" y="44" width="9" height="14" rx="4" fill={fill} />
        </g>
      );
    case 'headset':
      return (
        <g>
          <path d="M24 46 Q24 14 50 14 Q76 14 76 46" stroke={sil ? '#fff' : fill} strokeWidth={sil ? 13 : 6} fill="none" strokeLinecap="round" />
          <rect x="18" y="40" width="12" height="18" rx="5" fill={fill} />
          <rect x="70" y="40" width="12" height="18" rx="5" fill={fill} />
          <path d="M24 56 Q26 68 40 68" stroke={sil ? '#fff' : INK} strokeWidth={sil ? 8 : 2.5} fill="none" strokeLinecap="round" />
          <circle cx="41" cy="68" r="3" fill={sil ? '#fff' : INK} />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <circle cx="50" cy="12" r="6" fill={fill} />
          <path d="M25 38 Q25 14 50 14 Q75 14 75 38Z" fill={fill} />
          <rect x="23" y="33" width="54" height="10" rx="4" fill={sil ? '#fff' : darker(fill.startsWith('#') ? fill : '#8b5cf6')} />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M26 38 Q26 16 50 15 Q74 16 74 38Z" fill={fill} />
          <path d="M60 36 Q80 34 88 40 Q76 43 60 41Z" fill={sil ? '#fff' : darker(fill.startsWith('#') ? fill : '#3b82f6')} />
          <circle cx="50" cy="16" r="2.5" fill={sil ? '#fff' : darker(fill.startsWith('#') ? fill : '#3b82f6')} />
        </g>
      );
    default:
      return null;
  }
}

function eyewear(look: CrewLook): ReactNode {
  if (look.eyewear === 'aviators') {
    return (
      <g>
        <path d="M31 45 L47 45 Q47 56 39 56 Q31 56 31 47Z" fill="#12343b" stroke="#F6C177" strokeWidth="1.8" />
        <path d="M53 45 L69 45 L69 47 Q69 56 61 56 Q53 56 53 45Z" fill="#12343b" stroke="#F6C177" strokeWidth="1.8" />
        <path d="M47 46 Q50 44 53 46" stroke="#F6C177" strokeWidth="1.8" fill="none" />
        <path d="M34 47 L38 50" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
        <path d="M56 47 L60 50" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      </g>
    );
  }
  if (look.eyewear === 'glasses') {
    return (
      <g fill="none" stroke={INK} strokeWidth="2">
        <circle cx="41" cy="50" r="6" />
        <circle cx="59" cy="50" r="6" />
        <path d="M47 50 L53 50" />
      </g>
    );
  }
  return null;
}

export function CrewCharacter({ look, size = 48, className, title }: { look: CrewLook; size?: number; className?: string; title?: string }) {
  // Deterministic id (no hooks: this also renders in server components). Same look = same gradient.
  const grad = `rb-${encodeLook(look)}`;
  const skin = SKIN_TONES[look.skin] ?? SKIN_TONES[0];
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[0];
  const shirt = SHIRT_COLORS[look.shirt] ?? SHIRT_COLORS[0];
  const gear = gearFill(look.gearColor, grad);
  const hatted = look.headgear === 'captain' || look.headgear === 'beanie' || look.headgear === 'cap' || look.headgear === 'helmet';

  const hijab = look.headgear === 'hijab';
  const silhouette = (
    <>
      <path d="M16 100 Q16 76 50 74 Q84 76 84 100Z" fill="#fff" />
      {hijab && <path d={HIJAB_BACK} fill="#fff" />}
      {hairBack(look, '#fff')}
      <circle cx="50" cy="48" r="23" fill="#fff" />
      {!hijab && <circle cx="27" cy="50" r="5" fill="#fff" />}
      {!hijab && <circle cx="73" cy="50" r="5" fill="#fff" />}
      {hairFront(look, '#fff', hatted)}
      {headgear(look, '#fff', true)}
    </>
  );

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title ?? 'Crew member'}>
      <defs>
        <linearGradient id={grad} x1="0" x2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset=".25" stopColor="#f59e0b" />
          <stop offset=".5" stopColor="#22c55e" />
          <stop offset=".75" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* sticker outline */}
      <g stroke="#fff" strokeWidth={OUTLINE} strokeLinejoin="round">{silhouette}</g>
      {/* shoulders */}
      <path d="M16 100 Q16 76 50 74 Q84 76 84 100Z" fill={shirt} />
      <path d="M42 75 L50 84 L58 75" fill="none" stroke={darker(shirt, 0.3)} strokeWidth="2.5" strokeLinejoin="round" />
      {hijab && <path d={HIJAB_BACK} fill={gear} />}
      {hairBack(look, hair)}
      {/* neck + head */}
      {!hijab && <rect x="43" y="64" width="14" height="12" rx="4" fill={darker(skin, 0.1)} />}
      {!hijab && <circle cx="27" cy="50" r="5" fill={darker(skin, 0.06)} />}
      {!hijab && <circle cx="73" cy="50" r="5" fill={darker(skin, 0.06)} />}
      <circle cx="50" cy="48" r="23" fill={skin} />
      {/* face */}
      {look.eyewear !== 'aviators' && (
        <>
          <ellipse cx="41" cy="50" rx="3.2" ry="3.8" fill={INK} />
          <ellipse cx="59" cy="50" rx="3.2" ry="3.8" fill={INK} />
          <circle cx="42.2" cy="48.8" r="1.1" fill="#fff" />
          <circle cx="60.2" cy="48.8" r="1.1" fill="#fff" />
        </>
      )}
      <circle cx="34" cy="58" r="4" fill="#f59e9e" opacity=".55" />
      <circle cx="66" cy="58" r="4" fill="#f59e9e" opacity=".55" />
      <path d="M43 60 Q50 66 57 60" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {hairFront(look, hair, hatted)}
      {hijab && (
        <>
          <path d={HIJAB_FRONT} fill={gear} fillRule="evenodd" />
          {/* a soft fold line so it reads as fabric */}
          <path d="M30 68 Q50 80 70 68" stroke={GEAR_COLORS[look.gearColor] === 'rainbow' ? '#fff' : darker(GEAR_COLORS[look.gearColor], 0.25)} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
        </>
      )}
      {headgear(look, gear, false)}
      {eyewear(look)}
    </svg>
  );
}
