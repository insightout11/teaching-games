'use client';

import { getPlaneAsset, getPlaneViewAsset } from '@/lib/plane-progression';

interface ClassPlaneSpriteProps {
  planeKey?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'parked' | 'flying';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<ClassPlaneSpriteProps['size']>, string> = {
  sm: 'h-14',
  md: 'h-20',
  lg: 'h-28',
  xl: 'h-44',
};

const SIZE_PX: Record<NonNullable<ClassPlaneSpriteProps['size']>, number> = {
  sm: 56, md: 80, lg: 112, xl: 176,
};

/** Height of PlaneLayer's SVG image box, the space runwayYOffset is authored in. */
const PLANE_BOX_H = 240;

export function ClassPlaneSprite({ planeKey, size = 'md', variant, className }: ClassPlaneSpriteProps) {
  const plane = getPlaneAsset(planeKey);
  const src = variant === 'parked' ? getPlaneViewAsset(planeKey, 'ground') : plane.webp;
  const meta = plane.displayMeta;
  const scale = variant === 'parked' ? meta.parkedScale : variant === 'flying' ? meta.flyingScale : 1;
  const heightPx = SIZE_PX[size];
  const rawOffset = variant === 'parked' ? meta.runwayYOffset : variant === 'flying' ? meta.transitionYOffset : 0;
  // These offsets are authored in PlaneLayer's 480x240 SVG box, where the art
  // renders far larger than it does here. Applied as raw CSS pixels they would
  // fling a 56px sprite around by up to 50px, so scale them into this sprite's
  // space. (Only 3 planes were calibrated before, which is why this never bit.)
  const yOffset = (rawOffset * heightPx) / PLANE_BOX_H;
  const transformStyle = (scale !== 1 || yOffset !== 0) ? {
    transform: `scale(${scale}) translateY(${-yOffset}px)`,
    transformOrigin: variant === 'parked' ? 'center bottom' : 'center center',
  } : undefined;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={heightPx * 2}
      height={heightPx}
      draggable={false}
      style={transformStyle}
      className={`${SIZE_CLASS[size]} w-auto select-none${className ? ` ${className}` : ''}`}
    />
  );
}
