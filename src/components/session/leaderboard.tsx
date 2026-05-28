'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';

const HELMET_SEEDS = ['teal', 'amber', 'red', 'blue', 'violet', 'green', 'white', 'gold', 'black', 'pink', 'silver', 'rainbow'];
const VALID_HELMET_SEEDS = new Set(HELMET_SEEDS);

function resolveHelmet(avatarSeed: string | undefined, name: string): string {
  if (avatarSeed && VALID_HELMET_SEEDS.has(avatarSeed)) return avatarSeed;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return HELMET_SEEDS[hash % HELMET_SEEDS.length];
}

interface LeaderboardEntry {
  studentId: string;
  name: string;
  totalPoints: number;
  correctCount: number;
  bestStreak: number;
  avatarSeed?: string;
}

export function Leaderboard({ displayMode = 'competitive' }: { displayMode?: 'class' | 'team' | 'competitive' }) {
  const students = useSessionStore((s) => s.students);
  const scores = useSessionStore((s) => s.scores);
  const setCurrentStudent = useSessionStore((s) => s.setCurrentStudent);
  const currentStudentId = useSessionStore((s) => s.currentStudentId);
  const pickStudent = useSessionStore((s) => s.pickStudent);

  const [spinning, setSpinning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const handlePick = useCallback(() => {
    if (students.length === 0) return;
    setSpinning(true);
    let count = 0;
    intervalRef.current = setInterval(() => {
      setDisplayIndex(Math.floor(Math.random() * students.length));
      count++;
      if (count > 15) {
        clearInterval(intervalRef.current);
        pickStudent();
        setSpinning(false);
      }
    }, 100);
  }, [students, pickStudent]);

  const currentStudent = students.find((s) => s.id === currentStudentId);
  const spinStudent = spinning ? students[displayIndex] : currentStudent;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const entries = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();

    students.forEach((s) => {
      map.set(s.id, { studentId: s.id, name: s.name, totalPoints: 0, correctCount: 0, bestStreak: 0, avatarSeed: s.avatar_seed });
    });

    scores.filter(countsForLeaderboard).forEach((sc) => {
      const key = sc.student_id || sc.client_id;
      if (!key) return;

      let entry = map.get(key);
      if (!entry && sc.display_name) {
        entry = { studentId: key, name: sc.display_name, totalPoints: 0, correctCount: 0, bestStreak: 0 };
        map.set(key, entry);
      }
      if (!entry) return;

      entry.totalPoints += sc.points;
      if (isCorrectScore(sc)) entry.correctCount++;
      if (sc.streak_count > entry.bestStreak) entry.bestStreak = sc.streak_count;
    });

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, scores]);

  const visibleEntries = useMemo(() => {
    const ranked = entries.map((e, i) => ({ ...e, rank: i }));
    const top3 = ranked.slice(0, 3);
    if (!currentStudentId) return top3;
    const selfInTop3 = top3.some((e) => e.studentId === currentStudentId);
    if (selfInTop3) return top3;
    const self = ranked.find((e) => e.studentId === currentStudentId);
    if (!self) return top3;
    return [...top3, self];
  }, [entries, currentStudentId]);

  const teamTotals = useMemo(() => {
    if (displayMode !== 'team') return null;
    const map = new Map<string, number>();
    scores.filter(countsForLeaderboard).forEach((sc) => {
      if (!sc.team) return;
      map.set(sc.team, (map.get(sc.team) ?? 0) + sc.points);
    });
    return map.size > 0 ? Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])) : null;
  }, [displayMode, scores]);

  const sessionSummary = useMemo(() => {
    const leaderboardScores = scores.filter(countsForLeaderboard);
    const ids = new Set(leaderboardScores.map(sc => sc.student_id || sc.client_id).filter(Boolean));
    return { participated: ids.size, total: students.length, responseCount: leaderboardScores.length };
  }, [scores, students]);

  const prevTotals = useRef<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);
  const [deltas, setDeltas] = useState<Map<string, { value: number; ts: number }>>(new Map());

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const initial = new Map<string, number>();
      entries.forEach((e) => initial.set(e.studentId, e.totalPoints));
      prevTotals.current = initial;
      return;
    }

    const newDeltas = new Map<string, { value: number; ts: number }>();
    const now = Date.now();

    entries.forEach((e) => {
      const prev = prevTotals.current.get(e.studentId) ?? 0;
      if (e.totalPoints > prev) {
        newDeltas.set(e.studentId, { value: e.totalPoints - prev, ts: now });
      }
    });

    const updated = new Map<string, number>();
    entries.forEach((e) => updated.set(e.studentId, e.totalPoints));
    prevTotals.current = updated;

    if (newDeltas.size > 0) {
      setDeltas((prev) => {
        const merged = new Map(prev);
        newDeltas.forEach((v, k) => merged.set(k, v));
        return merged;
      });

      const keys = Array.from(newDeltas.keys());
      const timeout = setTimeout(() => {
        setDeltas((prev) => {
          const next = new Map(prev);
          keys.forEach((k) => {
            if (next.get(k)?.ts === now) next.delete(k);
          });
          return next;
        });
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [entries]);

  const medalColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider text-[10px] text-lc-text3">Class Status</h3>
          <p className="mt-1 text-xs text-lc-text3">Picker, progress, and scores</p>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
          {displayMode}
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-lc-text3">Up next</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={spinStudent?.id ?? 'empty'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mt-1 truncate text-lg font-game ${spinStudent && !spinning ? 'text-lc-blue' : 'text-lc-text3'}`}
              >
                {spinStudent ? spinStudent.name : 'No student selected'}
              </motion.p>
            </AnimatePresence>
          </div>
          <button
            onClick={handlePick}
            disabled={spinning || students.length === 0}
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-xs font-game text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {spinning ? 'Picking...' : 'Pick'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
          <p className="text-[9px] uppercase tracking-wider text-lc-text3">Students</p>
          <p className="mt-1 text-lg font-game text-white">{sessionSummary.total}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
          <p className="text-[9px] uppercase tracking-wider text-lc-text3">Active</p>
          <p className="mt-1 text-lg font-game text-white">{sessionSummary.participated}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
          <p className="text-[9px] uppercase tracking-wider text-lc-text3">Responses</p>
          <p className="mt-1 text-lg font-game text-white">{sessionSummary.responseCount}</p>
        </div>
      </div>

      {sessionSummary.responseCount === 0 && (
        <p className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-lc-text3">
          Waiting for responses.
        </p>
      )}

      {displayMode === 'team' && teamTotals && (
        <div className="grid grid-cols-2 gap-2">
          {teamTotals.slice(0, 2).map(([key, pts], idx) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const palette = idx === 0
              ? { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' }
              : { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' };
            return (
              <div key={key} className={`${palette.bg} border ${palette.border} rounded-xl p-3 text-center`}>
                <p className={`text-xs ${palette.text} font-semibold uppercase tracking-wider mb-1`}>{label}</p>
                <p className={`text-2xl font-game ${palette.text}`}>{pts}</p>
              </div>
            );
          })}
        </div>
      )}

      {displayMode === 'competitive' && sessionSummary.responseCount > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-lc-text3">Leaderboard</p>
          <AnimatePresence>
            {visibleEntries.filter(e => e.totalPoints > 0).map((entry) => (
              <motion.div
                key={entry.studentId}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group"
              >
                <button
                  onClick={() => setCurrentStudent(entry.studentId)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    entry.studentId === currentStudentId
                      ? 'bg-cyan-500/20 ring-1 ring-cyan-500/50'
                      : 'hover:bg-lc-card'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`text-sm font-bold w-6 ${entry.rank < 3 ? medalColors[entry.rank] : 'opacity-40'}`}>
                      {entry.rank + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/avatars/avatar-${resolveHelmet(entry.avatarSeed, entry.name)}.png`}
                      alt=""
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full flex-shrink-0"
                    />
                    <span className="truncate text-sm font-medium">
                      {entry.name}
                    </span>
                  </div>
                  <span className="relative text-sm font-game text-yellow-400">
                    {entry.totalPoints}
                    <AnimatePresence>
                      {deltas.has(entry.studentId) && (
                        <motion.span
                          key={`delta-${entry.studentId}-${deltas.get(entry.studentId)!.ts}`}
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -20 }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className="absolute -top-3 right-0 text-xs font-bold text-green-400 pointer-events-none"
                        >
                          +{deltas.get(entry.studentId)!.value}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
