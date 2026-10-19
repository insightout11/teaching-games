'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { FIRSTS, readFirsts, type First } from '@/lib/teacher-firsts';

const DISMISS_KEY = 'lc-first-checklist-dismissed';

/** Home: a short first-lesson checklist, gone once done (or dismissed). */
export function FirstLessonChecklist() {
  const [done, setDone] = useState<Partial<Record<First, true>> | null>(null);
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDone(readFirsts());
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === '1'); } catch { setDismissed(false); }
  }, []);
  if (!done || dismissed || FIRSTS.every((f) => done[f.key])) return null;
  const count = FIRSTS.filter((f) => done[f.key]).length;
  return (
    <section className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.05] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-amber-300">Your first lesson · {count} of {FIRSTS.length}</p>
        <button type="button" onClick={() => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage blocked */ } }} aria-label="Hide the checklist" className="text-white/45 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {FIRSTS.map((f) => (
          <li key={f.key} className={`flex items-center gap-2 text-sm ${done[f.key] ? 'text-white/45 line-through' : 'text-white/85'}`}>
            <span className={`grid h-5 w-5 place-items-center rounded-full border ${done[f.key] ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-white/30'}`}>
              {done[f.key] && <Check className="h-3 w-3" />}
            </span>
            {f.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
