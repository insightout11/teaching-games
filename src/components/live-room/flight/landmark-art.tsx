'use client';

/**
 * Landmarks seen from the plane (Phase 3.4), drawn bigger than life in the storybook style of the arrival scenes.
 * Two views: the SIDE VIEW (a big landmark rising on the horizon, seen from the window on the correct side) and the
 * CAMERA VIEW (a seat-back screen showing a zoomed outside camera, for landmarks too small or too far to see).
 * First two for the owner's approval: the Matterhorn (side view) and the Pyramids of Giza (camera view).
 */

function rng(seed: number) {
  let r = seed * 9301 + 49297;
  return () => ((r = (r * 9301 + 49297) % 233280) / 233280);
}

/** A hazy mountain ridge across the horizon: lit and shaded facets, snow on the higher peaks. */
function Ridge({ seed, base, amp, rock, shade, snow, opacity, snowLine }: { seed: number; base: number; amp: number; rock: string; shade: string; snow: string; opacity: number; snowLine: number }) {
  const R = rng(seed);
  const peaks: Array<{ x: number; h: number; w: number }> = [];
  for (let x = -80; x < 1700; x += 90 + R() * 120) peaks.push({ x, h: amp * (0.45 + R() * 0.55), w: 160 + R() * 160 });
  return (
    <g opacity={opacity}>
      {peaks.map((p, i) => {
        const top = base - p.h, l = p.x - p.w / 2, r = p.x + p.w / 2, mx = p.x + (R() - 0.5) * 20;
        const sd = p.h - snowLine;
        return (
          <g key={i}>
            <path d={`M${l} ${base} L${mx} ${top} L${mx} ${base}Z`} fill={rock} />
            <path d={`M${mx} ${top} L${r} ${base} L${mx} ${base}Z`} fill={shade} />
            {sd > 0 && <path d={`M${mx - (sd / p.h) * (mx - l)} ${top + sd} L${mx} ${top} L${mx + (sd / p.h) * (r - mx)} ${top + sd} L${mx + 10} ${top + sd * 0.75} L${mx - 6} ${top + sd * 0.9}Z`} fill={snow} />}
          </g>
        );
      })}
      <rect x="-20" y={base} width="1640" height="400" fill={shade} />
    </g>
  );
}

function Cloud({ x, y, s, fill, motion, delay = 0 }: { x: number; y: number; s: number; fill: string; motion: boolean; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g style={motion ? { animation: `lmDrift 60s linear ${delay}s infinite alternate` } : undefined}>
        <ellipse cx="0" cy="0" rx="120" ry="34" fill={fill} />
        <ellipse cx="-60" cy="-14" rx="60" ry="34" fill={fill} />
        <ellipse cx="30" cy="-30" rx="70" ry="44" fill={fill} />
        <ellipse cx="90" cy="-8" rx="50" ry="28" fill={fill} />
      </g>
    </g>
  );
}

/**
 * SIDE VIEW: the Matterhorn on the left of the plane. Its real silhouette (a steep four-sided horn whose summit hooks
 * back), the sunlit east face warm against the shaded north face streaked with snow, the Hörnli ridge running down,
 * glaciers at its foot, the rest of the Alps hazy behind, cloud below. Seen through the side window.
 */
const SIDE = { lit: '#f2e6da', litMid: '#d9c3b2', litDark: '#b59a88', shade: '#5d6b86', shadeDark: '#46526c', snow: '#f7fbff', snowShade: '#c9d6ea' };

type RidgeStyle = 'alps' | 'himalaya' | 'japan' | 'savanna';
const RIDGES: Record<RidgeStyle, Array<{ seed: number; base: number; amp: number; rock: string; shade: string; snow: string; opacity: number; snowLine: number }>> = {
  alps: [
    { seed: 7, base: 560, amp: 150, rock: '#a9bcd3', shade: '#8fa4c0', snow: '#eef4fa', opacity: 0.75, snowLine: 70 },
    { seed: 19, base: 600, amp: 190, rock: '#8aa0bd', shade: '#6f86a6', snow: '#f3f7fc', opacity: 0.9, snowLine: 90 },
  ],
  himalaya: [
    { seed: 31, base: 560, amp: 220, rock: '#b3c3d8', shade: '#97aac4', snow: '#f4f8fc', opacity: 0.8, snowLine: 60 },
    { seed: 43, base: 610, amp: 240, rock: '#93a7c2', shade: '#7489a8', snow: '#f7fafd', opacity: 0.92, snowLine: 70 },
  ],
  japan: [
    { seed: 53, base: 610, amp: 70, rock: '#8fa9b8', shade: '#7893a6', snow: '#8fa9b8', opacity: 0.7, snowLine: 999 },
    { seed: 61, base: 640, amp: 90, rock: '#6f8f86', shade: '#5c7a74', snow: '#6f8f86', opacity: 0.85, snowLine: 999 },
  ],
  savanna: [
    { seed: 71, base: 640, amp: 40, rock: '#c9b48e', shade: '#b39e7a', snow: '#c9b48e', opacity: 0.6, snowLine: 999 },
  ],
};

const titleCase = (t: string) => t.replace(/^the /, 'The ');

/**
 * SIDE VIEW frame: the plane's side window, sky, a hazy range behind, cloud passing below, and the caption. The
 * landmark (children) is drawn for the LEFT window; on the right the whole scene is mirrored.
 */
