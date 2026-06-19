'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { Scale } from 'lucide-react';

interface DebatePoint {
  id: string;
  client_id: string;
  display_name: string;
  side: string;
  content: string;
  created_at: string;
}

interface DebateBoardPanelProps {
  sessionId: string;
  forLabel?: string;
  againstLabel?: string;
}

const SIDE_META = {
  for: { heading: 'FOR', accent: 'text-sky-300', chip: 'border-sky-500/30 bg-sky-500/10' },
  against: { heading: 'AGAINST', accent: 'text-orange-300', chip: 'border-orange-500/30 bg-orange-500/10' },
} as const;

// Teacher's private monitor of both prep boards. Lives on the cockpit (the
// teacher's device) — never on the shared/projected screen — so neither team's
// prep leaks to the other. Realtime via the debate_points table.
export function DebateBoardPanel({ sessionId, forLabel, againstLabel }: DebateBoardPanelProps) {
  const [points, setPoints] = useState<DebatePoint[]>([]);

  const load = useCallback(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client
      .from('debate_points')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (data) setPoints(data as DebatePoint[]);
  }, [sessionId]);

  useEffect(() => {
    if (isMockMode()) return;
    const supabase = createClient();
    load(supabase);
    const channel = supabase
      .channel(`cockpit-debate-points:${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_points', filter: `session_id=eq.${sessionId}` },
        (payload: { new: DebatePoint }) => setPoints((prev) => [...prev, payload.new]))
      .subscribe();
    const poll = setInterval(() => load(supabase), 4000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [sessionId, load]);

  const labels: Record<'for' | 'against', string> = {
    for: forLabel || 'For',
    against: againstLabel || 'Against',
  };

  return (
    <div className="order-1 overflow-hidden rounded-2xl border border-indigo-400/25 bg-[#0d1f35] shadow-[0_0_28px_rgba(129,140,248,0.10)]">
      <div className="border-b border-white/8 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-indigo-300/80">
          <Scale className="h-3.5 w-3.5" /> Debate Prep Boards
        </p>
        <p className="mt-1 text-xs text-white/35">Both teams&rsquo; points, live. Private to you — not on the display.</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/8">
        {(['for', 'against'] as const).map((side) => {
          const meta = SIDE_META[side];
          const sidePoints = points.filter((p) => p.side === side);
          return (
            <div key={side} className="min-w-0 p-3">
              <div className="mb-2 flex items-center justify-between gap-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${meta.accent}`}>{meta.heading}</span>
                <span className="text-[10px] text-white/35">{sidePoints.length}</span>
              </div>
              <p className="mb-2 truncate text-[11px] text-white/45">{labels[side]}</p>
              {sidePoints.length === 0 ? (
                <p className="text-[11px] italic text-white/30">No points yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {sidePoints.map((p) => (
                    <div key={p.id} className={`rounded-lg border px-2 py-1.5 ${meta.chip}`}>
                      <p className="text-xs leading-snug text-white/90">{p.content}</p>
                      <p className="mt-0.5 text-[10px] text-white/40">{p.display_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
