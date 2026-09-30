import { CrewCharacter } from '@/components/ui/crew-character';
import { SHIRT_COLORS, type CrewLook } from '@/lib/crew-look';

/**
 * Full-body crew member for walk-ups (boarding): the sticker head-and-shoulders
 * on top of stepping legs. `walking` swings the legs; box is 100×150.
 */
export function CrewWalker({ look, height = 60, walking = true, className }: { look: CrewLook; height?: number; walking?: boolean; className?: string }) {
  const shirt = SHIRT_COLORS[look.shirt] ?? SHIRT_COLORS[0];
  return (
    <svg viewBox="0 0 100 150" height={height} width={(height * 100) / 150} className={className} aria-hidden overflow="visible">
      <style>{`
        @keyframes lcStepA { 0%,100% { transform: rotate(18deg) } 50% { transform: rotate(-18deg) } }
        @keyframes lcStepB { 0%,100% { transform: rotate(-18deg) } 50% { transform: rotate(18deg) } }
        @keyframes lcBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @media (prefers-reduced-motion: reduce) { .lc-leg, .lc-bob { animation: none !important } }
      `}</style>
      {/* legs (white sticker outline, then trousers + shoes) */}
      <g>
        {[{ x: 38, anim: 'lcStepA' }, { x: 62, anim: 'lcStepB' }].map((leg) => (
          <g
            key={leg.x}
            className="lc-leg"
            style={{ transformOrigin: `${leg.x}px 98px`, transformBox: 'view-box', animation: walking ? `${leg.anim} .5s ease-in-out infinite` : undefined }}
          >
            <rect x={leg.x - 9} y={92} width={18} height={50} rx={9} fill="#fff" />
            <rect x={leg.x - 6} y={94} width={12} height={40} rx={6} fill="#1b2233" />
            <ellipse cx={leg.x + 2} cy={140} rx={10} ry={6} fill="#fff" />
            <ellipse cx={leg.x + 2} cy={139} rx={8} ry={4.5} fill="#0B1220" />
          </g>
        ))}
      </g>
      {/* body: the bust, bobbing as it walks */}
      <g className="lc-bob" style={{ animation: walking ? 'lcBob .5s ease-in-out infinite' : undefined }}>
        <rect x="24" y="88" width="52" height="14" rx="7" fill={shirt} />
        <svg x="0" y="0" width="100" height="100" viewBox="0 0 100 100" overflow="visible">
          <CrewCharacter look={look} size={100} />
        </svg>
      </g>
    </svg>
  );
}
