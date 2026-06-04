import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type BadgeVariant = 'soft' | 'solid' | 'outline';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const TONE_SOFT: Record<BadgeTone, string> = {
  neutral: 'bg-lc-surface text-lc-text2',
  success: 'bg-lc-success/15 text-lc-success',
  warning: 'bg-lc-warn/15 text-lc-warn',
  danger:  'bg-lc-danger/15 text-lc-danger',
  info:    'bg-lc-info/15 text-lc-info',
};

const TONE_SOLID: Record<BadgeTone, string> = {
  neutral: 'bg-lc-text3 text-lc-bg',
  success: 'bg-lc-success text-lc-bg',
  warning: 'bg-lc-warn text-lc-bg',
  danger:  'bg-lc-danger text-white',
  info:    'bg-lc-info text-white',
};

const TONE_OUTLINE: Record<BadgeTone, string> = {
  neutral: 'border border-lc-border text-lc-text2',
  success: 'border border-lc-success/40 text-lc-success',
  warning: 'border border-lc-warn/40 text-lc-warn',
  danger:  'border border-lc-danger/40 text-lc-danger',
  info:    'border border-lc-info/40 text-lc-info',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = 'neutral', variant = 'soft', size = 'sm', ...props }, ref) => {
    const toneMap =
      variant === 'solid' ? TONE_SOLID : variant === 'outline' ? TONE_OUTLINE : TONE_SOFT;
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          toneMap[tone],
          {
            'px-1.5 py-0.5 text-[11px]': size === 'xs',
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-2.5 py-1 text-sm': size === 'md',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
