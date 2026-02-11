import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-lc-card rounded-2xl border border-lc-border p-6', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
