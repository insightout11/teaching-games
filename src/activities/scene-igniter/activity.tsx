'use client';

import { useState, useCallback } from 'react';
import type { ActivityProps } from '../types';
import type { SceneIgniterContent, SceneIgniterLine } from '../types';
import type { Student } from '@/lib/supabase/types';

type Phase = 'idle' | 'running' | 'summary';

function assignRoles(lines: SceneIgniterLine[], students: Student[]): Map<string, Student> {
  // Count lines per character
  const charLineCounts = new Map<string, number>();
  for (const line of lines) {
    charLineCounts.set(line.character, (charLineCounts.get(line.character) ?? 0) + 1);
  }
  // Sort characters by line count desc, assign greedily to student with fewest accumulated lines
  const sorted = Array.from(charLineCounts.entries()).sort((a, b) => b[1] - a[1]);
  const studentLineCounts = new Map(students.map((s) => [s.id, 0]));
  const result = new Map<string, Student>();
  for (const [char] of sorted) {
    const candidate = students.reduce((a, b) =>
      (studentLineCounts.get(a.id) ?? 0) <= (studentLineCounts.get(b.id) ?? 0) ? a : b
    );
    result.set(char, candidate);
    studentLineCounts.set(
      candidate.id,
      (studentLineCounts.get(candidate.id) ?? 0) + (charLineCounts.get(char) ?? 0)
    );
  }
  return result;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SceneIgniterActivity({
  students,
  generatedContent,
  onPhaseChange,
  onScore,
}: ActivityProps) {
  const content = generatedContent as SceneIgniterContent;
  const { title, lines } = content;

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [charToStudent, setCharToStudent] = useState<Map<string, Student>>(
    () => assignRoles(lines, students)
  );
  const [scoredLines, setScoredLines] = useState<Set<number>>(new Set());

  const handleReroll = useCallback(() => {
    setCharToStudent(assignRoles(lines, shuffled(students)));
  }, [lines, students]);

  const handleStart = useCallback(() => {
    setCurrentIdx(0);
    setScoredLines(new Set());
    setPhase('running');
    onPhaseChange?.('running');
  }, [onPhaseChange]);

  const handleNext = useCallback(async () => {
    const line = lines[currentIdx];
    if (line && !scoredLines.has(line.lineIndex)) {
      const student = charToStudent.get(line.character);
      if (student?.id) {
        await onScore?.({
          studentId: student.id,
          clientId: null,
          displayName: student.name,
          promptIndex: line.lineIndex,
          points: 1,
          isCorrect: null,
        });
      }
      setScoredLines((prev) => new Set(prev).add(line.lineIndex));
    }
    if (currentIdx + 1 >= lines.length) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [lines, currentIdx, scoredLines, charToStudent, onScore, onPhaseChange]);

  const handleSkip = useCallback(() => {
    if (currentIdx + 1 >= lines.length) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, lines.length, onPhaseChange]);

  const handlePrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);

  const handleRunAgain = useCallback(() => {
    setCharToStudent(assignRoles(lines, shuffled(students)));
    setCurrentIdx(0);
    setScoredLines(new Set());
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [lines, students, onPhaseChange]);

  // Compute lines-per-student for summary
  const linesPerStudent = useCallback((): { name: string; count: number }[] => {
    const counts = new Map<string, number>();
    for (const lineIndex of Array.from(scoredLines)) {
      const line = lines.find((l) => l.lineIndex === lineIndex);
      if (!line) continue;
      const student = charToStudent.get(line.character);
      if (!student) continue;
      counts.set(student.name, (counts.get(student.name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [scoredLines, lines, charToStudent]);

  const currentLine = lines[currentIdx];
  const currentStudent = currentLine ? charToStudent.get(currentLine.character) : undefined;

  // Unique characters for role cards
  const chars = Array.from(new Set(lines.map((l) => l.character))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-emerald-400">Scene Igniter</h3>
        {phase === 'running' && (
          <span className="text-sm opacity-60">
            Line {currentIdx + 1} / {lines.length}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold opacity-90">{title}</p>
            <p className="text-sm opacity-50">{lines.length} lines · {chars.length} characters</p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-3">
            {chars.map((char) => {
              const student = charToStudent.get(char);
              const charLines = lines.filter((l) => l.character === char).length;
              return (
                <div
                  key={char}
                  className="glass p-4 rounded-2xl border border-emerald-500/20 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-bold">
                      {char}
                    </span>
                    <span className="text-xs opacity-40">{charLines} line{charLines !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="font-semibold text-sm truncate">{student?.name ?? '—'}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleReroll}
              className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
            >
              Re-roll Roles
            </button>
            <button
              onClick={handleStart}
              className="px-10 py-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full font-game text-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              Start Scene ▶
            </button>
          </div>
        </div>
      )}

      {/* RUNNING */}
      {phase === 'running' && currentLine && (
        <div className="space-y-6">
          {/* Current line card */}
          <div className="glass p-6 rounded-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-mono font-bold">
                {currentLine.character}
              </span>
              <span className="font-semibold text-sm opacity-80">
                {currentStudent?.name ?? '—'}
              </span>
            </div>
            <p className="text-2xl leading-snug font-medium">{currentLine.text}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-5 py-3 bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors text-sm font-medium"
            >
              ← Prev
            </button>
            <button
              onClick={handleSkip}
              className="px-5 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors text-sm font-medium"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              {currentIdx + 1 >= lines.length ? 'Finish Scene ✓' : 'Next Line ▶'}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => { setPhase('summary'); onPhaseChange?.('summary'); }}
              className="text-xs opacity-40 hover:opacity-60 transition-opacity"
            >
              End Scene
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {phase === 'summary' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-emerald-400">Scene Complete!</p>
            <p className="text-sm opacity-50">{scoredLines.size} / {lines.length} lines spoken</p>
          </div>

          {/* Lines per student */}
          <div className="space-y-2">
            {linesPerStudent().map(({ name, count }) => (
              <div
                key={name}
                className="flex items-center justify-between glass px-4 py-3 rounded-xl"
              >
                <span className="font-medium text-sm">{name}</span>
                <span className="text-sm opacity-60">
                  {count} line{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunAgain}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              Run Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
