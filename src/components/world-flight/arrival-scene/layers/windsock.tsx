import { motion } from 'framer-motion';
import { CONTENT_W, LAYOUT, type SceneLayerProps } from '../types';

// LessonCaptain brandmark — just the "L" (from public/lessoncaptain-mark-*.svg,
// 512×512 viewBox, compass-star accent dropped). Recoloured white for the sock.
const L_MARK =
  'M219.446 106.025C181.592 152.266 185.378 164.679 185.378 200.255V219.212L185.431 247.015V393.448H313.45H425.749C425.749 483.255 396.728 484.274 259.254 487.058L92.0049 487.058L92.0538 247.015L92 219.212L92.0049 200.255C92.2726 143.132 123.314 101.932 187.012 71.6172C235.218 43.9858 337.128 31.308 345.625 43.9858C345.625 43.9858 257.3 59.7832 219.446 106.025ZM145 200.255V219.212V434.056H298.939C387.895 434.056 397.477 422.127 396.831 424.571C390.991 446.694 342.471 446.694 313.45 446.694H132.382V219.212V200.255C132.382 161.672 144.189 138.51 172.024 114.208C199.858 90.4074 207.987 87.7665 209.983 90.2271C183.485 114.208 145 133.828 145 200.255Z';

// Airfield windsock in LessonCaptain blue + white, carrying the "L" mark — a
// featured detail rendered on every scene. Volumetric fabric (gradient shading +
// a gravity droop + top sheen), a metal mouth ring, and a shaded tapered pole on
// a concrete footing with a ground shadow. The sock streams LEFT and flutters
// organically only when `ambient`; pole + mark are always drawn. Left-of-centre
// so the hero landmark + plane stay clear.
export function Windsock({ ambient, idPrefix }: SceneLayerProps) {
  const poleX = CONTENT_W * 0.22;
  const baseY = LAYOUT.runwayY - 44; // planted in the destination-specific apron beside the runway
  const topY = baseY - 132;
  const poleId = `${idPrefix}-ws-pole`;
  const blueId = `${idPrefix}-ws-blue`;
  const whiteId = `${idPrefix}-ws-white`;

  // Billowing tapered cone, streaming left from the mount (x = 0), with a slight
  // gravity droop toward the tail. Shading comes from shared vertical gradients
  // (userSpaceOnUse, so it stays consistent as the fabric flutters).
  const xs = [0, -30, -58, -84, -110, -152];
  const hs = [24, 20, 16, 12, 8, 3];
  const sag = (x: number) => 9 * Math.pow(Math.abs(x) / 152, 1.4);
  const yT = xs.map((x, i) => +(sag(x) - hs[i]).toFixed(2));
  const yB = xs.map((x, i) => +(sag(x) + hs[i]).toFixed(2));
  const fills = [`url(#${blueId})`, `url(#${whiteId})`, `url(#${blueId})`, `url(#${whiteId})`, `url(#${blueId})`];
  const bands = fills.map((fill, i) => (
    <path key={i} d={`M ${xs[i]} ${yT[i]} L ${xs[i + 1]} ${yT[i + 1]} L ${xs[i + 1]} ${yB[i + 1]} L ${xs[i]} ${yB[i]} Z`} fill={fill} />
  ));
  const topEdge = `M ${xs[0]} ${yT[0]} ` + xs.slice(1).map((x, i) => `L ${x} ${yT[i + 1]}`).join(' ');
  const seams = xs.slice(1, -1).map((x, i) => (
    <line key={i} x1={x} y1={yT[i + 1]} x2={x} y2={yB[i + 1]} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
  ));

  const sock = (
    <g>
      {/* dark interior at the mouth opening */}
      <ellipse cx={-2} cy={0} rx={5} ry={24} fill="#1d3650" />
      {bands}
      {seams}
      {/* sheen along the top edge */}
      <path d={topEdge} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round" />
      {/* metal mouth ring */}
      <ellipse cx={0} cy={0} rx={4} ry={24} fill="none" stroke="#262b33" strokeWidth={3} />
      <ellipse cx={-0.6} cy={0} rx={4} ry={24} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      {/* LessonCaptain "L" on the mouth band */}
      <g transform="translate(-15,0) scale(0.06) translate(-259,-259)">
        <path d={L_MARK} fill="#F2F6FC" />
      </g>
    </g>
  );

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id={poleId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#646d7a" />
          <stop offset="0.45" stopColor="#3a4048" />
          <stop offset="1" stopColor="#22262d" />
        </linearGradient>
        <linearGradient id={blueId} gradientUnits="userSpaceOnUse" x1="0" y1="-24" x2="0" y2="24">
          <stop offset="0" stopColor="#8ec9ff" />
          <stop offset="0.5" stopColor="#4DA3FF" />
          <stop offset="1" stopColor="#2b76c2" />
        </linearGradient>
        <linearGradient id={whiteId} gradientUnits="userSpaceOnUse" x1="0" y1="-24" x2="0" y2="24">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#eef4fb" />
          <stop offset="1" stopColor="#c6d4e6" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx={poleX} cy={baseY + 7} rx={28} ry={5} fill="rgba(0,0,0,0.18)" />
      {/* concrete footing */}
      <polygon points={`${poleX - 12},${baseY + 6} ${poleX + 12},${baseY + 6} ${poleX + 8},${baseY - 6} ${poleX - 8},${baseY - 6}`} fill="#454b54" />
      <rect x={poleX - 9} y={baseY - 8} width={18} height={4} fill="#2f343b" />
      {/* tapered metal pole */}
      <polygon points={`${poleX - 3.5},${baseY - 6} ${poleX + 3.5},${baseY - 6} ${poleX + 2.5},${topY} ${poleX - 2.5},${topY}`} fill={`url(#${poleId})`} />
      {/* swivel mount */}
      <circle cx={poleX} cy={topY} r={5.5} fill="#2f343b" />
      <circle cx={poleX} cy={topY} r={2.4} fill="#5a626e" />
      {/* sock — flutters organically when animated, pivoting at the mount */}
      <g transform={`translate(${poleX} ${topY})`}>
        {ambient ? (
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
            animate={{ rotate: [-3.5, 5.5, 1, 7, -1.5, -3.5] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {sock}
          </motion.g>
        ) : (
          sock
        )}
      </g>
    </g>
  );
}
