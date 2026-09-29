'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { isMockMode } from '@/lib/mock/auth';
import { useSessionStore } from '@/stores/session-store';
import type { InputSpec } from '@/lib/input-spec';
import { KitButton, KitLabel, KitSection, KitStatus } from '../widget-kit';

/**
 * Exit ticket: before landing, each student sends one thing they learned and
 * one word for how they feel. The widget shows the class mood (a small cloud)
 * and what was learned, without names, so it's safe on the shared screen.
 * Runs on the class board data (board key "exit-ticket"); no approval step.
 */
const BOARD_KEY = 'exit-ticket';

interface TicketItem { id: string; zoneKey: string; content: string; visibility: string }

export function ExitTicketContent({ sessionId }: { sessionId: string }) {
  const inputSpec = useSessionStore((s) => s.inputSpec);
  const setInputSpec = useSessionStore((s) => s.setInputSpec);
  const [items, setItems] = useState<TicketItem[]>([]);
  const isLive = inputSpec?.type === 'board' && inputSpec.boardKey === BOARD_KEY;

  const load = useCallback(async () => {
    if (isMockMode()) return;
    try {
      const res = await fetch(`/api/class-board/items?sessionId=${sessionId}&boardKey=${BOARD_KEY}`);
      if (!res.ok) return;
      const data = (await res.json()) as { items?: TicketItem[] };
      setItems(data.items ?? []);
    } catch { /* next poll retries */ }
  }, [sessionId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(t);
  }, [load]);

  const open = async () => {
    const spec: InputSpec = {
      type: 'board',
      gameKey: 'exit-ticket',
      prompt: 'Before we land: one thing you learned, and one word for how you feel.',
      instruction: 'Exit ticket',
      boardKey: BOARD_KEY,
      boardTitle: 'Exit ticket',
      boardPrompt: 'One thing you learned, and one word for how you feel',
      boardAllowVotes: false,
      boardLayout: 't-chart',
      boardCategories: [{ key: 'ticket', label: 'Ticket' }],
      boardZones: [
        { key: 'learned', label: 'One thing I learned' },
        { key: 'feel', label: 'How I feel (one word)' },
      ],
      boardDefaultCategory: 'ticket',
      boardDefaultZone: 'learned',
      maxLength: 160,
      allowMultiple: true,
    };
    await setInputSpec(spec);
  };

  const live = items.filter((i) => i.visibility !== 'hidden');
  const learned = live.filter((i) => i.zoneKey === 'learned');
  const moods = useMemo(() => {
    const m = new Map<string, number>();
    live.filter((i) => i.zoneKey === 'feel').forEach((i) => {
      const w = i.content.trim().toLowerCase().split(/\s+/)[0];
      if (w) m.set(w, (m.get(w) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [live]);
  const topMood = moods[0]?.[1] ?? 1;

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <KitStatus state={isLive ? 'live' : live.length ? 'closed' : 'draft'} count={learned.length} countLabel="tickets" />
        {isLive
          ? <KitButton onClick={() => void setInputSpec(null)}>Close</KitButton>
          : <KitButton tone="amber" solid onClick={() => void open()}>Open exit ticket</KitButton>}
      </div>

      <KitSection label="Class mood">
        {moods.length ? (
          <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-black/20 p-3">
            {moods.map(([w, n]) => (
              <span key={w} className="font-bold text-rose-200" style={{ fontSize: `${14 + (n / topMood) * 20}px` }} title={`${n}`}>{w}</span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/45">Mood words appear here.</p>
        )}
      </KitSection>

      <KitSection label="What we learned">
        {learned.length ? (
          <ul className="max-h-60 space-y-1.5 overflow-y-auto">
            {learned.map((i) => (
              <li key={i.id} className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] px-2.5 py-1.5 text-sm text-white/90">{i.content}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-white/45">Answers appear here (no names).</p>
        )}
      </KitSection>
      <KitLabel className="text-center">Coming soon: saved to the class Logbook</KitLabel>
    </div>
  );
}