export function SideWindow({ title, sub, side = 'left', ridge = 'alps', motion = true, children }: {
  title: string; sub: string; side?: 'left' | 'right'; ridge?: RidgeStyle; motion?: boolean; children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 1600 900" className="h-full w-full" role="img" aria-label={`On your ${side}: ${title}`}>
      <defs>
        <linearGradient id="lmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f6fb8" /><stop offset="0.55" stopColor="#7fb1e0" /><stop offset="1" stopColor="#d6e7f4" />
        </linearGradient>
        <radialGradient id="lmSun" cx="0.16" cy="0.14" r="0.35">
          <stop offset="0" stopColor="#fff8e6" stopOpacity="0.95" /><stop offset="0.25" stopColor="#fff2cc" stopOpacity="0.35" /><stop offset="1" stopColor="#fff2cc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lmHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6e7f4" stopOpacity="0" /><stop offset="1" stopColor="#e6f0f8" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="lmLitFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SIDE.lit} /><stop offset="0.6" stopColor={SIDE.litMid} /><stop offset="1" stopColor={SIDE.litDark} />
        </linearGradient>
        <linearGradient id="lmShadeFace" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SIDE.shade} /><stop offset="1" stopColor={SIDE.shadeDark} />
        </linearGradient>
        <linearGradient id="lmGully" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7fbff" stopOpacity="0.95" /><stop offset="1" stopColor="#f7fbff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lmPlume" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="lmWindow"><rect x="40" y="30" width="1520" height="840" rx="190" /></clipPath>
        <style>{'@keyframes lmDrift{from{transform:translateX(-30px)}to{transform:translateX(30px)}}@keyframes lmBelow{from{transform:translateX(0)}to{transform:translateX(-200px)}}@keyframes lmPlume{from{opacity:.75}to{opacity:1}}'}</style>
      </defs>
      <rect width="1600" height="900" fill="#0d1526" />
      <g clipPath="url(#lmWindow)">
        <g transform={side === 'right' ? 'translate(1600 0) scale(-1 1)' : undefined}>
          <rect width="1600" height="900" fill="url(#lmSky)" />
          <rect width="1600" height="900" fill="url(#lmSun)" />
          <Cloud x={1180} y={300} s={0.9} fill="#ffffff" motion={motion} />
          <Cloud x={1420} y={360} s={0.6} fill="#f4f8fc" motion={motion} delay={-20} />
          {RIDGES[ridge].map((r) => <Ridge key={r.seed} {...r} />)}
          <rect x="0" y="420" width="1600" height="260" fill="url(#lmHaze)" />
          {children}
          {/* cloud below the plane, passing */}
          <g style={motion ? { animation: 'lmBelow 30s linear infinite' } : undefined}>
            {Array.from({ length: 12 }, (_, i) => <Cloud key={i} x={i * 180 - 40} y={760 + (i % 3) * 30} s={1.1 + (i % 2) * 0.3} fill={i % 2 ? '#ffffff' : '#eef4fb'} motion={false} />)}
          </g>
        </g>
        {/* window glass sheen */}
        <path d="M80 60 L520 60 L180 860 L80 860Z" fill="#ffffff" opacity="0.05" />
      </g>
      <rect x="40" y="30" width="1520" height="840" rx="190" fill="none" stroke="#1c263b" strokeWidth="34" />
      <rect x="40" y="30" width="1520" height="840" rx="190" fill="none" stroke="#33405c" strokeWidth="6" />
      {/* caption, on the side away from the landmark */}
      <g transform={side === 'left' ? 'translate(930 92)' : 'translate(110 92)'}>
        <rect width="560" height="64" rx="32" fill="#0b1324" opacity="0.82" />
        <path d={side === 'left' ? 'M44 32 l18 -14 v8 h22 v12 h-22 v8z' : 'M84 32 l-18 -14 v8 h-22 v12 h22 v8z'} fill="#fcd34d" />
        <text x="104" y="41" fill="#ffffff" fontSize={title.length > 18 ? 24 : 28} fontFamily="Georgia, serif">On your {side}: {title}</text>
      </g>
      <g transform={side === 'left' ? 'translate(1490 168)' : 'translate(110 168)'}>
        <rect x={side === 'left' ? -(sub.length * 12 + 44) : 0} width={sub.length * 12 + 44} height="40" rx="20" fill="#0b1324" opacity="0.65" />
        <text x={side === 'left' ? -22 : 22} y="27" textAnchor={side === 'left' ? 'end' : 'start'} fill="#cbd5e1" fontSize="18" fontFamily="monospace" letterSpacing="2">{sub}</text>
      </g>
    </svg>
  );
}

/**
 * CAMERA VIEW frame: the seat-back screen's outside camera, with its HUD and caption. The scene (children) fills the
 * screen area (x 100–1520, y 60–860) and pans slowly.
 */
export function CameraScreen({ title, subtitle, motion = true, children }: { title: string; subtitle: string; motion?: boolean; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 1600 900" className="h-full w-full" role="img" aria-label={`Camera view: ${title}`}>
      <defs>
        <radialGradient id="pcVignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <pattern id="pcScan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.08" /></pattern>
        <clipPath id="pcScreen"><rect x="140" y="80" width="1320" height="742" rx="22" /></clipPath>
        <style>{'@keyframes pcPan{from{transform:translate(0,0) scale(1)}to{transform:translate(-24px,-10px) scale(1.03)}}@keyframes pcBlink{0%,60%{opacity:1}61%,100%{opacity:0.2}}@keyframes pcMist{from{transform:translateY(0);opacity:.75}to{transform:translateY(-30px);opacity:.35}}'}</style>
      </defs>
      <rect width="1600" height="900" fill="#1a2231" />
      <rect x="110" y="50" width="1380" height="802" rx="44" fill="#0b0f17" />
      <g clipPath="url(#pcScreen)">
        <g style={motion ? { animation: 'pcPan 40s ease-in-out infinite alternate' } : undefined}>{children}</g>
        <rect x="100" y="60" width="1420" height="800" fill="url(#pcScan)" />
        <rect x="100" y="60" width="1420" height="800" fill="url(#pcVignette)" />
        <g fontFamily="monospace" fill="#e2e8f0">
          <circle cx="190" cy="125" r="8" fill="#ef4444" style={motion ? { animation: 'pcBlink 1.6s infinite' } : undefined} />
          <text x="210" y="132" fontSize="22" letterSpacing="3">CAMERA · LOOKING DOWN</text>
          <text x="1420" y="132" fontSize="20" textAnchor="end" letterSpacing="2">ALT 10,600 M · 860 KM/H</text>
          <path d="M1390 760 h18 M1416 760 h18 M1412 738 v16 M1412 766 v16" stroke="#e2e8f0" strokeWidth="2" opacity="0.5" />
        </g>
        <g transform="translate(780 712)">
          <rect width="640" height="76" rx="16" fill="#0b1324" opacity="0.82" />
          <text x="28" y="34" fill="#ffffff" fontSize="28" fontFamily="Georgia, serif">{titleCase(title)}</text>
          <text x="28" y="62" fill="#cbd5e1" fontSize="18" fontFamily="sans-serif">{subtitle}</text>
        </g>
      </g>
      <rect x="140" y="80" width="1320" height="742" rx="22" fill="none" stroke="#222b3b" strokeWidth="6" />
      <circle cx="800" cy="840" r="6" fill="#273246" />
    </svg>
  );
}

// ── Side-view heroes (drawn for the left window; summit around x 400–700) ─────────────────────────────────────────

