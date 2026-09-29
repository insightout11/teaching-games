'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

// Shared building blocks for everything that lands in the phone's "now" card.
// One look for every game and activity: serif question, amber = your move,
// emerald = locked in, instrument-mono labels.

export const PHONE_MONO = 'font-[family-name:var(--font-instrument)] uppercase tracking-[0.12em]';

/** Big primary action (submit, send, ready). */
export const PHONE_PRIMARY =
  'w-full min-h-12 rounded-xl bg-amber-400 px-5 font-semibold text-lc-bg shadow-none hover:bg-amber-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed';

/** Text inputs and textareas. */
export const PHONE_FIELD =
  'w-full rounded-xl border border-lc-border bg-lc-bg px-4 py-3 text-base text-lc-text placeholder:text-lc-text3 focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/30';

/** A tappable option; selected = amber. */
export function phoneOption(selected: boolean): string {
  return `w-full min-h-14 rounded-xl border px-4 py-3 text-left text-base transition-colors touch-manipulation ${
    selected
      ? 'border-amber-400 bg-amber-400/15 text-amber-50'
      : 'border-lc-border bg-lc-card text-lc-text hover:border-lc-text3'
  } disabled:opacity-50`;
}

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const LETTER_TONES = ['text-amber-300', 'text-cyan-300', 'text-violet-300', 'text-rose-300', 'text-emerald-300', 'text-sky-300'];

export function OptionLetter({ index, selected }: { index: number; selected?: boolean }) {
  return (
    <span className={`${PHONE_MONO} mr-3 text-[12px] ${selected ? 'text-amber-300' : LETTER_TONES[index % LETTER_TONES.length]}`}>
      {OPTION_LETTERS[index] ?? index + 1}
    </span>
  );
}

export function PhonePrompt({ children, center }: { children: ReactNode; center?: boolean }) {
  return <p className={`font-display text-[22px] leading-snug text-lc-text ${center ? 'text-center' : ''}`}>{children}</p>;
}

export function PhoneLabel({ children, tone = 'text-lc-text3' }: { children: ReactNode; tone?: string }) {
  return <p className={`${PHONE_MONO} text-[11px] ${tone}`}>{children}</p>;
}

/** Thin amber countdown; turns red in the last five seconds. */
export function PhoneTimer({ timeLeft, timerSeconds }: { timeLeft: number; timerSeconds: number }) {
  const pct = timerSeconds > 0 ? Math.max(0, Math.min(100, (timeLeft / timerSeconds) * 100)) : 0;
  const urgent = timeLeft <= 5;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <PhoneLabel>Time</PhoneLabel>
        <span className={`${PHONE_MONO} text-[12px] tabular-nums ${urgent ? 'text-red-400' : 'text-amber-300'}`}>0:{String(Math.max(0, timeLeft)).padStart(2, '0')}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-lc-border">
        <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Single status line under an input. */
export function PhoneSubmitStatus({ status, waitSeconds }: { status: 'idle' | 'success' | 'error' | 'rate_limited'; waitSeconds: number }) {
  if (status === 'idle') return null;
  if (status === 'success') return <PhoneLabel tone="text-emerald-300">Sent · locked in</PhoneLabel>;
  if (status === 'error') return <PhoneLabel tone="text-red-300">Didn&apos;t send · try again</PhoneLabel>;
  return <PhoneLabel tone="text-amber-300">Stand by {waitSeconds}s</PhoneLabel>;
}

/** The "answer locked in" moment. */
export function PhoneLocked({ title = 'Answer locked in', detail, note = 'Watch the big screen' }: { title?: string; detail?: ReactNode; note?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 text-emerald-300 animate-[lcLock_420ms_ease-out]">
        <Check className="h-8 w-8" strokeWidth={2.5} />
      </span>
      <p className="mt-2 font-display text-2xl text-lc-text">{title}</p>
      {detail && <div className="text-base text-lc-text2">{detail}</div>}
      <PhoneLabel>{note}</PhoneLabel>
      <style>{'@keyframes lcLock{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}'}</style>
    </div>
  );
}
