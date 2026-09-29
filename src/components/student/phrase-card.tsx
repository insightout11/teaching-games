'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Volume2 } from 'lucide-react';
import type { PhraseSource, ReferenceVocabItem } from '@/lib/reference-materials';
import type { PhraseState } from '@/lib/phrasebook-progress';
import { buzz, BUZZ } from '@/components/student/phone-shell';

// Pocket Phrasebook: words are cream "postcard paper" cards the student keeps.
// Cream only ever means "something you keep"; everything else stays cockpit-dark.

const PAPER = '#f4efe3';
const INK = '#1b2233';
const INK_SOFT = '#5b5446';
const INK_FAINT = '#7a6f5a';
const STAMP = '#d4537e';
const MONO = 'font-[family-name:var(--font-instrument)] uppercase tracking-[0.12em]';

export const SOURCE_RIBBON: Record<PhraseSource, { color: string; label: string }> = {
  topic: { color: '#F59E0B', label: 'Topic' },
  reading: { color: '#22d3ee', label: 'Reading' },
  ai: { color: '#a78bfa', label: 'AI' },
  teacher: { color: '#2FE59B', label: 'Captain' },
};

function ribbonOf(item: ReferenceVocabItem) {
  return SOURCE_RIBBON[item.source ?? 'topic'];
}

export function speak(text: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    // no voice on this device — the button just does nothing
  }
}

/** Passport-style "USED IT" stamp. `fresh` plays the thud. */
export function UsedStamp({ date, place, fresh }: { date: string; place?: string | null; fresh?: boolean }) {
  return (
    <div
      className={`pointer-events-none select-none rounded-lg border-[2.5px] px-2.5 py-1 text-center ${fresh ? 'animate-[lcStamp_520ms_cubic-bezier(.2,1.4,.4,1)]' : ''}`}
      style={{ borderColor: STAMP, color: STAMP, transform: 'rotate(-12deg)', mixBlendMode: 'multiply' }}
      aria-label="Used it"
    >
      <p className={`${MONO} text-[13px] font-semibold leading-tight`}>Used it</p>
      <p className={`${MONO} text-[10px] leading-tight`}>{date}{place ? ` · ${place}` : ''}</p>
      <style>{'@keyframes lcStamp{0%{transform:rotate(-12deg) scale(2.2);opacity:0}55%{transform:rotate(-12deg) scale(.92);opacity:1}100%{transform:rotate(-12deg) scale(1)}}'}</style>
    </div>
  );
}

export function PhraseCard({
  item,
  state,
  usedAt,
  place,
  onUse,
  fresh,
}: {
  item: ReferenceVocabItem;
  state: PhraseState;
  usedAt?: number;
  place?: string | null;
  onUse: () => void;
  fresh?: boolean;
}) {
  const ribbon = ribbonOf(item);
  const used = state === 'used' || state === 'mastered';
  const date = usedAt ? new Date(usedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
  return (
    <article className="relative overflow-hidden rounded-2xl" style={{ background: PAPER, color: INK }}>
      <div className="h-1.5" style={{ background: ribbon.color }} />
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`${MONO} text-[11px]`} style={{ color: INK_FAINT }}>
              {ribbon.label}{item.partOfSpeech ? ` · ${item.partOfSpeech}` : ''}
              {state === 'mastered' && <Star className="ml-1.5 inline h-3 w-3 -translate-y-px" fill={STAMP} stroke={STAMP} />}
            </p>
            <h3 className="break-words font-display text-[34px] leading-[1.05]">{item.word}</h3>
          </div>
          <button
            type="button"
            onClick={() => speak(item.word)}
            aria-label={`Say ${item.word}`}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:scale-95"
            style={{ background: INK, color: PAPER }}
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
        {item.definition && <p className="mt-2 text-[15px] leading-snug">{item.definition}</p>}
        {item.example && (
          <p className="mt-2 text-[14px] italic leading-snug" style={{ color: INK_SOFT }}>
            &ldquo;{item.example}&rdquo;
          </p>
        )}
      </div>
      {/* Ticket-stub perforation: the front teaches, the stub is where you use it */}
      <div className="relative mx-4 border-t-2 border-dashed" style={{ borderColor: '#c9bfa8' }}>
        <span className="absolute -left-6 -top-2 h-4 w-4 rounded-full bg-lc-surface" />
        <span className="absolute -right-6 -top-2 h-4 w-4 rounded-full bg-lc-surface" />
      </div>
      <div className={`relative px-4 pb-4 pt-3 ${used ? 'pr-32' : ''}`}>
        {used && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <UsedStamp date={date} place={place} fresh={fresh} />
          </div>
        )}
        <p className={`${MONO} text-[11px]`} style={{ color: INK_FAINT }}>Use it</p>
        <p className="mt-1 text-[15px] leading-snug">
          {item.starter || `Say a sentence with “${item.word}” to your class.`}
        </p>
        {used ? (
          <p className={`${MONO} mt-3 text-[11px]`} style={{ color: STAMP }}>
            {state === 'mastered' ? 'Mastered · used in two classes' : 'Use it again next class to master it'}
          </p>
        ) : (
          <button
            type="button"
            onClick={onUse}
            className="mt-3 w-full rounded-xl py-3 text-base font-semibold active:scale-[0.98]"
            style={{ background: INK, color: '#F59E0B' }}
          >
            I used it!
          </button>
        )}
      </div>
    </article>
  );
}

