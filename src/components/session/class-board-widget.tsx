'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useSessionStore } from '@/stores/session-store';
import {
  CLASS_BOARD_PRESETS,
  DEFAULT_CLASS_BOARD_KEY,
  DEFAULT_CLASS_BOARD_PRESET_KEY,
  getClassBoardPreset,
  normalizeClassBoardKey,
  type ClassBoardCategory,
  type ClassBoardVisibility,
} from '@/lib/class-board';
import type { InputSpec } from '@/lib/input-spec';

interface ClassBoardContentProps {
  sessionId: string;
  boardKey?: string;
  presetKey?: string;
}

interface BoardItem {
  id: string;
  boardKey: string;
  authorType: 'teacher' | 'student';
  clientId: string | null;
  displayName: string;
  category: string;
  zoneKey: string;
  content: string;
  visibility: ClassBoardVisibility;
  pinned: boolean;
  position: number;
  createdAt: string;
  voteCount: number;
}

function categoryLabel(categories: ClassBoardCategory[], key: string) {
  return categories.find((category) => category.key === key)?.label ?? key;
}

export function ClassBoardContent({
  sessionId,
  boardKey = DEFAULT_CLASS_BOARD_KEY,
  presetKey,
}: ClassBoardContentProps) {
  const templateLocked = Boolean(presetKey);
  const [selectedPresetKey, setSelectedPresetKey] = useState(presetKey ?? DEFAULT_CLASS_BOARD_PRESET_KEY);
  const preset = useMemo(() => getClassBoardPreset(selectedPresetKey), [selectedPresetKey]);
  const normalizedBoardKey = normalizeClassBoardKey(templateLocked ? boardKey : `${boardKey}-${selectedPresetKey}`);
  const inputSpec = useSessionStore((state) => state.inputSpec);
  const setInputSpec = useSessionStore((state) => state.setInputSpec);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [teacherText, setTeacherText] = useState('');
  const [category, setCategory] = useState(preset.defaultCategory);
  const [zoneKey, setZoneKey] = useState(preset.defaultZone);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isOpenForStudents = inputSpec?.type === 'board' && inputSpec.boardKey === normalizedBoardKey;
  const pendingItems = items.filter((item) => item.visibility === 'pending');
  const visibleItems = items
    .filter((item) => item.visibility === 'visible')
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (
      preset.rankable
        ? a.position - b.position || a.createdAt.localeCompare(b.createdAt)
        : b.voteCount - a.voteCount || a.createdAt.localeCompare(b.createdAt)
    ));

  useEffect(() => {
    if (presetKey) setSelectedPresetKey(presetKey);
  }, [presetKey]);

  useEffect(() => {
    setCategory(preset.defaultCategory);
    setZoneKey(preset.defaultZone);
  }, [preset.defaultCategory, preset.defaultZone]);

  const loadItems = useCallback(async () => {
    if (isMockMode()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/class-board/items?sessionId=${sessionId}&boardKey=${encodeURIComponent(normalizedBoardKey)}`);
      if (!res.ok) return;
      const data = await res.json() as { items?: BoardItem[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [normalizedBoardKey, sessionId]);

  useEffect(() => {
    void loadItems();
    const timer = window.setInterval(() => void loadItems(), 5000);
    return () => window.clearInterval(timer);
  }, [loadItems]);

  useEffect(() => {
    if (isMockMode()) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`class-board-widget:${sessionId}:${normalizedBoardKey}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'class_board_items',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        void loadItems();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'class_board_votes',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        void loadItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems, normalizedBoardKey, sessionId]);

  const openForStudents = async () => {
    const spec: InputSpec = {
      type: 'board',
      gameKey: 'class-board',
      prompt: preset.prompt,
      instruction: 'Add to the class board',
      boardKey: normalizedBoardKey,
      boardTitle: preset.title,
      boardPrompt: preset.prompt,
      boardCategories: preset.categories.map(({ key, label }) => ({ key, label })),
      boardZones: preset.zones,
      boardDefaultCategory: preset.defaultCategory,
      boardDefaultZone: preset.defaultZone,
      boardAllowVotes: preset.allowVotes,
      maxLength: 280,
      allowMultiple: true,
    };
    await setInputSpec(spec);
  };

  const closeForStudents = async () => {
    if (isOpenForStudents) await setInputSpec(null);
  };

  const submitTeacherItem = async () => {
    const content = teacherText.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/class-board/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          boardKey: normalizedBoardKey,
          authorType: 'teacher',
          displayName: 'Teacher',
          content,
          category,
          zoneKey,
          visibility: 'visible',
          position: preset.rankable ? visibleItems.length + 1 : 0,
        }),
      });
      if (res.ok) {
        setTeacherText('');
        void loadItems();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (itemId: string, update: Record<string, unknown>) => {
    await fetch('/api/class-board/item', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, itemId, ...update }),
    });
    void loadItems();
  };

  const moveRankedItem = async (item: BoardItem, direction: -1 | 1) => {
    const zoneItems = visibleItems
      .filter((candidate) => candidate.zoneKey === item.zoneKey)
      .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
    const currentIndex = zoneItems.findIndex((candidate) => candidate.id === item.id);
    const target = zoneItems[currentIndex + direction];
    if (!target) return;

    await Promise.all([
      fetch('/api/class-board/item', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, itemId: item.id, position: target.position }),
      }),
      fetch('/api/class-board/item', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, itemId: target.id, position: item.position }),
      }),
    ]);
    void loadItems();
  };

  const renderVisibleItem = (item: BoardItem) => (
    <div key={item.id} className="rounded-lg border border-white/8 bg-slate-950/45 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-cyan-200/75">{categoryLabel(preset.categories, item.category)} - {item.displayName}</span>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-lc-text2">{item.voteCount} votes</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-lc-text">{item.content}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {preset.rankable ? (
          <>
            <button
              type="button"
              onClick={() => moveRankedItem(item, -1)}
              className="rounded-md bg-emerald-500/12 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/18"
            >
              Rank Higher
            </button>
            <button
              type="button"
              onClick={() => moveRankedItem(item, 1)}
              className="rounded-md bg-emerald-500/12 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/18"
            >
              Rank Lower
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => updateItem(item.id, { pinned: !item.pinned })}
          className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-semibold text-lc-text3 hover:bg-white/12"
        >
          {item.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          type="button"
          onClick={() => updateItem(item.id, { visibility: 'hidden' })}
          className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-semibold text-lc-text3 hover:bg-white/12"
        >
          Hide
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 p-3 text-sm">
      <div className="rounded-xl border border-lc-border bg-lc-surface/70 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lc-text3">{preset.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-lc-text2">{preset.prompt}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isOpenForStudents ? 'bg-emerald-500/18 text-emerald-300' : 'bg-white/8 text-lc-text3'
          }`}>
            {isOpenForStudents ? 'Live' : 'Closed'}
          </span>
        </div>
        {!templateLocked ? (
          <label className="mt-3 block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-lc-text3">Board template</span>
            <select
              value={selectedPresetKey}
              onChange={(event) => setSelectedPresetKey(event.target.value)}
              disabled={isOpenForStudents}
              className="w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-xs text-lc-text focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
            >
              {Object.values(CLASS_BOARD_PRESETS).map((option) => (
                <option key={option.key} value={option.key}>{option.title}</option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openForStudents}
            disabled={isOpenForStudents}
            className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-40"
          >
            Open to Students
          </button>
          <button
            type="button"
            onClick={closeForStudents}
            disabled={!isOpenForStudents}
            className="rounded-lg border border-lc-border bg-white/5 px-3 py-2 text-xs font-semibold text-lc-text2 transition hover:bg-white/10 disabled:opacity-40"
          >
            Close Input
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-lc-border bg-lc-surface/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-lc-text3">Teacher Note</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {preset.categories.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setCategory(option.key)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                category === option.key ? 'border-cyan-300/55 bg-cyan-300/15 text-cyan-100' : 'border-lc-border text-lc-text3 hover:text-lc-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {preset.zones.length > 1 ? (
          <select
            value={zoneKey}
            onChange={(event) => setZoneKey(event.target.value)}
            className="mt-2 w-full rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-xs text-lc-text focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            {preset.zones.map((zone) => (
              <option key={zone.key} value={zone.key}>{zone.label}</option>
            ))}
          </select>
        ) : null}
        <textarea
          value={teacherText}
          onChange={(event) => setTeacherText(event.target.value.slice(0, 280))}
          placeholder="Click here and type on the board..."
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-lc-border bg-lc-surface px-3 py-2 text-sm text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
        <button
          type="button"
          onClick={submitTeacherItem}
          disabled={!teacherText.trim() || saving}
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Adding...' : 'Add Teacher Note'}
        </button>
      </div>

      {pendingItems.length > 0 ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/8 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Pending ({pendingItems.length})</p>
          <div className="mt-2 space-y-2">
            {pendingItems.map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-950/45 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-lc-text3">{categoryLabel(preset.categories, item.category)} - {item.displayName}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-lc-text">{item.content}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, { visibility: 'visible', position: preset.rankable ? visibleItems.length + 1 : item.position })}
                    className="rounded-md bg-emerald-500/18 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/25"
                  >
                    Show
                  </button>
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, { visibility: 'hidden' })}
                    className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-semibold text-lc-text3 hover:bg-white/12"
                  >
                    Hide
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-lc-border bg-lc-surface/70 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-lc-text3">Visible Board ({visibleItems.length})</p>
          {loading ? <span className="text-[10px] text-lc-text3">Loading...</span> : null}
        </div>
        <div className="mt-2 space-y-2">
          {visibleItems.length === 0 ? (
            <p className="rounded-lg bg-white/5 p-3 text-center text-xs text-lc-text3">No visible items yet.</p>
          ) : preset.zones.length === 1 ? (
            visibleItems.map(renderVisibleItem)
          ) : (
            preset.zones.map((zone) => {
              const zoneItems = visibleItems.filter((item) => item.zoneKey === zone.key);
              return (
                <div key={zone.key} className="rounded-lg border border-white/8 bg-white/[0.025] p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-lc-text2">{zone.label}</p>
                      {zone.description ? <p className="text-[10px] text-lc-text3">{zone.description}</p> : null}
                    </div>
                    <span className="text-[10px] text-lc-text3">{zoneItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {zoneItems.length > 0 ? zoneItems.map(renderVisibleItem) : (
                      <p className="rounded-md bg-slate-950/35 p-2 text-center text-[11px] text-lc-text3">Empty</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
