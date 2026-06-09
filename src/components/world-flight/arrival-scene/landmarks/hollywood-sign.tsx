// Hollywood sign (Los Angeles) — midground slot. A TALL dry hill whose crest
// rises above the city skyline, with the white sign near the top. The hill's
// lower slopes fall behind the buildings (depth) but the crest + sign clear even
// the tallest buildings, so it's always visible regardless of the seeded skyline.
// Base-center origin (hill base at y=0), built upward.
export function HollywoodSignLandmark() {
  const hill = '#7d6f3a';
  const hillShade = '#5c5226';
  const letter = 'rgba(247,247,245,0.96)';
  // nine boards near the crest, following a shallow downward arc (crown of hill)
  const cols = [-150, -114, -78, -42, -6, 30, 66, 102, 138];
  const W = 24;
  const H = 46;
  const arcY = (x: number) => -358 + (x * x) / 760; // dips slightly toward the edges

  return (
    <g aria-hidden>
      {/* tall hill body */}
      <path
        d="M -340 0 C -286 -184 -184 -322 -64 -392 C -26 -412 26 -412 64 -392 C 184 -322 286 -184 340 0 Z"
        fill={hill}
      />
      {/* shaded lower-right flank for a bit of form */}
      <path d="M 64 -392 C 184 -322 286 -184 340 0 L 90 0 C 70 -150 70 -300 64 -392 Z" fill={hillShade} opacity={0.55} />
      {/* ridge highlight */}
      <path d="M -64 -392 C -26 -412 26 -412 64 -392" fill="none" stroke="rgba(255,240,200,0.25)" strokeWidth={4} />
      {/* dry scrub speckle */}
      {[-150, -70, 30, 120].map((x, i) => (
        <ellipse key={i} cx={x} cy={-150 - (i % 2) * 30} rx={26} ry={9} fill="rgba(40,34,12,0.28)" />
      ))}
      {/* nine white letter boards along the crown */}
      {cols.map((x) => {
        const y = arcY(x);
        return (
          <g key={x}>
            <rect x={x + 4} y={y} width={3} height={20} fill="rgba(0,0,0,0.28)" />
            <rect x={x + W - 7} y={y} width={3} height={20} fill="rgba(0,0,0,0.28)" />
            <rect x={x} y={y - H} width={W} height={H} fill={letter} />
            <rect x={x} y={y - H * 0.64} width={W} height={2} fill="rgba(0,0,0,0.16)" />
            <rect x={x} y={y - H * 0.34} width={W} height={2} fill="rgba(0,0,0,0.16)" />
          </g>
        );
      })}
    </g>
  );
}
