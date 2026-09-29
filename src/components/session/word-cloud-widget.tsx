'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ClipboardList, Crosshair, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useSessionStore } from '@/stores/session-store';
import { useFocusBus } from '@/stores/focus-bus-store';
import { DEFAULT_CLASS_BOARD_KEY, DEFAULT_CLASS_BOARD_PRESET_KEY, normalizeClassBoardKey } from '@/lib/class-board';
import type { InputSpec } from '@/lib/input-spec';
import { KitButton, KitInput, KitSection, KitStatus } from './widget-kit';

interface WordCloudContentProps {
  sessionId: string;
}

interface CloudItem {
  id: string;
  content: string;
  displayName?: string;
  visibility: 'pending' | 'visible' | 'hidden';
}

const BOARD_KEY = 'word-cloud';

// Each word takes the colour of the first student who sent it.
const PALETTE = ['#67e8f9', '#c4b5fd', '#6ee7b7', '#fcd34d', '#fda4af', '#93c5fd', '#f0abfc', '#5eead4'];
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function WordCloudContent({ sessionId }: WordCloudContentProps) {
  const inputSpec = useSessionStore((state) => state.inputSpec);
  const setInputSpec = useSessionStore((state) => state.setInputSpec);
  const topic = useSessionStore((s) => s.settings.customTopic || s.settings.topic);
  const difficulty = useSessionStore((s) => s.settings.difficulty);
  const makeFocus = useFocusBus((s) => s.makeFocus);
  const reduce = useReducedMotion();

  const [prompt, setPrompt] = useState('');
  const [items, setItems] = useState<CloudItem[]>([]);
  const [clearing, setClearing] = useState(false);
  const [merges, setMerges] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

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

  const ai = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/widgets/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, difficulty }),
    });
    return res.ok ? res.json() : null;
  }, [difficulty]);

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

  const hideItems = useCallback(async (list: CloudItem[]) => {
    await Promise.all(list.map((item) => fetch('/api/class-board/item', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, itemId: item.id, visibility: 'hidden' }),
    })));
    void loadItems();
  }, [loadItems, sessionId]);

  const clearWords = useCallback(async () => {
    const live = items.filter((item) => item.visibility !== 'hidden');
    if (live.length === 0 || clearing) return;
    setClearing(true);
    try {
      await hideItems(live);
      setMerges({});
    } finally {
      setClearing(false);
    }
  }, [items, clearing, hideItems]);

  const norm = (w: string) => w.trim().toLowerCase();
  const canonical = useCallback((w: string) => merges[norm(w)] ?? norm(w), [merges]);

  const removeWord = useCallback(async (key: string) => {
    setPicked(null);
    await hideItems(items.filter((item) => item.visibility !== 'hidden' && canonical(item.content) === key));
  }, [canonical, hideItems, items]);

  const promptFromTopic = async () => {
    const t = topic && topic !== 'General' ? topic : '';
    if (!t) { setNote('Set a topic first (the topic bar at the top).'); return; }
    setBusy('prompt');
    try {
      const d = await ai({ action: 'cloudPrompt', topic: t });
      if (d?.prompt) setPrompt(d.prompt);
      else setNote('Could not write a prompt right now.');
    } finally {
      setBusy(null);
    }
  };

  // Merge spelling variants and plurals; quietly hide unkind words.
  const tidy = async () => {
    const live = items.filter((i) => i.visibility !== 'hidden');
    if (!live.length) return;
    setBusy('tidy');
    try {
      const d = await ai({ action: 'cloudTidy', words: live.map((i) => i.content) });
      if (!d) { setNote('Tidy is unavailable right now.'); return; }
      const next: Record<string, string> = { ...merges };
      (d.merge ?? []).forEach((m: { from: string; to: string }) => { next[m.from] = m.to; });
      setMerges(next);
      const blocked = new Set<string>(d.blocked ?? []);
      if (blocked.size) await hideItems(live.filter((i) => blocked.has(norm(i.content))));
      setNote(`Tidied: ${(d.merge ?? []).length} merged${blocked.size ? `, ${blocked.size} hidden` : ''}.`);
    } finally {
      setBusy(null);
    }
  };

  const sendToBoard = async (label: string) => {
    setPicked(null);
    await fetch('/api/class-board/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        boardKey: normalizeClassBoardKey(`${DEFAULT_CLASS_BOARD_KEY}-${DEFAULT_CLASS_BOARD_PRESET_KEY}`),
        authorType: 'teacher',
        displayName: 'Teacher',
        content: label,
        category: 'idea',
        zoneKey: 'main',
        visibility: 'visible',
      }),
    }).catch(() => {});
    setNote(`"${label}" is on the Class Board.`);
  };

  // Group by (tidied) word; size by frequency relative to the most common.
  const cloud = useMemo(() => {
    const counts = new Map<string, { label: string; count: number; color: string }>();
    for (const item of items) {
      if (item.visibility === 'hidden') continue;
      const key = canonical(item.content);
      if (!key) continue;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { label: merges[norm(item.content)] ?? item.content.trim(), count: 1, color: colorFor(item.displayName || key) });
    }
    const arr = Array.from(counts.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count);
    const max = arr.length ? arr[0].count : 1;
    const min = arr.length ? arr[arr.length - 1].count : 1;
    return arr.map((word) => {
      const t = max === min ? 0.5 : (word.count - min) / (max - min);
      return { ...word, size: 16 + t * 40 }; // 16px … 56px
    });
  }, [canonical, items, merges]);

  const liveCount = items.filter((item) => item.visibility !== 'hidden').length;

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <KitStatus state={isLive ? 'live' : liveCount ? 'closed' : 'draft'} count={liveCount} countLabel={liveCount === 1 ? 'word' : 'words'} />
        <KitButton tone="violet" icon={<Sparkles className="h-3.5 w-3.5" />} disabled={busy === 'prompt'} onClick={() => void promptFromTopic()}>
          {busy === 'prompt' ? 'Writing…' : 'Prompt from topic'}
        </KitButton>
      </div>

      <KitSection label="Prompt">
        <KitInput value={prompt} onChange={(event) => setPrompt(event.target.value.slice(0, 120))} placeholder="e.g. One word for how rivers make you feel" />
      </KitSection>

      <div className="flex flex-wrap gap-1.5">
        <KitButton tone="amber" solid className="flex-1" onClick={() => void openForStudents()}>{isLive ? 'Update prompt' : 'Open to students'}</KitButton>
        {isLive && <KitButton onClick={() => void closeForStudents()}>Close</KitButton>}
        {liveCount > 1 && (
          <KitButton tone="violet" icon={<Wand2 className="h-3.5 w-3.5" />} disabled={busy === 'tidy'} onClick={() => void tidy()}>
            {busy === 'tidy' ? 'Tidying…' : 'Tidy'}
          </KitButton>
        )}
        {liveCount > 0 && (
          <KitButton tone="rose" icon={<Trash2 className="h-3.5 w-3.5" />} disabled={clearing} onClick={() => void clearWords()}>
            {clearing ? 'Clearing…' : 'Clear'}
          </KitButton>
        )}
      </div>
      {note && <button type="button" onClick={() => setNote(null)} className="text-left text-xs text-amber-200/80">{note}</button>}

      {isLive && inputSpec?.boardPrompt && (
        <p className="text-center font-display text-lg text-white">{inputSpec.boardPrompt}</p>
      )}

      <div className="relative flex min-h-[180px] flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-black/20 p-5">
        {cloud.length === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Words appear here as students send them</p>
        ) : (
          <AnimatePresence initial={false}>
            {cloud.map((word) => (
              <motion.button
                key={word.key}
                type="button"
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1, fontSize: `${word.size}px` }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                onClick={() => setPicked(picked === word.key ? null : word.key)}
                title={`${word.count} student${word.count === 1 ? '' : 's'}`}
                style={{ color: word.color, lineHeight: 1.1 }}
                className={`font-bold [text-shadow:0_2px_10px_rgba(0,0,0,.35)] ${picked === word.key ? 'underline decoration-2 underline-offset-4' : ''}`}
              >
                {word.label}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
        {picked && (() => {
          const word = cloud.find((w) => w.key === picked);
          if (!word) return null;
          return (
            <div className="mt-2 flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/90 p-2 backdrop-blur-md">
              <span className="mr-1 font-display text-base text-white">{word.label}</span>
              {makeFocus && (
                <KitButton tone="amber" icon={<Crosshair className="h-3.5 w-3.5" />} onClick={() => { makeFocus({ title: word.label, credit: 'the word cloud' }); setPicked(null); }}>
                  Make it the topic
                </KitButton>
              )}
              <KitButton tone="cyan" icon={<ClipboardList className="h-3.5 w-3.5" />} onClick={() => void sendToBoard(word.label)}>To the board</KitButton>
              <KitButton tone="rose" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => void removeWord(word.key)}>Remove</KitButton>
              <button type="button" onClick={() => setPicked(null)} className="ml-auto text-white/50 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
