'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus, Check, X, EyeOff, Zap, CircleDot, Sparkles, Wand2, Shapes, Crosshair, Archive } from 'lucide-react';
import { useFocusBus } from '@/stores/focus-bus-store';
import { useLiveRoomStore } from '@/stores/live-room-store';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useSessionStore } from '@/stores/session-store';
import {
  CLASS_BOARD_PRESETS,
  DEFAULT_CLASS_BOARD_KEY,
  DEFAULT_CLASS_BOARD_PRESET_KEY,
  boardSpecFields,
  getClassBoardPreset,
  isRankableLayout,
  normalizeClassBoardKey,
  type ClassBoardLayout,
  type ClassBoardPreset,
  type ClassBoardZone,
} from '@/lib/class-board';
import type { InputSpec } from '@/lib/input-spec';

interface ClassBoardCanvasProps {
  sessionId: string;
  /** Base board namespace. World Lens passes a per-round key; the widget defaults to `class-board`. */
  boardKey?: string;
  /** When set, the template is locked to this preset (World Lens, Wonder Board) — no switcher, liveness managed externally. */
  presetKey?: string;
  /** Question-wall mode (Wonder Board): each item is a question that can be answered + replied to. */
  questionWall?: boolean;
  /** Force live vote-ranking: items auto-sort by upvotes even on a rankable layout (Out & About). */
  sortByVotes?: boolean;
  /** Replace the preset's zones (e.g. Out & About uses one zone per real attraction). */
  zonesOverride?: ClassBoardZone[];
  /**
   * Show student items immediately, without cockpit approval. The submit API stores every
   * student item as 'pending' — for live-discussion boards (Out & About) that queue would
   * swallow the notes, so the canvas renders pending items as normal cards.
   */
  includePending?: boolean;
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
  answer: string | null;
  answerType: string | null;
  answeredAt: string | null;
  parentId: string | null;
}

/** Sticky-note colours; each student keeps one colour for the whole board. */
const NOTE_COLORS = ['#fde68a', '#fbcfe8', '#bbf7d0', '#bae6fd', '#ddd6fe', '#fed7aa', '#fecaca', '#d9f99d'];
function noteColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NOTE_COLORS[h % NOTE_COLORS.length];
}

/** Tailwind grid columns for each board layout. Literal classes so Tailwind keeps them. */
function columnsClass(layout: ClassBoardLayout, zoneCount: number): string {
  switch (layout) {
    case 't-chart':
    case 'quadrants':
      return 'sm:grid-cols-2';
    case 'venn':
    case 'image-evidence':
      return 'lg:grid-cols-3';
    case 'columns':
      if (zoneCount <= 1) return 'grid-cols-1';
      if (zoneCount === 2) return 'sm:grid-cols-2';
      if (zoneCount === 3) return 'sm:grid-cols-2 lg:grid-cols-3';
      if (zoneCount === 4) return 'sm:grid-cols-2 lg:grid-cols-4';
      return 'sm:grid-cols-2 lg:grid-cols-3'; // 5+ wraps onto multiple rows
    default:
      return 'grid-cols-1';
  }
}

