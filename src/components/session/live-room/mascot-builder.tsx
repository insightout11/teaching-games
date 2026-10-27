'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Sparkles, X } from 'lucide-react';
import { MascotFigure } from '@/components/ui/mascot-figure';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { usePollVotes } from '@/hooks/use-poll-votes';
import {
  DEFAULT_MASCOT, MASCOT_BODIES, MASCOT_COLORS, MASCOT_EXTRAS, MASCOT_EYES, MASCOT_HEADS, MASCOT_LABELS,
  isMascotPartOpen, type MascotLook,
} from '@/lib/mascot';

type Key = keyof MascotLook;
const ROUNDS: Array<{ key: Key; question: string; parts: readonly string[] }> = [
  { key: 'body', question: 'What kind of creature is our mascot?', parts: MASCOT_BODIES },
  { key: 'color', question: 'What colour is it?', parts: MASCOT_COLORS },
  { key: 'eyes', question: 'What eyes does it have?', parts: MASCOT_EYES },
  { key: 'head', question: 'What is on its head?', parts: MASCOT_HEADS.filter((p) => p !== 'none') },
  { key: 'extra', question: 'What extra does it get?', parts: MASCOT_EXTRAS.filter((p) => p !== 'none') },
];
const NAMES = ['Captain Fluff', 'Zoomy', 'Sir Wobble', 'Pickles', 'Nimbus', 'Rocket', 'Biscuit', 'Mango', 'Dr Bounce', 'Turbo', 'Noodle', 'Sprocket', 'Bubbles', 'Captain Crumbs', 'Zigzag', 'Pudding'];
const shuffle = <T,>(a: readonly T[]) => [...a].sort(() => Math.random() - 0.5);
const label = (part: string) => MASCOT_LABELS[part] ?? part;
/** Rapid fire (Oct 2026, owner): each vote closes by itself after this long. */
const ROUND_SECONDS = 5;

/**
 * Make a class mascot (Oct 2026, pilot 001): five rapid-fire votes on the phones (5 seconds each), one part at a time, then a name. The
 * mascot grows on the big screen after each vote. The teacher can also just click an option ("teacher picks"),
 * which is how a class without phones, or a quick class, builds one.
 */
