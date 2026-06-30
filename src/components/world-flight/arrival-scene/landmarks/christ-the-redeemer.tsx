// Christ the Redeemer (Rio de Janeiro) — background slot, the scene's hero. The
// pale soapstone statue (two-tone) stands arms-outstretched on a pedestal atop
// the forested granite Corcovado, reading bright against the dark peak. Base-
// center origin (peak base at y=0), built upward. Fixed iconic colours (no
// palette) + a backlight halo so the figure stays bright at any time of day.
export function ChristTheRedeemerLandmark() {
  const peak = 'rgba(34,54,40,0.97)'; // forested Corcovado granite
  const peakShade = 'rgba(0,0,0,0.2)';
  const peakLit = 'rgba(96,124,86,0.4)';
  const stone = 'rgb(230,228,220)'; // pale soapstone
  const shade = 'rgba(168,168,158,0.95)';
  return (
    <g aria-hidden>
      {/* steep forested peak (lit left flank / shaded right flank) */}
      <path d="M -150 0 C -82 -120 -42 -212 -8 -252 L 8 -252 C 42 -212 92 -120 150 0 Z" fill={peak} />
      <path d="M -8 -252 C -42 -182 -92 -92 -150 0 L -98 0 C -56 -112 -30 -192 -8 -252 Z" fill={peakLit} opacity={0.3} />
      <path d="M 8 -252 C 42 -182 92 -92 150 0 L 98 0 C 56 -112 30 -192 8 -252 Z" fill={peakShade} />
      {/* cliff striations */}
      <path d="M -118 -28 C -80 -70 -50 -120 -30 -178" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1.4} />
      <path d="M 118 -28 C 80 -70 50 -120 30 -178" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1.4} />

      {/* viewing terrace + stepped pedestal (two-tone) */}
      <rect x={-30} y={-262} width={60} height={10} fill={shade} />
      <rect x={-15} y={-300} width={30} height={40} fill={stone} />
      <rect x={3} y={-300} width={12} height={40} fill={shade} />

      {/* backlight halo so the figure separates from the dark peak */}
      <ellipse cx={0} cy={-368} rx={70} ry={88} fill="rgba(255,250,232,0.16)" />

      {/* robed body (a-line, two-tone + drape folds) */}
      <path d="M -16 -300 L -11 -372 L 11 -372 L 16 -300 Z" fill={stone} />
      <path d="M 1 -372 L 11 -372 L 16 -300 L 1 -300 Z" fill={shade} />
      <path d="M -5 -304 L -3 -366 M 5 -304 L 4 -366" stroke={shade} strokeWidth={1.2} opacity={0.6} fill="none" />

      {/* outstretched arms (the cross) + hands + cloak drape under them */}
      <path d="M -56 -360 L 56 -360 L 52 -350 L -52 -350 Z" fill={stone} />
      <path d="M 2 -360 L 56 -360 L 52 -350 L 2 -350 Z" fill={shade} />
      <path d="M -52 -350 L -44 -320 L -34 -350 Z" fill={stone} />
      <path d="M 52 -350 L 44 -320 L 34 -350 Z" fill={stone} />
      <path d="M 52 -350 L 44 -320 L 39 -337 Z" fill={shade} />
      <rect x={-59} y={-364} width={7} height={7} rx={1.5} fill={stone} />
      <rect x={52} y={-364} width={7} height={7} rx={1.5} fill={shade} />

      {/* shoulders + head (looking slightly down) */}
      <path d="M -16 -366 Q 0 -372 16 -366 L 12 -360 L -12 -360 Z" fill={stone} />
      <circle cx={0} cy={-382} r={9} fill={stone} />
      <path d="M 0 -391 A 9 9 0 0 1 0 -373 Z" fill={shade} opacity={0.6} />
      <circle cx={0} cy={-382} r={13} fill="none" stroke="rgba(255,250,232,0.5)" strokeWidth={1.5} opacity={0.5} />
    </g>
  );
}
