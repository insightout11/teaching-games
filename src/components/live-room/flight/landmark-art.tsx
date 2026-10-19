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
        <style>{'@keyframes lmDrift{from{transform:translateX(-30px)}to{transform:translateX(30px)}}@keyframes lmBelow{from{transform:translateX(0)}to{transform:translateX(-200px)}}'}</style>
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

/** Everest: a broad dark rock pyramid above a snowy massif, with its famous plume of snow blowing off the summit. */
function EverestHero({ motion }: { motion: boolean }) {
  const { snow, snowShade } = SIDE;
  return (
    <g>
      <path d="M40 710 C220 600 400 560 600 556 C800 556 980 600 1160 710Z" fill="#a8b8cf" />
      {/* Nuptse (left) and Lhotse (right), lower and whiter */}
      <path d="M150 670 L300 460 L350 492 L410 430 L500 540 L560 670Z" fill="#e8eef6" />
      <path d="M300 460 L350 492 L410 430 L452 486 L410 540 L340 520Z" fill="#c4d1e3" />
      <path d="M760 670 L880 450 L930 480 L1010 540 L1110 670Z" fill="#dfe7f2" />
      <path d="M880 450 L930 480 L970 580 L930 620 L840 580Z" fill="#b7c6db" />
      {/* the summit pyramid: dark rock, broad, with snow bands */}
      <path d="M650 240 L540 420 L470 580 L860 580 L800 430 L720 320Z" fill="#5a6075" />
      <path d="M650 240 L720 320 L800 430 L860 580 L660 580 L630 420Z" fill="#3f4558" />
      <path d="M650 240 L616 300 L632 310 L664 262Z" fill={snow} />
      <path d="M650 240 L664 262 L690 280 L676 250Z" fill={snow} opacity="0.85" />
      {/* the Yellow Band and snow ledges */}
      <path d="M572 400 C640 388 720 390 790 410 L796 424 C724 406 642 404 566 414Z" fill="#c8b58e" opacity="0.8" />
      {[[530, 480, 150], [560, 530, 200], [610, 340, 80], [700, 360, 70]].map(([x, y, w], k) => <path key={k} d={`M${x} ${y} q${w / 2} -10 ${w} 4`} stroke={snow} strokeWidth="5" fill="none" opacity="0.85" />)}
      <path d="M470 580 C580 560 760 560 860 580 L900 640 L430 640Z" fill={snowShade} />
      <path d="M430 640 C580 620 760 620 900 650 L920 680 L410 680Z" fill={snow} />
      {/* the snow plume streaming off the summit, under the caption */}
      <g style={motion ? { animation: 'lmDrift 9s ease-in-out infinite alternate' } : undefined}>
        <path d="M656 240 C780 214 940 226 1120 268 C940 252 800 256 670 270Z" fill="url(#lmPlume)" />
        <path d="M662 256 C780 244 900 256 1020 290 C890 278 790 280 674 282Z" fill="url(#lmPlume)" opacity="0.7" />
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

/** Niagara Falls from above: the river sweeping in, the Horseshoe Falls curving across it, white water and a tall mist plume, the boat in the gorge. */
function NiagaraScene({ motion }: { motion: boolean }) {
  return (
    <>
      <rect x="100" y="60" width="1420" height="800" fill="#5f7d4f" />
      {/* the upper river sweeping in from the top left, rapids before the brink */}
      <path d="M100 160 C360 130 620 180 780 260 C880 310 960 330 1080 330 L1120 400 C980 420 820 430 700 420 C540 400 400 320 100 330Z" fill="#3f8aa0" />
      {Array.from({ length: 22 }, (_, k) => { const r = rng(k + 91); const x = 160 + r() * 820, y = 200 + r() * 170; return <path key={k} d={`M${x} ${y} q30 -6 60 0`} stroke="#bfe3ee" strokeWidth="3" fill="none" opacity="0.6" />; })}
      {/* the horseshoe brink: a white U across the river, opening toward the camera */}
      <path d="M640 410 C680 520 980 540 1120 400" stroke="#f4fbff" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* falling water below the brink */}
      <defs>
        <linearGradient id="ngFall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4fbff" /><stop offset="1" stopColor="#7fb6c8" />
        </linearGradient>
      </defs>
      <path d="M640 410 C680 520 980 540 1120 400 L1124 460 C990 600 690 590 630 470Z" fill="url(#ngFall)" />
      {/* the gorge, dark water flowing away to the bottom right */}
      <path d="M630 470 C690 590 990 600 1124 460 C1180 560 1240 700 1300 860 L760 860 C760 700 700 580 630 470Z" fill="#2a5a6c" />
      {/* the mist plume rising out of the horseshoe */}
      <g style={motion ? { animation: 'pcMist 6s ease-in-out infinite alternate' } : undefined}>
        {[[880, 500, 220], [760, 470, 140], [1010, 460, 150], [860, 420, 160], [920, 350, 120], [880, 290, 90]].map(([x, y, r], k) => <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.5} fill="#ffffff" opacity={0.55 - k * 0.06} />)}
      </g>
      {/* the boat in the gorge, with its wake */}
      <path d="M960 720 l-50 44" stroke="#cfe6ee" strokeWidth="4" opacity="0.7" />
      <ellipse cx="968" cy="714" rx="22" ry="9" fill="#2e6fd1" /><rect x="958" y="706" width="20" height="7" fill="#f4f4f4" />
      {/* the American Falls: a straight white line on the near bank */}
      <path d="M560 560 L700 640" stroke="#ffffff" strokeWidth="10" />
      {/* shores: roads, buildings, autumn trees */}
      {Array.from({ length: 24 }, (_, k) => { const r = rng(k + 41); const left = k % 2 === 0; return <rect key={k} x={left ? 140 + r() * 360 : 1250 + r() * 240} y={left ? 600 + r() * 220 : 480 + r() * 340} width={20 + r() * 40} height={12 + r() * 26} fill={r() < 0.5 ? '#c9c2b4' : '#a39b8c'} />; })}
      {Array.from({ length: 50 }, (_, k) => { const r = rng(k + 71); return <circle key={k} cx={k % 2 ? 140 + r() * 400 : 1180 + r() * 320} cy={k % 2 ? 380 + r() * 200 : 420 + r() * 200} r={5 + r() * 6} fill={r() < 0.5 ? '#d08a3a' : '#a8432c'} opacity="0.85" />; })}
      <path d="M100 560 C300 560 460 590 560 640" stroke="#d9d2c0" strokeWidth="10" fill="none" />
      <path d="M1520 440 C1380 460 1260 500 1200 560" stroke="#d9d2c0" strokeWidth="10" fill="none" />
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
