'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { useState, useCallback, useRef } from 'react';

export function StudentPicker() {
  const students = useSessionStore((s) => s.students);
  const currentStudentId = useSessionStore((s) => s.currentStudentId);
  const pickerMode = useSessionStore((s) => s.pickerMode);
  const setPickerMode = useSessionStore((s) => s.setPickerMode);
  const pickStudent = useSessionStore((s) => s.pickStudent);
  const [spinning, setSpinning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const currentStudent = students.find((s) => s.id === currentStudentId);

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

  const spinStudent = spinning ? students[displayIndex] : currentStudent;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm opacity-70 uppercase tracking-wider text-[10px]">Student Picker</h3>
        <div className="flex gap-1">
          {(['fair', 'random'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPickerMode(mode)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                pickerMode === mode ? 'bg-cyan-500/30 text-lc-blue' : 'text-lc-text2 opacity-60 hover:opacity-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={spinStudent?.id ?? 'empty'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center py-4"
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
        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-game text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white disabled:opacity-30"
      >
        {spinning ? 'PICKING...' : 'PICK STUDENT'}
      </button>

    </div>
  );
}
