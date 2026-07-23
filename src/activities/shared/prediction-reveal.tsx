'use client';

import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import type { PredictionResult } from '@/stores/session-store';

/**
 * "Listen for it" reveal (Captain's Flight, Stage 1). Renders the takeoff predictions the class
 * committed to, with the answers that were held back until AFTER the briefing — the payoff for
 * reading/watching with a stake. Fed by `predictionResults` in the session store; presentational
 * only (scoring already happened at takeoff). Projected-safe: showing the answers IS the point.
 */

function ResultBar({ result }: { result: PredictionResult }) {
  const total = result.countA + result.countB;
  const pctA = total > 0 ? Math.round((result.countA / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((result.countB / total) * 100) : 0;
  const correctA = result.correctAnswer === 'A';

  return (
    <div className="glass p-5 rounded-2xl space-y-4">
      <p className="font-semibold text-lg">{result.text}</p>

      <div className="space-y-3">
        {([['A', result.optionA, result.countA, pctA], ['B', result.optionB, result.countB, pctB]] as const).map(
          ([key, label, count, pct]) => {
            const isCorrect = result.correctAnswer === key;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={`inline-flex items-center gap-1 ${isCorrect ? 'text-emerald-400 font-bold' : 'opacity-70'}`}>
                    {label}
                    {isCorrect && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="bg-white/10 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCorrect ? 'bg-emerald-400' : 'bg-sky-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="bg-white/5 rounded-xl p-3 text-sm opacity-80 border border-white/10 flex gap-2">
        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
        <span>
          {correctA ? result.optionA : result.optionB}. {result.revealFact}
        </span>
      </div>

      <p className="text-xs opacity-40">{total} prediction{total !== 1 ? 's' : ''} at takeoff</p>
    </div>
  );
}

/**
 * A toggle + panel for the briefing's complete screen. Renders nothing when there are no held-back
 * predictions, so it's safe to drop into any briefing activity regardless of preset — it only lights
 * up when a deferred-reveal Prediction Round ran earlier this session.
 */
export function PredictionReveal({ results }: { results: PredictionResult[] }) {
  const [open, setOpen] = useState(false);

  if (results.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3.5 transition-transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" /> Reveal Predictions
        <span className="text-xs font-normal opacity-80">({results.length})</span>
      </button>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 justify-center text-amber-400">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-lg font-semibold">The answers were in the briefing</h3>
      </div>
      <p className="text-sm text-center text-lc-text3">
        Here&apos;s what the class predicted at takeoff — and how it turned out.
      </p>
      <div className="grid gap-4">
        {results.map((r, i) => (
          <ResultBar key={i} result={r} />
        ))}
      </div>
    </div>
  );
}
