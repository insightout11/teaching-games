'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type WeatherState = 'idle' | 'climbing' | 'cruising' | 'golden' | 'landing';

interface SkyBackgroundProps {
  weatherState?: WeatherState;
  currentSlotIndex?: number;
  intensity?: 'subtle' | 'moderate';
  className?: string;
}

// ─── Weather config ─────────────────────────────────────────────────────────

const WEATHER: Record<WeatherState, {
  skyTop: string;
  skyBottom: string;
  horizonGlow: string;
  cloudFill: string;      // solid fill color, no alpha — opacity handled by motion.div
  opacityFar: number;
  opacityMid: number;
  opacityNear: number;
}> = {
  idle: {
    skyTop: '#070B14',
    skyBottom: '#0A1223',
    horizonGlow: 'rgba(77,163,255,0.03)',
    cloudFill: 'rgb(180,210,255)',
    opacityFar: 0.045,
    opacityMid: 0.065,
    opacityNear: 0.085,
  },
  climbing: {
    skyTop: '#08101C',
    skyBottom: '#0C1632',
    horizonGlow: 'rgba(77,163,255,0.05)',
    cloudFill: 'rgb(200,225,255)',
    opacityFar: 0.05,
    opacityMid: 0.075,
    opacityNear: 0.095,
  },
  cruising: {
    skyTop: '#060A16',
    skyBottom: '#08122A',
    horizonGlow: 'rgba(100,175,255,0.06)',
    cloudFill: 'rgb(215,235,255)',
    opacityFar: 0.055,
    opacityMid: 0.08,
    opacityNear: 0.11,
  },
  golden: {
    skyTop: '#080A14',
    skyBottom: '#12101E',
    horizonGlow: 'rgba(200,140,60,0.07)',
    cloudFill: 'rgb(240,225,195)',
    opacityFar: 0.055,
    opacityMid: 0.08,
    opacityNear: 0.105,
  },
  landing: {
    skyTop: '#0A0812',
    skyBottom: '#160E16',
    horizonGlow: 'rgba(220,140,50,0.10)',
    cloudFill: 'rgb(255,220,160)',
    opacityFar: 0.065,
    opacityMid: 0.09,
    opacityNear: 0.12,
  },
};

// ─── Cloud shape definitions ─────────────────────────────────────────────────
// Each cloud: circles fed to a Gaussian-blurred SVG group.
// Classic cumulus silhouette: wider ellipse base, bumpy circles on top.

type CloudCircle = { cx: number; cy: number; r: number };

function CloudShape({
  circles,
  blur,
  fill,
  filterId,
}: {
  circles: CloudCircle[];
  blur: number;
  fill: string;
  filterId: string;
}) {
  const viewW = Math.ceil(circles.reduce((m, c) => Math.max(m, c.cx + c.r), 0)) + 30;
  const viewH = Math.ceil(circles.reduce((m, c) => Math.max(m, c.cy + c.r), 0)) + 30;
  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={viewW}
      height={viewH}
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={fill} />
        ))}
      </g>
    </svg>
  );
}

// ─── Cloud data — three parallax layers ─────────────────────────────────────
// X positions in vw units spread across 300vw so clouds are visible everywhere
// during the drift loop. Layer divs are 300vw wide for seamless looping.

const FAR_CLOUDS = [
  { id: 'fc1', xVw: 5,  yPx: 28, blur: 9,
    circles: [{ cx:60,cy:32,r:28 },{ cx:95,cy:26,r:22 },{ cx:125,cy:30,r:18 },{ cx:45,cy:36,r:20 },{ cx:150,cy:34,r:16 }] },
  { id: 'fc2', xVw: 38, yPx: 12, blur: 8,
    circles: [{ cx:40,cy:22,r:20 },{ cx:68,cy:16,r:24 },{ cx:98,cy:20,r:18 },{ cx:120,cy:24,r:14 }] },
  { id: 'fc3', xVw: 68, yPx: 40, blur: 10,
    circles: [{ cx:50,cy:30,r:26 },{ cx:82,cy:22,r:20 },{ cx:110,cy:28,r:16 },{ cx:30,cy:34,r:18 },{ cx:135,cy:32,r:13 }] },
  { id: 'fc4', xVw: 88, yPx: 18, blur: 8,
    circles: [{ cx:35,cy:20,r:18 },{ cx:60,cy:14,r:22 },{ cx:88,cy:18,r:16 }] },
];

const MID_CLOUDS = [
  { id: 'mc1', xVw: 2,  yPx: 55, blur: 13,
    circles: [{ cx:80,cy:60,r:50 },{ cx:130,cy:45,r:58 },{ cx:185,cy:55,r:46 },{ cx:50,cy:68,r:40 },{ cx:220,cy:62,r:36 },{ cx:240,cy:58,r:30 }] },
  { id: 'mc2', xVw: 35, yPx: 30, blur: 12,
    circles: [{ cx:65,cy:50,r:44 },{ cx:115,cy:38,r:52 },{ cx:162,cy:46,r:40 },{ cx:40,cy:58,r:34 },{ cx:190,cy:52,r:32 }] },
  { id: 'mc3', xVw: 62, yPx: 65, blur: 14,
    circles: [{ cx:90,cy:65,r:55 },{ cx:148,cy:50,r:62 },{ cx:205,cy:60,r:48 },{ cx:55,cy:74,r:42 },{ cx:235,cy:66,r:38 }] },
  { id: 'mc4', xVw: 82, yPx: 42, blur: 11,
    circles: [{ cx:55,cy:44,r:38 },{ cx:98,cy:32,r:46 },{ cx:145,cy:40,r:36 },{ cx:34,cy:52,r:28 },{ cx:170,cy:46,r:28 }] },
];

