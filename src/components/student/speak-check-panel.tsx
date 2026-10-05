'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { CONFIDENCE_LABELS } from '@/lib/speak-check';
import { buzz, BUZZ } from './phone-shell';
import { PhonePrompt } from './phone-kit';

/** Speak situation check: pick the reply you'd use, how confident you'd feel, and the can-do. */
export function SpeakCheckPanel({ spec, onSubmit }: { spec: InputSpec; onSubmit: (choice: string) => Promise<void> | void }) {
  const data = spec.perStudentData?.__speakcheck as { situation: string; replies: string[]; canDo: string } | undefined;
  const [reply, setReply] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [canDo, setCanDo] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  if (!data) return <PhonePrompt>{spec.prompt}</PhonePrompt>;
  const ready = reply !== null && confidence !== null && canDo !== null;
  const pick = 'border-amber-400 bg-amber-400/15 text-amber-50';
  const idle = 'border-white/10 bg-white/[0.03] text-lc-text';

  return (
    <div className="space-y-4">
      <PhonePrompt>{data.situation}</PhonePrompt>
      <div className="space-y-2">
        <p className="text-[14px] text-lc-text2">Which reply would you use?</p>
        {data.replies.map((r, i) => (
          <button key={r} type="button" onClick={() => { setSent(false); setReply(i); }} className={`w-full rounded-2xl border px-4 py-3 text-left text-[16px] ${reply === i ? pick : idle}`}>“{r}”</button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-[14px] text-lc-text2">How confident would you feel saying it?</p>
        <div className="grid grid-cols-3 gap-2">
          {CONFIDENCE_LABELS.map((l, i) => (
            <button key={l} type="button" onClick={() => { setSent(false); setConfidence(i); }} className={`rounded-xl border px-2 py-2.5 text-[15px] ${confidence === i ? pick : idle}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[14px] text-lc-text2">Could you {data.canDo.charAt(0).toLowerCase() + data.canDo.slice(1)}?</p>
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" onClick={() => { setSent(false); setCanDo(v); }} className={`rounded-xl border px-2 py-2.5 text-[15px] ${canDo === v ? pick : idle}`}>{v ? 'Yes' : 'Not yet'}</button>
          ))}
        </div>
      </div>
      <button type="button" disabled={!ready || sent}
        onClick={() => { setSent(true); buzz(BUZZ.sent); void onSubmit(JSON.stringify({ reply, confidence, canDo })); }}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[16px] font-semibold disabled:opacity-50 ${sent ? 'bg-emerald-500/20 text-emerald-100' : 'bg-cyan-500 text-white'}`}>
        {sent && <Check className="h-4 w-4" aria-hidden />}{sent ? 'Sent' : 'Send'}
      </button>
    </div>
  );
}
