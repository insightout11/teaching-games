'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Mic, RotateCcw, SkipForward } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';
import { KitButton } from '@/components/session/widget-kit';

/**
 * Shared speaking engine for the grammar family games (Compare It, Answer First, …): the class
 * takes spoken turns, fewest-turns-first, and the teacher judges each turn out loud.
 */
export function useSpeakingTurns(students: Student[]) {
  const [turns, setTurns] = useState<Record<string, number>>({});
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const [retry, setRetry] = useState(false);

  const pick = useCallback((exclude: string | null, t: Record<string, number>) => {
    setRetry(false);
    if (!students.length) { setSpeakerId(null); return; }
    const pool = students.filter((s) => s.id !== exclude);
    const list = pool.length ? pool : students;
    const min = Math.min(...list.map((s) => t[s.id] ?? 0));
    const cands = list.filter((s) => (t[s.id] ?? 0) === min);
    setSpeakerId(cands[Math.floor(Math.random() * cands.length)].id);
  }, [students]);

  const speaker = students.find((s) => s.id === speakerId) ?? null;

  /** Count the current speaker's turn and move on. */
  const advance = useCallback(() => {
    const t = speakerId ? { ...turns, [speakerId]: (turns[speakerId] ?? 0) + 1 } : turns;
    setTurns(t);
    pick(speakerId, t);
  }, [speakerId, turns, pick]);

  const start = useCallback(() => pick(speakerId, turns), [pick, speakerId, turns]);

  return { speaker, speakerId, retry, setRetry, advance, start };
}

/** The "Mia, your turn!" bar with Good! / Try again / Skip. */
export function SpeakerBar({ name, retry, prompt, onGood, onRetry, onSkip }: { name: string; retry: boolean; prompt: string; onGood: () => void; onRetry: () => void; onSkip: () => void }) {
  return (
    <motion.div key={name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-4">
      <p className="flex items-center gap-2 text-2xl"><Mic className="h-6 w-6 shrink-0 text-amber-300" /><span><span className="font-display text-4xl">{name}</span>, {retry ? 'have another go!' : prompt}</span></p>
      <div className="flex flex-wrap gap-2">
        <KitButton tone="emerald" solid onClick={onGood} icon={<Check className="h-4 w-4" />}>Good!</KitButton>
        <KitButton tone="plain" onClick={onRetry} icon={<RotateCcw className="h-4 w-4" />}>Try again</KitButton>
        <KitButton tone="plain" onClick={onSkip} icon={<SkipForward className="h-4 w-4" />}>Skip</KitButton>
      </div>
    </motion.div>
  );
}

/** Phone card payload for speaking-frame games (rendered by SpeakingFramePanel). */
export interface SpeakingFrameCard {
  role: 'speaking-frame';
  title: string;
  prompt: string;
  helpers: Array<{ label: string; items: string[] }>;
  yourTurn: boolean;
}

/** perStudentData keyed by student id AND name (phones match either). */
export function speakingFramePerStudent(students: Student[], speakerId: string | null, base: Omit<SpeakingFrameCard, 'role' | 'yourTurn'>): Record<string, unknown> {
  const per: Record<string, unknown> = { __room: true };
  students.forEach((s) => {
    const card: SpeakingFrameCard = { role: 'speaking-frame', ...base, yourTurn: s.id === speakerId };
    per[s.id] = card;
    per[s.name] = card;
  });
  return per;
}
