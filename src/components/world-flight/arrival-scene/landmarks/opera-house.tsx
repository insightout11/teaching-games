// Sydney Opera House — foreground slot. Interlocking white shell "sails" (the
// building's floodlit off-white tiled vaults) on a granite podium. Base-center
// origin, built upward. Fixed iconic colours (the shells are always lit white)
// with two-tone shading — lit spine / shaded lobe — so no shell reads as a flat
// blob. Two main vaulted halls lean toward the centre, with a smaller shell pair.
export function OperaHouseLandmark() {
  const shell = 'rgb(242,241,234)'; // sun-warmed white tile
  const shellLobe = 'rgb(206,210,210)'; // shaded inner lobe
  const shellEdge = 'rgb(255,255,255)'; // lit ridge
  const seam = 'rgba(120,140,148,0.32)';
  const stone = 'rgb(150,142,128)';
  const stoneShade = 'rgba(0,0,0,0.22)';

  // A single pointed shell. `dir` = +1 leans/points right, −1 left. Drawn as an
  // "orange-segment" sail: convex spine up to a sharp apex, convex front sweeping
  // back down to the podium. Shaded front lobe + a lit ridge along the spine.
  const Shell = ({ x, w, h, dir }: { x: number; w: number; h: number; dir: number }) => {
    const s = dir >= 0 ? 1 : -1;
    const cx = x + w / 2;
    const apexX = cx + s * w * 0.16;
    const startX = cx - s * w * 0.5; // base on the tall/spine side
    const endX = cx + s * w * 0.5; // base on the front side
    const spine = `M ${startX} 0 C ${startX - s * w * 0.04} ${-h * 0.5} ${apexX - s * w * 0.26} ${-h * 0.95} ${apexX} ${-h}`;
    const body = `${spine} C ${apexX + s * w * 0.2} ${-h * 0.6} ${endX} ${-h * 0.18} ${endX} 0 Z`;
    const lobe = `M ${apexX} ${-h} C ${apexX + s * w * 0.2} ${-h * 0.6} ${endX} ${-h * 0.18} ${endX} 0 L ${apexX} 0 Z`;
    return (
      <g>
        <path d={body} fill={shell} />
        <path d={lobe} fill={shellLobe} opacity={0.85} />
        {/* tile seam echoing the spine */}
        <path
          d={`M ${startX + s * w * 0.12} 0 C ${startX + s * w * 0.08} ${-h * 0.5} ${apexX - s * w * 0.16} ${-h * 0.86} ${apexX} ${-h * 0.95}`}
          fill="none"
          stroke={seam}
          strokeWidth={1.6}
        />
        {/* lit ridge */}
        <path d={spine} fill="none" stroke={shellEdge} strokeWidth={2.4} strokeLinecap="round" />
      </g>
    );
  };

  return (
    <g aria-hidden>
      {/* granite podium (two-tone) + waterline plinth */}
      <rect x={-280} y={-36} width={560} height={36} fill={stone} />
      <rect x={0} y={-36} width={280} height={36} fill={stoneShade} />
      <rect x={-280} y={-10} width={560} height={4} fill="rgba(0,0,0,0.18)" />

      {/* left hall — three nested shells rising toward the centre */}
      <Shell x={-256} w={130} h={118} dir={1} />
      <Shell x={-204} w={138} h={182} dir={1} />
      <Shell x={-150} w={132} h={244} dir={1} />

      {/* right hall — mirror, tallest shell nearest the centre */}
      <Shell x={18} w={132} h={244} dir={-1} />
      <Shell x={66} w={138} h={182} dir={-1} />
      <Shell x={120} w={130} h={118} dir={-1} />

      {/* smaller restaurant shell pair on the right flank */}
      <Shell x={196} w={92} h={92} dir={-1} />
      <Shell x={232} w={78} h={64} dir={-1} />
    </g>
  );
}
