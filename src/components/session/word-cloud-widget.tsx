'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useSessionStore } from '@/stores/session-store';
import type { InputSpec } from '@/lib/input-spec';

interface WordCloudContentProps {
  sessionId: string;
}

interface CloudItem {
  id: string;
  content: string;
  visibility: 'pending' | 'visible' | 'hidden';
}

const BOARD_KEY = 'word-cloud';

// Distinct, screen-friendly hues; assigned by a stable hash of the word so the
// same word keeps its color as the cloud grows.
const PALETTE = ['#67e8f9', '#a78bfa', '#6ee7b7', '#fcd34d', '#fda4af', '#93c5fd', '#f0abfc', '#5eead4'];

function colorFor(word: string): string {
  let hash = 0;
  for (let i = 0; i < word.length; i++) hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function WordCloudContent({ sessionId }: WordCloudContentProps) {
  const inputSpec = useSessionStore((state) => state.inputSpec);
  const setInputSpec = useSessionStore((state) => state.setInputSpec);

  const [prompt, setPrompt] = useState('');
  const [items, setItems] = useState<CloudItem[]>([]);
  const [clearing, setClearing] = useState(false);

  const isLive =
    inputSpec?.type === 'board' && inputSpec.boardKey === BOARD_KEY && Boolean(inputSpec.boardWordCloud);

  const loadItems = useCallback(async () => {
    if (isMockMode()) return;
    try {
      const res = await fetch(`/api/class-board/items?sessionId=${sessionId}&boardKey=${BOARD_KEY}`);
      if (!res.ok) return;
      const data = (await res.json()) as { items?: CloudItem[] };
      setItems(data.items ?? []);
    } catch {
      // transient; next poll retries
    }
  }, [sessionId]);

  useEffect(() => {
    void loadItems();
    const timer = window.setInterval(() => void loadItems(), 4000);
    return () => window.clearInterval(timer);
  }, [loadItems]);

  useEffect(() => {
    if (isMockMode()) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`word-cloud:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_board_items', filter: `session_id=eq.${sessionId}` },
        () => void loadItems(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems, sessionId]);

  const openForStudents = useCallback(async () => {
    const text = prompt.trim() || 'Add one word';
    const spec: InputSpec = {
      type: 'board',
      gameKey: 'word-cloud',
      prompt: text,
      instruction: 'Add a word to the cloud',
      boardKey: BOARD_KEY,
      boardTitle: 'Word Cloud',
      boardPrompt: text,
      boardWordCloud: true,
      boardAllowVotes: false,
      boardLayout: 'list',
      boardCategories: [{ key: 'word', label: 'Word' }],
      boardZones: [{ key: 'main', label: 'Words' }],
      boardDefaultCategory: 'word',
      boardDefaultZone: 'main',
      maxLength: 24,
      allowMultiple: true,
      placeholder: 'Type one word…',
    };
    await setInputSpec(spec);
  }, [prompt, setInputSpec]);

  const closeForStudents = useCallback(async () => {
    if (isLive) await setInputSpec(null);
  }, [isLive, setInputSpec]);

  const clearWords = useCallback(async () => {
    const live = items.filter((item) => item.visibility !== 'hidden');
    if (live.length === 0 || clearing) return;
    setClearing(true);
    try {
      await Promise.all(
        live.map((item) =>
          fetch('/api/class-board/item', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, itemId: item.id, visibility: 'hidden' }),
          }),
        ),
      );
      void loadItems();
    } finally {
      setClearing(false);
    }
  }, [items, clearing, loadItems, sessionId]);

  const removeWord = useCallback(
    async (normalized: string) => {
      const matching = items.filter(
        (item) => item.visibility !== 'hidden' && item.content.trim().toLowerCase() === normalized,
      );
      if (matching.length === 0) return;
      await Promise.all(
        matching.map((item) =>
          fetch('/api/class-board/item', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, itemId: item.id, visibility: 'hidden' }),
          }),
        ),
      );
      void loadItems();
    },
    [items, loadItems, sessionId],
  );

  // Group by normalized word; size each by frequency relative to the most common.
  const cloud = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const item of items) {
      if (item.visibility === 'hidden') continue;
      const normalized = item.content.trim().toLowerCase();
      if (!normalized) continue;
      const existing = counts.get(normalized);
      if (existing) existing.count += 1;
      else counts.set(normalized, { label: item.content.trim(), count: 1 });
    }
    const arr = Array.from(counts.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count);
    const max = arr.length ? arr[0].count : 1;
    const min = arr.length ? arr[arr.length - 1].count : 1;
    return arr.map((word) => {
      const t = max === min ? 0.5 : (word.count - min) / (max - min);
      return { ...word, size: 16 + t * 36 }; // 16px … 52px
    });
  }, [items]);

  const liveCount = items.filter((item) => item.visibility !== 'hidden').length;

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2 rounded-xl border border-lc-border bg-lc-surface/70 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-lc-text3">Word Cloud</p>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
              isLive ? 'bg-emerald-500/18 text-emerald-300' : 'bg-white/8 text-lc-text3'
            }`}
          >
            {isLive ? 'Live' : 'Closed'}
          </span>
        </div>
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value.slice(0, 120))}
          placeholder="Prompt — e.g. One word for how you feel about…"
          className="w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={openForStudents}
            className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
          >
            {isLive ? 'Update prompt' : 'Open to students'}
          </button>
          <button
            onClick={closeForStudents}
            disabled={!isLive}
            className="rounded-lg border border-lc-border bg-white/5 px-3 py-2 text-xs font-semibold text-lc-text2 transition hover:bg-white/10 disabled:opacity-40"
          >
            Close
          </button>
        </div>
        {liveCount > 0 && (
          <button
            onClick={clearWords}
            disabled={clearing}
            className="w-full rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-1.5 text-[11px] font-semibold text-rose-200/80 transition hover:bg-rose-400/10 disabled:opacity-40"
          >
            {clearing ? 'Clearing…' : `Clear words (${liveCount})`}
          </button>
        )}
      </div>

      {isLive && inputSpec?.boardPrompt && (
        <p className="text-center text-sm font-medium text-cyan-200">{inputSpec.boardPrompt}</p>
      )}

      <div className="flex min-h-[160px] flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-xl border border-white/8 bg-slate-950/40 p-4">
        {cloud.length === 0 ? (
          <p className="text-xs text-lc-text3">No words yet.</p>
        ) : (
          cloud.map((word) => (
            <span key={word.key} className="group relative inline-flex items-baseline">
              <span
                title={`${word.count}`}
                style={{ fontSize: `${word.size}px`, color: colorFor(word.key), lineHeight: 1.1 }}
                className="font-bold transition-all duration-300"
              >
                {word.label}
              </span>
              <button
                type="button"
                onClick={() => removeWord(word.key)}
                title="Remove this word"
                className="absolute -right-2 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-rose-500/85 text-[10px] font-bold leading-none text-white shadow group-hover:flex"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
