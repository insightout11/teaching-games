// Thai temple (Bangkok) — foreground slot. An ordination hall (ubosot) with
// steep tiered red-tile roofs, gold bargeboards (lamyong) and upswept naga-tail
// finials, a ringed gold spire, flanked by two golden bell-shaped chedis (the
// gilded domed stupas). Base-center origin, built upward. Fixed iconic colours
// (floodlit temple) with two-tone shading so nothing reads as a flat blob.
export function TempleRoofLandmark() {
  const tile = 'rgb(176,54,44)'; // glazed red roof tile
  const tileShade = 'rgba(0,0,0,0.24)';
  const gold = 'rgb(226,186,94)';
  const goldLit = 'rgb(248,214,124)';
  const goldShade = 'rgba(146,108,36,0.6)';
  const cream = 'rgb(234,226,208)'; // whitewashed hall wall
  const creamShade = 'rgba(0,0,0,0.16)';
  const doorRed = 'rgb(140,40,34)';

  // One upswept roof tier: red tile body (shaded right), a gold bargeboard down
  // each slope, and a curled gold naga-tail finial at each eave tip.
  const Tier = ({ y, half, h, kk }: { y: number; half: number; h: number; kk: string }) => {
    const tipL = -half - 26;
    const tipR = half + 26;
    const tipY = y - 26;
    const apexY = y - h;
    return (
      <g key={kk}>
        <path
          d={`M ${-half} ${y} Q ${-half - 18} ${y - 10} ${tipL} ${tipY} L 0 ${apexY} L ${tipR} ${tipY} Q ${half + 18} ${y - 10} ${half} ${y} Z`}
          fill={tile}
        />
        <path d={`M 0 ${apexY} L ${tipR} ${tipY} Q ${half + 18} ${y - 10} ${half} ${y} L 0 ${y} Z`} fill={tileShade} />
        <path d={`M ${tipL} ${tipY} L 0 ${apexY} L ${tipR} ${tipY}`} fill="none" stroke={gold} strokeWidth={3.5} strokeLinejoin="round" />
        {/* upswept gold naga-tail finials (chofah) at the eave tips */}
        <path d={`M ${tipL} ${tipY} q -11 -3 -13 -17 q 7 6 13 7 Z`} fill={gold} />
        <path d={`M ${tipR} ${tipY} q 11 -3 13 -17 q -7 6 -13 7 Z`} fill={gold} />
      </g>
    );
  };

  // Golden bell-shaped chedi (stupa), drawn at a local origin then placed/scaled.
  const Chedi = ({ cx, s, kk }: { cx: number; s: number; kk: string }) => (
    <g key={kk} transform={`translate(${cx},0) scale(${s})`}>
      {/* redented square terraces */}
      <rect x={-40} y={-20} width={80} height={20} fill={gold} />
      <rect x={2} y={-20} width={38} height={20} fill={goldShade} />
      <rect x={-32} y={-36} width={64} height={16} fill={gold} />
      <rect x={2} y={-36} width={30} height={16} fill={goldShade} />
      <rect x={-24} y={-50} width={48} height={14} fill={gold} />
      <rect x={2} y={-50} width={22} height={14} fill={goldShade} />
      {/* bell dome (shaded right) */}
      <path d="M -28 -50 C -32 -118 -14 -150 0 -150 C 14 -150 32 -118 28 -50 Z" fill={gold} />
      <path d="M 0 -150 C 14 -150 32 -118 28 -50 L 0 -50 Z" fill={goldShade} />
      <path d="M -22 -66 C -22 -112 22 -112 22 -66" fill="none" stroke={goldLit} strokeWidth={2} opacity={0.55} />
      {/* harmika + ringed spire */}
      <rect x={-9} y={-162} width={18} height={12} fill={gold} />
      <rect x={0} y={-162} width={9} height={12} fill={goldShade} />
      {[-168, -178, -188, -198, -208].map((yy, i) => (
        <ellipse key={i} cx={0} cy={yy} rx={10 - i * 1.4} ry={2.4} fill={i % 2 ? goldLit : gold} />
      ))}
      {/* needle + finial */}
      <polygon points="-3 -210, 3 -210, 1.4 -250, -1.4 -250" fill={goldLit} />
      <circle cx={0} cy={-254} r={4} fill={goldLit} />
    </g>
  );

  return (
    <g aria-hidden>
      {/* flanking golden chedis (drawn first; the hall sits in front) */}
      <Chedi cx={-178} s={0.96} kk="cL" />
      <Chedi cx={184} s={0.86} kk="cR" />

      {/* ── ordination hall (ubosot) ── */}
      {/* stone plinth */}
      <rect x={-118} y={-18} width={236} height={18} fill="rgb(206,196,176)" />
      <rect x={0} y={-18} width={118} height={18} fill="rgba(0,0,0,0.18)" />
      {/* whitewashed wall (two-tone) */}
      <rect x={-104} y={-134} width={208} height={116} fill={cream} />
      <rect x={0} y={-134} width={104} height={116} fill={creamShade} />
      {/* gold pilasters */}
      {[-92, -56, 50, 86].map((px) => (
        <rect key={px} x={px} y={-134} width={6} height={116} fill={gold} opacity={0.85} />
      ))}
      {/* central doorway + flanking windows (red lacquer + gold frame) */}
      <rect x={-20} y={-104} width={40} height={86} fill={doorRed} />
      <path d="M -20 -104 Q 0 -124 20 -104 Z" fill={doorRed} />
      <rect x={-22} y={-106} width={44} height={4} fill={gold} />
      {[-66, 40].map((wx) => (
        <g key={wx}>
          <rect x={wx} y={-96} width={26} height={44} fill={doorRed} />
          <rect x={wx - 2} y={-98} width={30} height={3} fill={gold} />
        </g>
      ))}

      {/* tiered roofs (steep, overlapping) */}
      <Tier y={-134} half={126} h={86} kk="t1" />
      <Tier y={-192} half={98} h={76} kk="t2" />
      <Tier y={-246} half={70} h={66} kk="t3" />

      {/* ── ringed gold spire (the central finial) ── */}
      <rect x={-13} y={-326} width={26} height={14} fill={gold} />
      <rect x={0} y={-326} width={13} height={14} fill={goldShade} />
      {[-332, -342, -352, -362].map((yy, i) => (
        <ellipse key={yy} cx={0} cy={yy} rx={11 - i * 1.6} ry={3} fill={i % 2 ? goldLit : gold} />
      ))}
      <polygon points="-6 -362, 6 -362, 3 -408, -3 -408" fill={goldLit} />
      {/* topmost chofah flame + finial bead */}
      <path d="M 0 -408 C -7 -420 -3 -432 0 -440 C 3 -432 7 -420 0 -408 Z" fill={goldLit} />
      <circle cx={0} cy={-412} r={3.5} fill={gold} />
    </g>
  );
}
