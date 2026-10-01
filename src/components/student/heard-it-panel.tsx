'use client';

import { useState } from 'react';
import { Ear } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import { buzz, BUZZ } from './phone-shell';
import { PhonePrompt } from './phone-kit';

/** Grammar Spotlight "Watch it": a big button to tap every time you hear the structure. */
export function HeardItPanel({ spec, onSubmit }: { spec: InputSpec; onSubmit: (choice: string) => Promise<void> | void }) {
  const [count, setCount] = useState(0);
  return (
    <div className="space-y-5 text-center">
      <PhonePrompt center>{spec.prompt}</PhonePrompt>
      <button
        type="button"
        onClick={() => { setCount((n) => n + 1); buzz(BUZZ.sent); void onSubmit('heard'); }}
        className="mx-auto flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full border-4 border-amber-300 bg-amber-300/15 text-amber-50 active:scale-95"
      >
        <Ear className="h-12 w-12" />
        <span className="font-display text-[26px]">Heard it!</span>
      </button>
      <p className="text-[15px] text-lc-text2">You heard it {count} time{count === 1 ? '' : 's'}</p>
    </div>
  );
}
