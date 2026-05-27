'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ActivityProps } from '../types';
import type { LanguageToolkitContent, SourceVocabItem } from './types';

type Phase = 'idle' | 'speaking' | 'done';

function ToolkitCard({ item }: { item: SourceVocabItem }) {
  return (
    <div className="glass p-4 rounded-2xl space-y-2 flex flex-col">
      <p className="text-lg font-bold text-sky-300">{item.term}</p>
      <p className="text-sm opacity-70 leading-snug">{item.meaning}</p>
      <p className="text-sm italic opacity-50 leading-snug">&ldquo;{item.example}&rdquo;</p>
      {item.prompt && (
        <div className="mt-auto pt-2 border-t border-white/10">
          <p className="text-xs font-medium text-amber-300 leading-snug">{item.prompt}</p>
        </div>
      )}
    </div>
  );
}

export function LanguageToolkitActivity({
  generatedContent,
  onSetInputSpec,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as LanguageToolkitContent;
  const items = useMemo(() => content.items ?? [], [content.items]);
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (phase !== 'speaking') {
      onSetInputSpec?.(null);
      return;
    }
    // Spoken-first: students see vocab cards + optional "I used this" confirm button
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'language-toolkit',
      prompt: 'Pick one term and use it in a sentence with a partner.',
      buttonLabel: 'I used this term',
      toolkitItems: items.map((i) => ({
        term: i.term,
        meaning: i.meaning,
        example: i.example,
        prompt: i.prompt ?? '',
      })),
    });
  }, [phase, items, onSetInputSpec]);

  const handleStart = useCallback(() => {
    setPhase('speaking');
    onPhaseChange?.('speaking');
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
        {phase === 'speaking' && (
          <button
            onClick={handleDone}
            className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            DONE
          </button>
        )}
      </div>

      {phase === 'speaking' && (
        <p className="text-sm opacity-60">
          Students choose one term and say a sentence to a partner — tap &ldquo;I used this term&rdquo; on their device when done.
        </p>
      )}

      {phase === 'done' ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-lg font-semibold text-sky-400">Spoken practice complete</p>
          <p className="text-sm opacity-60">Spotlight students who used terms well before moving on.</p>
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
