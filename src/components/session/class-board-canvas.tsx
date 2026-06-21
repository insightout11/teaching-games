'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
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
  /** When set, the template is locked to this preset (World Lens) — no switcher, liveness managed externally. */
  presetKey?: string;
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

/** Tailwind grid columns for each board layout. */
function columnsClass(layout: ClassBoardLayout): string {
  switch (layout) {
    case 't-chart':
      return 'sm:grid-cols-2';
    case 'venn':
    case 'image-evidence':
      return 'lg:grid-cols-3';
    case 'quadrants':
      return 'sm:grid-cols-2';
    default:
      return 'grid-cols-1';
  }
}

export function ClassBoardCanvas({ sessionId, boardKey, presetKey }: ClassBoardCanvasProps) {
  const templateLocked = Boolean(presetKey);
  const [selectedPresetKey, setSelectedPresetKey] = useState(presetKey ?? DEFAULT_CLASS_BOARD_PRESET_KEY);
  const preset = useMemo(() => getClassBoardPreset(selectedPresetKey), [selectedPresetKey]);

  const inputSpec = useSessionStore((state) => state.inputSpec);
  const setInputSpec = useSessionStore((state) => state.setInputSpec);

  const [items, setItems] = useState<BoardItem[]>([]);
  const [zoneLabels, setZoneLabels] = useState<Record<string, string>>({});
  const [addingZoneKey, setAddingZoneKey] = useState<string | null>(null);
  const [addText, setAddText] = useState('');
  const [editingZoneKey, setEditingZoneKey] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingZone, setSavingZone] = useState<string | null>(null);

  const base = boardKey ?? DEFAULT_CLASS_BOARD_KEY;
  const activeBoardKey = normalizeClassBoardKey(templateLocked ? base : `${base}-${selectedPresetKey}`);

  // Zones with any teacher-renamed titles applied.
  const zones: ClassBoardZone[] = useMemo(
    () => preset.zones.map((zone) => ({ ...zone, label: zoneLabels[zone.key] ?? zone.label })),
    [preset.zones, zoneLabels],
  );

  const isLive = inputSpec?.type === 'board' && inputSpec.boardKey === activeBoardKey;
  const rankable = isRankableLayout(preset.layout);

  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => item.visibility === 'visible')
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            (rankable
              ? a.position - b.position || a.createdAt.localeCompare(b.createdAt)
              : b.voteCount - a.voteCount || a.createdAt.localeCompare(b.createdAt)),
        ),
    [items, rankable],
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
        const nextZones = preset.zones.map((zone) => ({ ...zone, label: nextLabels[zone.key] ?? zone.label }));
        await setInputSpec(buildSpec(preset, nextZones));
      }
    },
    [buildSpec, editText, isLive, preset, setInputSpec, zoneLabels],
  );

  const itemsForZone = useCallback(
    (zoneKey: string) => visibleItems.filter((item) => item.zoneKey === zoneKey),
    [visibleItems],
  );

  const renderZone = (zone: ClassBoardZone, index: number) => {
    const zoneItems = itemsForZone(zone.key);
    const isAdding = addingZoneKey === zone.key;
    const isEditing = editingZoneKey === zone.key;
    return (
      <div key={zone.key} className="flex min-h-[140px] flex-col rounded-xl border border-white/10 bg-slate-950/40 p-3">
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

        <div className="flex-1 space-y-2">
          {zoneItems.map((item, itemIndex) => (
            <div
              key={item.id}
              className={`rounded-lg border px-3 py-2 text-sm leading-snug ${
                item.authorType === 'teacher'
                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-50'
                  : 'border-white/10 bg-white/[0.04] text-slate-100'
              }`}
            >
              {rankable && <span className="mr-2 font-game text-cyan-300">{itemIndex + 1}.</span>}
              <span>{item.content}</span>
              {item.authorType === 'student' && (
                <span className="mt-1 block text-[10px] uppercase tracking-wider text-slate-400">{item.displayName}</span>
              )}
            </div>
          ))}

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

      <div className={`grid grid-cols-1 gap-3 ${columnsClass(preset.layout)}`}>
        {zones.map(renderZone)}
      </div>
    </div>
  );
}
