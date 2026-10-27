import type { ScenePalette } from '../types';
import { VIEWBOX } from '../types';

// Drifting mist (Oct 2026, dreamy and atmospheric): a few long, soft wisps in the haze bands between the far hills and
// the city, sliding slowly sideways. Tinted by the scene's horizon colour so it belongs to the light of the moment.
// When `moving` is false (still frames, reduced motion) the wisps simply stay where they are.

/** How thick the mist is by time of day (Matt, 27 Oct 2026): stronger at dawn and dusk, lighter by day. */
export const MIST_STRENGTH: Record<string, number> = { dawn: 1.7, dusk: 1.6, night: 1.1, day: 0.75 };

export function MistLayer({ palette, rand, idPrefix, moving, band, strength = 1 }: { palette: ScenePalette; rand: () => number; idPrefix: string; moving: boolean; band: 'far' | 'near'; strength?: number }) {
  const far = band === 'far';
  const y0 = far ? 330 : 560, y1 = far ? 520 : 640;
  const count = (far ? 5 : 3) + (strength > 1.3 ? 2 : 0);
  const wisps = Array.from({ length: count }, (_, i) => ({
    x: (i / count) * VIEWBOX.w + rand() * 300,
    y: y0 + rand() * (y1 - y0),
    w: (far ? 520 : 680) + rand() * 420,
    h: (far ? 34 : 46) + rand() * 30,
    o: Math.min(0.85, ((far ? 0.34 : 0.3) + rand() * 0.14) * strength),
    dur: (far ? 90 : 70) + rand() * 50,
    delay: -rand() * 120,
  }));
  const id = `${idPrefix}-mist-${band}`;
  return (
    <g aria-hidden>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={palette.horizonGlow} stopOpacity="1" />
          <stop offset="0.6" stopColor={palette.horizonGlow} stopOpacity="0.45" />
          <stop offset="1" stopColor={palette.horizonGlow} stopOpacity="0" />
        </radialGradient>
      </defs>
      {moving && <style>{`@keyframes lc-mist{from{transform:translateX(-700px)}to{transform:translateX(700px)}}.lc-mist{animation:lc-mist linear infinite alternate}`}</style>}
      {wisps.map((m, i) => (
        <g key={i} className={moving ? 'lc-mist' : undefined} style={moving ? { animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` } : undefined}>
          <ellipse cx={m.x} cy={m.y} rx={m.w / 2} ry={m.h / 2} fill={`url(#${id})`} opacity={m.o} />
          <ellipse cx={m.x + m.w * 0.18} cy={m.y - m.h * 0.25} rx={m.w * 0.3} ry={m.h * 0.38} fill={`url(#${id})`} opacity={m.o * 0.8} />
        </g>
      ))}
    </g>
  );
}
