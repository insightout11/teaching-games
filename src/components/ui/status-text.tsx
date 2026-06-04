import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusTextProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: StatusTone;
}

const TONE_TEXT: Record<StatusTone, string> = {
  neutral: 'text-lc-text3',
  success: 'text-lc-success',
  warning: 'text-lc-warn',
  danger:  'text-lc-danger',
  info:    'text-lc-info',
};

export const StatusText = forwardRef<HTMLParagraphElement, StatusTextProps>(
  ({ className, tone = 'neutral', ...props }, ref) => (
    <p ref={ref} className={cn('text-sm', TONE_TEXT[tone], className)} {...props} />
  )
);

StatusText.displayName = 'StatusText';