const NEAR_CLOUDS = [
  { id: 'nc1', xVw: 8,  yPx: 80, blur: 18,
    circles: [{ cx:110,cy:85,r:72 },{ cx:185,cy:65,r:82 },{ cx:260,cy:78,r:64 },{ cx:70,cy:96,r:55 },{ cx:310,cy:88,r:52 },{ cx:340,cy:82,r:42 }] },
  { id: 'nc2', xVw: 42, yPx: 50, blur: 16,
    circles: [{ cx:95,cy:70,r:65 },{ cx:165,cy:52,r:76 },{ cx:238,cy:64,r:58 },{ cx:58,cy:80,r:48 },{ cx:275,cy:72,r:46 }] },
  { id: 'nc3', xVw: 74, yPx: 90, blur: 20,
    circles: [{ cx:120,cy:90,r:78 },{ cx:200,cy:70,r:88 },{ cx:282,cy:82,r:68 },{ cx:75,cy:102,r:60 },{ cx:330,cy:94,r:56 }] },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function SkyBackground({
  weatherState = 'idle',
  currentSlotIndex,
  intensity = 'moderate',
  className,
}: SkyBackgroundProps) {
  const config = WEATHER[weatherState];
  const mult = intensity === 'subtle' ? 0.6 : 1;

  // Transition burst: fires when the slot index advances
  const prevSlotRef = useRef(currentSlotIndex);
  const [transitioning, setTransitioning] = useState(false);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentSlotIndex === undefined) return;
    if (prevSlotRef.current !== undefined && prevSlotRef.current !== currentSlotIndex) {
      setTransitioning(true);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      burstTimerRef.current = setTimeout(() => setTransitioning(false), 5000);
    }
    prevSlotRef.current = currentSlotIndex;
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, [currentSlotIndex]);

  const burstDurations: React.CSSProperties = transitioning
    ? { '--cloud-duration-far': '52s', '--cloud-duration-mid': '34s', '--cloud-duration-near': '22s' } as React.CSSProperties
    : {};

  // opacity values for each layer — doubled during transition burst
  const opFar  = config.opacityFar  * mult * (transitioning ? 2 : 1);
  const opMid  = config.opacityMid  * mult * (transitioning ? 2 : 1);
  const opNear = config.opacityNear * mult * (transitioning ? 2 : 1);
  const opTransDuration = transitioning ? 0.6 : 3.5;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 0, ...burstDurations }}
      aria-hidden
    >
      {/* Sky gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(180deg, ${config.skyTop} 0%, ${config.skyBottom} 100%)` }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{ zIndex: 0 }}
      />

      {/* Horizon warmth glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '35%', zIndex: 1 }}
        animate={{ background: `radial-gradient(ellipse 90% 50% at 50% 100%, ${config.horizonGlow} 0%, transparent 100%)` }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />

      {/* Far layer — farthest, slowest, smallest */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <div className="cloud-layer-far absolute top-0 left-0" style={{ width: '300vw' }}>
          {FAR_CLOUDS.map((cloud) => (
            <motion.div
              key={cloud.id}
              className="absolute"
              style={{ left: `${cloud.xVw}vw`, top: cloud.yPx }}
              animate={{ opacity: opFar }}
              transition={{ duration: opTransDuration, ease: 'easeInOut' }}
            >
              <CloudShape
                circles={cloud.circles}
                blur={cloud.blur}
                fill={config.cloudFill}
                filterId={`sky-${cloud.id}`}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mid layer */}
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
        <div className="cloud-layer-mid absolute top-0 left-0" style={{ width: '300vw' }}>
          {MID_CLOUDS.map((cloud) => (
            <motion.div
              key={cloud.id}
              className="absolute"
              style={{ left: `${cloud.xVw}vw`, top: cloud.yPx }}
              animate={{ opacity: opMid }}
              transition={{ duration: opTransDuration, ease: 'easeInOut' }}
            >
              <CloudShape
                circles={cloud.circles}
                blur={cloud.blur}
                fill={config.cloudFill}
                filterId={`sky-${cloud.id}`}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Near layer — closest, fastest, largest */}
      <div className="absolute inset-0" style={{ zIndex: 4 }}>
        <div className="cloud-layer-near absolute top-0 left-0" style={{ width: '300vw' }}>
          {NEAR_CLOUDS.map((cloud) => (
            <motion.div
              key={cloud.id}
              className="absolute"
              style={{ left: `${cloud.xVw}vw`, top: cloud.yPx }}
              animate={{ opacity: opNear }}
              transition={{ duration: opTransDuration, ease: 'easeInOut' }}
            >
              <CloudShape
                circles={cloud.circles}
                blur={cloud.blur}
                fill={config.cloudFill}
                filterId={`sky-${cloud.id}`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
