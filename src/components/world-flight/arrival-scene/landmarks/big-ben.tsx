// Big Ben / Elizabeth Tower (London) — foreground slot. Gothic clock tower in
// pale Portland-ish stone (two-tone), with a projecting clock stage + gilded
// clock face, a louvred belfry with corner pinnacles, and a steep patinated
// cast-iron spire with gold cresting + finial. Base-center origin, built upward.
// Fixed iconic colours (floodlit) so it reads at any time of day.
export function BigBenLandmark() {
  const stone = 'rgb(198,184,152)';
  const stoneLit = 'rgb(218,204,170)';
  const stoneShade = 'rgba(0,0,0,0.2)';
  const roof = 'rgb(72,84,80)'; // patinated cast iron (faint green)
  const roofShade = 'rgba(0,0,0,0.26)';
  const gold = 'rgb(228,194,108)';
  const goldLit = 'rgb(246,216,128)';
  const faceCream = 'rgb(238,232,214)';
  const dark = 'rgb(40,44,52)';

  // a pointed lancet opening (recessed) at (cx, top), width w, height h
  const lancet = (cx: number, top: number, w: number, h: number, key: string) => (
    <path
      key={key}
      d={`M ${cx - w / 2} ${top} L ${cx - w / 2} ${top - h} Q ${cx} ${top - h - w * 0.55} ${cx + w / 2} ${top - h} L ${cx + w / 2} ${top} Z`}
      fill={dark}
      opacity={0.5}
    />
  );

  return (
    <g aria-hidden>
      {/* plinth */}
      <rect x={-42} y={-22} width={84} height={22} fill={stoneShade} />
      <rect x={-40} y={-24} width={80} height={6} fill={stone} />

      {/* shaft (two-tone) + pilasters */}
      <rect x={-34} y={-300} width={68} height={278} fill={stone} />
      <rect x={2} y={-300} width={32} height={278} fill={stoneShade} />
      <rect x={-34} y={-300} width={5} height={278} fill={stoneLit} />
      {[-22, 0, 22].map((px) => (
        <rect key={px} x={px - 1.5} y={-296} width={3} height={272} fill="rgba(0,0,0,0.16)" />
      ))}
      {/* string courses */}
      {[-70, -150, -230].map((y) => (
        <rect key={y} x={-37} y={y} width={74} height={4} fill={stoneShade} />
      ))}
      {/* lit lancet window bays up the shaft */}
      {lancet(-16, -110, 14, 34, 'sw1')}
      {lancet(16, -110, 14, 34, 'sw2')}
      {lancet(-16, -200, 14, 34, 'sw3')}
      {lancet(16, -200, 14, 34, 'sw4')}

      {/* projecting clock stage */}
      <rect x={-42} y={-356} width={84} height={56} fill={stone} />
      <rect x={2} y={-356} width={40} height={56} fill={stoneShade} />
      <rect x={-44} y={-300} width={88} height={5} fill={stoneLit} />
      {/* gilded clock face */}
      <circle cx={0} cy={-328} r={25} fill={faceCream} />
      <circle cx={0} cy={-328} r={25} fill="none" stroke={gold} strokeWidth={3.5} />
      {Array.from({ length: 12 }, (_, i) => {
        const ang = (i / 12) * Math.PI * 2;
        const x1 = Math.sin(ang) * 21;
        const y1 = -328 - Math.cos(ang) * 21;
        const x2 = Math.sin(ang) * 24;
        const y2 = -328 - Math.cos(ang) * 24;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={gold} strokeWidth={1.4} />;
      })}
      <line x1={0} y1={-328} x2={0} y2={-346} stroke={dark} strokeWidth={2.4} />
      <line x1={0} y1={-328} x2={11} y2={-322} stroke={dark} strokeWidth={2.4} />
      {/* gablet crowning the clock face */}
      <polygon points="-26 -353, 0 -372, 26 -353" fill={gold} opacity={0.9} />

      {/* belfry (louvred bell stage) */}
      <rect x={-38} y={-410} width={76} height={54} fill={stone} />
      <rect x={2} y={-410} width={36} height={54} fill={stoneShade} />
      {[-20, 0, 20].map((cx) => (
        <g key={cx}>
          {lancet(cx, -360, 14, 38, `bl${cx}`)}
          {[-2, -10, -18, -26].map((dy) => (
            <line key={dy} x1={cx - 6} y1={-360 + dy} x2={cx + 6} y2={-360 + dy} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
          ))}
        </g>
      ))}
      {/* corner pinnacles */}
      {[-38, 38].map((cx) => (
        <g key={cx}>
          <rect x={cx - 4} y={-444} width={8} height={34} fill={stone} />
          <polygon points={`${cx - 5} -444, ${cx} -462, ${cx + 5} -444`} fill={roof} />
          <circle cx={cx} cy={-464} r={2.6} fill={gold} />
        </g>
      ))}

      {/* steep cast-iron spire with gold cresting + ribs */}
      <rect x={-40} y={-418} width={80} height={8} fill={gold} opacity={0.9} />
      <polygon points="-36 -418, 0 -496, 36 -418" fill={roof} />
      <polygon points="0 -496, 36 -418, 0 -418" fill={roofShade} />
      {[-24, -12, 0, 12, 24].map((bx) => (
        <line key={bx} x1={bx} y1={-418} x2={0} y2={-496} stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
      ))}
      {/* gilded finial */}
      <rect x={-1.6} y={-520} width={3.2} height={24} fill={goldLit} />
      <circle cx={0} cy={-500} r={5} fill={goldLit} />
      <circle cx={0} cy={-522} r={3} fill={goldLit} />
    </g>
  );
}
