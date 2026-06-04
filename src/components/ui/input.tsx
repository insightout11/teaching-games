import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'search';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // `inputSize` avoids clashing with the native numeric `size` attribute.
  inputSize?: 'sm' | 'md' | 'lg' | 'compact';
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize = 'md', variant = 'default', ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-lc-surface border border-lc-border rounded-xl text-lc-text placeholder:text-lc-text3 transition-colors disabled:opacity-50 disabled:pointer-events-none',
        {
          'px-3 py-1.5 text-sm': inputSize === 'sm',
          'px-4 py-2.5 text-sm': inputSize === 'md',
          'px-4 py-3 text-base': inputSize === 'lg',
          'px-3 py-2 text-sm rounded-lg': inputSize === 'compact',
        },
        {
          'pl-9 pr-9': variant === 'search',
        },
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