function MatterhornHero({ motion }: { motion: boolean }) {
  const { lit, litMid, litDark, snow, snowShade } = SIDE;
  return (
    <>
        {/* The Matterhorn, hero and bigger than life: its real, lopsided profile. The summit's "nose" leans left; the
            broad east face (left) is in sun; the narrower north face (right) is in shade and streaked with snow; the
            Hörnli ridge drops to the right with its shoulder two-thirds of the way up. */}
        <g>
          {/* lower slopes and glaciers at its foot, hazy */}
          <path d="M110 700 C230 640 360 612 520 604 C680 600 840 616 1000 664 L1040 720 L80 720Z" fill="#9fb0c8" />
          <path d="M200 690 C300 648 420 628 540 622 C660 618 790 632 920 668 L940 700 L180 700Z" fill={snowShade} />
          <path d="M270 690 C360 654 460 640 560 636 C660 634 760 646 860 672 L870 690Z" fill={snow} />
          {/* east face, in sun */}
          <path d="M520 138 L506 190 L498 252 L478 332 L440 430 L390 520 L320 600 L260 644 L732 644 L702 542 L672 452 L642 362 L602 262 L562 160Z" fill="url(#lmLitFace)" />
          {/* lower east face turning slightly from the sun */}
          <path d="M440 430 L390 520 L320 600 L260 644 L732 644 L702 542 L672 452 L560 470Z" fill={litMid} opacity="0.5" />
          {/* north face, in shade */}
          <path d="M562 160 L602 262 L642 362 L672 452 L702 542 L732 644 L906 644 L822 522 L762 432 L722 362 L700 352 L662 300 L612 222Z" fill="url(#lmShadeFace)" />
          {/* the summit nose, leaning left over the east face */}
          <path d="M520 138 L532 122 L560 128 L574 150 L562 160Z" fill={lit} />
          <path d="M520 138 L532 122 L514 128Z" fill={litDark} />
          {/* broken rock on the east face: irregular darker patches and ribs, kept inside the face */}
          <clipPath id="lmEastFace"><path d="M520 138 L506 190 L498 252 L478 332 L440 430 L390 520 L320 600 L260 644 L732 644 L702 542 L672 452 L642 362 L602 262 L562 160Z" /></clipPath>
          <g clipPath="url(#lmEastFace)">
            {Array.from({ length: 28 }, (_, k) => {
              const r = rng(k * 7 + 3);
              const y = 170 + r() * 460, x = 300 + r() * 420, w = 18 + r() * 46, h = 6 + r() * 16;
              return <path key={k} d={`M${x} ${y} l${w} ${-h * 0.3} l${-w * 0.2} ${h} l${-w * 0.9} ${h * 0.4}Z`} fill={k % 3 ? litDark : '#a08572'} opacity={0.18 + r() * 0.22} />;
            })}
            {[0, 1, 2, 3].map((k) => <path key={`rib${k}`} d={`M${545 - k * 18} ${175 + k * 60} C${520 - k * 30} ${300 + k * 40} ${480 - k * 40} ${430 + k * 30} ${420 - k * 50} ${600}`} stroke="#fff4e6" strokeWidth="2.5" fill="none" opacity="0.35" />)}
          </g>
          {/* rock strata across the east face, gently dipping to the left */}
          {Array.from({ length: 10 }, (_, k) => {
            const y = 210 + k * 42;
            const xr = 590 + k * 13, xl = 500 - k * 22 + (k > 5 ? -(k - 5) * 14 : 0);
            return <path key={k} d={`M${xr} ${y} L${xl + 30} ${y + 14}`} stroke={litDark} strokeWidth="3" opacity={0.3 + (k % 2) * 0.15} />;
          })}
          {/* snow gullies and fields on the shaded north face, fading downwards */}
          {[[610, 236, 0.5], [640, 300, 0.7], [672, 372, 0.8], [700, 440, 0.95], [730, 510, 1.05]].map(([x, y, k], n) => (
            <path key={n} d={`M${x} ${y} C${x + 10} ${y + 40 * k} ${x + 26} ${y + 80 * k} ${x + 44} ${y + 120 * k} L${x + 32} ${y + 120 * k} C${x + 16} ${y + 80 * k} ${x + 4} ${y + 40 * k} ${x - 8} ${y + 4}Z`} fill="url(#lmGully)" />
          ))}
          {[[618, 280, 34], [652, 348, 40], [684, 418, 46], [714, 486, 54]].map(([x, y, w], n) => (
            <path key={n} d={`M${x} ${y} q${w / 2} -4 ${w} 6`} stroke={snow} strokeWidth="4" fill="none" opacity="0.8" strokeLinecap="round" />
          ))}
          {/* snow on the Hörnli shoulder */}
          <path d="M700 352 L722 362 L742 392 L712 380Z" fill={snow} />
          {/* the edge between the faces, catching the light */}
          <path d="M562 160 L602 262 L642 362 L672 452 L702 542 L732 644" stroke="#fff7ee" strokeWidth="4" fill="none" opacity="0.85" />
          {/* summit snow */}
          <path d="M520 138 L532 122 L560 128 L548 140 L530 144Z" fill={snow} />
          {/* banner cloud trailing from the summit (the Matterhorn's famous flag) */}
          <g style={motion ? { animation: 'lmDrift 14s ease-in-out infinite alternate' } : undefined} opacity="0.85">
            <ellipse cx="650" cy="146" rx="90" ry="14" fill="#ffffff" />
            <ellipse cx="712" cy="156" rx="60" ry="10" fill="#ffffff" />
          </g>
        </g>
    </>
  );
}

/**
 * Everest: the summit pyramid towering over everything, dark rock faces lit warm on one side, snow-filled gullies,
 * bright snow ridges and the pale Yellow Band; the South Col saddle joins it to Lhotse on the right; Nuptse's wall
 * stands lower in front; a long plume of snow streams off the summit.
 */
