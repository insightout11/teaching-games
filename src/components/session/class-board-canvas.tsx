'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus, X, EyeOff, Zap, CircleDot, Sparkles, Wand2, Crosshair, LayoutGrid, Smartphone } from 'lucide-react';
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
import { useWidgetStore } from '@/stores/widget-store';

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
  pendingControls?: (count: number, showAll: () => void) => ReactNode;
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

/** A short stable code for a question, so each question has its own board. */
function questionRoundOf(q: string): string {
  let h = 5381;
  for (const ch of q.trim().toLowerCase()) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return `q${h.toString(36).slice(0, 6)}`;
}

export function ClassBoardCanvas({ sessionId, boardKey, presetKey, questionWall = false, sortByVotes = false, zonesOverride, includePending = false, pendingControls }: ClassBoardCanvasProps) {
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
  const totalDots = items.reduce((n, i) => n + (i.voteCount ?? 0), 0);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemText, setEditItemText] = useState('');
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);
  const reduce = useReducedMotion();

  const base = boardKey ?? DEFAULT_CLASS_BOARD_KEY;
  // Each new question gets its own board (its own cards); the old question's answers stay under its own key
  const [questionRound, setQuestionRound] = useState<string | null>(null);
  const layoutKey = `${base}-${aiPreset ? aiPreset.key : selectedPresetKey}`;
  const roundKey = (round: string | null) => normalizeClassBoardKey(templateLocked ? base : round ? `${layoutKey.slice(0, 70)}-${round}` : layoutKey);
  const activeBoardKey = roundKey(questionRound);

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

  // Another surface (e.g. Grammar Spotlight pinning its anchor chart) asked for a template.
  const presetRequest = useWidgetStore((s) => s.classBoardPresetRequest);
  const clearPresetRequest = useWidgetStore((s) => s.requestClassBoardPreset);
  useEffect(() => {
    if (!presetRequest || templateLocked) return;
    setAiPreset(null);
    setSelectedPresetKey(presetRequest);
    clearPresetRequest(null);
  }, [presetRequest, templateLocked, clearPresetRequest]);

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_board_votes', filter: `session_id=eq.${sessionId}` },
        () => void loadItems(),
      )
      .subscribe();
    // Dots also arrive by a light poll, in case vote changes are not broadcast.
    const poll = setInterval(() => void loadItems(), 5000);
    return () => {
      clearInterval(poll);
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
    (nextPreset: ClassBoardPreset, nextZones: ClassBoardZone[], keyOverride?: string): InputSpec => ({
      type: 'board',
      gameKey: 'class-board',
      prompt: nextPreset.prompt,
      instruction: 'Add to the class board',
      maxLength: 280,
      allowMultiple: true,
      ...boardSpecFields(nextPreset, keyOverride ?? activeBoardKey, nextZones),
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

  // "Everyone answers" (the facts board, a Look card…): an open board titled with the question, straight to the phones
  const [boardQuestion, setBoardQuestion] = useState<string | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const q = (e as CustomEvent<{ question?: string }>).detail?.question?.trim();
      if (!q || templateLocked) return;
      setAiPreset(null);
      setSelectedPresetKey('open-board');
      setBoardQuestion(q.slice(0, 160));
    };
    window.addEventListener('lc-board-question', on);
    return () => window.removeEventListener('lc-board-question', on);
  }, [templateLocked]);
  useEffect(() => {
    if (!boardQuestion || preset.key !== 'open-board') return;
    const labels = { [baseZones[0]?.key ?? 'main']: boardQuestion };
    const round = questionRoundOf(boardQuestion);
    setQuestionRound(round);
    setZoneLabels(labels);
    setCustomQuestion(boardQuestion);
    setAutoShow(true); // everyone answers: the answers appear as they arrive (rude words are filtered on the way in)
    void setInputSpec(buildSpec({ ...preset, prompt: boardQuestion }, baseZones.map((zone) => ({ ...zone, label: labels[zone.key] ?? zone.label })), roundKey(round)));
    setBoardQuestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardQuestion, preset, baseZones, buildSpec, setInputSpec]);

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

  // ── The board (Oct 2026 redesign): the question and the answers are the board; layouts behind one button; one slim
  // toolbar; Cards or Cloud. ─────────────────────────────────────────────────────────────────────────────────────
  const studentCount = useSessionStore((state) => state.students.length);
  const [view, setView] = useState<'cards' | 'cloud'>('cards');
  useEffect(() => {
    const on = (e: Event) => { const v = (e as CustomEvent<{ view?: string }>).detail?.view; if (v === 'cloud' || v === 'cards') setView(v); };
    window.addEventListener('lc-board-view', on);
    return () => window.removeEventListener('lc-board-view', on);
  }, []);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [recentLayouts, setRecentLayouts] = useState<string[]>([]);
  // Smart: question ideas (each with its layout), and a question set by an idea or typed in (shown big, sent to phones)
  const [ideas, setIdeas] = useState<Array<{ question: string; layout: string }> | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string | null>(null);
  const [pendingIdea, setPendingIdea] = useState<{ question: string; layout: string } | null>(null);
  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem('lc-board-recent') ?? '[]') as string[]; if (Array.isArray(r)) setRecentLayouts(r.filter((k) => CLASS_BOARD_PRESETS[k]).slice(0, 3)); } catch { /* storage unavailable */ }
  }, []);
  const pickLayout = (key: string) => {
    setLayoutOpen(false);
    void selectPreset(key);
    setRecentLayouts((r) => {
      const next = [key, ...r.filter((k) => k !== key)].slice(0, 3);
      try { localStorage.setItem('lc-board-recent', JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };
  const answered = new Set(items.filter((i) => i.authorType === 'student' && !i.parentId).map((i) => i.displayName)).size;
  const single = zones.length === 1 && !questionWall;
  // The question: a single-section board's (renamed) title, otherwise the layout's own prompt
  const defaultZoneLabel = baseZones[0]?.label;
  const question = customQuestion ?? (single && zones[0] && zones[0].label !== defaultZoneLabel
    ? zones[0].label
    : single ? (preset.question ?? (topic && topic !== 'General' ? `What do you think about ${topic}?` : 'What do you think?')) : preset.title);
  // Put a question on the board and on the phones (in the layout that suits it)
  const applyQuestion = (q: string, layout?: string) => {
    if (layout && CLASS_BOARD_PRESETS[layout] && layout !== selectedPresetKey && !templateLocked) { setPendingIdea({ question: q, layout }); pickLayout(layout); return; }
    setCustomQuestion(q);
    const labels = single && zones[0] ? { ...zoneLabels, [zones[0].key]: q } : zoneLabels;
    setZoneLabels(labels);
    const round = questionRoundOf(q);
    setQuestionRound(round);
    setAutoShow(true);
    void setInputSpec(buildSpec({ ...preset, prompt: q }, baseZones.map((zone) => ({ ...zone, label: labels[zone.key] ?? zone.label })), roundKey(round)));
  };
  useEffect(() => {
    if (!pendingIdea || preset.key !== pendingIdea.layout) return;
    const q = pendingIdea.question;
    setPendingIdea(null);
    setCustomQuestion(q);
    const labels = baseZones.length === 1 ? { [baseZones[0].key]: q } : {};
    setZoneLabels(labels);
    const round = questionRoundOf(q);
    setQuestionRound(round);
    void setInputSpec(buildSpec({ ...preset, prompt: q }, baseZones.map((zone) => ({ ...zone, label: labels[zone.key as keyof typeof labels] ?? zone.label })), roundKey(round)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIdea, preset]);
  const loadIdeas = async () => {
    const t = topic && topic !== 'General' ? topic : '';
    if (!t) { setAiNote('Set a topic first (the topic bar at the top).'); return; }
    setAiBusy('ideas');
    try {
      const layouts = Object.values(CLASS_BOARD_PRESETS).map((p) => `${p.key} (${p.title})`).join(', ');
      const d = await callAi({ action: 'questions', topic: t, layouts });
      setIdeas(Array.isArray(d?.ideas) && d.ideas.length ? d.ideas : null);
      if (!d?.ideas?.length) setAiNote('Could not think of questions right now.');
    } finally { setAiBusy(null); }
  };
  const spotMistakes = async () => {
    setAiBusy('mistakes');
    try {
      const d = await callAi({ action: 'mistakes', items: studentCards.map((i) => ({ id: i.id, text: i.content })) });
      const m: Array<{ wrong: string; right: string; count: number }> = d?.mistakes ?? [];
      setAiNote(m.length ? `Common mistake: ${m.map((x) => `"${x.wrong}" → "${x.right}" (${x.count} answers)`).join(' · ')}` : 'No mistake shared by several answers. Nice work!');
    } finally { setAiBusy(null); }
  };
  const saveSummary = async () => {
    setAiBusy('summary');
    try {
      const d = await callAi({ action: 'summary', topic: question, items: visibleItems.map((i) => ({ id: i.id, text: i.content })) });
      if (!d?.summary) { setAiNote('Could not write a summary right now.'); return; }
      const id = `board-sum-${Date.now().toString(36)}`;
      addRoomItem(sessionId, { id, kind: 'note', title: d.summary.slice(0, 90), url: `note:${id}`, publisher: 'Class board', text: `${d.summary}\n\n${boardAsText()}` });
      setAiNote(`Saved: ${d.summary}`);
    } finally { setAiBusy(null); }
  };

  const cloudWords = useMemo(() => {
    if (view !== 'cloud') return [];
    const STOP = new Set('the a an and or but to of in on at for with is are was were be been it its this that these those i you he she we they my your our their me him her us them so very because would like want try first then than from as by not no yes do does did have has had will can could should just really also there here what why how when where which who'.split(' '));
    const counts = new Map<string, number>();
    for (const item of visibleItems) {
      for (const raw of item.content.toLowerCase().split(/[^a-z']+/)) {
        const w = raw.replace(/^'+|'+$/g, '');
        if (w.length < 3 || STOP.has(w)) continue;
        counts.set(w, (counts.get(w) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 36);
  }, [view, visibleItems]);

  const renderCard = (item: BoardItem, itemIndex: number) => {
    const student = item.authorType === 'student';
    const tone = student ? noteColor(item.displayName) : '#67e8f9';
    const editing = editingItemId === item.id;
    return (
      <motion.div
        key={item.id}
        layout={!reduce}
        initial={reduce ? false : { opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        draggable={!questionWall && !editing}
        onDragStart={(e) => { dragItemId.current = item.id; (e as unknown as DragEvent).dataTransfer?.setData('text/plain', item.id); }}
        onDragEnd={() => { dragItemId.current = null; setDragOverZone(null); }}
        onClick={() => { if (!editing) setSpotlightId(item.id); }}
        onDoubleClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); setEditItemText(item.content); }}
        className={`mb-3 cursor-pointer break-inside-avoid rounded-xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.35)] ${student ? 'bg-[#f6f1e4] text-[#1b2233]' : 'border border-cyan-300/30 bg-cyan-300/10 text-cyan-50'}`}
        style={student && !anonymous ? { borderLeft: `6px solid ${tone}` } : undefined}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {rankable && <span className={`mr-2 font-game ${student ? 'text-[#1b2233]/60' : 'text-cyan-300'}`}>{itemIndex + 1}.</span>}
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
                className="w-full resize-none rounded bg-white/60 px-1 text-lg text-[#1b2233] focus:outline-none"
              />
            ) : (
              <span className="text-lg leading-snug">{item.content}</span>
            )}
            {polishOn && fixes[item.id] && !hiddenFixes.has(item.id) && (
              <span className="mt-1.5 flex items-start gap-1 rounded bg-emerald-100/80 px-1.5 py-0.5 text-[14px] text-emerald-900">
                <Wand2 className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="flex-1">{fixes[item.id]}</span>
                <button type="button" title="Hide this correction" onClick={(e) => { e.stopPropagation(); setHiddenFixes((prev) => new Set(prev).add(item.id)); }} className="shrink-0 text-emerald-900/50 hover:text-emerald-900"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={student ? 'text-[#1b2233]/55' : 'text-cyan-200/60'}>{student ? (anonymous ? '' : item.displayName) : 'Teacher'}</span>
          {item.voteCount > 0 && (questionWall || dotsRevealed) && (
            <span className="flex flex-wrap justify-end gap-0.5" title={`${item.voteCount} dot${item.voteCount === 1 ? '' : 's'}`}>
              {item.voteCount <= 6
                ? Array.from({ length: item.voteCount }, (_, k) => <i key={k} className="h-2 w-2 rounded-full bg-amber-500" />)
                : <b className="rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{item.voteCount}</b>}
            </span>
          )}
        </div>
        {questionWall && renderQuestionExtras(item)}
      </motion.div>
    );
  };

  const renderAdd = (zoneKey: string) => (addingZoneKey === zoneKey ? (
    <div className="mb-3 break-inside-avoid rounded-xl border border-cyan-400/40 bg-slate-900/70 p-2">
      <textarea
        autoFocus
        value={addText}
        onChange={(event) => setAddText(event.target.value.slice(0, 280))}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void addTeacherItem(zoneKey); }
          if (event.key === 'Escape') { setAddingZoneKey(null); setAddText(''); }
        }}
        rows={2}
        placeholder="Type here…"
        className="w-full resize-none rounded-md border border-white/10 bg-slate-950 px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
      />
      <div className="mt-1.5 flex items-center justify-end gap-1.5">
        <button onClick={() => { setAddingZoneKey(null); setAddText(''); }} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-200"><X className="h-3.5 w-3.5" /></button>
        <button onClick={() => void addTeacherItem(zoneKey)} disabled={!addText.trim() || savingZone === zoneKey} className="rounded-md bg-cyan-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">{savingZone === zoneKey ? 'Adding…' : 'Add'}</button>
      </div>
    </div>
  ) : null);

  const renderZone = (zone: ClassBoardZone) => {
    const zoneItems = itemsForZone(zone.key);
    const isEditing = editingZoneKey === zone.key;
    return (
      <div
        key={zone.key}
        onDragOver={(e) => { if (dragItemId.current) { e.preventDefault(); setDragOverZone(zone.key); } }}
        onDragLeave={() => setDragOverZone((z) => (z === zone.key ? null : z))}
        onDrop={(e) => { e.preventDefault(); const id = dragItemId.current; setDragOverZone(null); if (id) void patchItem(id, { zoneKey: zone.key }); }}
        className={`min-h-[120px] rounded-2xl p-2 transition-colors ${dragOverZone === zone.key ? 'bg-amber-300/10 ring-1 ring-amber-300/50' : ''}`}
      >
        <div className="mb-3 flex items-center gap-2 border-b border-white/12 pb-1.5">
          {isEditing && !templateLocked ? (
            <input
              autoFocus
              value={editText}
              onChange={(event) => setEditText(event.target.value.slice(0, 60))}
              onBlur={() => void saveZoneLabel(zone.key)}
              onKeyDown={(event) => { if (event.key === 'Enter') void saveZoneLabel(zone.key); if (event.key === 'Escape') setEditingZoneKey(null); }}
              className="w-full rounded-md border border-cyan-400/40 bg-slate-900 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.14em] text-white focus:outline-none"
            />
          ) : (
            <button type="button" disabled={templateLocked} onClick={() => { setEditingZoneKey(zone.key); setEditText(zone.label); }} className="min-w-0 flex-1 truncate text-left font-mono text-xs uppercase tracking-[0.16em] text-amber-200/80 disabled:cursor-default" title={zone.description}>
              {zone.label}
            </button>
          )}
          <button type="button" onClick={() => { setAddingZoneKey(zone.key); setAddText(''); }} title="Add a card" className="text-white/35 hover:text-white"><Plus className="h-3.5 w-3.5" /></button>
        </div>
        <div className="space-y-0">
          <AnimatePresence initial={false}>{zoneItems.map(renderCard)}</AnimatePresence>
          {renderAdd(zone.key)}
        </div>
      </div>
    );
  };

  const tool = (on: boolean) => `rounded-lg p-1.5 transition ${on ? 'bg-white/12 text-white' : 'text-white/55 hover:bg-white/8 hover:text-white'}`;
  const smartItems: Array<{ key: string; label: string; detail: string; run: () => void; show: boolean; busy?: boolean }> = [
    { key: 'ideas', label: 'Question ideas', detail: 'Three questions for this topic, each in the layout that suits it', run: () => void loadIdeas(), show: !templateLocked, busy: aiBusy === 'ideas' },
    { key: 'mistakes', label: 'Spot a common mistake', detail: 'A mistake several answers share, for a quick fix (no names)', run: () => void spotMistakes(), show: studentCards.length > 2, busy: aiBusy === 'mistakes' },
    { key: 'summary', label: 'Save a summary', detail: 'One line on what the class thought, saved to cargo with the board', run: () => void saveSummary(), show: visibleItems.length > 1, busy: aiBusy === 'summary' },
    { key: 'topic', label: 'Board from topic', detail: 'A fresh board designed for the current topic', run: () => void boardFromTopic(), show: !templateLocked, busy: aiBusy === 'zones' },
    { key: 'themes', label: 'Group into themes', detail: 'Sort the cards into named sections', run: () => void groupThemes(), show: !templateLocked && !questionWall && visibleItems.length > 2, busy: aiBusy === 'themes' },
    { key: 'polish', label: polishOn ? 'Hide corrections' : 'Spot mistakes (Polish)', detail: 'A gently corrected version under students\' sentences', run: () => void togglePolish(), show: visibleItems.length > 0, busy: aiBusy === 'polish' },
    { key: 'cloud', label: view === 'cloud' ? 'Back to cards' : 'Show as a word cloud', detail: "The class's own words, the most common biggest", run: () => setView((v) => (v === 'cloud' ? 'cards' : 'cloud')), show: !questionWall && visibleItems.length > 0 },
    { key: 'dots', label: dotsRevealed ? 'Hide the dots' : `Reveal the class's dots${totalDots ? ` (${totalDots})` : ''}`, detail: 'Students vote with 3 dots each; reveal to sort by them', run: () => setDotsRevealed((v) => !v), show: !questionWall && visibleItems.length > 1 },
    { key: 'focus', label: 'Make it the topic', detail: 'Talk about (and build activities from) the whole board', run: () => makeFocus?.({ title: question, text: boardAsText(), credit: 'the class board' }), show: !!makeFocus && visibleItems.length > 0 },
    { key: 'cargo', label: 'Save to cargo', detail: 'Keep this board as material for activities', run: () => { const id = `board-${Date.now().toString(36)}`; addRoomItem(sessionId, { id, kind: 'note', title: `Board: ${question}`, url: `note:${id}`, publisher: 'Class board', text: boardAsText() }); setAiNote('Saved to cargo: drag an activity onto it to build from the board.'); }, show: visibleItems.length > 0 },
  ];

  return (
    <div className="relative">
      {/* slim toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/8 px-3 py-2">
        {!templateLocked && (
          <>
            <button type="button" onClick={() => { setLayoutOpen((o) => !o); setSmartOpen(false); }} className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/85 hover:bg-white/10">
              <LayoutGrid className="h-3.5 w-3.5" /> {aiPreset ? aiPreset.title : preset.title}
            </button>
            {recentLayouts.filter((k) => k !== selectedPresetKey).slice(0, 3).map((k) => (
              <button key={k} type="button" onClick={() => pickLayout(k)} title={CLASS_BOARD_PRESETS[k]?.title} className="rounded-lg border border-white/8 px-2 py-1 text-[11px] text-white/55 hover:bg-white/8 hover:text-white">{CLASS_BOARD_PRESETS[k]?.title}</button>
            ))}
            <div className="mx-1 h-5 w-px bg-white/10" />
          </>
        )}
        {!questionWall && (
          <div className="flex rounded-lg border border-white/12 p-0.5 text-xs">
            <button type="button" onClick={() => setView('cards')} className={`rounded-md px-2.5 py-1 ${view === 'cards' ? 'bg-white/12 text-white' : 'text-white/55'}`}>Cards</button>
            <button type="button" onClick={() => setView('cloud')} className={`rounded-md px-2.5 py-1 ${view === 'cloud' ? 'bg-white/12 text-white' : 'text-white/55'}`}>Cloud</button>
          </div>
        )}
        <button type="button" title={anonymous ? 'Names hidden: show names' : 'Hide names on the cards'} onClick={() => setAnonymous((v) => !v)} className={tool(anonymous)}><EyeOff className="h-4 w-4" /></button>
        <button type="button" title={autoShow ? 'New cards appear at once: turn off' : 'Show new cards without approval'} onClick={() => setAutoShow((v) => !v)} className={tool(autoShow)}><Zap className="h-4 w-4" /></button>
        {!questionWall && <button type="button" title={dotsRevealed ? 'Hide the dots' : `Reveal the class's dots${totalDots ? ` (${totalDots})` : ''}`} onClick={() => setDotsRevealed((v) => !v)} className={tool(dotsRevealed)}><CircleDot className="h-4 w-4" /></button>}
        <button type="button" onClick={() => { setSmartOpen((o) => !o); setLayoutOpen(false); }} className="flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-300/10 px-2.5 py-1.5 text-xs text-amber-100 hover:bg-amber-300/20"><Sparkles className="h-3.5 w-3.5" /> Smart</button>
        {single && <button type="button" title="Add a card" onClick={() => { setAddingZoneKey(zones[0].key); setAddText(''); }} className={tool(false)}><Plus className="h-4 w-4" /></button>}
        {!templateLocked && (
          <button
            type="button"
            onClick={() => (isLive ? void closeForStudents() : void openForStudents())}
            title={isLive ? 'Take the board off the phones' : 'Open the board on the students\' phones'}
            className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${isLive ? 'border-emerald-300/50 bg-emerald-300/10 text-emerald-100' : 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'}`}
          >
            <Smartphone className="h-3.5 w-3.5" /> {isLive ? <>On phones · <b>{answered}{studentCount ? ` of ${studentCount}` : ''}</b> answered <span className="ml-1 flex items-center gap-0.5 rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] uppercase tracking-wide"><X className="h-3 w-3" />Close</span></> : 'Open to phones'}
          </button>
        )}
      </div>

      {pendingControls?.(items.filter((item) => item.visibility === 'pending').length, () => {
        items.filter((item) => item.visibility === 'pending').forEach((item) => { void patchItem(item.id, { visibility: 'visible' }); });
      })}

      {/* the question */}
      <div className="px-5 pb-1 pt-4">
        {single && editingZoneKey === zones[0].key && !templateLocked ? (
          <input
            autoFocus
            value={editText}
            onChange={(event) => setEditText(event.target.value.slice(0, 160))}
            onBlur={() => { setEditingZoneKey(null); if (editText.trim()) { setCustomQuestion(editText.trim()); void saveZoneLabel(zones[0].key); } }}
            onKeyDown={(event) => { if (event.key === 'Enter') (event.target as HTMLInputElement).blur(); if (event.key === 'Escape') setEditingZoneKey(null); }}
            className="w-full rounded-lg border border-cyan-400/40 bg-slate-900/80 px-3 py-1 font-display text-3xl text-white focus:outline-none"
          />
        ) : (
          <button type="button" disabled={!single || templateLocked} onClick={() => { setEditingZoneKey(zones[0].key); setEditText(question); }} title={single ? 'Click to change the question' : undefined} className="block w-full text-left font-display text-2xl leading-tight text-white disabled:cursor-default md:text-3xl">
            {question}
          </button>
        )}
        {aiNote && <button type="button" onClick={() => setAiNote(null)} className="mt-1 text-xs text-amber-200/80 hover:text-amber-100">{aiNote}</button>}
      </div>

      {/* the board */}
      <div className="px-5 pb-5 pt-3">
        {view === 'cloud' && !questionWall ? (
          <div className="flex min-h-[260px] flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 py-8">
            {cloudWords.length === 0 && <p className="text-white/50">The words appear here as answers arrive</p>}
            {cloudWords.map(([w, n], i) => {
              const max = cloudWords[0]?.[1] ?? 1;
              return <span key={w} className="font-display leading-none" style={{ fontSize: 18 + (n / max) * 46, color: NOTE_COLORS[i % NOTE_COLORS.length], opacity: 0.65 + (n / max) * 0.35 }}>{w}</span>;
            })}
          </div>
        ) : visibleItems.length === 0 && isLive && single && addingZoneKey === null ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
            <Smartphone className="h-9 w-9 text-white/40" />
            <p className="font-display text-3xl text-white/85">Answer on your phones</p>
            <p className="text-sm text-white/50">Answers appear here as they arrive</p>
            {studentCount > 0 && <div className="mt-1 flex gap-1.5">{Array.from({ length: studentCount }).map((_, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < answered ? 'bg-emerald-300' : 'bg-white/15'}`} />)}</div>}
          </div>
        ) : single && visibleItems.length === 0 && addingZoneKey === null ? (
          <p className="py-12 text-center text-white/45">Open it to the phones, or add the first card with +</p>
        ) : single ? (
          <div
            onDragOver={(e) => { if (dragItemId.current) e.preventDefault(); }}
            // columns by the board's own width (a small board window gets one column, a big one three or four)
            className="gap-3"
            style={{ columnWidth: 250 }}
          >
            <AnimatePresence initial={false}>{itemsForZone(zones[0].key).map(renderCard)}</AnimatePresence>
            {renderAdd(zones[0].key)}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 ${columnsClass(preset.layout, zones.length)}`}>{zones.map(renderZone)}</div>
        )}
      </div>

      {/* layout picker: mini diagrams instead of a long row of names */}
      {layoutOpen && !templateLocked && (
        <div className="absolute left-3 top-11 z-20 w-[440px] max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/15 bg-[#0d1526] p-3 shadow-2xl backdrop-blur-md">
          <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Layout</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(CLASS_BOARD_PRESETS).map((option) => (
              <button key={option.key} type="button" onClick={() => pickLayout(option.key)} className={`rounded-xl border p-2 text-left ${selectedPresetKey === option.key && !aiPreset ? 'border-amber-300/60 bg-amber-300/10' : 'border-white/10 bg-white/5 hover:border-amber-300/40'}`}>
                <div className="mb-1.5 h-8"><LayoutMini preset={option} /></div>
                <span className="block truncate text-[11px] text-white/80">{option.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* smart menu: what makes sense right now */}
      {smartOpen && (
        <div className="absolute right-3 top-11 z-20 w-[360px] max-w-[calc(100%-1.5rem)] rounded-2xl border border-amber-300/25 bg-[#0d1526] p-3 shadow-2xl backdrop-blur-md">
          <p className="mb-2 flex items-center gap-1.5 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/80"><Sparkles className="h-3 w-3" /> Smart · right now</p>
          {ideas && (
            <div className="mb-2 space-y-1.5 rounded-xl border border-amber-300/25 bg-amber-300/5 p-2">
              <p className="px-1 text-[11px] text-amber-100/80">Tap one: it goes on the board and to the phones</p>
              {ideas.map((idea) => (
                <button key={idea.question} type="button" onClick={() => { applyQuestion(idea.question, idea.layout); setIdeas(null); setSmartOpen(false); }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-amber-300/40">
                  <p className="text-sm text-white">{idea.question}</p>
                  <p className="text-[11px] text-white/45">{CLASS_BOARD_PRESETS[idea.layout]?.title ?? 'Open board'}</p>
                </button>
              ))}
            </div>
          )}
          {smartItems.filter((s) => s.show).map((s) => (
            <button key={s.key} type="button" disabled={s.busy} onClick={() => { s.run(); if (s.key !== 'ideas') setSmartOpen(false); }} className="mb-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-amber-300/40 disabled:opacity-60">
              <p className="text-sm text-white">{s.busy ? 'Working…' : s.label}</p>
              <p className="text-xs text-white/50">{s.detail}</p>
            </button>
          ))}
        </div>
      )}

      {/* Spotlight: one card, big, while the class talks about it */}
      <AnimatePresence>
        {spotlightId && (() => {
          const item = items.find((i) => i.id === spotlightId);
          if (!item) return null;
          const student = item.authorType === 'student';
          return (
            <motion.div key="spotlight" className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 p-8 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSpotlightId(null)}>
              <motion.div
                initial={reduce ? false : { scale: 0.8 }} animate={{ scale: 1 }}
                className="max-w-2xl rounded-2xl bg-[#f6f1e4] p-8 text-[#1b2233] shadow-2xl"
                style={student && !anonymous ? { borderLeft: `8px solid ${noteColor(item.displayName)}` } : undefined}
              >
                <p className="font-display text-4xl leading-tight">{item.content}</p>
                {student && !anonymous && <p className="mt-4 text-sm font-semibold uppercase tracking-wider opacity-60">{item.displayName}</p>}
                {makeFocus && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); makeFocus({ title: item.content, credit: student && !anonymous ? item.displayName : undefined }); setSpotlightId(null); }} className="mt-5 flex items-center gap-1.5 rounded-lg border border-[#1b2233]/25 px-3 py-1.5 text-sm font-semibold hover:bg-[#1b2233]/5">
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

/** A layout as a tiny diagram (its sections), so the picker shows the shape, not just a name. */
function LayoutMini({ preset }: { preset: ClassBoardPreset }) {
  const box = 'rounded-[3px] bg-white/25';
  const n = Math.max(1, preset.zones.length);
  if (isRankableLayout(preset.layout)) return <div className="flex h-full flex-col gap-1"><div className={`${box} h-1.5 w-full`} /><div className={`${box} h-1.5 w-4/5`} /><div className={`${box} h-1.5 w-3/5`} /></div>;
  if (n === 1) return <div className="grid h-full grid-cols-3 gap-1"><div className={`${box} h-3`} /><div className={`${box} h-4`} /><div className={`${box} h-3`} /><div className={`${box} h-4`} /><div className={`${box} h-3`} /></div>;
  if (n === 4) return <div className="grid h-full grid-cols-2 grid-rows-2 gap-1">{Array.from({ length: 4 }).map((_, i) => <div key={i} className={box} />)}</div>;
  return <div className="grid h-full gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(n, 5)}, minmax(0, 1fr))` }}>{Array.from({ length: Math.min(n, 5) }).map((_, i) => <div key={i} className={box} />)}</div>;
}
