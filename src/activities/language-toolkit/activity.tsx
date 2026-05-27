'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { LanguageToolkitContent, LanguageToolkitItem } from './types';

type Phase = 'idle' | 'collecting' | 'done';

function ToolkitCard({ item }: { item: LanguageToolkitItem }) {
  return (
    <div className="glass p-4 rounded-2xl space-y-2 flex flex-col">
      <p className="text-lg font-bold text-sky-300">{item.term}</p>
      <p className="text-sm opacity-70 leading-snug">{item.meaning}</p>
      <p className="text-sm italic opacity-50 leading-snug">&ldquo;{item.example}&rdquo;</p>
      <div className="mt-auto pt-2 border-t border-white/10">
        <p className="text-xs font-medium text-amber-300 leading-snug">{item.prompt}</p>
      </div>
    </div>
  );
}

export function LanguageToolkitActivity({
  generatedContent,
  onSetInputSpec,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as LanguageToolkitContent;
  const items = content.items ?? [];
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (phase !== 'collecting') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'language-toolkit',
      prompt: 'Pick one term and answer its prompt in one sentence.',
      placeholder: 'Write your sentence here...',
      maxLength: 250,
      reviewMode: 'approval',
      keywords: items.map((i) => i.term),
    });
  }, [phase, items, onSetInputSpec]);

  const handleStart = useCallback(() => {
    setPhase('collecting');
    onPhaseChange?.('collecting');
  }, [onPhaseChange]);

  const handleDone = useCallback(() => {
    onSetInputSpec?.(null);
    setPhase('done');
    onPhaseChange?.('finished');
  }, [onSetInputSpec, onPhaseChange]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sky-400">Language Toolkit</h3>
        {phase === 'idle' && (
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            START
          </button>
        )}
        {phase === 'collecting' && (
          <button
            onClick={handleDone}
            className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            DONE
          </button>
        )}
      </div>

      {phase === 'collecting' && (
        <p className="text-sm opacity-60">
          Students are writing — review responses in the submissions panel.
        </p>
      )}

      {phase === 'done' ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-lg font-semibold text-sky-400">Responses collected</p>
          <p className="text-sm opacity-60">Spotlight standout sentences before moving on.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <ToolkitCard key={item.term} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
