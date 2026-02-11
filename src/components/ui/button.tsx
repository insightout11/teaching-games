import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-lc-blue text-white hover:bg-lc-blue-hover focus:ring-lc-blue-glow': variant === 'primary',
            'bg-lc-surface border border-lc-border text-lc-text2 hover:bg-lc-card focus:ring-lc-blue-glow': variant === 'secondary',
            'bg-lc-danger text-white hover:brightness-110 focus:ring-lc-blue-glow': variant === 'danger',
            'text-lc-text3 hover:bg-lc-surface hover:text-lc-text focus:ring-lc-blue-glow': variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
