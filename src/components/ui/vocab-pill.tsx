'use client';
import { cn } from '@/lib/utils';
import type { VocabWord } from '@/activities/types';
import { normalizeVocabWord } from '@/activities/types';

interface VocabPillProps {
  word: string | VocabWord;
  className?: string; // full pill styling from caller (bg, text, rounding, padding)
}

export function VocabPill({ word, className }: VocabPillProps) {
  const vocab = normalizeVocabWord(word);
  const hasDefinition = vocab.definition.length > 0;

  if (!hasDefinition) {
    return <span className={cn('text-sm', className)}>{vocab.word}</span>;
  }

  return (
    <span className={cn('relative inline-block group cursor-default', className)}>
      <span className="underline decoration-dotted underline-offset-2">{vocab.word}</span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
          'w-max max-w-[200px] rounded-lg px-3 py-2 text-xs leading-snug text-white',
          'bg-gray-900/90 backdrop-blur-sm shadow-xl',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2',
          'after:border-4 after:border-transparent after:border-t-gray-900/90',
        )}
      >
        {vocab.definition}
      </span>
    </span>
  );
}
