import { motion } from 'framer-motion';
import { CONTENT_W, LAYOUT, type SceneLayerProps } from '../types';
import { normalizeVegetation } from '../scene-registry';
import { randRange } from '../seed';

// Trees along the grassy field edge, between the city and the runway band.
// Variants; 'none' renders nothing. Positions are deterministic per city.
export function VegetationLayer({ scene, palette, rand, ambient }: SceneLayerProps) {
  const veg = normalizeVegetation(scene.vegetation);
  if (veg === 'none') return null;

  const baseY = LAYOUT.apronY + 64; // on the grass strip, in front of the city

  // Scatter trees, avoiding the centre where the plane lands/taxis.
  const slots: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    const x = randRange(rand, 30, CONTENT_W - 30);
    if (x > CONTENT_W * 0.34 && x < CONTENT_W * 0.74) continue; // keep runway centre clear
    slots.push(x);
  }

  // Coconut palm — a tapering, slightly bent trunk with segment rings + coconuts
  // and a full crown of arched, drooping fronds (filled leaf shapes). Sways
  // gently in the breeze (ambient only). cx0/cy0 = crown at the top of the trunk.
  const palm = (k: number, x: number, s: number) => {
    const bark = palette.trunk;
    const leaf = palette.foliage;
    const cx0 = -13;
    const cy0 = -118;
    // [endX, endY, archHeight, halfWidth] relative to the crown.
    const fronds: Array<[number, number, number, number]> = [
      [-80, 20, 30, 9], [-66, -16, 26, 9], [-40, -42, 22, 8], [-6, -54, 18, 8],
      [32, -44, 22, 8], [60, -18, 26, 9], [78, 18, 30, 9], [-30, 34, 24, 8], [46, 34, 24, 8],
    ];
    const frond = ([ex, ey, arch, w]: [number, number, number, number], i: number) => {
      const tx = cx0 + ex;
      const ty = cy0 + ey;
      const mx = cx0 + ex * 0.5;
      const my = cy0 + ey * 0.5 - arch;
      const dx = tx - cx0;
      const dy = ty - cy0;
      const len = Math.hypot(dx, dy) || 1;
      const ux = (-dy / len) * w;
      const uy = (dx / len) * w;
      return <path key={i} d={`M ${cx0} ${cy0} Q ${mx + ux} ${my + uy} ${tx} ${ty} Q ${mx - ux} ${my - uy} ${cx0} ${cy0} Z`} fill={leaf} />;
    };
    const tree = (
      <g>
        {/* tapering, slightly bent trunk */}
        <path d={`M -6 0 Q -10 -62 ${cx0 - 3.5} ${cy0} L ${cx0 + 3.5} ${cy0} Q 0 -62 6 0 Z`} fill={bark} />
        {[-18, -40, -62, -84, -104].map((yy, i) => (
          <line key={i} x1={-5 - i * 1.4} y1={yy} x2={5 - i * 1.4} y2={yy} stroke="rgba(0,0,0,0.18)" strokeWidth={1.4} />
        ))}
        {/* coconuts at the crown */}
        {[[-20, -110], [-8, -113], [-15, -106]].map(([cxx, cyy], i) => (
          <circle key={i} cx={cxx} cy={cyy} r={3.4} fill={bark} />
        ))}
        {/* fronds + crown */}
        {fronds.map(frond)}
        <circle cx={cx0} cy={cy0} r={4} fill={leaf} />
      </g>
    );
    return (
      <g key={k} transform={`translate(${x} ${baseY}) scale(${s})`}>
        {ambient ? (
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            animate={{ rotate: [-1.8, 1.8, -1.8] }}
            transition={{ duration: 4.8 + (k % 3) * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            {tree}
          </motion.g>
        ) : (
          tree
        )}
      </g>
    );
  };

  // Conifer — four stacked, overlapping tiers (lit left / shadow right) tapering
  // to a tip. Sways gently in the breeze (ambient only).
  const pine = (k: number, x: number, s: number) => {
    const bark = palette.trunk;
    const leaf = palette.foliage;
    const dark = 'rgba(0,0,0,0.18)';
    // [bottomY, halfWidth, topY]
    const tiers: Array<[number, number, number]> = [
      [-22, 38, -64], [-50, 30, -90], [-76, 22, -114], [-98, 14, -134],
    ];
    const tree = (
      <g>
        <rect x={-3.5} y={-26} width={7} height={26} fill={bark} />
        {tiers.map(([by, hw, ty], i) => (
          <g key={i}>
            <polygon points={`0,${ty} ${-hw},${by} ${hw},${by}`} fill={leaf} />
            <polygon points={`0,${ty} ${hw},${by} 0,${by}`} fill={dark} />
          </g>
        ))}
      </g>
    );
    return (
      <g key={k} transform={`translate(${x} ${baseY}) scale(${s})`}>
        {ambient ? (
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            animate={{ rotate: [-1.3, 1.3, -1.3] }}
            transition={{ duration: 5.2 + (k % 3) * 0.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {tree}
          </motion.g>
        ) : (
          tree
        )}
      </g>
    );
  };

  // Broadleaf — a tapering trunk with two branches under a full lobed canopy
  // (top-lit, shaded underside). Sways gently in the breeze (ambient only).
  const broadleaf = (k: number, x: number, s: number) => {
    const bark = palette.trunk;
    const leaf = palette.foliage;
    const dark = 'rgba(0,0,0,0.16)';
    const lit = 'rgba(255,255,255,0.07)';
    // [cx, cy, r]
    const lobes: Array<[number, number, number]> = [
      [0, -78, 36], [-26, -66, 24], [26, -66, 24], [-14, -94, 24], [16, -92, 23], [0, -106, 20],
    ];
    const tree = (
      <g>
        {/* trunk + branches */}
        <path d="M -5 0 Q -6 -34 -3 -58 L 3 -58 Q 6 -34 5 0 Z" fill={bark} />
        <path d="M -2 -44 Q -14 -56 -22 -70" fill="none" stroke={bark} strokeWidth={4} strokeLinecap="round" />
        <path d="M 2 -40 Q 14 -54 22 -66" fill="none" stroke={bark} strokeWidth={4} strokeLinecap="round" />
        {/* canopy */}
        {lobes.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={leaf} />
        ))}
        {/* shaded underside + top highlight */}
        <circle cx={18} cy={-58} r={20} fill={dark} />
        <circle cx={-6} cy={-58} r={16} fill={dark} />
        <circle cx={-10} cy={-98} r={14} fill={lit} />
        <circle cx={6} cy={-92} r={12} fill={lit} />
      </g>
    );
    return (
      <g key={k} transform={`translate(${x} ${baseY}) scale(${s})`}>
        {ambient ? (
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4.6 + (k % 3) * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            {tree}
          </motion.g>
        ) : (
          tree
        )}
      </g>
    );
  };

  // Cherry blossom — pink canopy clusters on a slim branched trunk. Sways slowly
  // back and forth, pivoting at the trunk base. The sway is AMBIENT only (a still
  // tree when motion is static / reduced-motion).
  const sakura = (k: number, x: number, s: number) => {
    const light = 'rgba(250,206,222,0.96)';
    const mid = 'rgba(238,166,196,0.96)';
    const tree = (
      <g>
        {/* trunk + a couple of branches */}
        <path d="M 0 0 C -2 -22 -2 -38 -5 -52" fill="none" stroke={palette.trunk} strokeWidth={6} strokeLinecap="round" />
        <path d="M -4 -38 C -14 -46 -20 -52 -27 -62" fill="none" stroke={palette.trunk} strokeWidth={4} strokeLinecap="round" />
        <path d="M -3 -32 C 8 -40 16 -46 23 -56" fill="none" stroke={palette.trunk} strokeWidth={4} strokeLinecap="round" />
        {/* blossom canopy */}
        <circle cx={-22} cy={-70} r={19} fill={mid} />
        <circle cx={24} cy={-68} r={19} fill={mid} />
        <circle cx={2} cy={-84} r={25} fill={light} />
        <circle cx={-4} cy={-64} r={17} fill={light} />
        <circle cx={14} cy={-58} r={14} fill={mid} />
        {/* a few deeper petal flecks */}
        {[[-14, -78], [10, -72], [-2, -90], [20, -78]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={3} fill="rgba(226,138,176,0.9)" />
        ))}
      </g>
    );
    return (
      <g key={k} transform={`translate(${x} ${baseY}) scale(${s})`}>
        {ambient ? (
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            animate={{ rotate: [-2.4, 2.4, -2.4] }}
            transition={{ duration: 5.4 + (k % 4) * 0.9, repeat: Infinity, ease: 'easeInOut' }}
          >
            {tree}
          </motion.g>
        ) : (
          tree
        )}
      </g>
    );
  };

  const draw =
    veg === 'palms' ? palm : veg === 'pines' ? pine : veg === 'sakura' ? sakura : broadleaf;

  return (
    <g aria-hidden>
      {slots.map((x, i) => draw(i, x, randRange(rand, 0.7, 1.15)))}
    </g>
  );
}