function EverestHero({ motion }: { motion: boolean }) {
  const { snow, snowShade } = SIDE;
  const face = 'M660 200 L622 262 L590 330 L548 420 L500 520 L452 600 L880 600 L846 520 L800 430 L752 340 L706 262Z';
  return (
    <g>
      <defs>
        <linearGradient id="evLit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a7f78" /><stop offset="0.5" stopColor="#5d5a66" /><stop offset="1" stopColor="#474a5b" />
        </linearGradient>
        <linearGradient id="evShade" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3e4357" /><stop offset="1" stopColor="#2c3043" />
        </linearGradient>
        <linearGradient id="evSnowFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#cfdbeb" />
        </linearGradient>
        <clipPath id="evFace"><path d={face} /></clipPath>
        <clipPath id="evPyramid"><path d="M660 200 L622 262 L590 330 L548 420 L500 520 L452 600 L880 600 L846 520 L800 430 L752 340 L706 262Z" /></clipPath>
        <linearGradient id="evBand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d8c79c" stopOpacity="0.75" /><stop offset="1" stopColor="#a8976e" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* the massif's snowy base */}
      <path d="M0 720 C200 610 420 560 640 552 C880 548 1080 600 1300 720Z" fill="#a9b9d0" />
      {/* Lhotse and the South Col saddle, right */}
      <path d="M760 600 L830 470 L880 500 L960 400 L1010 430 L1120 600Z" fill="url(#evSnowFace)" />
      <path d="M960 400 L1010 430 L1060 520 L1120 600 L990 600 L980 500Z" fill="#b5c4d9" />
      <path d="M960 400 L980 500 L940 560 L900 520Z" fill="#9fb0c8" opacity="0.7" />
      {[[930, 470, 30], [990, 520, 40], [1030, 560, 26], [900, 540, 22]].map(([x, y, w], k) => <path key={k} d={`M${x} ${y} l${w} -6 l-8 14 l-${w - 10} 6Z`} fill="#5f6476" opacity="0.6" />)}
      <path d="M830 470 L880 500 L960 400" stroke="#ffffff" strokeWidth="4" fill="none" opacity="0.9" />
      {/* the summit pyramid: the lit west face and the shaded face, divided by the bright south-east ridge */}
      <path d={face} fill="url(#evLit)" />
      <path d="M660 200 L706 262 L752 340 L800 430 L846 520 L880 600 L700 600 L690 470 L676 330Z" fill="url(#evShade)" />
      {/* rock texture and snow-filled gullies on the lit face, kept inside the face */}
      <g clipPath="url(#evFace)">
        {Array.from({ length: 30 }, (_, k) => {
          const r = rng(k * 5 + 17);
          const y = 240 + r() * 360, x = 470 + r() * 360, w = 14 + r() * 40, h = 5 + r() * 12;
          return <path key={k} d={`M${x} ${y} l${w} ${-h * 0.3} l${-w * 0.2} ${h} l${-w * 0.9} ${h * 0.4}Z`} fill={k % 3 ? '#7b7177' : '#9a8f86'} opacity={0.2 + r() * 0.25} />;
        })}
        {[[640, 250, 0.6], [620, 300, 0.8], [596, 360, 1], [566, 430, 1.1], [700, 300, 0.8], [730, 380, 1]].map(([x, y, k], n) => (
          <path key={n} d={`M${x} ${y} C${x - 8} ${y + 50 * k} ${x - 20} ${y + 100 * k} ${x - 36} ${y + 150 * k} L${x - 14} ${y + 150 * k} C${x - 4} ${y + 100 * k} ${x + 4} ${y + 50 * k} ${x + 10} ${y + 4}Z`} fill="url(#lmGully)" opacity="0.55" />
        ))}
      </g>
      {/* the Yellow Band: a pale stripe across the summit pyramid */}
      <g clipPath="url(#evPyramid)">
        <path d="M540 384 C620 366 700 362 760 372 C800 378 830 392 860 404 L860 426 C826 412 796 400 756 394 C696 386 616 390 540 406Z" fill="url(#evBand)" />
      </g>
      {/* bright snow ridges: the south-east ridge and the west ridge */}
      <path d="M660 200 L706 262 L752 340 L800 430 L846 520 L880 600" stroke="#ffffff" strokeWidth="5" fill="none" opacity="0.9" />
      <path d="M660 200 L622 262 L590 330 L548 420 L500 520 L452 600" stroke="#f1f5fb" strokeWidth="3" fill="none" opacity="0.6" />
      {/* the summit snow and a warm touch of sun on the very top */}
      <path d="M660 200 L640 236 L656 240 L672 220 L686 236 L700 238 L682 210Z" fill={snow} />
      <path d="M660 200 L650 218 L668 214Z" fill="#ffe7cf" />
      {/* Nuptse's wall, lower, in front on the left, with its own snow */}
      <path d="M120 680 L250 470 L300 500 L360 440 L420 490 L480 470 L560 600 L600 680Z" fill="url(#evSnowFace)" />
      <path d="M360 440 L420 490 L480 470 L540 560 L470 600 L400 560Z" fill="#b8c7dc" />
      <path d="M250 470 L300 500 L320 580 L240 620 L180 640Z" fill="#c9d5e6" />
      {[[270, 540, 34], [330, 520, 28], [420, 560, 36], [470, 520, 24], [210, 600, 30]].map(([x, y, w], k) => <path key={k} d={`M${x} ${y} l${w} -8 l-10 16 l-${w - 12} 8Z`} fill="#5f6476" opacity="0.55" />)}
      <path d="M250 470 L300 500 L360 440 L420 490 L480 470" stroke="#ffffff" strokeWidth="4" fill="none" />
      {/* snowfields at the foot */}
      <path d="M440 600 C520 588 600 600 680 590 C760 582 840 596 900 606 L940 660 L400 660Z" fill={snowShade} />
      <path d="M380 660 C470 646 560 656 650 644 C740 636 860 650 960 668 L980 700 L360 700Z" fill={snow} />
      {Array.from({ length: 14 }, (_, k) => { const r = rng(k + 901); const x = 440 + r() * 480, y = 612 + r() * 70; return <path key={k} d={`M${x} ${y} l${10 + r() * 22} ${r() * 4 - 2}`} stroke="#9fb3cf" strokeWidth="2" opacity="0.7" />; })}
      {/* the snow plume streaming off the summit: layered, fading into the sky */}
      <g style={motion ? { animation: 'lmPlume 6s ease-in-out infinite alternate' } : undefined}>
        <path d="M664 202 C800 176 980 186 1180 230 C980 214 820 218 676 230Z" fill="url(#lmPlume)" />
        <path d="M674 214 C800 202 940 214 1080 252 C930 238 810 240 686 246Z" fill="url(#lmPlume)" opacity="0.75" />
        <path d="M680 228 C780 224 880 236 980 266 C870 256 780 256 690 258Z" fill="url(#lmPlume)" opacity="0.5" />
      </g>
    </g>
  );
}

/** Fuji: the perfect cone, snow cap with ragged edges and streaks down the ravines, blue-violet lower slopes. */
function FujiHero({ motion }: { motion: boolean }) {
  return (
    <g>
      <defs>
        <linearGradient id="fjSlope" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f6f9a" /><stop offset="1" stopColor="#8195b8" />
        </linearGradient>
      </defs>
      <path d="M40 720 C240 640 420 380 560 230 L700 230 C840 380 1020 640 1220 720Z" fill="url(#fjSlope)" />
      <path d="M630 230 L700 230 C840 380 1020 640 1220 720 L640 720Z" fill="#4f5e86" opacity="0.45" />
      {/* the crater rim */}
      <path d="M560 230 L582 222 L600 230 L620 220 L640 228 L662 218 L680 228 L700 230Z" fill="#f7fbff" />
      {/* snow cap with ragged lower edge and streaks down the ravines */}
      <path d="M560 230 C520 274 486 316 450 364 L470 372 L484 356 L500 388 L520 360 L540 400 L556 366 L578 410 L596 370 L616 420 L636 372 L656 412 L676 366 L696 404 L712 362 L734 394 L748 356 L772 380 L790 352 L812 368 C780 320 740 276 700 230Z" fill="#f7fbff" />
      <path d="M640 228 L700 230 C740 276 780 320 812 368 L790 352 L772 380 L748 356 L734 394 L712 362 L696 404 L676 366 L656 412 L640 380Z" fill="#d6e1f0" />
      {[[520, 410, 60], [580, 430, 70], [640, 440, 80], [700, 430, 70], [760, 410, 60]].map(([x, y, h], k) => (
        <path key={k} d={`M${x} ${y} l-6 ${h} l10 0Z`} fill="#eef3fa" opacity="0.8" />
      ))}
      {/* a ring of cloud around the slopes */}
      <g style={motion ? { animation: 'lmDrift 20s ease-in-out infinite alternate' } : undefined} opacity="0.9">
        <ellipse cx="420" cy="560" rx="160" ry="22" fill="#ffffff" />
        <ellipse cx="860" cy="580" rx="180" ry="24" fill="#ffffff" />
      </g>
    </g>
  );
}

