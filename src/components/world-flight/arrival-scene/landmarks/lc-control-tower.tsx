import { motion } from 'framer-motion';
import type { LandmarkLayerProps } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// LC Control Tower — the LessonCaptain home-base hero (foreground slot).
//
// The grounded brand landmark for "LC International": a slender white control
// tower with LC-blue bands and a swept-fin (aviation) motif, a glowing cyan
// observation cab, a sweeping searchlight + beacon (ambient), and a small "L"
// mark plaque near the base — beside a signature arched hangar with a warm-lit
// mouth. Hardcoded LC blue/white so the brand identity reads at every time of
// day (precedent: the windsock + the bespoke skyline accents do the same); the
// white shaft stays the brightest, highest-contrast object in frame so the hero
// pops against the darker city behind it.
//
// Base-center local origin (x=0 centre, y=0 base line), built UPWARD with
// negative y; the composer applies anchor/baseY/scale from the registry.
// ─────────────────────────────────────────────────────────────────────────────

// LessonCaptain "L" brandmark (512 viewBox), recoloured for the base plaque.
const L_MARK =
  'M219.446 106.025C181.592 152.266 185.378 164.679 185.378 200.255V219.212L185.431 247.015V393.448H313.45H425.749C425.749 483.255 396.728 484.274 259.254 487.058L92.0049 487.058L92.0538 247.015L92 219.212L92.0049 200.255C92.2726 143.132 123.314 101.932 187.012 71.6172C235.218 43.9858 337.128 31.308 345.625 43.9858C345.625 43.9858 257.3 59.7832 219.446 106.025ZM145 200.255V219.212V434.056H298.939C387.895 434.056 397.477 422.127 396.831 424.571C390.991 446.694 342.471 446.694 313.45 446.694H132.382V219.212V200.255C132.382 161.672 144.189 138.51 172.024 114.208C199.858 90.4074 207.987 87.7665 209.983 90.2271C183.485 114.208 145 133.828 145 200.255Z';

const LC_BLUE = '#2b76c2';
const LC_BLUE_LIGHT = '#4DA3FF';
const CAB_GLASS = 'rgba(120,210,255,0.78)';

// Shaft half-width at height y (base ±20 tapering to ±11 at the cab at y=-300).
const shaftHW = (y: number) => 20 - 9 * Math.min(1, -y / 300);

