import type { ScenePalette } from '../types';
import { VIEWBOX } from '../types';

// The nearest layer (Oct 2026, owner: more parallax): grass tufts, runway edge lights and the odd marker post right at
// the bottom edge, closer than the runway, so they slide past faster than everything else. Darker than the scene (out
// of the light, near the camera) and kept below the plane's wheels. Lights glow at night.

function shade(hex: string, amount: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function NearForegroundLayer({ palette, rand, idPrefix }: { palette: ScenePalette; rand: () => number; idPrefix: string }) {
  const night = palette.light === 'moon';
  const grass = shade(palette.foliage, night ? 0.62 : 0.38);
  const grassDark = shade(palette.foliage, night ? 0.75 : 0.55);
  const lightOn = night;
  const W = VIEWBOX.w + 600, X0 = -300, BASE = VIEWBOX.h + 6;

  // grass tufts: clumps of 3-5 blades along the bottom edge
  const tufts = Array.from({ length: 46 }, (_, i) => {
    const x = X0 + (i + rand() * 0.8) * (W / 46);
    const h = 26 + rand() * 46;
    const blades = 3 + Math.floor(rand() * 3);
    return { x, h, blades, lean: (rand() - 0.5) * 18, dark: rand() < 0.4 };
  });
  // runway edge lights and posts, evenly spaced with a little jitter
  const lights = Array.from({ length: 9 }, (_, i) => X0 + 160 + i * (W / 9) + rand() * 60);
  const posts = Array.from({ length: 3 }, (_, i) => X0 + 420 + i * (W / 3) + rand() * 120);

  return (
    <g aria-hidden>
      <defs>
        <radialGradient id={`${idPrefix}-nf-glow`}>
          <stop offset="0" stopColor={palette.windowWarm} stopOpacity="0.85" />
          <stop offset="1" stopColor={palette.windowWarm} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* a dark grass bank along the very bottom */}
      <path d={`M${X0} ${BASE} L${X0} ${BASE - 22} Q${X0 + W * 0.25} ${BASE - 34} ${X0 + W * 0.5} ${BASE - 24} T${X0 + W} ${BASE - 26} L${X0 + W} ${BASE} Z`} fill={grassDark} />
      {posts.map((x) => (
        <g key={`p${x}`}>
          <rect x={x} y={BASE - 92} width={9} height={92} rx={2} fill={shade(palette.buildingSilhouette, 0.35)} />
          <rect x={x - 14} y={BASE - 104} width={37} height={18} rx={3} fill={night ? '#c2410c' : '#f59e0b'} opacity={0.9} />
        </g>
      ))}
      {lights.map((x) => (
        <g key={`l${x}`}>
          {lightOn && <circle cx={x + 5} cy={BASE - 48} r={34} fill={`url(#${idPrefix}-nf-glow)`} />}
          <rect x={x + 2} y={BASE - 40} width={6} height={40} fill={shade(palette.buildingSilhouette, 0.4)} />
          <ellipse cx={x + 5} cy={BASE - 46} rx={10} ry={8} fill={lightOn ? palette.windowWarm : shade(palette.windowWarm, 0.35)} />
        </g>
      ))}
      {tufts.map((t) => (
        <g key={`t${t.x}`} fill={t.dark ? grassDark : grass}>
          {Array.from({ length: t.blades }, (_, k) => {
            const bx = t.x + k * 7;
            const tip = bx + t.lean + (k - t.blades / 2) * 6;
            return <path key={k} d={`M${bx - 5} ${BASE} Q${bx + t.lean * 0.3} ${BASE - t.h * 0.6} ${tip} ${BASE - t.h} Q${bx + 4} ${BASE - t.h * 0.5} ${bx + 5} ${BASE} Z`} />;
          })}
        </g>
      ))}
    </g>
  );
}
