'use client';

import { motion } from 'framer-motion';
import { ClassPlaneSprite } from '@/components/ui/class-plane-sprite';
import { getPlaneAsset, getPlaneViewAsset } from '@/lib/plane-progression';

interface RunwayPlaneSceneProps {
  planeKey?: string | null;
  planeSize?: 'sm' | 'md' | 'lg' | 'xl';
  showRunway?: boolean;
  // Front-facing view (faces the camera, for forward-facing runway scenes).
  frontFacing?: boolean;
  frontVariant?: 'headon' | '3q';
  className?: string;
}

const FRONT_H: Record<NonNullable<RunwayPlaneSceneProps['planeSize']>, number> = {
  sm: 96, md: 140, lg: 180, xl: 232,
};

export function RunwayPlaneScene({ planeKey, planeSize = 'md', showRunway = true, frontFacing = false, frontVariant = '3q', className }: RunwayPlaneSceneProps) {
  const plane = getPlaneAsset(planeKey);
  const frontSrc = getPlaneViewAsset(planeKey, frontVariant === 'headon' ? 'front' : 'front-3q');
  const frontTransform = frontFacing && plane.displayMeta.runwayYOffset !== 0
    ? { transform: `translateY(${-plane.displayMeta.runwayYOffset}px)` }
    : undefined;

  return (
    <div className={`relative inline-flex flex-col items-center ${className ?? ''}`}>
      {showRunway && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: '260px',
            height: '64px',
            background: 'radial-gradient(ellipse at 50% 100%, rgba(190,90,18,0.32) 0%, transparent 72%)',
          }}
        />
      )}

      {/* Plane — subtle engine-idle vibration */}
      <motion.div
        animate={{ y: [0, -1.5, 0], rotate: frontFacing ? [0, 0, 0] : [0, 0.25, 0, -0.25, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {frontFacing ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frontSrc}
            alt=""
            draggable={false}
            style={{ height: FRONT_H[planeSize], width: 'auto', ...frontTransform }}
            className="select-none w-auto"
          />
        ) : (
          <ClassPlaneSprite planeKey={planeKey} size={planeSize} variant="parked" />
        )}
      </motion.div>

      {showRunway && (
        <>
          {/* Runway surface */}
          <div
            className="relative mt-0.5 rounded-sm overflow-hidden"
            style={{ width: '220px', height: '10px', background: 'rgba(18,26,16,0.92)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center gap-2.5 px-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-px"
                  style={{ background: 'rgba(205,170,55,0.45)' }}
                />
              ))}
            </div>
          </div>

          {/* Runway edge lights — staggered amber pulse */}
          <div className="absolute bottom-1.5 flex gap-[196px]">
            {[0, 1].map((side) => (
              <motion.div
                key={side}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'rgba(255,162,38,0.92)',
                  boxShadow: '0 0 5px 2px rgba(255,138,18,0.5)',
                }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{
                  duration: 1.9,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: side * 0.55,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