/** Kilimanjaro: the broad flat top of Kibo with its last glaciers, jagged Mawenzi beside it, a belt of cloud, savanna below. */
function KilimanjaroHero({ motion }: { motion: boolean }) {
  return (
    <g>
      <path d="M0 720 C200 650 360 560 480 400 C540 330 600 300 700 296 C820 294 900 320 980 400 C1100 520 1300 640 1600 700 L1600 720Z" fill="#7e7466" />
      <path d="M700 296 C820 294 900 320 980 400 C1100 520 1300 640 1600 700 L1600 720 L760 720Z" fill="#62594d" opacity="0.6" />
      {/* Mawenzi, jagged, to the left */}
      <path d="M200 650 L280 470 L300 500 L320 440 L345 490 L365 460 L410 560 L470 650Z" fill="#5e564c" />
      <path d="M320 440 L345 490 L365 460 L410 560 L340 560Z" fill="#4a433b" />
      {/* the flat summit and its glaciers: white blocks with blue-shadowed cliffs */}
      <path d="M540 330 C600 300 680 292 760 294 C840 296 900 314 940 344 L900 348 C840 330 760 322 680 324 C620 326 580 334 548 344Z" fill="#8a8072" />
      {[[560, 320, 70], [652, 306, 96], [778, 306, 84], [872, 326, 52]].map(([x, y, w], k) => (
        <g key={k}>
          {/* a glacier remnant: soft top, a blue-shadowed ice cliff along its edge */}
          <path d={`M${x} ${y + 14} C${x + w * 0.2} ${y - 2} ${x + w * 0.5} ${y + 4} ${x + w * 0.7} ${y - 2} C${x + w * 0.85} ${y + 2} ${x + w} ${y + 6} ${x + w} ${y + 14}Z`} fill="#f7fbff" />
          <path d={`M${x} ${y + 14} L${x + w} ${y + 14} L${x + w - 4} ${y + 24} L${x + w * 0.6} ${y + 20} L${x + w * 0.3} ${y + 25} L${x + 4} ${y + 21}Z`} fill="#a9c2dc" />
        </g>
      ))}
      {/* the cloud belt around its waist */}
      <g style={motion ? { animation: 'lmDrift 22s ease-in-out infinite alternate' } : undefined}>
        {[[300, 520, 170], [560, 500, 200], [860, 520, 210], [1120, 560, 180]].map(([x, y, r], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={30} fill="#ffffff" opacity="0.92" />)}
      </g>
      {/* savanna and an acacia at the foot */}
      <path d="M0 690 C300 660 900 650 1600 690 L1600 720 L0 720Z" fill="#c9a96a" />
      <g transform="translate(1180 660)"><rect x="-3" y="0" width="6" height="26" fill="#4a3a26" /><ellipse cx="0" cy="-4" rx="40" ry="9" fill="#5b6a34" /></g>
    </g>
  );
}

// ── Camera scenes (screen area x 100–1520, y 60–860) ─────────────────────────────────────────────────────────────

function PyramidsScene() {
  const geom = (x: number, y: number, s: number) => {
    const h = 150 * s, w = 150 * s, d = 70 * s;
    return { apex: [x, y - h] as const, L: [x - w, y] as const, F: [x, y + d] as const, Rr: [x + w, y] as const, w, h, d };
  };
  // Its shadow on the sand (afternoon sun from the right): a soft triangle to the left, drawn before all pyramids.
  const Shadow = ({ x, y, s }: { x: number; y: number; s: number }) => {
    const g = geom(x, y, s);
    return <path d={`M${g.L[0]} ${g.L[1]} L${g.F[0]} ${g.F[1]} L${x - g.w * 1.7} ${y + g.d * 0.55}Z`} fill="#7a4a24" opacity="0.28" />;
  };
  const Pyr = ({ x, y, s, cap = false }: { x: number; y: number; s: number; cap?: boolean }) => {
    const { apex, L, F, Rr, w, h, d } = geom(x, y, s);
    return (
      <g>
        <path d={`M${apex[0]} ${apex[1]} L${L[0]} ${L[1]} L${F[0]} ${F[1]}Z`} fill="#b07a46" />
        <path d={`M${apex[0]} ${apex[1]} L${F[0]} ${F[1]} L${Rr[0]} ${Rr[1]}Z`} fill="#e8b878" />
        {[0.25, 0.5, 0.75].map((t) => (
          <g key={t} opacity="0.35">
            <path d={`M${apex[0] + (L[0] - apex[0]) * t} ${apex[1] + (L[1] - apex[1]) * t} L${apex[0] + (F[0] - apex[0]) * t} ${apex[1] + (F[1] - apex[1]) * t}`} stroke="#7a4f2a" strokeWidth="2" />
            <path d={`M${apex[0] + (F[0] - apex[0]) * t} ${apex[1] + (F[1] - apex[1]) * t} L${apex[0] + (Rr[0] - apex[0]) * t} ${apex[1] + (Rr[1] - apex[1]) * t}`} stroke="#c48f55" strokeWidth="2" />
          </g>
        ))}
        <path d={`M${apex[0]} ${apex[1]} L${F[0]} ${F[1]}`} stroke="#f6d39c" strokeWidth="2" opacity="0.8" />
        {cap && (
          <>
            <path d={`M${apex[0]} ${apex[1]} L${apex[0] - w * 0.18} ${apex[1] + h * 0.18} L${apex[0]} ${apex[1] + h * 0.18 + d * 0.18}Z`} fill="#e9dcc6" />
            <path d={`M${apex[0]} ${apex[1]} L${apex[0]} ${apex[1] + h * 0.18 + d * 0.18} L${apex[0] + w * 0.18} ${apex[1] + h * 0.18}Z`} fill="#fbf3e4" />
          </>
        )}
      </g>
    );
  };
  // Back to front: Khufu, Khafre, Menkaure, then the queens' pyramids.
  const PYRAMIDS: Array<{ x: number; y: number; s: number; cap?: boolean }> = [
    { x: 1130, y: 470, s: 1.22 }, { x: 830, y: 540, s: 1.15, cap: true }, { x: 560, y: 630, s: 0.7 },
    { x: 640, y: 720, s: 0.32 }, { x: 700, y: 735, s: 0.3 }, { x: 760, y: 748, s: 0.28 },
  ];
  return (
    <>
      <defs>
        <linearGradient id="pcSand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b98a" /><stop offset="1" stopColor="#e8c48e" />
        </linearGradient>
        <linearGradient id="pcHazeTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe3cf" stopOpacity="0.95" /><stop offset="1" stopColor="#efe3cf" stopOpacity="0" />
        </linearGradient>
      </defs>
          <rect x="100" y="60" width="1420" height="800" fill="url(#pcSand)" />
          {/* dunes and wind ripples */}
          {Array.from({ length: 18 }, (_, i) => (
            <path key={i} d={`M100 ${300 + i * 34} C500 ${280 + i * 34} 900 ${330 + i * 34} 1520 ${300 + i * 34}`} stroke={i % 2 ? '#c9a46f' : '#f1d6a6'} strokeWidth="6" fill="none" opacity="0.35" />
          ))}
          {/* Cairo and the Nile in the haze beyond */}
          <path d="M100 120 L1520 120 L1520 250 C1200 230 900 260 600 240 C400 228 250 250 100 236Z" fill="#c6b9a2" />
          {Array.from({ length: 60 }, (_, i) => { const R = rng(i + 3); return <rect key={i} x={120 + R() * 1380} y={130 + R() * 90} width={10 + R() * 26} height={6 + R() * 12} fill={R() < 0.5 ? '#ad9f88' : '#d8ccb6'} />; })}
          <path d="M100 168 C400 158 700 190 1000 170 C1200 158 1400 172 1520 166 L1520 196 C1400 202 1200 188 1000 200 C700 220 400 188 100 198Z" fill="#7aa36a" />
          <path d="M100 180 C400 172 700 202 1000 184 C1200 172 1400 184 1520 180" stroke="#4f8fb0" strokeWidth="8" fill="none" />
          <rect x="100" y="60" width="1420" height="260" fill="url(#pcHazeTop)" />
          {/* road to the plateau */}
          <path d="M1480 330 C1200 400 1050 470 980 560" stroke="#cdb48c" strokeWidth="14" fill="none" />
          {/* the rocky Giza plateau under the pyramids */}
          <path d="M380 760 C520 560 820 430 1300 400 C1420 420 1460 520 1380 640 C1200 760 760 800 380 760Z" fill="#cfa775" opacity="0.55" />
          {/* every shadow first, then the pyramids back to front, so no shadow falls over a pyramid in front */}
          {PYRAMIDS.map((q, k) => <Shadow key={`s${k}`} {...q} />)}
          {PYRAMIDS.map((q, k) => <Pyr key={`p${k}`} {...q} />)}
          {/* the Sphinx */}
          <g transform="translate(1250 640)">
            <path d="M0 0 l90 -4 l10 -18 l14 -6 l10 8 l-4 20 l-120 8z" fill="#c18c55" />
            <path d="M104 -28 l14 -6 l10 8 l-4 10 l-18 2z" fill="#e2b47c" />
          </g>
          {/* tour buses, tiny */}
          {[[1300, 700], [1330, 712], [1360, 705]].map(([x, y], i) => <rect key={i} x={x} y={y} width="16" height="7" fill={i % 2 ? '#f4f4f4' : '#e8c35c'} />)}
    </>
  );
}

/** Stonehenge from above: the sarsen ring with its lintels, the horseshoe of trilithons, the Heel Stone, chalk paths, green plain. */
function StonehengeScene() {
  const cx = 820, cy = 470;
  const ring = Array.from({ length: 30 }, (_, k) => (k / 30) * Math.PI * 2);
  return (
    <>
      <rect x="100" y="60" width="1420" height="800" fill="#7fa45a" />
      {Array.from({ length: 10 }, (_, k) => { const r = rng(k + 11); return <rect key={k} x={100 + r() * 1300} y={60 + r() * 700} width={160 + r() * 260} height={90 + r() * 160} fill={k % 2 ? '#93b468' : '#6f9550'} opacity="0.7" transform={`rotate(${r() * 30 - 15} 800 460)`} />; })}
      {/* chalk paths and the visitor walkway ring */}
      <path d="M100 640 C400 600 640 560 800 520" stroke="#e7e1cc" strokeWidth="14" fill="none" />
      <ellipse cx={cx} cy={cy} rx="250" ry="130" fill="none" stroke="#d8d2bb" strokeWidth="10" />
      <ellipse cx={cx} cy={cy} rx="200" ry="104" fill="#87a861" />
      {/* the bank and ditch */}
      <ellipse cx={cx} cy={cy} rx="210" ry="110" fill="none" stroke="#6c8c4c" strokeWidth="6" />
      {/* sarsen circle: uprights with lintels, shadows to the left */}
      {ring.map((a, k) => {
        const x = cx + Math.cos(a) * 140, y = cy + Math.sin(a) * 72;
        return (
          <g key={k}>
            <rect x={x - 16} y={y + 2} width="16" height="10" fill="#4f5f3a" opacity="0.4" />
            <rect x={x - 6} y={y - 22} width="13" height="24" fill="#9a958a" />
            <rect x={x - 6} y={y - 22} width="6" height="24" fill="#b9b4a8" />
          </g>
        );
      })}
      <ellipse cx={cx} cy={cy - 22} rx="140" ry="72" fill="none" stroke="#c9c4b7" strokeWidth="8" />
      {/* the horseshoe of five great trilithons */}
      {[-0.9, -0.45, 0, 0.45, 0.9].map((a, k) => {
        const x = cx + Math.sin(a) * 70, y = cy - 6 + Math.cos(a) * 30;
        return (
          <g key={k}>
            <rect x={x - 22} y={y - 44} width="16" height="46" fill="#8f8a7f" />
            <rect x={x + 6} y={y - 44} width="16" height="46" fill="#a7a296" />
            <rect x={x - 24} y={y - 54} width="48" height="12" fill="#c4bfb2" />
          </g>
        );
      })}
      {/* the Heel Stone out on the avenue, and tiny visitors */}
      <rect x="1080" y="400" width="14" height="26" fill="#9a958a" />
      {Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return <circle key={k} cx={cx + Math.cos(a) * 250} cy={cy + Math.sin(a) * 130} r="4" fill={k % 3 ? '#d9534f' : '#3a6fb0'} />; })}
    </>
  );
}