function StateTag({ state }: { state: PhraseState }) {
  if (state === 'used') return <span className={`${MONO} rounded border-[1.5px] px-1.5 text-[10px]`} style={{ color: STAMP, borderColor: STAMP }}>Used</span>;
  if (state === 'mastered') return <span className={`${MONO} flex items-center gap-1 text-[10px]`} style={{ color: STAMP }}><Star className="h-3 w-3" fill={STAMP} stroke={STAMP} />Mastered</span>;
  if (state === 'new') return <span className={`${MONO} flex items-center gap-1 text-[10px]`} style={{ color: '#b45309' }}><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />New</span>;
  return <span className={`${MONO} text-[10px]`} style={{ color: INK_FAINT }}>Seen</span>;
}

export function PhraseRow({ item, state, onOpen }: { item: ReferenceVocabItem; state: PhraseState; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left active:scale-[0.99]"
      style={{ background: PAPER, color: INK }}
    >
      <span className="w-1 self-stretch rounded-full" style={{ background: ribbonOf(item).color }} />
      <span className="min-w-0 flex-1 truncate font-display text-xl">{item.word}</span>
      <StateTag state={state} />
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: INK_FAINT }} />
    </button>
  );
}

/** Whole phrasebook: list → one card, with prev/next. */
export function Phrasebook({
  items,
  stateOf,
  usedAtOf,
  place,
  onOpen,
  onUse,
  openWord,
  setOpenWord,
}: {
  items: ReferenceVocabItem[];
  stateOf: (word: string) => PhraseState;
  usedAtOf: (word: string) => number | undefined;
  place?: string | null;
  onOpen: (word: string) => void;
  onUse: (word: string) => void;
  openWord: string | null;
  setOpenWord: (word: string | null) => void;
}) {
  const [freshWord, setFreshWord] = useState<string | null>(null);
  useEffect(() => {
    if (!freshWord) return;
    const t = window.setTimeout(() => setFreshWord(null), 900);
    return () => window.clearTimeout(t);
  }, [freshWord]);

  const idx = openWord ? items.findIndex((i) => i.word === openWord) : -1;
  if (idx >= 0) {
    const item = items[idx];
    const go = (d: number) => {
      const next = items[(idx + d + items.length) % items.length];
      onOpen(next.word);
      setOpenWord(next.word);
    };
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setOpenWord(null)} className={`${MONO} flex items-center gap-1 text-[11px] text-lc-text2`}>
            <ChevronLeft className="h-4 w-4" /> All words
          </button>
          <span className={`${MONO} text-[11px] text-lc-text3`}>{idx + 1} / {items.length}</span>
        </div>
        <PhraseCard
          item={item}
          state={stateOf(item.word)}
          usedAt={usedAtOf(item.word)}
          place={place}
          fresh={freshWord === item.word}
          onUse={() => { onUse(item.word); setFreshWord(item.word); window.setTimeout(() => buzz(BUZZ.stamp), 260); }}
        />
        {items.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => go(-1)} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-lc-border text-sm text-lc-text2"><ChevronLeft className="h-4 w-4" />Previous</button>
            <button type="button" onClick={() => go(1)} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-lc-border text-sm text-lc-text2">Next<ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    );
  }

  const usedCount = items.filter((i) => ['used', 'mastered'].includes(stateOf(i.word))).length;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className={`${MONO} text-[11px] text-lc-text3`}>{items.length} words collected</p>
        <p className={`${MONO} text-[11px]`} style={{ color: STAMP }}>{usedCount} stamped</p>
      </div>
      {items.map((item) => (
        <PhraseRow key={item.word} item={item} state={stateOf(item.word)} onOpen={() => { onOpen(item.word); setOpenWord(item.word); }} />
      ))}
      <p className={`${MONO} pt-1 text-[10px] leading-relaxed text-lc-text3`}>
        {Object.entries(SOURCE_RIBBON).map(([k, v]) => (
          <span key={k} className="mr-3 inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: v.color }} />{v.label}</span>
        ))}
      </p>
    </div>
  );
}
