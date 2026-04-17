'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useStudentPrefs } from '@/hooks/use-student-prefs';

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

export function Leaderboard({ teacherView = true }: { teacherView?: boolean }) {
  const students = useSessionStore((s) => s.students);
  const scores = useSessionStore((s) => s.scores);
  const sessionId = useSessionStore((s) => s.sessionId);
  const setCurrentStudent = useSessionStore((s) => s.setCurrentStudent);
  const currentStudentId = useSessionStore((s) => s.currentStudentId);
  const awardPoints = useSessionStore((s) => s.awardPoints);
  const pickStudent = useSessionStore((s) => s.pickStudent);

  const prefsMap = useStudentPrefs(sessionId);

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

  // Map student_id → client_id for roster students (prefs are keyed by client_id)
  const studentIdToClientId = useMemo(() => {
    const m = new Map<string, string>();
    scores.forEach((sc) => {
      if (sc.student_id && sc.client_id) m.set(sc.student_id, sc.client_id);
    });
    return m;
  }, [scores]);

  const entries = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();

    // Add roster students
    students.forEach((s) => {
      map.set(s.id, { studentId: s.id, name: s.name, totalPoints: 0, correctCount: 0, bestStreak: 0, avatarSeed: s.avatar_seed });
    });

    // Process scores, creating entries for remote students
    scores.forEach((sc) => {
      const key = sc.student_id || sc.client_id; // Use client_id for remote students
      if (!key) return;

      let entry = map.get(key);
      if (!entry && sc.display_name) {
        // Remote student - create new entry
        entry = { studentId: key, name: sc.display_name, totalPoints: 0, correctCount: 0, bestStreak: 0 };
        map.set(key, entry);
      }
      if (!entry) return;

      entry.totalPoints += sc.points;
      if (sc.is_correct) entry.correctCount++;
      if (sc.streak_count > entry.bestStreak) entry.bestStreak = sc.streak_count;
    });

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, scores]);

  // During-session view: Top 3 + own entry (locked invariant).
  // Rank reflects actual position in the full sorted list.
  // When !teacherView, students who chose "fly anonymous" are excluded entirely.
  const visibleEntries = useMemo(() => {
    const isHidden = (studentId: string) => {
      if (teacherView) return false;
      const clientId = studentIdToClientId.get(studentId) ?? studentId;
      return prefsMap.get(clientId)?.score_visible === false;
    };

    const ranked = entries.map((e, i) => ({ ...e, rank: i }));
    const top3 = ranked.filter((e) => !isHidden(e.studentId)).slice(0, 3);
    if (!currentStudentId) return top3;
    const selfInTop3 = top3.some((e) => e.studentId === currentStudentId);
    if (selfInTop3) return top3;
    const self = ranked.find((e) => e.studentId === currentStudentId);
    if (!self || isHidden(self.studentId)) return top3;
    return [...top3, self];
  }, [entries, currentStudentId, teacherView, prefsMap, studentIdToClientId]);

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

      <div className="border-t border-lc-border/40 pt-3 space-y-1">
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
                    {prefsMap.get(studentIdToClientId.get(entry.studentId) ?? entry.studentId)?.score_visible === false
                      ? 'Anonymous pilot'
                      : entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Quick award buttons - appear on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); awardPoints(entry.studentId, 1); }}
                      className="px-1.5 py-0.5 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded cursor-pointer"
                    >
                      +1
                    </span>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); awardPoints(entry.studentId, 2); }}
                      className="px-1.5 py-0.5 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded cursor-pointer"
                    >
                      +2
                    </span>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); awardPoints(entry.studentId, 5); }}
                      className="px-1.5 py-0.5 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded cursor-pointer"
                    >
                      +5
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
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

