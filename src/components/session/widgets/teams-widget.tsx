'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Shuffle } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';
import { KitButton, KitChip, KitLabel, KitSection } from '../widget-kit';

/**
 * Teams: split the class into 2–4 teams at random, then keep score. Kept in
 * this browser for the session (the teacher's own device).
 */
const TEAM_LOOKS = [
  { name: 'Eagles', color: '#67e8f9' },
  { name: 'Falcons', color: '#fcd34d' },
  { name: 'Hawks', color: '#fda4af' },
  { name: 'Owls', color: '#c4b5fd' },
];

interface Team { name: string; color: string; members: string[]; score: number }

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

export function TeamsContent({ sessionId, students }: { sessionId: string; students: Student[] }) {
  const key = `lc-teams:${sessionId}`;
  const [count, setCount] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setTeams(JSON.parse(raw) as Team[]);
    } catch { /* no saved teams */ }
  }, [key]);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(teams)); } catch { /* storage unavailable */ }
  }, [key, teams]);

  const split = () => {
    const names = shuffle(students.map((s) => s.name));
    const next: Team[] = TEAM_LOOKS.slice(0, count).map((l) => ({ ...l, members: [], score: 0 }));
    names.forEach((n, i) => next[i % count].members.push(n));
    setTeams(next);
  };
  const addScore = (i: number, d: number) => setTeams((prev) => prev.map((t, k) => (k === i ? { ...t, score: Math.max(0, t.score + d) } : t)));
  const lead = teams.length ? Math.max(...teams.map((t) => t.score)) : 0;

  return (
    <div className="space-y-3 p-3">
      <KitSection label="Teams" right={<span className="font-mono text-[11px] text-white/50">{students.length} students</span>}>
        <div className="flex flex-wrap items-center gap-1.5">
          {[2, 3, 4].map((c) => <KitChip key={c} on={count === c} onClick={() => setCount(c)}>{c} teams</KitChip>)}
          <KitButton tone="amber" solid className="ml-auto" icon={<Shuffle className="h-3.5 w-3.5" />} disabled={students.length < 2} onClick={split}>
            {teams.length ? 'Shuffle again' : 'Make teams'}
          </KitButton>
        </div>
      </KitSection>

      {teams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-xs text-white/50">
          Pick how many teams, then Make teams. Scores are kept here for the lesson.
        </p>
      ) : (
        <div className={`grid gap-2 ${teams.length > 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {teams.map((t, i) => (
            <div key={t.name} className="rounded-2xl border bg-black/25 p-3" style={{ borderColor: `${t.color}66` }}>
              <div className="flex items-center justify-between">
                <p className="font-display text-lg" style={{ color: t.color }}>{t.name}</p>
                {t.score === lead && lead > 0 && <KitLabel tone="amber">Leading</KitLabel>}
              </div>
              <div className="my-2 flex items-center justify-between">
                <button type="button" onClick={() => addScore(i, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white" aria-label={`Take a point from ${t.name}`}><Minus className="h-4 w-4" /></button>
                <AnimatePresence mode="popLayout">
                  <motion.span key={t.score} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-mono text-4xl font-bold text-white">{t.score}</motion.span>
                </AnimatePresence>
                <button type="button" onClick={() => addScore(i, 1)} className="grid h-8 w-8 place-items-center rounded-full text-[#0b1220]" style={{ background: t.color }} aria-label={`Give ${t.name} a point`}><Plus className="h-4 w-4" /></button>
              </div>
              <p className="text-xs leading-snug text-white/70">{t.members.join(', ') || 'No one yet'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