export function ClassBoardCanvas({ sessionId, boardKey, presetKey, questionWall = false, sortByVotes = false, zonesOverride, includePending = false }: ClassBoardCanvasProps) {
  const templateLocked = Boolean(presetKey);
  const [selectedPresetKey, setSelectedPresetKey] = useState(presetKey ?? DEFAULT_CLASS_BOARD_PRESET_KEY);
  // AI: a board designed for the current topic (fresh board) and theme sections (same board).
  const [aiPreset, setAiPreset] = useState<ClassBoardPreset | null>(null);
  const [zonesCustom, setZonesCustom] = useState<ClassBoardZone[] | null>(null);
  const [fixes, setFixes] = useState<Record<string, string>>({});
  const [polishOn, setPolishOn] = useState(false);
  const [hiddenFixes, setHiddenFixes] = useState<Set<string>>(new Set());
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const preset = useMemo(() => aiPreset ?? getClassBoardPreset(selectedPresetKey), [aiPreset, selectedPresetKey]);
  const topic = useSessionStore((state) => state.settings.customTopic || state.settings.topic);
  const difficulty = useSessionStore((state) => state.settings.difficulty);
  const makeFocus = useFocusBus((state) => state.makeFocus);
  const addRoomItem = useLiveRoomStore((state) => state.add);

  const inputSpec = useSessionStore((state) => state.inputSpec);
  const setInputSpec = useSessionStore((state) => state.setInputSpec);

  const [items, setItems] = useState<BoardItem[]>([]);
  const [zoneLabels, setZoneLabels] = useState<Record<string, string>>({});
  const [addingZoneKey, setAddingZoneKey] = useState<string | null>(null);
  const [addText, setAddText] = useState('');
  const [editingZoneKey, setEditingZoneKey] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingZone, setSavingZone] = useState<string | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [busyAnswerId, setBusyAnswerId] = useState<string | null>(null);
  // Board modes (teacher controls on the board header).
  const [anonymous, setAnonymous] = useState(false);
  const [autoShow, setAutoShow] = useState(false);
  const [dotsRevealed, setDotsRevealed] = useState(false);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemText, setEditItemText] = useState('');
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);
  const reduce = useReducedMotion();

  const base = boardKey ?? DEFAULT_CLASS_BOARD_KEY;
  const activeBoardKey = normalizeClassBoardKey(templateLocked ? base : `${base}-${aiPreset ? aiPreset.key : selectedPresetKey}`);

  // Zones with any teacher-renamed titles applied. `zonesOverride` (e.g. one zone per real
  // attraction in Out & About) replaces the preset's default zones as the base.
  const baseZones = zonesOverride ?? zonesCustom ?? preset.zones;
  const zones: ClassBoardZone[] = useMemo(
    () => baseZones.map((zone) => ({ ...zone, label: zoneLabels[zone.key] ?? zone.label })),
    [baseZones, zoneLabels],
  );

  const isLive = inputSpec?.type === 'board' && inputSpec.boardKey === activeBoardKey;
  const rankable = isRankableLayout(preset.layout);

  // In question-wall mode, follow-up replies (parentId set) thread under their parent
  // rather than appearing as their own cards in a zone.
  const visibleItems = useMemo(
    () =>
      items
        .filter((item) =>
          (item.visibility === 'visible' || (includePending && item.visibility === 'pending')) &&
          !(questionWall && item.parentId))
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            (rankable && !sortByVotes
              ? a.position - b.position || a.createdAt.localeCompare(b.createdAt)
              : (questionWall || sortByVotes || dotsRevealed ? b.voteCount - a.voteCount : 0) || a.createdAt.localeCompare(b.createdAt)),
        ),
    [items, rankable, questionWall, sortByVotes, includePending, dotsRevealed],
  );

  const repliesFor = useCallback(
    (parentId: string) =>
      items
        .filter((item) => item.visibility === 'visible' && item.parentId === parentId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [items],
  );

  // Reset renamed titles when the template changes.
  useEffect(() => {
    setZoneLabels({});
    setAddingZoneKey(null);
    setEditingZoneKey(null);
  }, [selectedPresetKey]);

  useEffect(() => {
    if (presetKey) setSelectedPresetKey(presetKey);
  }, [presetKey]);

  const loadItems = useCallback(async () => {
    if (isMockMode()) return;
    try {
      const res = await fetch(
        `/api/class-board/items?sessionId=${sessionId}&boardKey=${encodeURIComponent(activeBoardKey)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { items?: BoardItem[] };
      setItems(data.items ?? []);
    } catch {
      // transient; next poll retries
    }
  }, [activeBoardKey, sessionId]);

  useEffect(() => {
    void loadItems();
    const timer = window.setInterval(() => void loadItems(), 5000);
    return () => window.clearInterval(timer);
  }, [loadItems]);

  useEffect(() => {
    if (isMockMode()) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`class-board-canvas:${sessionId}:${activeBoardKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_board_items', filter: `session_id=eq.${sessionId}` },
        () => void loadItems(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems, activeBoardKey, sessionId]);

  // Teacher edits: move between zones, edit text (optimistic, then saved).
  const patchItem = useCallback(async (itemId: string, patch: Partial<Pick<BoardItem, 'zoneKey' | 'content' | 'visibility'>>) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));
    try {
      await fetch('/api/class-board/item', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, itemId, ...patch }),
      });
    } finally {
      void loadItems();
    }
  }, [loadItems, sessionId]);

  const callAi = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/class-board/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, difficulty }),
    });
    return res.ok ? res.json() : null;
  }, [difficulty]);

  const broadcast = useCallback(async (p: ClassBoardPreset, z: ClassBoardZone[], key: string) => {
    await setInputSpec({
      type: 'board', gameKey: 'class-board', prompt: p.prompt, instruction: 'Add to the class board',
      maxLength: 280, allowMultiple: true, ...boardSpecFields(p, key, z),
    });
  }, [setInputSpec]);

  // A fresh board designed for whatever the class is talking about.
  const boardFromTopic = useCallback(async () => {
    const t = topic && topic !== 'General' ? topic : '';
    if (!t) { setAiNote('Set a topic first (the topic bar at the top).'); return; }
    setAiBusy('zones');
    try {
      const d = await callAi({ action: 'zones', topic: t });
      if (!d?.zones) { setAiNote('Could not design a board right now.'); return; }
      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + Date.now().toString(36).slice(-4);
      const zones: ClassBoardZone[] = d.zones.map((z: { label: string; description: string }, i: number) => ({ key: `z${i + 1}`, label: z.label, description: z.description }));
      const p: ClassBoardPreset = { ...getClassBoardPreset(DEFAULT_CLASS_BOARD_PRESET_KEY), key: `topic-${slug}`, title: d.title, prompt: d.prompt || `Add your ideas about ${t}`, layout: 'columns', zones };
      setZonesCustom(null);
      setAiPreset(p);
      setFixes({});
      if (isLive) await broadcast(p, zones, normalizeClassBoardKey(`${base}-${p.key}`));
    } finally {
      setAiBusy(null);
    }
  }, [base, broadcast, callAi, isLive, topic]);

  const studentCards = useMemo(() => visibleItems.filter((i) => i.authorType === 'student'), [visibleItems]);

  // Gentle correction under students' sentences (the teacher can hide any one).
  const togglePolish = useCallback(async () => {
    if (polishOn) { setPolishOn(false); return; }
    setPolishOn(true);
    const todo = studentCards.filter((i) => !(i.id in fixes));
    if (!todo.length) return;
    setAiBusy('polish');
    try {
      const d = await callAi({ action: 'polish', items: todo.map((i) => ({ id: i.id, text: i.content })) });
      if (!d) { setPolishOn(false); setAiNote('Polish is unavailable right now. Try again in a moment.'); return; }
      const next: Record<string, string> = {};
      todo.forEach((i) => { next[i.id] = ''; });
      (d?.fixes ?? []).forEach((f: { id: string; corrected: string }) => { next[f.id] = f.corrected; });
      setFixes((prev) => ({ ...prev, ...next }));
    } finally {
      setAiBusy(null);
    }
  }, [callAi, fixes, polishOn, studentCards]);

  // Sort the cards into named themes (same board, new sections).
  const groupThemes = useCallback(async () => {
    if (visibleItems.length < 3) { setAiNote('Group into themes works once there are a few cards.'); return; }
    setAiBusy('themes');
    try {
      const d = await callAi({ action: 'themes', items: visibleItems.map((i) => ({ id: i.id, text: i.content })) });
      const themes: Array<{ label: string; ids: string[] }> = d?.themes ?? [];
      if (!themes.length) { setAiNote('Could not find themes right now.'); return; }
      const zones: ClassBoardZone[] = themes.map((t, i) => ({ key: `theme-${i + 1}`, label: t.label }));
      setZonesCustom(zones);
      themes.forEach((t, i) => t.ids.forEach((id) => { void patchItem(id, { zoneKey: `theme-${i + 1}` }); }));
      if (isLive) await broadcast(preset, zones, activeBoardKey);
    } finally {
      setAiBusy(null);
    }
  }, [activeBoardKey, broadcast, callAi, isLive, patchItem, preset, visibleItems]);

  const boardAsText = useCallback(() => zones
    .map((z) => {
      const lines = visibleItems.filter((i) => i.zoneKey === z.key).map((i) => `- ${i.content}`);
      return lines.length ? `${z.label}:\n${lines.join('\n')}` : '';
    })
    .filter(Boolean)
    .join('\n\n'), [visibleItems, zones]);

  // Auto-show: student cards appear without waiting for approval.
  useEffect(() => {
    if (!autoShow) return;
    items.filter((i) => i.visibility === 'pending' && i.authorType === 'student').forEach((i) => { void patchItem(i.id, { visibility: 'visible' }); });
  }, [autoShow, items, patchItem]);

  const buildSpec = useCallback(
    (nextPreset: ClassBoardPreset, nextZones: ClassBoardZone[]): InputSpec => ({
      type: 'board',
      gameKey: 'class-board',
      prompt: nextPreset.prompt,
      instruction: 'Add to the class board',
      maxLength: 280,
      allowMultiple: true,
      ...boardSpecFields(nextPreset, activeBoardKey, nextZones),
    }),
    [activeBoardKey],
  );

  const openForStudents = useCallback(async () => {
    await setInputSpec(buildSpec(preset, zones));
  }, [buildSpec, preset, setInputSpec, zones]);

  const closeForStudents = useCallback(async () => {
    if (isLive) await setInputSpec(null);
  }, [isLive, setInputSpec]);

  const selectPreset = useCallback(
    async (key: string) => {
      const wasLive = isLive;
      setSelectedPresetKey(key);
      setAiPreset(null);
      setZonesCustom(null);
      // If students are already on this board, rebroadcast so their devices rebuild too.
      if (wasLive) {
        const nextPreset = getClassBoardPreset(key);
        const nextKey = normalizeClassBoardKey(`${base}-${key}`);
        await setInputSpec({
          type: 'board',
          gameKey: 'class-board',
          prompt: nextPreset.prompt,
          instruction: 'Add to the class board',
          maxLength: 280,
          allowMultiple: true,
          ...boardSpecFields(nextPreset, nextKey, nextPreset.zones),
        });
      }
    },
    [base, isLive, setInputSpec],
  );

  const addTeacherItem = useCallback(
    async (zoneKey: string) => {
      const content = addText.trim();
      if (!content || savingZone) return;
      setSavingZone(zoneKey);
      try {
        const res = await fetch('/api/class-board/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            boardKey: activeBoardKey,
            authorType: 'teacher',
            displayName: 'Teacher',
            content,
            category: preset.defaultCategory,
            zoneKey,
            visibility: 'visible',
            position: rankable ? visibleItems.filter((i) => i.zoneKey === zoneKey).length + 1 : 0,
          }),
        });
        if (res.ok) {
          setAddText('');
          setAddingZoneKey(null);
          void loadItems();
        }
      } finally {
        setSavingZone(null);
      }
    },
    [addText, activeBoardKey, loadItems, preset.defaultCategory, rankable, savingZone, sessionId, visibleItems],
  );

  const saveZoneLabel = useCallback(
    async (zoneKey: string) => {
      const label = editText.trim();
      setEditingZoneKey(null);
      if (!label) return;
      const nextLabels = { ...zoneLabels, [zoneKey]: label };
      setZoneLabels(nextLabels);
      if (isLive) {
        const nextZones = baseZones.map((zone) => ({ ...zone, label: nextLabels[zone.key] ?? zone.label }));
        await setInputSpec(buildSpec(preset, nextZones));
      }
    },
    [buildSpec, baseZones, editText, isLive, preset, setInputSpec, zoneLabels],
  );

  const answerQuestion = useCallback(
    async (itemId: string, type: 'ai' | 'teacher') => {
      if (busyAnswerId) return;
      if (type === 'teacher' && !answerText.trim()) return;
      setBusyAnswerId(itemId);
      try {
        const res = await fetch('/api/class-board/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            itemId,
            answerType: type,
            answerText: type === 'teacher' ? answerText.trim() : undefined,
          }),
        });
        if (res.ok) {
          setAnsweringId(null);
          setAnswerText('');
          void loadItems();
        }
      } finally {
        setBusyAnswerId(null);
      }
    },
    [answerText, busyAnswerId, loadItems, sessionId],
  );

  const itemsForZone = useCallback(
    (zoneKey: string) => visibleItems.filter((item) => item.zoneKey === zoneKey),
    [visibleItems],
  );

  const renderQuestionExtras = (item: BoardItem) => {
    const replies = repliesFor(item.id);
    const isAnswering = answeringId === item.id;
    return (
      <div className="mt-2 space-y-2">
        {item.answer ? (
          <div className="rounded-md border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">
              {item.answerType === 'ai' ? 'AI answer' : 'Answer'}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-emerald-50">{item.answer}</p>
          </div>
        ) : isAnswering ? (
          <div className="rounded-md border border-cyan-400/30 bg-slate-900/70 p-2">
            <textarea
              autoFocus
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value.slice(0, 300))}
              rows={2}
              placeholder="Type an answer…"
              className="w-full resize-none rounded-md border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
                onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                className="rounded-md px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => void answerQuestion(item.id, 'teacher')}
                disabled={!answerText.trim() || busyAnswerId === item.id}
                className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setAnsweringId(item.id)}
              className="rounded-md bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-lc-text3 hover:bg-white/12"
            >
              Answer
            </button>
            <button
              onClick={() => void answerQuestion(item.id, 'ai')}
              disabled={busyAnswerId === item.id}
              className="rounded-md bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-200 hover:bg-violet-500/25 disabled:opacity-40"
            >
              {busyAnswerId === item.id ? 'Thinking…' : 'Quick Answer'}
            </button>
          </div>
        )}

        {replies.length > 0 && (
          <div className="space-y-1 border-l border-white/10 pl-2">
            {replies.map((reply) => (
              <p key={reply.id} className="text-[11px] leading-snug text-slate-300">
                <span className="text-slate-500">{reply.displayName}: </span>
                {reply.content}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderZone = (zone: ClassBoardZone, index: number) => {
    const zoneItems = itemsForZone(zone.key);
    const isAdding = addingZoneKey === zone.key;
    const isEditing = editingZoneKey === zone.key;
    return (
      <div
        key={zone.key}
        onDragOver={(e) => { if (dragItemId.current) { e.preventDefault(); setDragOverZone(zone.key); } }}
        onDragLeave={() => setDragOverZone((z) => (z === zone.key ? null : z))}
        onDrop={(e) => {
          e.preventDefault();
          const id = dragItemId.current;
          setDragOverZone(null);
          if (id) void patchItem(id, { zoneKey: zone.key });
        }}
        className={`flex min-h-[140px] flex-col rounded-xl border p-3 transition-colors ${dragOverZone === zone.key ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/10 bg-slate-950/40'}`}
      >
        <div className="mb-2 border-b border-white/8 pb-2">
          {isEditing && !templateLocked ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={editText}
                onChange={(event) => setEditText(event.target.value.slice(0, 60))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void saveZoneLabel(zone.key);
                  if (event.key === 'Escape') setEditingZoneKey(null);
                }}
                className="w-full rounded-md border border-cyan-400/40 bg-slate-900 px-2 py-1 text-sm font-bold text-white focus:outline-none"
              />
              <button onClick={() => void saveZoneLabel(zone.key)} className="text-emerald-300 hover:text-emerald-200">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={templateLocked}
              onClick={() => {
                setEditingZoneKey(zone.key);
                setEditText(zone.label);
              }}
              className="block w-full text-left disabled:cursor-default"
            >
              <span className="text-sm font-bold uppercase tracking-wide text-cyan-100">{zone.label}</span>
              {zone.description ? <span className="mt-0.5 block text-[11px] text-slate-400">{zone.description}</span> : null}
            </button>
          )}
        </div>

        {/* One section: notes tile like a wall. Several sections: a column each. */}
        <div className={zones.length === 1 && !questionWall ? 'grid flex-1 content-start gap-2 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]' : 'flex-1 space-y-2'}>
          <AnimatePresence initial={false}>
          {zoneItems.map((item, itemIndex) => {
            const student = item.authorType === 'student';
            const color = student ? noteColor(item.displayName) : undefined;
            const editing = editingItemId === item.id;
            return (
            <motion.div
              key={item.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.6, x: 60, y: 40, rotate: 6 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: student ? ((item.id.charCodeAt(0) % 5) - 2) * 0.6 : 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              draggable={!questionWall && !editing}
              onDragStart={(e) => { dragItemId.current = item.id; (e as unknown as DragEvent).dataTransfer?.setData('text/plain', item.id); }}
              onDragEnd={() => { dragItemId.current = null; setDragOverZone(null); }}
              onClick={() => { if (!editing) setSpotlightId(item.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); setEditItemText(item.content); }}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm leading-snug shadow-[0_4px_12px_rgba(0,0,0,.25)] ${
                student ? 'text-[#1f2430]' : 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-50'
              }`}
              style={student ? { background: color } : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {rankable && <span className={`mr-2 font-game ${student ? 'text-[#1f2430]/70' : 'text-cyan-300'}`}>{itemIndex + 1}.</span>}
                  {editing ? (
                    <textarea
                      autoFocus
                      value={editItemText}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditItemText(e.target.value.slice(0, 280))}
                      onBlur={() => { setEditingItemId(null); if (editItemText.trim() && editItemText.trim() !== item.content) void patchItem(item.id, { content: editItemText.trim() }); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
                        if (e.key === 'Escape') { setEditItemText(item.content); setEditingItemId(null); }
                      }}
                      rows={2}
                      className="w-full resize-none rounded bg-white/60 px-1 text-sm text-[#1f2430] focus:outline-none"
                    />
                  ) : (
                    <span>{item.content}</span>
                  )}
                  {polishOn && fixes[item.id] && !hiddenFixes.has(item.id) && (
                    <span className="mt-1 flex items-start gap-1 rounded bg-white/55 px-1.5 py-0.5 text-[13px] text-emerald-900">
                      <Wand2 className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="flex-1">{fixes[item.id]}</span>
                      <button
                        type="button"
                        title="Hide this correction"
                        onClick={(e) => { e.stopPropagation(); setHiddenFixes((prev) => new Set(prev).add(item.id)); }}
                        className="shrink-0 text-emerald-900/50 hover:text-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {student && !anonymous && (
                    <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-[#1f2430]/55">{item.displayName}</span>
                  )}
                </div>
                {item.voteCount > 0 && (questionWall || dotsRevealed) && (
                  <span className="flex shrink-0 flex-wrap justify-end gap-0.5 pt-0.5" title={`${item.voteCount} dot${item.voteCount === 1 ? '' : 's'}`}>
                    {item.voteCount <= 6
                      ? Array.from({ length: item.voteCount }, (_, k) => <i key={k} className="h-2 w-2 rounded-full bg-rose-500 shadow-sm" />)
                      : <b className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{item.voteCount}</b>}
                  </span>
                )}
              </div>
              {questionWall && renderQuestionExtras(item)}
            </motion.div>
            );
          })}
          </AnimatePresence>

          {isAdding ? (
            <div className="rounded-lg border border-cyan-400/40 bg-slate-900/70 p-2">
              <textarea
                autoFocus
                value={addText}
                onChange={(event) => setAddText(event.target.value.slice(0, 280))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void addTeacherItem(zone.key);
                  }
                  if (event.key === 'Escape') {
                    setAddingZoneKey(null);
                    setAddText('');
                  }
                }}
                rows={2}
                placeholder="Type here…"
                className="w-full resize-none rounded-md border border-white/10 bg-slate-950 px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => {
                    setAddingZoneKey(null);
                    setAddText('');
                  }}
                  className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void addTeacherItem(zone.key)}
                  disabled={!addText.trim() || savingZone === zone.key}
                  className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {savingZone === zone.key ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAddingZoneKey(zone.key);
                setAddText('');
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 py-2 text-xs font-semibold text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
        {/* index kept for potential future quadrant labels */}
        <span className="sr-only">Zone {index + 1}</span>
      </div>
    );
  };

  return (
    <div className="space-y-3 p-3">
      {/* Header: title + (unlocked) template switcher + live toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{preset.title}</p>
          <p className="truncate text-xs text-slate-400">{preset.prompt}</p>
        </div>
        {!templateLocked && (
          <button
            onClick={() => (isLive ? void closeForStudents() : void openForStudents())}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              isLive
                ? 'bg-emerald-500/18 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-cyan-400/12 text-cyan-200 hover:bg-cyan-400/20'
            }`}
          >
            {isLive ? 'Live · Close' : 'Open to students'}
          </button>
        )}
      </div>

      {!templateLocked && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {Object.values(CLASS_BOARD_PRESETS).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => void selectPreset(option.key)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                selectedPresetKey === option.key
                  ? 'border-cyan-300/55 bg-cyan-300/15 text-cyan-100'
                  : 'border-white/12 text-slate-400 hover:text-white'
              }`}
            >
              {option.title}
            </button>
          ))}
        </div>
      )}

      {/* Board modes */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <ModeToggle on={anonymous} onClick={() => setAnonymous((v) => !v)} icon={<EyeOff className="h-3 w-3" />} label="Anonymous" title="Hide names on the cards" />
        <ModeToggle on={autoShow} onClick={() => setAutoShow((v) => !v)} icon={<Zap className="h-3 w-3" />} label="Auto-show" title="Student cards appear without approval" />
        {!questionWall && (
          <ModeToggle on={dotsRevealed} onClick={() => setDotsRevealed((v) => !v)} icon={<CircleDot className="h-3 w-3" />} label={dotsRevealed ? 'Dots shown' : 'Reveal dots'} title="Students vote with 3 dots each; reveal to show and sort by them" />
        )}
        <span className="ml-auto text-slate-500">Drag cards between sections · double-click to edit · click to spotlight</span>
      </div>

      {/* AI helpers */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {!templateLocked && (
          <AiButton busy={aiBusy === 'zones'} onClick={() => void boardFromTopic()} icon={<Sparkles className="h-3 w-3" />} label="Board from topic" title="A fresh board designed for the current topic" />
        )}
        <AiButton on={polishOn} busy={aiBusy === 'polish'} onClick={() => void togglePolish()} icon={<Wand2 className="h-3 w-3" />} label="Polish" title="Show a gently corrected version under students' sentences" />
        {!templateLocked && !questionWall && (
          <AiButton busy={aiBusy === 'themes'} onClick={() => void groupThemes()} icon={<Shapes className="h-3 w-3" />} label="Group into themes" title="Sort the cards into named sections" />
        )}
        {makeFocus && visibleItems.length > 0 && (
          <>
            <AiButton onClick={() => makeFocus({ title: preset.title, text: boardAsText(), credit: 'the class board' })} icon={<Crosshair className="h-3 w-3" />} label="Make it the topic" title="Talk about (and build activities from) the whole board" />
            <AiButton
              onClick={() => {
                const id = `board-${Date.now().toString(36)}`;
                addRoomItem(sessionId, { id, kind: 'note', title: `Board: ${preset.title}`, url: `note:${id}`, publisher: 'Class board', text: boardAsText() });
                setAiNote('Saved to cargo: drag an activity onto it to build from the board.');
              }}
              icon={<Archive className="h-3 w-3" />}
              label="Save to cargo"
              title="Keep this board as material (activities can be built from it)"
            />
          </>
        )}
        {aiNote && (
          <button type="button" onClick={() => setAiNote(null)} className="text-amber-200/80 hover:text-amber-100">{aiNote}</button>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-3 ${columnsClass(preset.layout, zones.length)}`}>
        {zones.map(renderZone)}
      </div>

      {/* Spotlight: one card, big, while the class talks about it */}
      <AnimatePresence>
        {spotlightId && (() => {
          const item = items.find((i) => i.id === spotlightId);
          if (!item) return null;
          const student = item.authorType === 'student';
          return (
            <motion.div
              key="spotlight"
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 p-8 backdrop-blur-[2px]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSpotlightId(null)}
            >
              <motion.div
                initial={reduce ? false : { scale: 0.7, rotate: -3 }} animate={{ scale: 1, rotate: -1 }}
                className="max-w-2xl rounded-2xl p-8 shadow-2xl"
                style={{ background: student ? noteColor(item.displayName) : '#0e3a4a', color: student ? '#1f2430' : '#e0fbff' }}
              >
                <p className="font-display text-4xl leading-tight">{item.content}</p>
                {student && !anonymous && <p className="mt-4 text-sm font-semibold uppercase tracking-wider opacity-60">{item.displayName}</p>}
                {makeFocus && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); makeFocus({ title: item.content, credit: student && !anonymous ? item.displayName : undefined }); setSpotlightId(null); }}
                    className="mt-5 flex items-center gap-1.5 rounded-lg border border-current/30 px-3 py-1.5 text-sm font-semibold opacity-80 hover:opacity-100"
                  >
                    <Crosshair className="h-4 w-4" /> Make it the topic
                  </button>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function AiButton({ on = false, busy = false, onClick, icon, label, title }: { on?: boolean; busy?: boolean; onClick: () => void; icon: React.ReactNode; label: string; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title}
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold transition disabled:opacity-60 ${on ? 'border-violet-300/60 bg-violet-300/15 text-violet-100' : 'border-violet-300/25 text-violet-200/80 hover:text-violet-100'}`}
    >
      {icon} {busy ? 'Working…' : label}
    </button>
  );
}

function ModeToggle({ on, onClick, icon, label, title }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold transition ${on ? 'border-amber-300/60 bg-amber-300/15 text-amber-100' : 'border-white/12 text-slate-400 hover:text-white'}`}
    >
      {icon} {label}
    </button>
  );
}
