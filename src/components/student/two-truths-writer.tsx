'use client';

import { useState } from 'react';
import { Check, EyeOff } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { PHONE_FIELD, PHONE_PRIMARY, PhoneLabel, PhonePrompt } from './phone-kit';

const STARTERS = ['I have…', 'I once…', 'I can…', 'I have never…', 'When I was a child, I…', 'My favourite…'];

/**
 * Two Truths & a Lie on the phone: three separate sentences and a private
 * "this one's my lie" tap. Submits JSON { statements, lie } so the game can
 * reveal automatically (the teacher never has to guess).
 */
export function TwoTruthsWriter({ spec, onSubmit, isSubmitting, submitStatus }: { spec: InputSpec; onSubmit: (content: string) => Promise<void> | void; isSubmitting: boolean; submitStatus: string }) {
  const [lines, setLines] = useState(['', '', '']);
  const [lie, setLie] = useState<number | null>(null);
  const [focus, setFocus] = useState(0);
  const ready = lines.every((l) => l.trim().length >= 3) && lie !== null;

  if (submitStatus === 'success') {
    return (
      <div className="space-y-3 py-8 text-center">
        <Check className="mx-auto h-10 w-10 text-emerald-300" />
        <PhonePrompt center>Sent! Keep a straight face…</PhonePrompt>
        <p className="text-[15px] text-lc-text2">Your lie stays secret until you&apos;re in the spotlight.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PhonePrompt>{spec.prompt ? 'Write two true things about you, and one lie.' : 'Two truths and a lie'}</PhonePrompt>
      {lines.map((line, i) => (
        <div key={i} className={`space-y-1.5 rounded-2xl border p-3 ${lie === i ? 'border-rose-400/60 bg-rose-400/[0.07]' : 'border-lc-border'}`}>
          <div className="flex items-center justify-between">
            <PhoneLabel>Sentence {i + 1}</PhoneLabel>
            <button type="button" onClick={() => setLie(i)} className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] ${lie === i ? 'border-rose-300 bg-rose-400/20 text-rose-100' : 'border-white/15 text-lc-text3'}`}>
              {lie === i && <EyeOff className="h-3 w-3" />}{lie === i ? 'My lie (secret)' : 'This one’s my lie'}
            </button>
          </div>
          <input
            value={line}
            onFocus={() => setFocus(i)}
            onChange={(e) => setLines((prev) => prev.map((l, j) => (j === i ? e.target.value : l)))}
            maxLength={120}
            placeholder={['I can play the guitar.', 'I have been to Japan.', 'I once met a famous singer.'][i]}
            className={`w-full ${PHONE_FIELD}`}
          />
        </div>
      ))}
      <div className="space-y-1.5">
        <PhoneLabel>Start with</PhoneLabel>
        <div className="flex flex-wrap gap-1.5">
          {STARTERS.map((st) => (
            <button key={st} type="button" onClick={() => setLines((prev) => prev.map((l, j) => (j === focus && !l.trim() ? st.replace('…', ' ') : l)))} className="rounded-full border border-white/12 px-2.5 py-1 text-[13px] text-lc-text2 active:scale-95">
              {st}
            </button>
          ))}
        </div>
      </div>
      <button type="button" disabled={!ready || isSubmitting} onClick={() => void onSubmit(JSON.stringify({ statements: lines.map((l) => l.trim()), lie }))} className={`w-full py-4 text-lg ${PHONE_PRIMARY}`}>
        {lie === null ? 'Tap which one is your lie' : isSubmitting ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
