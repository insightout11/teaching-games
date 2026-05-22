'use client';

import { getPlaneAsset } from '@/lib/plane-progression';

interface ClassPlaneSpriteProps {
  planeKey?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<ClassPlaneSpriteProps['size']>, string> = {
  sm: 'h-14',
  md: 'h-20',
  lg: 'h-28',
  xl: 'h-44',
};

export function ClassPlaneSprite({ planeKey, size = 'md', className }: ClassPlaneSpriteProps) {
  const plane = getPlaneAsset(planeKey);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={plane.webp}
      alt=""
      draggable={false}
      className={`${SIZE_CLASS[size]} w-auto select-none${className ? ` ${className}` : ''}`}
    />
  );
}
