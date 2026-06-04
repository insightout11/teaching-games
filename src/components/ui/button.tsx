import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'game' | 'hero' | 'icon' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'compact' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const isIcon = variant === 'icon' || size === 'icon';
    const isLink = variant === 'link';

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
            'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:scale-[1.02] active:scale-95 focus:ring-lc-blue-glow': variant === 'game',
            'bg-gradient-to-b from-lc-amber to-[#e08600] text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] hover:shadow-[0_10px_30px_-6px_rgba(245,158,11,0.85)] hover:brightness-105 focus:ring-lc-amber-glow': variant === 'hero',
            'rounded-lg text-lc-text3 hover:bg-lc-surface hover:text-lc-text focus:ring-lc-blue-glow': variant === 'icon',
            'rounded-none text-lc-blue hover:text-lc-blue-hover focus:ring-lc-blue-glow': variant === 'link',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm' && !isIcon && !isLink,
            'px-4 py-2 text-sm': size === 'md' && !isIcon && !isLink,
            'px-6 py-3 text-base': size === 'lg' && !isIcon && !isLink,
            'px-4 py-2.5 text-sm': size === 'compact' && !isIcon && !isLink,
            'h-9 w-9 p-0 text-sm': isIcon,
            'p-0 text-sm': isLink && size !== 'lg' && !isIcon,
            'p-0 text-base': isLink && size === 'lg' && !isIcon,
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
