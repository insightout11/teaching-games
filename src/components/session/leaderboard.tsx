'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';

const HELMET_SEEDS = ['teal', 'amber', 'red', 'blue', 'violet', 'green', 'white', 'gold', 'black', 'pink', 'silver', 'rainbow'];
const VALID_HELMET_SEEDS = new Set(HELMET_SEEDS);

function resolveHelmet(avatarSeed: string | undefined, name: string): string {
  if (avatarSeed && VALID_HELMET_SEEDS.has(avatarSeed)) return avatarSeed;
  // Deterministic fallback based on name
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

  // Student picker state
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

  const entries = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();

    // Add roster students
    students.forEach((s) => {
      map.set(s.id, { studentId: s.id, name: s.name, totalPoints: 0, correctCount: 0, bestStreak: 0, avatarSeed: s.avatar_seed });
    });

    const leaderboardScores = scores.filter(countsForLeaderboard);

    leaderboardScores.forEach((sc) => {
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

  // Competitive/class mode: Top 3 + own entry (locked invariant).
  // Rank reflects actual position in the full sorted list.
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

  // Team mode: aggregate by team key (generic — supports 'x'/'o', 'red'/'blue', etc.)
  const teamTotals = useMemo(() => {
    if (displayMode !== 'team') return null;
    const leaderboardScores = scores.filter(countsForLeaderboard);
    const map = new Map<string, number>();
    leaderboardScores.forEach((sc) => {
      if (!sc.team) return;
      map.set(sc.team, (map.get(sc.team) ?? 0) + sc.points);
    });
    return map.size > 0 ? Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])) : null;
  }, [displayMode, scores]);

  // Class mode: count distinct participants
  const participantCount = useMemo(() => {
    if (displayMode !== 'class') return null;
    const leaderboardScores = scores.filter(countsForLeaderboard);
    const ids = new Set(leaderboardScores.map(sc => sc.student_id || sc.client_id).filter(Boolean));
    return { participated: ids.size, total: students.length };
  }, [displayMode, scores, students]);

  // Delta animation tracking
  const prevTotals = useRef<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);
  const [deltas, setDeltas] = useState<Map<string, { value: number; ts: number }>>(new Map());

  useEffect(() => {
    if (isFirstRender.current) {
      // Populate ref on first render without triggering deltas
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

    // Update ref to current totals
    const updated = new Map<string, number>();
    entries.forEach((e) => updated.set(e.studentId, e.totalPoints));
    prevTotals.current = updated;

    if (newDeltas.size > 0) {
      setDeltas((prev) => {
        const merged = new Map(prev);
        newDeltas.forEach((v, k) => merged.set(k, v));
        return merged;
      });

      // Clear these deltas after animation completes
      const keys = Array.from(newDeltas.keys());
      const timeout = setTimeout(() => {
        setDeltas((prev) => {
          const next = new Map(prev);
          keys.forEach((k) => {
            // Only clear if timestamp matches (avoid clearing a newer delta)
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
    <div className="glass rounded-2xl p-4">
      <h3 className="font-semibold text-sm opacity-70 mb-3 uppercase tracking-wider text-[10px]">Leaderboard</h3>

      {/* Student Picker */}
      <div className="mb-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={spinStudent?.id ?? 'empty'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-center py-2"
          >
            {spinStudent ? (
              <p className={`text-2xl font-game ${spinning ? 'opacity-40' : 'text-lc-blue'}`}>
                {spinStudent.name}
              </p>
            ) : (
              <p className="opacity-40 text-sm">No student selected</p>
            )}
          </motion.div>
        </AnimatePresence>
        <button
          onClick={handlePick}
          disabled={spinning || students.length === 0}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white disabled:opacity-30"
        >
          {spinning ? 'PICKING...' : 'PICK STUDENT'}
        </button>
      </div>

      <div className="border-t border-lc-border/40 pt-3">

        {/* Team mode: generic two-team totals */}
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

        {/* Class mode: participation count only — no ranked list */}
        {displayMode === 'class' && participantCount && (
          <div className="py-2 text-center">
            <p className="text-xs text-gray-400">
              <span className="text-white font-semibold">{participantCount.participated}</span>
              {' / '}{participantCount.total} responded
            </p>
          </div>
        )}

        {/* Competitive only: ranked list (Top 3 + own) */}
        {displayMode === 'competitive' && (
          <div className="space-y-1">
            <AnimatePresence>
              {visibleEntries.map((entry) => (
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
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold w-6 ${entry.rank < 3 ? medalColors[entry.rank] : 'opacity-40'}`}>
                        {entry.rank + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/avatars/avatar-${resolveHelmet(entry.avatarSeed, entry.name)}.png`}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <span className="text-sm font-medium">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
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
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
