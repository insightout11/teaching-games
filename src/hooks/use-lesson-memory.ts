'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addActivity, addMaterial, addTopic, addWords, emptyLessonMemory, lessonMemoryStorageKey, type LessonMemory } from '@/lib/lesson-memory';

const SAVE_DELAY_MS = 15_000;

function load(sessionId: string): LessonMemory {
  try {
    const raw = localStorage.getItem(lessonMemoryStorageKey(sessionId));
    if (raw) return { ...emptyLessonMemory(), ...(JSON.parse(raw) as LessonMemory) };
  } catch { /* storage unavailable */ }
  return emptyLessonMemory();
}

/**
 * Live memory step 1: record what the lesson covers as it happens. Kept in localStorage during class and saved to
 * the server shortly after each change and when the page closes (failures are quiet; the lesson never waits on it).
 */
export function useLessonMemory(sessionId: string) {
  const memory = useRef<LessonMemory>(emptyLessonMemory());
  const timer = useRef<number | null>(null);
  const dirty = useRef(false);
  // A copy for display (the in-room logbook); the ref stays the source of truth for saving.
  const [snapshot, setSnapshot] = useState<LessonMemory>(emptyLessonMemory());

  useEffect(() => { memory.current = load(sessionId); setSnapshot(memory.current); }, [sessionId]);

  const save = useCallback((keepalive = false) => {
    if (!dirty.current) return;
    dirty.current = false;
    void fetch('/api/session/lesson-memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, memory: memory.current }),
      keepalive,
    }).catch(() => {});
  }, [sessionId]);

  const update = useCallback((fn: (m: LessonMemory) => LessonMemory) => {
    const next = fn(memory.current);
    if (next === memory.current) return;
    memory.current = next;
    setSnapshot(next);
    dirty.current = true;
    try { localStorage.setItem(lessonMemoryStorageKey(sessionId), JSON.stringify(next)); } catch { /* storage unavailable */ }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(), SAVE_DELAY_MS);
  }, [sessionId, save]);

  useEffect(() => {
    const onHide = () => save(true);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      if (timer.current) window.clearTimeout(timer.current);
      save(true);
    };
  }, [save]);

  // Stable functions (effects depend on them, not on the returned object), plus the current record for display.
  const api = useMemo(() => ({
    topic: (title: string, kind: string) => update((m) => addTopic(m, title, kind)),
    words: (words: string[]) => update((m) => addWords(m, words)),
    material: (title: string, kind: string) => update((m) => addMaterial(m, title, kind)),
    activity: (name: string) => update((m) => addActivity(m, name)),
    /** Save now (e.g. when the class ends). */
    flush: () => save(true),
  }), [update, save]);
  return { ...api, snapshot };
}
