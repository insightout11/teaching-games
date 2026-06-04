import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputSize?: 'sm' | 'md' | 'lg' | 'compact';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, inputSize = 'md', ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-lc-surface border border-lc-border rounded-xl text-lc-text placeholder:text-lc-text3 transition-colors disabled:opacity-50 disabled:pointer-events-none resize-y',
        {
          'px-3 py-1.5 text-sm': inputSize === 'sm',
          'px-4 py-2.5 text-sm': inputSize === 'md',
          'px-4 py-3 text-base': inputSize === 'lg',
          'px-3 py-2 text-sm rounded-lg': inputSize === 'compact',
        },
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';
