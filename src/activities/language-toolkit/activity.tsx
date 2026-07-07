'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { LanguageToolkitContent, SourceVocabItem } from './types';
import { useSessionStore } from '@/stores/session-store';

type Phase = 'idle' | 'presenting' | 'done';

function FocusedCard({ item }: { item: SourceVocabItem }) {
  return (
    <div className="glass p-8 rounded-2xl space-y-4">
      <p className="text-3xl font-bold text-sky-300">{item.term}</p>
      <p className="text-base opacity-80 leading-snug">{item.meaning}</p>
      <p className="text-base italic opacity-60 leading-snug">&ldquo;{item.example}&rdquo;</p>
      {item.prompt && (
        <div className="pt-3 border-t border-white/10">
          <p className="text-sm font-semibold text-amber-300 leading-snug">{item.prompt}</p>
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const addFlightLogEntry = useSessionStore((s) => s.addFlightLogEntry);

  const currentItem = items[currentIndex] ?? null;

  // Clear student input when not presenting
  useEffect(() => {
    if (phase !== 'presenting') {
      onSetInputSpec?.(null);
    }
  }, [phase, onSetInputSpec]);

  const handleStart = useCallback(() => {
    setCurrentIndex(0);
    setPhase('presenting');
    onPhaseChange?.('presenting');
  }, [onPhaseChange]);

  const handleDone = useCallback(() => {
    // Flight log (Captain's Flight): record the words taught so the Final Word can drill them again.
    // addFlightLogEntry self-guards to Captain's, so this no-ops in other presets.
    const terms = items.map((i) => i.term).filter(Boolean);
    if (terms.length > 0) {
      addFlightLogEntry({
        beat: 'toolkit',
        text: `Learned ${terms.length} word${terms.length !== 1 ? 's' : ''}: ${terms.join(', ')}.`,
        vocab: terms,
      });
    }
    onSetInputSpec?.(null);
    setPhase('done');
    onPhaseChange?.('finished');
  }, [items, addFlightLogEntry, onSetInputSpec, onPhaseChange]);

  const handlePrev = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const handleNext = useCallback(() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1)), [items.length]);

  if (phase === 'done') {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-lg font-semibold text-sky-400">Vocabulary complete</p>
        <p className="text-sm opacity-60">Move on when ready.</p>
      </div>
    );
  }

  if (phase === 'presenting' && currentItem) {
    const isLastItem = currentIndex === items.length - 1;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-sky-400">Language Toolkit</h3>
          {isLastItem ? (
            <button
              onClick={handleDone}
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              DONE
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              NEXT <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <FocusedCard item={currentItem} />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm opacity-50 tabular-nums">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === items.length - 1}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Word strip — tap any to jump */}
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item, i) => (
            <button
              key={item.term}
              onClick={() => setCurrentIndex(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                i === currentIndex
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/80'
              }`}
            >
              {item.term}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // idle — show all cards as preview
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sky-400">Language Toolkit</h3>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
        >
          START
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.term} className="glass p-4 rounded-2xl space-y-1.5">
            <p className="text-base font-bold text-sky-300">{item.term}</p>
            <p className="text-xs opacity-60 leading-snug">{item.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
