'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, EyeOff } from 'lucide-react';
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

export function BoardInbox({ sessionId }: { sessionId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [cards, setCards] = useState<PendingCard[]>([]);

  const load = useCallback(async () => {
    if (isMockMode()) return;
    const { data } = await supabase
      .from('class_board_items')
      .select('id, content, display_name, zone_key, created_at')
      .eq('session_id', sessionId)
      .eq('visibility', 'pending')
      .eq('author_type', 'student')
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
