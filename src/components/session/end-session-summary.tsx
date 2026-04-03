'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EndSessionSummary({ classId, className, sessionId }: { classId: string; className: string; sessionId: string }) {
  const students = useSessionStore((s) => s.students);
  const scores = useSessionStore((s) => s.scores);
  const reset = useSessionStore((s) => s.reset);

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

      entry.total += sc.points;
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
        <h1 className="text-3xl font-bold text-center text-lc-text mb-2">Session Complete!</h1>
        <p className="text-center text-lc-text3 mb-8">{className}</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-lc-card rounded-2xl border border-lc-border p-4 text-center">
            <p className="text-2xl font-bold text-lc-blue">{totalRounds}</p>
            <p className="text-sm text-lc-text3">Total Turns</p>
          </div>
          <div className="bg-lc-card rounded-2xl border border-lc-border p-4 text-center">
            <p className="text-2xl font-bold text-lc-success">{overallAccuracy}%</p>
            <p className="text-sm text-lc-text3">Accuracy</p>
          </div>
          <div className="bg-lc-card rounded-2xl border border-lc-border p-4 text-center">
            <p className="text-2xl font-bold text-lc-warn">
              {summary.length > 0 ? Math.max(...summary.map((s) => s.bestStreak)) : 0}
            </p>
            <p className="text-sm text-lc-text3">Best Streak</p>
          </div>
        </div>

        <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
          <h2 className="font-semibold mb-4 text-lc-text">Final Standings</h2>
          <div className="space-y-3">
            {summary.map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2 border-b border-lc-border-subtle last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-lc-text3/20 text-lc-text3' :
                    i === 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-lc-surface text-lc-text3'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-medium text-lc-text">{entry.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-lc-text3">{entry.correct}/{entry.attempts}</span>
                  {entry.bestStreak >= 2 && <span className="text-lc-warn">🔥{entry.bestStreak}</span>}
                  <span className="font-bold text-lc-blue w-16 text-right">{entry.total} pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <Link href={`/classes/${classId}`}>
            <Button variant="secondary" onClick={reset}>Back to Class</Button>
          </Link>
          <Link href={`/classes/${classId}/sessions/${sessionId}/control-room`}>
            <Button variant="secondary">View Control Room</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
