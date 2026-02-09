'use client';

import { motion } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';

export function StreakIndicator({ studentId }: { studentId: string | null }) {
  const streaks = useSessionStore((s) => s.streaks);
  const students = useSessionStore((s) => s.students);

  if (!studentId) return null;
  const streak = streaks[studentId] ?? 0;
  if (streak < 2) return null;

  const student = students.find((s) => s.id === studentId);
  const cappedStreak = Math.min(streak, 6);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white"
    >
      {'🔥'.repeat(Math.min(cappedStreak - 1, 5))}
      <span>{student?.name} — {streak} streak! (+{Math.min(streak - 1, 5)} bonus)</span>
    </motion.div>
  );
}
