import { motion } from 'framer-motion';
import { LC_L_MARK } from '../lc-brand';

// LessonCaptain yacht — drawn around a local origin (0,0 = waterline centre),
// bow to the right. The caller places + sizes it with translate/scale onto the
// foreground water band (so it sits in the same layer as the bay, in front of
// the city and behind the runway tarmac). LC-blue hull + white superstructure,
// an LC roundel on the hull, an LC pennant, warm cabin lights, a wake + faint
// reflection on the water, and a gentle bob when ambient.
export function LcYacht({
  cx,
  waterY,
  scale = 1,
  ambient,
  hull = 'rgb(33,108,184)',
  deck = 'rgb(234,242,251)',
  warm = 'rgba(255,206,120,0.95)',
  isNight = false,
}: {
  cx: number;
  waterY: number;
  scale?: number;
  ambient: boolean;
  hull?: string;
  deck?: string;
  warm?: string;
  isNight?: boolean;
}) {
  const win = 'rgba(150,205,255,0.9)';
  const body = (
    <g>
      {/* hull */}
      <path d="M -50 -14 L 34 -14 L 58 -4 L 50 6 L -50 6 Z" fill={hull} />
      {/* white waterline stripe */}
      <rect x={-50} y={1} width={108} height={2.5} fill={deck} opacity={0.9} />
      {/* LC roundel on the hull */}
      <circle cx={-26} cy={-4} r={8} fill={deck} />
      <g transform="translate(-26,-4) scale(0.024) translate(-259,-259)">
        <path d={LC_L_MARK} fill={hull} />
      </g>
      {/* superstructure (white, raked windshield) + bridge */}
      <path d="M -34 -14 L 12 -14 L 4 -32 L -30 -32 Z" fill={deck} />
      <rect x={-28} y={-42} width={24} height={10} rx={2} fill={deck} />
      {/* window strips */}
      <rect x={-28} y={-26} width={34} height={4.5} fill={win} />
      <rect x={-26} y={-39} width={18} height={3.5} fill={win} />
      {/* warm deck lights */}
      <circle cx={24} cy={-15} r={1.8} fill={warm} />
      <circle cx={-40} cy={-15} r={1.8} fill={warm} />
      {/* mast + LC pennant + nav light */}
      <rect x={-18} y={-62} width={2.2} height={20} fill={deck} />
      <polygon points="-15.8 -62, 2 -57, -15.8 -52" fill={hull} />
      <circle cx={-17} cy={-63} r={1.8} fill={warm} />
    </g>
  );

  return (
    <g transform={`translate(${cx} ${waterY}) scale(${scale})`} aria-hidden>
      {/* wake trailing astern + a bow ripple */}
      <ellipse cx={-2} cy={9} rx={74} ry={7} fill={isNight ? 'rgba(150,210,255,0.12)' : 'rgba(255,255,255,0.16)'} />
      {[[-60, 5], [-44, 4], [62, 4]].map(([wx, wl], i) => (
        <path key={i} d={`M ${wx} ${7 + i} q 8 ${wl} 16 0`} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      ))}
      {/* faint reflection on the water */}
      {[[-26, 14], [-6, 11], [16, 15], [34, 9]].map(([rx, rh], i) => (
        <rect key={`r${i}`} x={rx} y={6} width={3} height={rh} fill={hull} opacity={0.14} />
      ))}
      {ambient ? (
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={{ y: [0, -2.4, 0], rotate: [-0.7, 0.7, -0.7] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {body}
        </motion.g>
      ) : (
        body
      )}
    </g>
  );
}
