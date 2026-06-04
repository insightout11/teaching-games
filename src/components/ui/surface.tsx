import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type SurfaceVariant = 'card' | 'panel' | 'glass';
type SurfaceDensity = 'comfortable' | 'compact';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  density?: SurfaceDensity;
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant = 'card', density = 'comfortable', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        {
          // `card` matches the existing Card component baseline.
          'bg-lc-card rounded-2xl border border-lc-border p-6':
            variant === 'card' && density === 'comfortable',
          'bg-lc-card rounded-xl border border-lc-border p-4':
            variant === 'card' && density === 'compact',
          // `panel` and `glass` reuse the existing global CSS classes.
          'panel-card': variant === 'panel',
          'glass rounded-2xl': variant === 'glass',
        },
        className
      )}
      {...props}
    />
  )
);

Surface.displayName = 'Surface';
