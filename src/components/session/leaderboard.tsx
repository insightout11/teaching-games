'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { useMemo } from 'react';

interface LeaderboardEntry {
  studentId: string;
  name: string;
  totalPoints: number;
  correctCount: number;
  bestStreak: number;
}

export function Leaderboard() {
  const { students, scores, setCurrentStudent, currentStudentId, awardPoints } = useSessionStore();

  const entries = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();

    // Add roster students
    students.forEach((s) => {
      map.set(s.id, { studentId: s.id, name: s.name, totalPoints: 0, correctCount: 0, bestStreak: 0 });
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

      entry.totalPoints += sc.points + sc.streak_bonus;
      if (sc.is_correct) entry.correctCount++;
      if (sc.streak_count > entry.bestStreak) entry.bestStreak = sc.streak_count;
    });

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, scores]);

  const medalColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="font-semibold text-sm opacity-70 mb-3 uppercase tracking-wider text-[10px]">Leaderboard</h3>
      <div className="space-y-1">
        <AnimatePresence>
          {entries.map((entry, i) => (
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
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold w-6 ${i < 3 ? medalColors[i] : 'opacity-40'}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{entry.name}</span>
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
                  {entry.bestStreak >= 2 && (
                    <span className="text-xs text-orange-400">🔥{entry.bestStreak}</span>
                  )}
                  <span className="text-sm font-game text-yellow-400">{entry.totalPoints}</span>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
