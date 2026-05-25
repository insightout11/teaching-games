'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { ContributionBreakContent } from '../types';

type Phase = 'idle' | 'collecting' | 'done';

export function ContributionBreakActivity({
  generatedContent,
  onSetInputSpec,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as ContributionBreakContent;
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (phase !== 'collecting') {
      onSetInputSpec?.(null);
      return;
    }
    onSetInputSpec?.({
      type: 'textarea',
      gameKey: 'contribution-break',
      prompt: content.prompt,
      placeholder: 'Write your contribution...',
      maxLength: 200,
    });
  }, [phase, content.prompt, onSetInputSpec]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-400">Contribution Break</h3>
      </div>

      {phase === 'idle' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl space-y-3">
            <p className="text-sm opacity-50 uppercase tracking-widest">Student prompt</p>
            <p className="text-xl font-semibold">{content.prompt}</p>
          </div>
          <div className="text-center">
            <button
              onClick={handleStart}
              className="px-12 py-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full font-game text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </div>
      )}

      {phase === 'collecting' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl border-2 border-amber-500/30 space-y-2">
            <p className="text-xl font-semibold">{content.prompt}</p>
            <p className="text-sm opacity-60">Students are submitting — review responses in the submissions panel.</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleDone}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="text-center py-12 space-y-3">
          <p className="text-lg font-semibold text-amber-400">Contributions collected</p>
          <p className="text-sm opacity-60">Spotlight selected responses before moving to the next stage.</p>
        </div>
      )}
    </div>
  );
}
