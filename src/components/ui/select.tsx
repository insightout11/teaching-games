import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  inputSize?: 'sm' | 'md' | 'lg' | 'compact';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, inputSize = 'md', children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full bg-lc-surface border border-lc-border rounded-xl text-lc-text transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        {
          'px-3 py-1.5 text-sm': inputSize === 'sm',
          'px-4 py-2.5 text-sm': inputSize === 'md',
          'px-4 py-3 text-base': inputSize === 'lg',
          'px-3 py-2 text-sm rounded-lg': inputSize === 'compact',
        },
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = 'Select';