export function LcControlTower({ idPrefix, ambient }: LandmarkLayerProps) {
  const shaftId = `${idPrefix}-lct-shaft`;
  const finId = `${idPrefix}-lct-fin`;
  const glowId = `${idPrefix}-lct-glow`;

  const bands = [-70, -150, -230].map((y) => {
    const hw = shaftHW(y);
    return <rect key={y} x={-hw - 1} y={y - 3} width={(hw + 1) * 2} height={6} fill={LC_BLUE} />;
  });

  const beacon = (
    <>
      <rect x={-2} y={-446} width={4} height={46} fill="#cfe0f5" />
      {ambient ? (
        <motion.circle
          cx={0} cy={-450} r={5} fill={LC_BLUE_LIGHT}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <circle cx={0} cy={-450} r={4.5} fill={LC_BLUE_LIGHT} />
      )}
    </>
  );

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id={shaftId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f4f8ff" />
          <stop offset="0.5" stopColor="#dbe8fb" />
          <stop offset="1" stopColor="#aec6e6" />
        </linearGradient>
        <linearGradient id={finId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={LC_BLUE} />
          <stop offset="1" stopColor={LC_BLUE_LIGHT} />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(140,215,255,0.55)" />
          <stop offset="1" stopColor="rgba(140,215,255,0)" />
        </radialGradient>
        <radialGradient id={`${idPrefix}-lct-ground`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(120,200,255,0.28)" />
          <stop offset="1" stopColor="rgba(120,200,255,0)" />
        </radialGradient>
      </defs>

      {/* soft ground glow pool */}
      <ellipse cx={-30} cy={6} rx={220} ry={20} fill={`url(#${idPrefix}-lct-ground)`} />

      {/* ── Glass terminal concourse (right of the tower base) ── */}
      <g>
        <rect x={34} y={-44} width={154} height={44} fill="#13233c" />
        <rect x={34} y={-44} width={154} height={3} fill={LC_BLUE} />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={42 + i * 21} y={-36} width={13} height={24} rx={1.5} fill="rgba(150,220,255,0.5)" />
        ))}
        {/* jet-bridge stub + LC stripe */}
        <rect x={150} y={-26} width={40} height={9} rx={2} fill="#1c2e4a" />
        <rect x={150} y={-24} width={40} height={2.5} fill={LC_BLUE_LIGHT} opacity={0.8} />
      </g>

      {/* ── Signature hangar (left, behind the tower) ── */}
      <g>
        {/* arch shell */}
        <path d="M -188 0 L -188 -54 Q -188 -118 -120 -118 Q -52 -118 -52 -54 L -52 0 Z" fill="#16263f" />
        {/* LC-blue arch rim */}
        <path d="M -188 -54 Q -188 -118 -120 -118 Q -52 -118 -52 -54" fill="none" stroke={LC_BLUE} strokeWidth={4} />
        {/* lit mouth */}
        <path d="M -170 0 L -170 -52 Q -170 -100 -120 -100 Q -70 -100 -70 -52 L -70 0 Z" fill="#0a0805" />
        <ellipse cx={-120} cy={-34} rx={46} ry={34} fill="rgba(210,150,60,0.22)" />
        {/* "LC" stripe on the hangar shoulder */}
        <rect x={-150} y={-86} width={60} height={5} rx={2} fill={LC_BLUE_LIGHT} opacity={0.85} />
      </g>

      {/* ── Swept fin (aviation tail motif, behind the shaft) ── */}
      <path d="M 12 -40 C 58 -120 70 -240 44 -332 C 40 -250 26 -170 6 -120 Z" fill={`url(#${finId})`} opacity={0.92} />
      <path d="M 12 -40 C 58 -120 70 -240 44 -332" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />

      {/* ── Shaft ── */}
      <polygon points="-20 0, -11 -300, 11 -300, 20 0" fill={`url(#${shaftId})`} />
      <polygon points="-20 0, -11 -300, -7 -300, -16 0" fill="rgba(255,255,255,0.35)" />
      <polygon points="20 0, 11 -300, 7 -300, 16 0" fill="rgba(20,40,70,0.22)" />
      {bands}

      {/* base plaque with the LC "L" mark */}
      <rect x={-16} y={-44} width={32} height={32} rx={5} fill={LC_BLUE} />
      <g transform="translate(-12,-40) scale(0.047) translate(-259,-259)">
        <path d={L_MARK} fill="#F2F6FC" />
      </g>

      {/* ── Sweeping searchlight (behind the cab, ambient only) ── */}
      {ambient && (
        <motion.polygon
          points="0 -322, -54 -470, 54 -470"
          fill={`url(#${glowId})`}
          style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
          animate={{ rotate: [-26, 26, -26], opacity: [0.12, 0.34, 0.12] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Observation cab (glowing cyan glass) ── */}
      <polygon points="-34 -300, 34 -300, 28 -332, 18 -354, -18 -354, -28 -332" fill="#16263f" />
      <ellipse cx={0} cy={-330} rx={30} ry={24} fill={`url(#${glowId})`} />
      <polygon points="-26 -304, 26 -304, 21 -330, 13 -348, -13 -348, -21 -330" fill={CAB_GLASS} />
      {/* mullions */}
      {[-14, 0, 14].map((mx) => (
        <rect key={mx} x={mx - 1} y={-348} width={2} height={44} fill="rgba(16,32,56,0.5)" />
      ))}
      {/* roof ring */}
      <rect x={-20} y={-362} width={40} height={10} rx={3} fill="#1c2e4a" />
      <rect x={-18} y={-360} width={36} height={3} fill={LC_BLUE_LIGHT} opacity={0.7} />

      {/* holographic data-ring orbiting the cab (ambient) */}
      {ambient ? (
        <motion.ellipse
          cx={0} cy={-328} rx={48} ry={15} fill="none" stroke={LC_BLUE_LIGHT} strokeWidth={1.5}
          strokeDasharray="6 9" opacity={0.7}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <ellipse cx={0} cy={-328} rx={48} ry={15} fill="none" stroke={LC_BLUE_LIGHT} strokeWidth={1.2} strokeDasharray="6 9" opacity={0.5} />
      )}

      {beacon}
    </g>
  );
}
