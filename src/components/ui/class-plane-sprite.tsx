'use client';

import { getPlaneAsset } from '@/lib/plane-progression';

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

export function ClassPlaneSprite({ planeKey, size = 'md', variant, className }: ClassPlaneSpriteProps) {
  const plane = getPlaneAsset(planeKey);
  const meta = plane.displayMeta;
  const scale = variant === 'parked' ? meta.parkedScale : variant === 'flying' ? meta.flyingScale : 1;
  const yOffset = variant === 'parked' ? meta.runwayYOffset : variant === 'flying' ? meta.transitionYOffset : 0;
  const transformStyle = (scale !== 1 || yOffset !== 0) ? {
    transform: `scale(${scale}) translateY(${-yOffset}px)`,
    transformOrigin: variant === 'parked' ? 'center bottom' : 'center center',
  } : undefined;
  const heightPx = SIZE_PX[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={plane.webp}
      alt=""
      width={heightPx * 2}
      height={heightPx}
      draggable={false}
      style={transformStyle}
      className={`${SIZE_CLASS[size]} w-auto select-none${className ? ` ${className}` : ''}`}
    />
  );
}
