'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ClipboardList, Eye, ImageOff, MessageCircle, Sparkles, Telescope, Vote, X, Zap } from 'lucide-react';
import type { FactCard } from '@/lib/live-room/fact-cards';
import type { FreePicture } from '@/lib/sources/wikimedia-images';

/**
 * The facts board: the topic presented on the shared screen before the class discusses it. Cards are revealed one at
 * a time (the class can guess what comes next), or all at once. A revealed card opens big with more sentences and
 * two questions; one tap sends a question to Talk. Facts only, never answers to anything, so it is safe on the
 * shared screen.
 */
export function FactsBoard({ title, cards, pictures = [], onAsk, onClose, onDive, onVote, onBoard, onQuiz }: {
  title: string;
  cards: FactCard[];
  /** A free Wikimedia photo per card (null while loading or when none fits). */
  pictures?: Array<FreePicture | null>;
  /** Send a question to Talk (the board closes). */
  onAsk: (question: string) => void;
  /** Next steps from an open card: this fact becomes the topic; a phone vote or the Class Board on a question; a quiz. */
  onDive?: (card: FactCard) => void;
  onVote?: (question: string) => void;
  onBoard?: (question: string) => void;
  onQuiz?: () => void;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  // Pictures come from a free search, so the teacher can take away any that does not fit.
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  useEffect(() => { setShown(0); setOpen(null); setHidden(new Set()); }, [title]);
  const picOf = (i: number) => (hidden.has(i) ? null : pictures[i] ?? null);
  const allShown = shown >= cards.length;
  const card = open !== null ? cards[open] : null;

  return (
    // Glass over the cockpit view (like every other activity): the window stays visible round and between the cards.
    <div className="absolute inset-0 z-20 flex flex-col gap-3 overflow-y-auto px-6 pb-5 pt-12 [&>*:first-child]:mt-auto [&>*:last-child]:mb-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/55 px-4 py-2.5 shadow-xl backdrop-blur-md">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Facts first</span>
        <h2 className="font-display text-xl text-white md:text-2xl">{title}</h2>
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
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/15 bg-slate-950/65 p-6 shadow-2xl backdrop-blur-md md:p-8">
          <button type="button" onClick={() => setOpen(null)} className="mb-4 flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All the facts
          </button>
          {picOf(open!) && (
            <figure className="mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={picOf(open!)!.imageUrl} alt={picOf(open!)!.title} onError={() => setHidden((h) => new Set(h).add(open!))} referrerPolicy="no-referrer" className="h-64 w-full rounded-2xl bg-black/30 object-contain" />
              <figcaption className="mt-1 flex items-center justify-between gap-3 text-[11px] text-white/45">
                <span className="truncate">Wikimedia Commons · {picOf(open!)!.credit}</span>
                <button type="button" onClick={() => setHidden((h) => new Set(h).add(open!))} className="flex shrink-0 items-center gap-1 hover:text-white"><ImageOff className="h-3 w-3" /> Hide picture</button>
              </figcaption>
            </figure>
          )}
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
          {/* where to go from here: always a next step, never a dead end */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {onDive && (
              <button type="button" onClick={() => onDive(card)} className="flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/20">
                <Telescope className="h-4 w-4" /> Dive into this
              </button>
            )}
            {onBoard && card.questions[0] && (
              <button type="button" onClick={() => onBoard(card.questions[0])} title="Everyone writes an answer on their phone; the answers gather on the Class Board" className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-sm text-white/85 hover:bg-white/10">
                <ClipboardList className="h-4 w-4" /> Everyone answers
              </button>
            )}
            {onVote && card.questions[0] && (
              <button type="button" onClick={() => onVote(card.questions[0])} title="A quick vote on the phones, then hear a few reasons" className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-sm text-white/85 hover:bg-white/10">
                <Vote className="h-4 w-4" /> Class vote
              </button>
            )}
            {onQuiz && (
              <button type="button" onClick={onQuiz} title="A quick quiz on these facts" className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-sm text-white/85 hover:bg-white/10">
                <Zap className="h-4 w-4" /> Quiz these facts
              </button>
            )}
            <button type="button" onClick={() => { const n = (open! + 1) % cards.length; setShown((s) => Math.max(s, n + 1)); setOpen(n); }} className="ml-auto flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10">
              {open! + 1 < cards.length ? 'Next fact' : 'First fact'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`mx-auto grid w-full max-w-6xl gap-3 ${cards.length <= 4 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {cards.map((c, i) => {
            const revealed = i < shown;
            return revealed ? (
              <button key={c.headline} type="button" onClick={() => setOpen(i)} className="flex min-h-[7.5rem] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/55 p-4 text-left shadow-xl backdrop-blur-md hover:border-amber-300/60">
                {picOf(i) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={picOf(i)!.thumbUrl} alt="" onError={() => setHidden((h) => new Set(h).add(i))} referrerPolicy="no-referrer" className="-mx-4 -mt-4 mb-2 h-20 w-[calc(100%+2rem)] max-w-none rounded-t-2xl object-cover object-[center_25%]" />
                )}
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Fact {i + 1}</span>
                <span className="mt-1.5 font-display text-lg leading-snug text-white xl:text-xl">{c.headline}</span>
                <span className="mt-auto pt-2 text-xs text-white/50">Tap for more</span>
              </button>
            ) : (
              <div key={c.headline} className="flex min-h-[8.5rem] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-950/25 backdrop-blur-sm">
                <span className="font-display text-4xl text-white/35">{i + 1}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
