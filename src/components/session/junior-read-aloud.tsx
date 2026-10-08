'use client';

import { Volume2 } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import { speak, warmUpSpeech } from '@/lib/speech';

/**
 * Junior classes: one button that reads the phones' current question and its choices aloud with the computer
 * voice, for kids who don't read yet. Reads only what every phone already shows (never answers).
 */
export function JuniorReadAloud() {
  const junior = useSessionStore((s) => s.junior);
  const spec = useSessionStore((s) => s.inputSpec);
  if (!junior || !spec?.prompt) return null;

  const options = spec.optionLabels ?? spec.options ?? [];
  const text = options.length
    ? `${spec.prompt} ${options.slice(0, -1).join(', ')}${options.length > 1 ? ', or ' : ''}${options.at(-1)}?`
    : spec.prompt;

  return (
    <button
      type="button"
      onClick={() => {
        warmUpSpeech();
        speak(text, 0.8);
      }}
      className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-200 hover:bg-amber-400/25"
      title="Read the question aloud"
    >
      <Volume2 className="h-4 w-4" aria-hidden />
      Read it out
    </button>
  );
}
