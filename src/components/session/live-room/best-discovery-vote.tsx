'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Crown, Sparkles, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { usePollVotes } from '@/hooks/use-poll-votes';
import { rarityOf, RARITY_STYLE } from '@/lib/live-room/landmark-rarity';

export interface Discovery { title: string; landmarkId?: string; photographed?: boolean }

const nice = (t: string) => t.replace(/^the /, 'The ');

/**
 * "Best discovery" at the landing (Oct 2026, owner: the Class Board version offered "Make it the topic" and felt off):
 * its own vote. The flight's discoveries are cards, phones vote for one, counts fill in live, and the captain crowns
 * the winner (the most votes; the captain can also just click a card).
 */
export function BestDiscoveryVote({ sessionId, discoveries, onCrown, onClose }: {
  sessionId: string;
  discoveries: Discovery[];
  onCrown: (d: Discovery) => void;
  onClose: () => void;
}) {
  const list = discoveries.slice(0, 8);
  const labels = list.map((d) => nice(d.title));
  const [pollId, setPollId] = useState<string | null>(null);
  const { tallies, votes } = usePollVotes(pollId);

  useEffect(() => {
    if (isMockMode()) return;
    let id: string | null = null;
    void (async () => {
      const supabase = createClient();
      await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
      const { data } = await supabase.from('polls').insert({ session_id: sessionId, question: 'What was the best discovery of our flight?', options: labels, is_active: true, metadata: { purpose: 'best-discovery' } }).select('id').single();
      id = (data as { id: string } | null)?.id ?? null;
      setPollId(id);
    })();
    return () => { if (id) void createClient().from('polls').update({ is_active: false }).eq('id', id); };
    // opened once, with the discoveries as they were when the vote started
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const top = Math.max(0, ...labels.map((l) => tallies[l] ?? 0));
  const crownTop = () => {
    const leaders = list.filter((_, i) => (tallies[labels[i]] ?? 0) === top);
    onCrown(leaders[Math.floor(Math.random() * leaders.length)]);
  };

  return (
    <div className="absolute inset-x-0 top-3 z-30 mx-auto w-[min(880px,94%)]">
      <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="overflow-hidden rounded-3xl border border-white/15 bg-slate-950/90 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-amber-300"><Sparkles className="h-4 w-4" /> Best discovery of the flight</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <p className="font-display text-3xl leading-tight">What was the best thing we discovered today?</p>
          <p className="mb-4 text-sm text-white/60">Vote on your phone{votes.length ? ` · ${votes.length} vote${votes.length === 1 ? '' : 's'} in` : ''}. Then say why!</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {list.map((d, i) => {
              const n = tallies[labels[i]] ?? 0;
              const r = d.landmarkId ? rarityOf(d.landmarkId) : null;
              const leading = n > 0 && n === top;
              return (
                <button key={d.title} type="button" onClick={() => onCrown(d)} title={`Crown ${labels[i]}`} className={`flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition ${leading ? 'border-amber-300/80 bg-amber-300/10' : 'border-white/12 bg-white/5 hover:border-white/30'}`}>
                  <span className="font-display text-xl leading-tight">{labels[i]}</span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {r && <span className={`rounded-full px-1.5 text-[10px] font-semibold uppercase ${RARITY_STYLE[r]}`}>{r}</span>}
                    {d.photographed && <span className="flex items-center gap-1 text-[11px] text-sky-200"><Camera className="h-3 w-3" /> photo</span>}
                  </span>
                  <span className="mt-auto flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full bg-amber-300 transition-all" style={{ width: `${votes.length ? (n / votes.length) * 100 : 0}%` }} /></span>
                    <span className="font-mono text-sm text-amber-200">{n}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="mr-auto text-xs text-white/45">Click a card to crown it yourself.</span>
            <button type="button" disabled={top === 0} onClick={crownTop} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">
              <Crown className="h-4 w-4" /> Crown the winner
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