/** The Great Wall from above: a stone wall snaking along the crests of green ridges, with watchtowers, in haze. */
function GreatWallScene() {
  const crest = (y0: number, amp: number, seed: number) => {
    const r = rng(seed);
    let d = `M100 ${y0}`;
    for (let x = 100; x <= 1520; x += 60) d += ` L${x} ${y0 - Math.abs(Math.sin(x * 0.006 + seed)) * amp - r() * 20}`;
    return d;
  };
  const wall = 'M100 560 C220 470 300 420 400 450 C500 480 560 360 680 330 C800 300 860 400 960 380 C1060 360 1120 260 1240 250 C1340 244 1420 300 1520 280';
  const towers: Array<[number, number]> = [[230, 478], [400, 450], [560, 372], [680, 330], [860, 380], [1040, 360], [1240, 250], [1420, 288]];
  return (
    <>
      <rect x="100" y="60" width="1420" height="800" fill="#b9cbb8" />
      {[[260, 90, 3, '#a7bda3'], [380, 120, 5, '#86a47f'], [520, 150, 7, '#6c8f62'], [700, 170, 9, '#57794d'], [880, 160, 11, '#466a3e']].map(([y, a, s, c], k) => (
        <path key={k} d={`${crest(y as number, a as number, s as number)} L1520 900 L100 900Z`} fill={c as string} />
      ))}
      {/* autumn trees on the slopes */}
      {Array.from({ length: 80 }, (_, k) => { const r = rng(k + 21); return <circle key={k} cx={100 + r() * 1420} cy={420 + r() * 420} r={4 + r() * 6} fill={r() < 0.3 ? '#c98a3a' : r() < 0.6 ? '#3f6136' : '#527a45'} opacity="0.8" />; })}
      {/* the wall: shadow, body, walkway, crenellations */}
      <path d={wall} stroke="#3c4a33" strokeWidth="30" fill="none" opacity="0.35" transform="translate(-8 10)" />
      <path d={wall} stroke="#9c9483" strokeWidth="26" fill="none" strokeLinecap="round" />
      <path d={wall} stroke="#c9c1ad" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d={wall} stroke="#7e7666" strokeWidth="3" strokeDasharray="6 8" fill="none" transform="translate(0 -9)" />
      {towers.map(([x, y], k) => (
        <g key={k}>
          <rect x={x - 22} y={y - 30} width="44" height="40" fill="#8f8776" />
          <rect x={x - 22} y={y - 30} width="22" height="40" fill="#b3aa96" />
          <rect x={x - 26} y={y - 38} width="52" height="10" fill="#6d6657" />
        </g>
      ))}
      <rect x="100" y="60" width="1420" height="260" fill="#dfe8dd" opacity="0.45" />
    </>
  );
}

