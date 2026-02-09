'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EndSessionSummary({ classId, className }: { classId: string; className: string }) {
  const { students, scores, reset } = useSessionStore();

  const summary = useMemo(() => {
    const map = new Map<string, { name: string; total: number; correct: number; attempts: number; bestStreak: number }>();

    // Add roster students
    students.forEach((s) => {
      map.set(s.id, { name: s.name, total: 0, correct: 0, attempts: 0, bestStreak: 0 });
    });

    // Process scores, including remote students
    scores.forEach((sc) => {
      const key = sc.student_id || sc.client_id;
      if (!key) return;

      let entry = map.get(key);
      if (!entry && sc.display_name) {
        // Remote student - create new entry
        entry = { name: sc.display_name, total: 0, correct: 0, attempts: 0, bestStreak: 0 };
        map.set(key, entry);
      }
      if (!entry) return;

      entry.total += sc.points + sc.streak_bonus;
      entry.attempts++;
      if (sc.is_correct) entry.correct++;
      if (sc.streak_count > entry.bestStreak) entry.bestStreak = sc.streak_count;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [students, scores]);

  const totalRounds = scores.length;
  const overallAccuracy = totalRounds > 0
    ? Math.round((scores.filter((s) => s.is_correct).length / totalRounds) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Session Complete!</h1>
        <p className="text-center text-gray-500 mb-8">{className}</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalRounds}</p>
            <p className="text-sm text-gray-500">Total Turns</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{overallAccuracy}%</p>
            <p className="text-sm text-gray-500">Accuracy</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {summary.length > 0 ? Math.max(...summary.map((s) => s.bestStreak)) : 0}
            </p>
            <p className="text-sm text-gray-500">Best Streak</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold mb-4">Final Standings</h2>
          <div className="space-y-3">
            {summary.map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-800">{entry.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{entry.correct}/{entry.attempts}</span>
                  {entry.bestStreak >= 2 && <span className="text-orange-500">🔥{entry.bestStreak}</span>}
                  <span className="font-bold text-indigo-600 w-16 text-right">{entry.total} pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <Link href={`/classes/${classId}`}>
            <Button variant="secondary" onClick={reset}>Back to Class</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
