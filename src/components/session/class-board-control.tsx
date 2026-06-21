'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { isRankableLayout } from '@/lib/class-board';
import type { InputSpec } from '@/lib/input-spec';

interface ClassBoardControlProps {
  sessionId: string;
  spec: InputSpec;
}

interface BoardItem {
  id: string;
  authorType: 'teacher' | 'student';
  displayName: string;
  category: string;
  zoneKey: string;
  content: string;
  visibility: 'pending' | 'visible' | 'hidden';
  pinned: boolean;
  position: number;
  createdAt: string;
  voteCount: number;
}

export function ClassBoardControl({ sessionId, spec }: ClassBoardControlProps) {
  const boardKey = spec.boardKey ?? 'class-board';
  const zones = useMemo(() => spec.boardZones ?? [{ key: 'main', label: 'Board' }], [spec.boardZones]);
  const rankable = isRankableLayout(spec.boardLayout);

  const [items, setItems] = useState<BoardItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const zoneLabel = useCallback(
    (key: string) => zones.find((zone) => zone.key === key)?.label ?? key,
    [zones],
  );

  const loadItems = useCallback(async () => {
    if (isMockMode()) return;
    try {
      const res = await fetch(
        `/api/class-board/items?sessionId=${sessionId}&boardKey=${encodeURIComponent(boardKey)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { items?: BoardItem[] };
      setItems(data.items ?? []);
    } catch {
      // transient; next poll retries
    }
  }, [boardKey, sessionId]);

  useEffect(() => {
    void loadItems();
    const timer = window.setInterval(() => void loadItems(), 4000);
    return () => window.clearInterval(timer);
  }, [loadItems]);

  useEffect(() => {
    if (isMockMode()) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`class-board-control:${sessionId}:${boardKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_board_items', filter: `session_id=eq.${sessionId}` },
        () => void loadItems(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems, boardKey, sessionId]);

  const patchItem = useCallback(
    async (itemId: string, update: Record<string, unknown>) => {
      setBusyId(itemId);
      try {
        await fetch('/api/class-board/item', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, itemId, ...update }),
        });
        void loadItems();
      } finally {
        setBusyId(null);
      }
    },
    [loadItems, sessionId],
  );

  const pending = items.filter((item) => item.visibility === 'pending');
  const visible = items
    .filter((item) => item.visibility === 'visible')
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (rankable ? a.position - b.position : b.voteCount - a.voteCount) ||
        a.createdAt.localeCompare(b.createdAt),
    );

  const moveRanked = (item: BoardItem, direction: -1 | 1) => {
    const zoneItems = visible
      .filter((candidate) => candidate.zoneKey === item.zoneKey)
      .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
    const currentIndex = zoneItems.findIndex((candidate) => candidate.id === item.id);
    const target = zoneItems[currentIndex + direction];
    if (!target) return;
    void patchItem(item.id, { position: target.position });
    void patchItem(target.id, { position: item.position });
  };

  return (
    <div className="p-3 space-y-3">
      {/* Pending student submissions */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300/80">
          Pending ({pending.length})
        </p>
        {pending.length === 0 ? (
          <p className="mt-1 text-xs text-white/30">No submissions waiting for review.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {pending.map((item) => (
              <div key={item.id} className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-2.5">
                <p className="text-sm text-white">{item.content}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">{item.displayName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {zones.length > 1 && (
                    <select
                      defaultValue={item.zoneKey}
                      onChange={(event) => void patchItem(item.id, { zoneKey: event.target.value })}
                      className="rounded-md border border-white/12 bg-slate-900 px-2 py-1 text-[11px] text-white focus:outline-none"
                    >
                      {zones.map((zone) => (
                        <option key={zone.key} value={zone.key}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void patchItem(item.id, { visibility: 'visible' })}
                    className="rounded-md bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void patchItem(item.id, { visibility: 'hidden' })}
                    className="rounded-md bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/60 hover:bg-white/12 disabled:opacity-40"
                  >
                    Hide
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live board items */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">On the board ({visible.length})</p>
        {visible.length === 0 ? (
          <p className="mt-1 text-xs text-white/30">Nothing approved yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {visible.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white">{item.content}</p>
                  <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">
                    {zoneLabel(item.zoneKey)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {rankable && (
                    <>
                      <button
                        onClick={() => moveRanked(item, -1)}
                        className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-semibold text-white/60 hover:bg-white/12"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveRanked(item, 1)}
                        className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-semibold text-white/60 hover:bg-white/12"
                      >
                        ↓
                      </button>
                    </>
                  )}
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void patchItem(item.id, { pinned: !item.pinned })}
                    className="rounded-md bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/60 hover:bg-white/12 disabled:opacity-40"
                  >
                    {item.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void patchItem(item.id, { visibility: 'hidden' })}
                    className="rounded-md bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/60 hover:bg-white/12 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