export function MascotBuilder({ sessionId, unlocks, onDone, onClose }: {
  sessionId: string;
  unlocks: ReadonlySet<string>;
  onDone: (look: MascotLook, name: string) => void;
  onClose: () => void;
}) {
  const [look, setLook] = useState<MascotLook>(DEFAULT_MASCOT);
  const [round, setRound] = useState(0); // 0-4 parts, 5 = name
  const [pollId, setPollId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const options = useMemo(() => {
    if (round >= ROUNDS.length) return shuffle(NAMES).slice(0, 3);
    return shuffle(ROUNDS[round].parts.filter((p) => isMascotPartOpen(p, unlocks))).slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const { tallies, votes } = usePollVotes(pollId);
  const labels = round >= ROUNDS.length ? options : options.map(label);

  // Open this round's vote on the phones.
  const opened = useRef(-1);
  useEffect(() => {
    if (opened.current === round || isMockMode()) return;
    opened.current = round;
    const question = round >= ROUNDS.length ? 'What is our mascot called?' : ROUNDS[round].question;
    void (async () => {
      const supabase = createClient();
      await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
      const { data } = await supabase.from('polls').insert({ session_id: sessionId, question: `Mascot: ${question}`, options: labels, is_active: true, metadata: { purpose: 'mascot' } }).select('id').single();
      setPollId((data as { id: string } | null)?.id ?? null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const closePoll = () => {
    if (pollId && !isMockMode()) void createClient().from('polls').update({ is_active: false }).eq('id', pollId);
    setPollId(null);
  };
  useEffect(() => () => { if (pollId && !isMockMode()) void createClient().from('polls').update({ is_active: false }).eq('id', pollId); }, [pollId]);

  const choose = (i: number) => {
    closePoll();
    if (round >= ROUNDS.length) { setName(options[i]); return; }
    setLook((l) => ({ ...l, [ROUNDS[round].key]: options[i] }));
    setRound((r) => r + 1);
  };
  // The class's choice: most votes; a tie goes to a random one of the leaders.
  const lockWinner = () => {
    const counts = labels.map((l) => tallies[l] ?? 0);
    const top = Math.max(...counts);
    const leaders = counts.flatMap((c, i) => (c === top ? [i] : []));
    choose(leaders[Math.floor(Math.random() * leaders.length)]);
  };

  // The clock: starts when the round's options appear, and the class choice locks in by itself at zero.
  const [left, setLeft] = useState(ROUND_SECONDS);
  const lockRef = useRef(lockWinner);
  lockRef.current = lockWinner;
  useEffect(() => {
    if (name) return;
    const end = Date.now() + ROUND_SECONDS * 1000;
    setLeft(ROUND_SECONDS);
    const id = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) { window.clearInterval(id); lockRef.current(); }
    }, 200);
    return () => window.clearInterval(id);
  }, [round, name]);

  const naming = round >= ROUNDS.length;
  const preview = (part: string): MascotLook => (naming ? look : { ...look, [ROUNDS[round].key]: part });
  return (
    <div className="absolute inset-x-0 top-3 z-30 mx-auto w-[min(820px,94%)]">
      <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="overflow-hidden rounded-3xl border border-white/15 bg-slate-950/90 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-amber-300"><Sparkles className="h-4 w-4" /> Make our mascot · {naming ? 'name' : `${round + 1} of ${ROUNDS.length}`}</p>
          <button type="button" onClick={() => { closePoll(); onClose(); }} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-5 p-5">
          <div className="flex w-44 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/[0.04]">
            <motion.div key={JSON.stringify(look)} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
              <MascotFigure look={look} size={150} />
            </motion.div>
            {name && <p className="font-display text-2xl">{name}</p>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl">{naming ? 'What is our mascot called?' : ROUNDS[round].question}</p>
            {!name && (
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div key={round} initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: ROUND_SECONDS, ease: 'linear' }} className="h-full bg-amber-300" />
                </div>
                <span className="w-6 text-right font-mono text-lg text-amber-200">{left}</span>
              </div>
            )}
            <p className="mb-3 text-sm text-white/60">Quick, vote on your phone{votes.length ? ` · ${votes.length} vote${votes.length === 1 ? '' : 's'} in` : ''}. The captain can also just pick.</p>
            {!name ? (
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                {options.map((o, i) => (
                  <button key={o} type="button" onClick={() => choose(i)} className="flex flex-col items-center gap-1 rounded-2xl border border-white/12 bg-white/5 p-2 hover:border-amber-300/60">
                    {!naming && <MascotFigure look={preview(o)} size={84} />}
                    <span className={`text-center ${naming ? 'py-4 font-display text-xl' : 'text-sm'}`}>{labels[i]}</span>
                    <span className="font-mono text-xs text-amber-200">{tallies[labels[i]] ?? 0}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-lg">Meet <b className="text-amber-200">{name}</b>!</p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {naming && !name && (
                <form onSubmit={(e) => { e.preventDefault(); const n = (e.currentTarget.elements.namedItem('mascot-name') as HTMLInputElement).value.trim().slice(0, 40); if (n) { closePoll(); setName(n); } }} className="mr-auto flex items-center gap-1.5">
                  <input name="mascot-name" placeholder="Or type a name" aria-label="Mascot name" className="rounded-lg border border-white/15 bg-slate-900 px-2 py-1 text-sm" />
                  <button type="submit" className="rounded-lg border border-white/20 px-2 py-1 text-sm hover:bg-white/10">Use it</button>
                </form>
              )}
              {name && (
                <button type="button" onClick={() => onDone(look, name)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-5 py-2 text-sm font-semibold text-slate-950"><Plane className="h-4 w-4" /> Board {name}</button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
