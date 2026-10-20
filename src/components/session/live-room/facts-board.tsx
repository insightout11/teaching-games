'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, MessageCircle, Sparkles, X } from 'lucide-react';
import type { FactCard } from '@/lib/live-room/fact-cards';

/**
 * The facts board: the topic presented on the shared screen before the class discusses it. Cards are revealed one at
 * a time (the class can guess what comes next), or all at once. A revealed card opens big with more sentences and
 * two questions; one tap sends a question to Talk. Facts only, never answers to anything, so it is safe on the
 * shared screen.
 */
export function FactsBoard({ title, cards, onAsk, onClose }: {
  title: string;
  cards: FactCard[];
  /** Send a question to Talk (the board closes). */
  onAsk: (question: string) => void;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { setShown(0); setOpen(null); }, [title]);
  const allShown = shown >= cards.length;
  const card = open !== null ? cards[open] : null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-slate-950/80 px-5 pb-5 pt-12 backdrop-blur-md">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Facts first</span>
        <h2 className="font-display text-2xl text-white md:text-3xl">{title}</h2>
        <div className="ml-auto flex items-center gap-2">
          {!allShown && !card && (
            <>
              <button type="button" onClick={() => setShown((n) => Math.min(cards.length, n + 1))} className="flex items-center gap-1.5 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
                <Sparkles className="h-4 w-4" /> {shown === 0 ? 'First fact' : 'Next fact'}
              </button>
              <button type="button" onClick={() => setShown(cards.length)} className="flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-sm text-white/85 hover:border-white/50">
                <Eye className="h-4 w-4" /> Show all
              </button>
            </>
          )}
          <button type="button" onClick={onClose} className="flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-sm text-white/85 hover:border-white/50" title="Close the facts and start talking">
            <MessageCircle className="h-4 w-4" /> Start talking
          </button>
          <button type="button" onClick={onClose} aria-label="Close the facts board" className="rounded-full p-2 text-white/60 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
      </div>

      {card ? (
        // One card, big: the fact, more about it, and two questions for the class
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center">
          <button type="button" onClick={() => setOpen(null)} className="mb-4 flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All the facts
          </button>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Fact {open! + 1}</p>
          <p className="mt-2 font-display text-3xl leading-tight text-white md:text-5xl">{card.headline}</p>
          {card.detail && <p className="mt-5 text-lg leading-relaxed text-white/85 md:text-2xl">{card.detail}</p>}
          {card.questions.length > 0 && (
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {card.questions.map((q) => (
                <button key={q} type="button" onClick={() => onAsk(q)} className="group rounded-2xl border border-amber-300/30 bg-slate-900/70 p-4 text-left text-lg text-white hover:border-amber-300/70">
                  {q}
                  <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300/80 group-hover:text-amber-200"><MessageCircle className="h-3.5 w-3.5" /> Ask the class</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`grid min-h-0 flex-1 auto-rows-fr gap-3 ${cards.length <= 4 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {cards.map((c, i) => {
            const revealed = i < shown;
            return revealed ? (
              <button key={c.headline} type="button" onClick={() => setOpen(i)} className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900/80 p-4 text-left hover:border-amber-300/60">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Fact {i + 1}</span>
                <span className="mt-2 font-display text-lg leading-snug text-white lg:text-2xl">{c.headline}</span>
                <span className="mt-auto pt-3 text-xs text-white/50">Tap for more</span>
              </button>
            ) : (
              <div key={c.headline} className="flex items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-900/30">
                <span className="font-display text-5xl text-white/20">{i + 1}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
