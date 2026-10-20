'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';

/**
 * Class Board approvals in the teacher's private window: students' cards wait
 * here (off the shared screen) until the teacher shows or hides them. The
 * board's Auto-show switch skips this step for trusted classes.
 */
interface PendingCard {
  id: string;
  content: string;
  display_name: string | null;
  zone_key: string;
  created_at: string;
}

export function BoardInbox({ sessionId, roster = [] }: { sessionId: string; roster?: string[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [cards, setCards] = useState<PendingCard[]>([]);
  // Private help while answers come in: who has not answered yet, and a few answers worth hearing aloud
  const [recent, setRecent] = useState<PendingCard[]>([]);
  const [picks, setPicks] = useState<Array<{ id: string; why: string }> | null>(null);
  const [picking, setPicking] = useState(false);
  const loadRecent = useCallback(async () => {
    if (isMockMode()) return;
    const since = new Date(Date.now() - 45 * 60_000).toISOString();
    const { data } = await supabase
      .from('class_board_items')
      .select('id, content, display_name, zone_key, created_at')
      .eq('session_id', sessionId)
      .eq('author_type', 'student')
      .neq('visibility', 'hidden')
      .not('board_key', 'in', '("word-cloud","exit-ticket")')
      .gte('created_at', since)
      .order('created_at', { ascending: true });
    if (data) setRecent(data as PendingCard[]);
  }, [sessionId, supabase]);
  useEffect(() => {
    void loadRecent();
    const t = window.setInterval(() => { void loadRecent(); }, 5000);
    return () => window.clearInterval(t);
  }, [loadRecent]);
  const answeredNames = new Set(recent.map((c) => c.display_name ?? ''));
  const notAnswered = roster.filter((name) => !answeredNames.has(name));
  const pickVoices = async () => {
    setPicking(true);
    try {
      const res = await fetch('/api/class-board/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pick', items: recent.map((c) => ({ id: c.id, text: c.content })) }) });
      const d = res.ok ? await res.json() : null;
      setPicks(Array.isArray(d?.picks) ? d.picks : []);
    } finally { setPicking(false); }
  };

  const load = useCallback(async () => {
    if (isMockMode()) return;
    const { data } = await supabase
      .from('class_board_items')
      .select('id, content, display_name, zone_key, created_at')
      .eq('session_id', sessionId)
      .eq('visibility', 'pending')
      .eq('author_type', 'student')
      // Word cloud words and exit tickets aren't board cards to approve.
      .not('board_key', 'in', '("word-cloud","exit-ticket")')
      .order('created_at', { ascending: true });
    if (data) setCards(data as PendingCard[]);
  }, [sessionId, supabase]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => { void load(); }, 3000);
    return () => window.clearInterval(t);
  }, [load]);

  const setVisibility = async (ids: string[], visibility: 'visible' | 'hidden') => {
    setCards((prev) => prev.filter((c) => !ids.includes(c.id)));
    await supabase.from('class_board_items').update({ visibility, updated_at: new Date().toISOString() }).in('id', ids).eq('session_id', sessionId);
    void load();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto pr-1">
      {recent.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
          {roster.length > 0 && (
            <p className="text-xs text-white/70">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">Not answered yet · {notAnswered.length} of {roster.length}</span>
              {notAnswered.length > 0 && <span className="mt-1 block text-white/80">{notAnswered.join(', ')}</span>}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/80">Who to call on</span>
            <button type="button" disabled={picking || recent.length < 2} onClick={() => void pickVoices()} className="flex items-center gap-1 rounded-lg border border-cyan-300/40 px-2 py-0.5 text-[11px] text-cyan-100 hover:bg-cyan-300/10 disabled:opacity-50"><Sparkles className="h-3 w-3" /> {picking ? 'Thinking…' : picks ? 'Again' : 'Suggest'}</button>
          </div>
          {picks && picks.length === 0 && <p className="mt-1 text-xs text-white/50">No suggestion right now.</p>}
          {picks?.map((p) => {
            const c = recent.find((x) => x.id === p.id);
            return c ? (
              <div key={p.id} className="mt-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                <p className="text-xs text-white"><b>{c.display_name ?? 'A student'}</b>: {c.content}</p>
                <p className="text-[11px] text-cyan-100/70">{p.why}</p>
              </div>
            ) : null;
          })}
        </div>
      )}
      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/50">
          No cards waiting. When students add to the Class Board, the button in the room lights up and their cards wait here.
        </p>
      ) : (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-white/70">{cards.length} card{cards.length === 1 ? '' : 's'} waiting</p>
          <button type="button" onClick={() => void setVisibility(cards.map((c) => c.id), 'visible')} className="rounded-lg border border-emerald-300/40 px-2.5 py-1 text-xs text-emerald-100 hover:bg-emerald-300/10">
            Show all
          </button>
        </div>
      )}
      {cards.map((c) => (
        <div key={c.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug text-white">{c.content}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">{c.display_name ?? 'A student'} · {c.zone_key}</p>
          </div>
          <button type="button" title="Show on the board" onClick={() => void setVisibility([c.id], 'visible')} className="rounded-lg border border-emerald-300/40 p-1.5 text-emerald-200 hover:bg-emerald-300/10">
            <Check className="h-4 w-4" />
          </button>
          <button type="button" title="Hide" onClick={() => void setVisibility([c.id], 'hidden')} className="rounded-lg border border-white/15 p-1.5 text-white/60 hover:text-white">
            <EyeOff className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
