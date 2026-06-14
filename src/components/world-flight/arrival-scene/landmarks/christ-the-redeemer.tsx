// Christ the Redeemer (Rio de Janeiro) — background slot, the scene's hero. The
// pale concrete statue (light stone, two-tone) reads bright against the forested
// granite Corcovado peak so it stands out at distance. Arms-outstretched figure
// atop the summit. Base-center origin (peak base at y=0), built upward. Uses
// fixed iconic colours (no palette) so the statue stays bright at any time.
export function ChristTheRedeemerLandmark() {
  const peak = 'rgba(34,54,40,0.97)'; // forested Corcovado granite
  const peakShade = 'rgba(0,0,0,0.18)';
  const peakLit = 'rgba(96,124,86,0.4)';
  const stone = 'rgb(228,226,218)'; // pale soapstone statue
  const shade = 'rgba(172,172,162,0.95)';
  return (
    <g aria-hidden>
      {/* steep forested peak */}
      <path d="M -150 0 C -80 -120 -40 -210 -8 -250 L 8 -250 C 40 -210 90 -120 150 0 Z" fill={peak} />
      {/* lit left flank + shaded right flank */}
      <path d="M -8 -250 C -40 -180 -90 -90 -150 0 L -96 0 C -54 -110 -28 -190 -8 -250 Z" fill={peakLit} opacity={0.3} />
      <path d="M 8 -250 C 40 -180 90 -90 150 0 L 96 0 C 54 -110 28 -190 8 -250 Z" fill={peakShade} />
      {/* statue pedestal (two-tone) — taller, lifting the figure higher */}
      <rect x={-11} y={-290} width={22} height={40} fill={stone} />
      <rect x={2} y={-290} width={9} height={40} fill={shade} />
      {/* robed body (two-tone) */}
      <path d="M -13 -290 L -10 -360 L 10 -360 L 13 -290 Z" fill={stone} />
      <path d="M 0 -360 L 10 -360 L 13 -290 L 0 -290 Z" fill={shade} />
      {/* outstretched arms — narrower, at shoulder height, with robe drape */}
      <rect x={-52} y={-363} width={104} height={9} fill={stone} />
      <rect x={3} y={-363} width={49} height={9} fill={shade} />
      <path d="M -50 -354 L -46 -340 L -42 -354 Z" fill={stone} />
      <path d="M 42 -354 L 46 -340 L 50 -354 Z" fill={shade} />
      {/* head */}
      <circle cx={0} cy={-378} r={9} fill={stone} />
      {/* soft halo */}
      <circle cx={0} cy={-378} r={14.5} fill="none" stroke="rgba(255,250,232,0.55)" strokeWidth={2} opacity={0.5} />
    </g>
  );
}
