'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';

interface TakeoffSparkProps {
  size?: number;
  className?: string;
  loading?: boolean;
  label?: string;
}

const L_PATH =
  'M219.446 106.025C181.592 152.266 185.378 164.679 185.378 200.255V219.212L185.431 247.015V393.448H313.45H425.749C425.749 483.255 396.728 484.274 259.254 487.058L92.0049 487.058L92.0538 247.015L92 219.212L92.0049 200.255C92.2726 143.132 123.314 101.932 187.012 71.6172C235.218 43.9858 337.128 31.308 345.625 43.9858C345.625 43.9858 257.3 59.7832 219.446 106.025ZM145 200.255V219.212V434.056H298.939C387.895 434.056 397.477 422.127 396.831 424.571C390.991 446.694 342.471 446.694 313.45 446.694H132.382V219.212V200.255C132.382 161.672 144.189 138.51 172.024 114.208C199.858 90.4074 207.987 87.7665 209.983 90.2271C183.485 114.208 145 133.828 145 200.255Z';

const ARROW_PATH =
  'M378.339 31.7291C384.723 36.9837 386.6 37.6205 400.118 38.7351C418.208 40.2693 427.849 41.8789 429.104 43.512C427.849 45.1451 418.208 46.7547 400.118 48.2889C386.6 49.4035 384.723 50.0404 378.339 55.2949C374.584 58.4794 369.804 61.0239 367.551 61.0239C363.42 61.0239 363.132 60.8679 365.948 55.2949C365.948 55.2949 368.764 49.2442 368.764 48.9257C368.764 48.6073 364.07 48.2889 358.438 48.2889C348.3 48.2889 348.112 48.2888 348.112 43.512C348.112 38.7352 348.3 38.7351 358.438 38.7351C364.07 38.7351 368.764 38.4167 368.764 38.0983C368.764 37.7798 365.948 31.7291 365.948 31.7291C363.132 26.1561 363.42 26.0001 367.551 26.0001C369.804 26.0001 374.584 28.5446 378.339 31.7291Z';

const TRAIL_PATH =
  'M96 486L96 247L96 200C96 144 126 103 187 72C234 48 292 39 346 44';

function MarkPaths() {
  return (
    <>
      <path fillRule="evenodd" clipRule="evenodd" d={L_PATH} fill="#4DA3FF" />
      <path d={ARROW_PATH} fill="#4DA3FF" />
    </>
  );
}

export function TakeoffSpark({ size = 40, className, loading = false, label }: TakeoffSparkProps) {
  const prefersReducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '');

  const glowId = `ts-glow-${uid}`;
  const trailGradId = `ts-trail-${uid}`;
  const sparkGradId = `ts-spark-${uid}`;

  const ariaProps = label
    ? ({ 'aria-label': label, role: 'img' } as const)
    : ({ 'aria-hidden': true } as const);

  const sharedDefs = (
    <defs>
      <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={trailGradId} x1="96" y1="486" x2="346" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4DA3FF" stopOpacity="0" />
        <stop offset="0.72" stopColor="#8FE8FF" />
        <stop offset="1" stopColor="#4DA3FF" />
      </linearGradient>
      <radialGradient
        id={sparkGradId}
        cx="0" cy="0" r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(388 44) rotate(90) scale(44)"
      >
        <stop stopColor="#B9F3FF" stopOpacity="0.9" />
        <stop offset="1" stopColor="#4DA3FF" stopOpacity="0" />
      </radialGradient>
    </defs>
  );

  // Reduced motion → static mark, no animation
  if (prefersReducedMotion) {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...ariaProps}>
        {sharedDefs}
        <g filter={`url(#${glowId})`}>
          <MarkPaths />
        </g>
      </svg>
    );
  }

  // Loading → static mark with gentle opacity pulse (no trail/spark replay)
  if (loading) {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...ariaProps}>
        {sharedDefs}
        <motion.g
          filter={`url(#${glowId})`}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MarkPaths />
        </motion.g>
      </svg>
    );
  }

  // Default → one-shot takeoff sequence: trail draws, spark bursts, mark resolves
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...ariaProps}>
      {sharedDefs}

      {/* Trail: draws along the lesson route then fades */}
      <motion.path
        d={TRAIL_PATH}
        stroke={`url(#${trailGradId})`}
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1],
          opacity: [0, 0.6, 0.3, 0],
        }}
        transition={{
          pathLength: { duration: 1.1, times: [0, 0.69, 1], ease: 'easeOut' },
          opacity: { duration: 1.5, times: [0, 0.18, 0.7, 1], ease: 'linear' },
        }}
      />

      {/* Spark: bursts at the plane position then expands away */}
      <motion.circle
        cx={388}
        cy={44}
        r={44}
        fill={`url(#${sparkGradId})`}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.0, 1.6], opacity: [0, 0.85, 0] }}
        transition={{ times: [0, 0.45, 1], duration: 0.65, delay: 0.65, ease: 'easeOut' }}
      />

      {/* Mark: resolves and stays static */}
      <motion.g
        filter={`url(#${glowId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.35, ease: 'easeOut' }}
      >
        <MarkPaths />
      </motion.g>
    </svg>
  );
}
