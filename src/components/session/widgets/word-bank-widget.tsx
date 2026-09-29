'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Sparkles, X } from 'lucide-react';
import { useFocusBus } from '@/stores/focus-bus-store';
import { openWordBankChannel, type WordUse } from '@/lib/live-room/word-bank';
import { KitInput, KitLabel, KitSection } from '../widget-kit';

/**
 * Word bank: the topic's key words pinned for the class, as cards. Students
 * tap "I used it!" on their phone when they use a word while speaking; each
 * card counts who used it and sparkles when someone does.
 */
export function WordBankContent({ sessionId }: { sessionId: string }) {
  const topicWords = useFocusBus((s) => s.vocab);
  const [extra, setExtra] = useState<Array<{ word: string; definition: string }>>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState('');
  const [uses, setUses] = useState<Record<string, string[]>>({});
  const [flashWord, setFlashWord] = useState<string | null>(null);

  useEffect(() => {
    const ch = openWordBankChannel(sessionId, (u: WordUse) => {
      const key = u.word.toLowerCase();
      setUses((prev) => {
        const names = prev[key] ?? [];
        return names.includes(u.name) ? prev : { ...prev, [key]: [...names, u.name] };
      });
      setFlashWord(key);
      window.setTimeout(() => setFlashWord((w) => (w === key ? null : w)), 1600);
    });
    return () => ch.close();
  }, [sessionId]);

  const words = useMemo(() => {
    const all = [...topicWords, ...extra];
    const seen = new Set<string>();
    return all.filter((w) => {
      const k = w.word.toLowerCase();
      if (seen.has(k) || hidden.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [extra, hidden, topicWords]);

  const add = () => {
    const w = draft.trim();
    if (!w) return;
    setExtra((prev) => [...prev, { word: w, definition: '' }]);
    setDraft('');
  };

  return (
    <div className="space-y-3 p-3">
      <KitSection label="Word bank" right={<span className="font-mono text-[11px] text-white/50">tap &quot;I used it!&quot; on phones</span>}>
        {words.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/15 px-3 py-5 text-center text-xs text-white/50">
            Set a topic and its key words appear here. You can add your own too.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {words.map((w) => {
            const key = w.word.toLowerCase();
            const who = uses[key] ?? [];
            const hot = flashWord === key;
            return (
              <motion.div
                key={key}
                layout
                animate={hot ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                className={`group relative rounded-xl border p-2.5 ${who.length ? 'border-emerald-300/50 bg-emerald-300/[0.08]' : 'border-white/12 bg-black/25'}`}
              >
                <p className="font-display text-base leading-tight text-white">{w.word}</p>
                {w.definition && <p className="mt-0.5 text-[11px] leading-snug text-white/55">{w.definition}</p>}
                <AnimatePresence>
                  {who.length > 0 && (
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-200">
                      <Sparkles className="h-3 w-3" /> {who.length} used it · {who.slice(-3).join(', ')}
                    </motion.p>
                  )}
                </AnimatePresence>
                <button type="button" onClick={() => setHidden((h) => new Set(h).add(key))} className="absolute right-1.5 top-1.5 hidden text-white/40 hover:text-white group-hover:block" aria-label={`Remove ${w.word}`}>
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </KitSection>
      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex items-center gap-1.5">
        <KitInput value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 40))} placeholder="Add a word…" />
        <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-300/45 text-cyan-100 hover:bg-cyan-300/10" aria-label="Add word"><Plus className="h-4 w-4" /></button>
      </form>
      <KitLabel className="text-center">Words used by the class light up green</KitLabel>
    </div>
  );
}