/**
 * Niagara Falls from above: the turquoise river with its rapids, split by wooded Goat Island; the Horseshoe Falls as a
 * deep curved bowl with a sheet of falling water, foam and a tall mist plume with a faint rainbow; the straight American
 * Falls beside it; the emerald gorge with the tour boat and the Rainbow Bridge; the Skylon Tower on the Canadian side.
 */
function NiagaraScene({ motion }: { motion: boolean }) {
  // The Horseshoe's brink: a deep U, opening downstream (towards the bottom of the screen).
  const brink = 'M520 330 C540 470 700 560 840 560 C960 560 1060 480 1080 360';
  const sheet = 'M520 330 C540 470 700 560 840 560 C960 560 1060 480 1080 360 L1084 420 C1060 560 960 640 840 640 C690 640 530 550 512 400Z';
  return (
    <>
      <defs>
        <linearGradient id="ngRiver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f8f98" /><stop offset="1" stopColor="#4fb3ad" />
        </linearGradient>
        <linearGradient id="ngSheet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset="0.6" stopColor="#e2f4f6" /><stop offset="1" stopColor="#bfe4e6" />
        </linearGradient>
        <linearGradient id="ngGorge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f7f78" /><stop offset="1" stopColor="#155a57" />
        </linearGradient>
        <radialGradient id="ngMist" cx="0.5" cy="0.6" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ngRainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff6b6b" /><stop offset="0.25" stopColor="#ffd166" /><stop offset="0.5" stopColor="#7bd389" /><stop offset="0.75" stopColor="#5fa8ff" /><stop offset="1" stopColor="#b388ff" />
        </linearGradient>
      </defs>
      {/* land: Canada on the left, the USA on the right, autumn colours */}
      <rect x="100" y="60" width="1420" height="800" fill="#6f8f57" />
      {Array.from({ length: 90 }, (_, k) => { const r = rng(k + 301); return <circle key={k} cx={100 + r() * 1420} cy={60 + r() * 800} r={6 + r() * 9} fill={r() < 0.35 ? '#c9853a' : r() < 0.6 ? '#a8432c' : '#58763f'} opacity="0.7" />; })}
      {/* the upper river, coming in wide from the top, with rapids above the brink */}
      <path d="M380 60 L1360 60 C1300 160 1200 240 1140 320 L1080 360 C1060 480 960 560 840 560 C700 560 540 470 520 330 C460 250 420 160 380 60Z" fill="url(#ngRiver)" />
      {Array.from({ length: 40 }, (_, k) => { const r = rng(k + 401); const x = 480 + r() * 520, y = 100 + r() * (r() < 0.5 ? 220 : 380); return <path key={k} d={`M${x} ${y} q20 -5 40 0 q20 5 40 0`} stroke="#e6fbfb" strokeWidth={2 + r() * 2} fill="none" opacity={0.4 + r() * 0.4} />; })}
      {/* Goat Island, wooded, between the two falls */}
      <path d="M1080 360 C1120 300 1200 290 1260 320 C1300 360 1300 430 1260 470 C1200 500 1120 480 1090 440Z" fill="#4f7a3c" />
      {Array.from({ length: 22 }, (_, k) => { const r = rng(k + 501); return <circle key={k} cx={1110 + r() * 160} cy={320 + r() * 140} r={8 + r() * 8} fill={r() < 0.4 ? '#c47a34' : '#3f6a32'} />; })}
      {/* the American Falls: a straight white curtain into the gorge */}
      <path d="M1260 470 L1420 520 L1424 560 L1262 512Z" fill="url(#ngSheet)" />
      <path d="M1262 512 L1424 560 C1400 600 1300 610 1240 580Z" fill="#e8f6f6" opacity="0.8" />
      {/* the gorge below the falls: emerald water flowing away to the bottom */}
      <path d="M512 400 C530 550 690 640 840 640 C960 640 1060 560 1084 420 C1120 520 1200 560 1250 580 C1300 640 1330 740 1360 860 L700 860 C700 760 600 640 512 400Z" fill="url(#ngGorge)" />
      {Array.from({ length: 16 }, (_, k) => { const r = rng(k + 601); const x = 760 + r() * 460, y = 680 + r() * 170; return <path key={k} d={`M${x} ${y} q30 -8 60 0`} stroke="#5fc3b6" strokeWidth="3" fill="none" opacity="0.5" />; })}
      {/* the falling sheet of the Horseshoe, with soft vertical streaks */}
      <path d={sheet} fill="url(#ngSheet)" />
      {Array.from({ length: 30 }, (_, k) => {
        const t = k / 29;
        const x = 520 + t * 560, y = 330 + Math.sin(t * Math.PI) * 230 - (t > 0.9 ? (t - 0.9) * 200 : 0);
        return <path key={k} d={`M${x} ${y} l${(t - 0.5) * -6} 70`} stroke="#9fd3d8" strokeWidth="2" opacity="0.35" />;
      })}
      <path d={brink} stroke="#ffffff" strokeWidth="5" fill="none" />
      {/* foam in the plunge pool */}
      {Array.from({ length: 26 }, (_, k) => { const r = rng(k + 701); const t = r(); return <ellipse key={k} cx={540 + t * 520} cy={600 + Math.sin(t * Math.PI) * 60 + r() * 30} rx={16 + r() * 24} ry={7 + r() * 8} fill="#ffffff" opacity={0.55 + r() * 0.35} />; })}
      {/* the mist plume rising out of the bowl, with a faint rainbow */}
      <g style={motion ? { animation: 'pcMist 7s ease-in-out infinite alternate' } : undefined}>
        <ellipse cx="820" cy="560" rx="300" ry="130" fill="url(#ngMist)" />
        <ellipse cx="800" cy="440" rx="220" ry="140" fill="url(#ngMist)" opacity="0.8" />
        <ellipse cx="830" cy="320" rx="160" ry="120" fill="url(#ngMist)" opacity="0.6" />
        <path d="M660 560 C700 440 940 440 980 560" stroke="url(#ngRainbow)" strokeWidth="10" fill="none" opacity="0.35" />
      </g>
      {/* the tour boat near the falls, with its wake */}
      <path d="M900 720 C940 750 980 770 1030 790" stroke="#bfeee8" strokeWidth="5" fill="none" opacity="0.6" />
      <g transform="translate(890 712) rotate(-20)">
        <rect x="-26" y="-9" width="52" height="18" rx="9" fill="#2e6fd1" />
        <rect x="-16" y="-6" width="30" height="10" fill="#f4f4f4" />
      </g>
      {/* the Rainbow Bridge downstream */}
      <path d="M1180 820 C1260 760 1380 760 1460 820" stroke="#cfc6b4" strokeWidth="10" fill="none" />
      <path d="M1160 822 L1480 822" stroke="#e0d8c8" strokeWidth="8" />
      {/* the Canadian side: a park along the rim, a road, buildings and the Skylon Tower */}
      <path d="M100 360 C260 380 400 400 500 420 L620 700 L100 700Z" fill="#7f9b62" opacity="0.6" />
      <path d="M100 420 C260 430 420 460 540 520 C600 580 640 680 660 860" stroke="#d9d2c0" strokeWidth="10" fill="none" />
      {Array.from({ length: 18 }, (_, k) => { const r = rng(k + 801); return <rect key={k} x={130 + r() * 380} y={560 + r() * 260} width={22 + r() * 40} height={14 + r() * 26} fill={r() < 0.5 ? '#c9c2b4' : '#a39b8c'} />; })}
      <g transform="translate(360 470)">
        <path d="M-4 0 L4 0 L5 150 L-5 150Z" fill="#d8d2c4" />
        <path d="M-60 140 L-4 0 L-4 150Z" fill="#000" opacity="0.15" />
        <ellipse cx="0" cy="0" rx="26" ry="12" fill="#e8c35c" />
        <ellipse cx="0" cy="-6" rx="20" ry="8" fill="#f2e6c2" />
      </g>
    </>
  );
}

