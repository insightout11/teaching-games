'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student } from '@/lib/supabase/types';

interface RandomPickerContentProps {
  students: Student[];
}

type PickMode = 'one' | 'multi' | 'groups';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function RandomPickerContent({ students }: RandomPickerContentProps) {
  const [mode, setMode] = useState<PickMode>('one');

  // Pick one state
  const [spinning, setSpinning] = useState(false);
  const [pickedStudent, setPickedStudent] = useState<Student | null>(null);
  const [displayStudent, setDisplayStudent] = useState<Student | null>(null);

  // Pick N state
  const [pickCount, setPickCount] = useState(2);
  const [pickedMulti, setPickedMulti] = useState<Student[]>([]);

  // Groups state
  const [groupSize, setGroupSize] = useState(2);
  const [groups, setGroups] = useState<Student[][]>([]);

  const handlePickOne = useCallback(() => {
    if (students.length === 0) return;
    setSpinning(true);
    setPickedStudent(null);

    let count = 0;
    const interval = setInterval(() => {
      setDisplayStudent(students[Math.floor(Math.random() * students.length)]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const picked = students[Math.floor(Math.random() * students.length)];
        setDisplayStudent(picked);
        setPickedStudent(picked);
        setSpinning(false);
      }
    }, 100);
  }, [students]);

  const handlePickMulti = useCallback(() => {
    if (students.length === 0) return;
    const count = Math.min(pickCount, students.length);
    const shuffled = shuffleArray(students);
    setPickedMulti(shuffled.slice(0, count));
  }, [students, pickCount]);

  const handleFormGroups = useCallback(() => {
    if (students.length === 0) return;
    const shuffled = shuffleArray(students);
    const result: Student[][] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      result.push(shuffled.slice(i, i + groupSize));
    }
    // If last group is too small (1 person), merge with previous
    if (result.length > 1 && result[result.length - 1].length === 1) {
      const lonely = result.pop()!;
      result[result.length - 1].push(...lonely);
    }
    setGroups(result);
  }, [students, groupSize]);

  return (
    <div>
      {/* Mode Tabs */}
      <div className="flex border-b border-lc-border">
        {([
          { key: 'one' as const, label: 'Pick 1' },
          { key: 'multi' as const, label: 'Pick N' },
          { key: 'groups' as const, label: 'Groups' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              mode === tab.key ? 'text-cyan-400 border-b-2 border-cyan-400' : 'opacity-50 hover:opacity-80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {students.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-4">No students in session</p>
        ) : mode === 'one' ? (
          /* Pick One Mode */
          <div className="space-y-4">
            <div className="text-center py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayStudent?.id ?? 'empty'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1 }}
                >
                  {displayStudent ? (
                    <p className={`text-2xl font-game ${spinning ? 'opacity-40' : 'text-cyan-400'}`}>
                      {displayStudent.name}
                    </p>
                  ) : (
                    <p className="opacity-40 text-sm">Click to pick a student</p>
                  )}
                </motion.div>
              </AnimatePresence>
              {pickedStudent && !spinning && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-green-400 mt-2"
                >
                  Selected!
                </motion.p>
              )}
            </div>
            <button
              onClick={handlePickOne}
              disabled={spinning}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white disabled:opacity-30"
            >
              {spinning ? 'Picking...' : 'Pick Student'}
            </button>
          </div>
        ) : mode === 'multi' ? (
          /* Pick N Mode */
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60 mb-2">How many?</p>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPickCount(n)}
                    className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                      pickCount === n ? 'bg-cyan-500/30 text-cyan-400' : 'bg-lc-card hover:bg-lc-border'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handlePickMulti}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white"
            >
              Pick {Math.min(pickCount, students.length)} Students
            </button>
            {pickedMulti.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-1"
              >
                {pickedMulti.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 bg-lc-surface rounded-lg"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm">{s.name}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          /* Groups Mode */
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Group size</p>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGroupSize(n)}
                    className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                      groupSize === n ? 'bg-cyan-500/30 text-cyan-400' : 'bg-lc-card hover:bg-lc-border'
                    }`}
                  >
                    {n}s
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleFormGroups}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-game text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white"
            >
              Form Groups
            </button>
            {groups.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {groups.map((group, gi) => (
                  <motion.div
                    key={gi}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.15 }}
                    className="bg-lc-surface rounded-lg p-3"
                  >
                    <p className="text-xs font-semibold text-purple-400 mb-1.5">Group {gi + 1}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.map((s) => (
                        <span key={s.id} className="px-2 py-1 bg-lc-card rounded text-xs">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
                <p className="text-xs opacity-40 text-center">
                  {groups.length} groups from {students.length} students
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
