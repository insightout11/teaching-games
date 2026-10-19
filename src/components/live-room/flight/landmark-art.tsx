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
export function MatterhornSideView({ motion = true }: { motion?: boolean }) {
  const lit = '#f2e6da', litMid = '#d9c3b2', litDark = '#b59a88';
  const shade = '#5d6b86', shadeDark = '#46526c', snow = '#f7fbff', snowShade = '#c9d6ea';
  return (
    <svg viewBox="0 0 1600 900" className="h-full w-full" role="img" aria-label="On your left: the Matterhorn">
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
          <stop offset="0" stopColor={lit} /><stop offset="0.6" stopColor={litMid} /><stop offset="1" stopColor={litDark} />
        </linearGradient>
        <linearGradient id="lmShadeFace" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade} /><stop offset="1" stopColor={shadeDark} />
        </linearGradient>
        <linearGradient id="lmGully" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7fbff" stopOpacity="0.95" /><stop offset="1" stopColor="#f7fbff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="lmWindow"><rect x="40" y="30" width="1520" height="840" rx="190" /></clipPath>
        <style>{'@keyframes lmDrift{from{transform:translateX(-30px)}to{transform:translateX(30px)}}@keyframes lmBelow{from{transform:translateX(0)}to{transform:translateX(-200px)}}'}</style>
      </defs>
      <rect width="1600" height="900" fill="#0d1526" />
      <g clipPath="url(#lmWindow)">
        <rect width="1600" height="900" fill="url(#lmSky)" />
        <rect width="1600" height="900" fill="url(#lmSun)" />
        <Cloud x={1180} y={300} s={0.9} fill="#ffffff" motion={motion} />
        <Cloud x={1420} y={360} s={0.6} fill="#f4f8fc" motion={motion} delay={-20} />
        {/* The Alps behind, hazier with distance */}
        <Ridge seed={7} base={560} amp={150} rock="#a9bcd3" shade="#8fa4c0" snow="#eef4fa" opacity={0.75} snowLine={70} />
        <Ridge seed={19} base={600} amp={190} rock="#8aa0bd" shade="#6f86a6" snow="#f3f7fc" opacity={0.9} snowLine={90} />
        <rect x="0" y="420" width="1600" height="260" fill="url(#lmHaze)" />

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

        {/* cloud below the plane, passing */}
        <g style={motion ? { animation: 'lmBelow 30s linear infinite' } : undefined}>
          {Array.from({ length: 12 }, (_, i) => <Cloud key={i} x={i * 180 - 40} y={760 + (i % 3) * 30} s={1.1 + (i % 2) * 0.3} fill={i % 2 ? '#ffffff' : '#eef4fb'} motion={false} />)}
        </g>
        {/* window glass sheen */}
        <path d="M80 60 L520 60 L180 860 L80 860Z" fill="#ffffff" opacity="0.05" />
      </g>
      {/* window frame */}
      <rect x="40" y="30" width="1520" height="840" rx="190" fill="none" stroke="#1c263b" strokeWidth="34" />
      <rect x="40" y="30" width="1520" height="840" rx="190" fill="none" stroke="#33405c" strokeWidth="6" />
      {/* caption */}
      <g transform="translate(930 92)">
        <rect width="560" height="64" rx="32" fill="#0b1324" opacity="0.82" />
        <path d="M44 32 l18 -14 v8 h22 v12 h-22 v8z" fill="#fcd34d" />
        <text x="104" y="41" fill="#ffffff" fontSize="28" fontFamily="Georgia, serif">On your left: the Matterhorn</text>
      </g>
      <g transform="translate(1240 168)">
        <rect width="250" height="40" rx="20" fill="#0b1324" opacity="0.65" />
        <text x="22" y="27" fill="#cbd5e1" fontSize="18" fontFamily="monospace" letterSpacing="2">4,478 M · SWITZERLAND</text>
      </g>
    </svg>
  );
}

/**
 * CAMERA VIEW: the seat-back screen's outside camera, zoomed down onto the Pyramids of Giza (too small to see from
 * the window at cruise height). Khufu, Khafre (with the last of its white casing at the top) and Menkaure in their
 * real diagonal line, with small queens' pyramids, long afternoon shadows, the Sphinx, the desert plateau, and Cairo
 * with the green Nile beyond.
 */
export function PyramidsCameraView({ motion = true }: { motion?: boolean }) {
  // One pyramid in an oblique view from above: two faces lit (south-east) and shaded (south-west), and its shadow.
  // One pyramid in an oblique view from above: the south-east face in sun, the south-west face in shade.
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
    <svg viewBox="0 0 1600 900" className="h-full w-full" role="img" aria-label="Camera view: the Pyramids of Giza">
      <defs>
        <linearGradient id="pcSand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b98a" /><stop offset="1" stopColor="#e8c48e" />
        </linearGradient>
        <linearGradient id="pcHazeTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe3cf" stopOpacity="0.95" /><stop offset="1" stopColor="#efe3cf" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="pcVignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <pattern id="pcScan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.08" /></pattern>
        <clipPath id="pcScreen"><rect x="140" y="80" width="1320" height="742" rx="22" /></clipPath>
        <style>{'@keyframes pcPan{from{transform:translate(0,0) scale(1)}to{transform:translate(-24px,-10px) scale(1.03)}}@keyframes pcBlink{0%,60%{opacity:1}61%,100%{opacity:0.2}}'}</style>
      </defs>
      {/* seat back */}
      <rect width="1600" height="900" fill="#1a2231" />
      <rect x="110" y="50" width="1380" height="802" rx="44" fill="#0b0f17" />
      <g clipPath="url(#pcScreen)">
        <g style={motion ? { animation: 'pcPan 40s ease-in-out infinite alternate' } : undefined}>
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
        </g>
        <rect x="100" y="60" width="1420" height="800" fill="url(#pcScan)" />
        <rect x="100" y="60" width="1420" height="800" fill="url(#pcVignette)" />
        {/* camera HUD */}
        <g fontFamily="monospace" fill="#e2e8f0">
          <circle cx="190" cy="125" r="8" fill="#ef4444" style={motion ? { animation: 'pcBlink 1.6s infinite' } : undefined} />
          <text x="210" y="132" fontSize="22" letterSpacing="3">CAMERA · LOOKING DOWN</text>
          <text x="1420" y="132" fontSize="20" textAnchor="end" letterSpacing="2">ALT 10,600 M · 860 KM/H</text>
          <path d="M1390 760 h18 M1416 760 h18 M1412 738 v16 M1412 766 v16" stroke="#e2e8f0" strokeWidth="2" opacity="0.5" />
        </g>
        <g transform="translate(780 712)">
          <rect width="640" height="76" rx="16" fill="#0b1324" opacity="0.82" />
          <text x="28" y="34" fill="#ffffff" fontSize="28" fontFamily="Georgia, serif">The Pyramids of Giza</text>
          <text x="28" y="62" fill="#cbd5e1" fontSize="18" fontFamily="sans-serif">Too small to see from the window: here is the camera</text>
        </g>
      </g>
      {/* screen bezel details */}
      <rect x="140" y="80" width="1320" height="742" rx="22" fill="none" stroke="#222b3b" strokeWidth="6" />
      <circle cx="800" cy="840" r="6" fill="#273246" />
    </svg>
  );
}