// ── The registry and the one view the room uses ───────────────────────────────────────────────────────────────

interface DrawnLandmark {
  /** The name used in the app's place list (named-features). */
  name: string;
  view: 'side' | 'camera';
  sub: string;
  ridge?: RidgeStyle;
  Art: (p: { motion: boolean }) => JSX.Element;
}

export const DRAWN_LANDMARKS: DrawnLandmark[] = [
  { name: 'the Matterhorn', view: 'side', sub: '4,478 M · SWITZERLAND', ridge: 'alps', Art: MatterhornHero },
  { name: 'Mount Everest', view: 'side', sub: '8,849 M · NEPAL AND CHINA', ridge: 'himalaya', Art: EverestHero },
  { name: 'Mount Fuji', view: 'side', sub: '3,776 M · JAPAN', ridge: 'japan', Art: FujiHero },
  { name: 'Mount Kilimanjaro', view: 'side', sub: '5,895 M · TANZANIA', ridge: 'savanna', Art: KilimanjaroHero },
  { name: 'the Pyramids of Giza', view: 'camera', sub: 'Too small to see from the window: here is the camera', Art: PyramidsScene },
  { name: 'Stonehenge', view: 'camera', sub: 'About 5,000 years old, seen from the camera', Art: StonehengeScene },
  { name: 'the Great Wall of China', view: 'camera', sub: 'Thousands of kilometres of wall, seen from the camera', Art: GreatWallScene },
  { name: 'Niagara Falls', view: 'camera', sub: 'The Horseshoe Falls, between Canada and the USA', Art: NiagaraScene },
];

export const drawnLandmark = (name: string) => DRAWN_LANDMARKS.find((l) => l.name.toLowerCase() === name.toLowerCase()) ?? null;

/**
 * A landmark as the class sees it: big landmarks in the side window on the correct side; small or far ones on the
 * seat-back camera. Real weather decides for the big ones: under cloud the view switches to the camera.
 */
export function LandmarkView({ name, side = 'left', cloudy = false, motion = true }: { name: string; side?: 'left' | 'right'; cloudy?: boolean; motion?: boolean }) {
  const l = drawnLandmark(name);
  if (!l) return null;
  if (l.view === 'camera') return <CameraScreen title={l.name} subtitle={l.sub} motion={motion}><l.Art motion={motion} /></CameraScreen>;
  if (cloudy) {
    return (
      <CameraScreen title={l.name} subtitle="Under the clouds today: switching to the camera" motion={motion}>
        <rect x="100" y="60" width="1420" height="800" fill="#9fb8d6" />
        <g transform="translate(180 150) scale(0.82)">
          {RIDGES[l.ridge ?? 'alps'].map((r) => <Ridge key={r.seed} {...r} />)}
          <l.Art motion={motion} />
        </g>
      </CameraScreen>
    );
  }
  return <SideWindow title={l.name} sub={l.sub} side={side} ridge={l.ridge} motion={motion}><l.Art motion={motion} /></SideWindow>;
}

/** The first two drawings, as approved (kept for the dev preview). */
export function MatterhornSideView({ motion = true }: { motion?: boolean }) {
  return <LandmarkView name="the Matterhorn" motion={motion} />;
}
export function PyramidsCameraView({ motion = true }: { motion?: boolean }) {
  return <LandmarkView name="the Pyramids of Giza" motion={motion} />;
}
