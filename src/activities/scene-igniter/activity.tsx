'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ActivityProps } from '../types';
import type { SceneIgniterContent, SceneIgniterLine, SceneIgniterScene } from '../types';
import type { Student } from '@/lib/supabase/types';

type Phase = 'idle' | 'running' | 'group_done' | 'improv-running' | 'summary';

function assignRoles(lines: SceneIgniterLine[], students: Student[]): Map<string, Student> {
  const charLineCounts = new Map<string, number>();
  for (const line of lines) {
    charLineCounts.set(line.character, (charLineCounts.get(line.character) ?? 0) + 1);
  }
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

function renderWithBlanks(text: string): React.ReactNode {
  const parts = text.split('___');
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="border-b-2 border-amber-400 text-amber-300 font-semibold px-1 mx-0.5">
          ___
        </span>
      )}
    </React.Fragment>
  ));
}

const BLANK_HINTS = ['Try a noun.', 'Try an emotion.', 'Try a food.', 'Try a place.', 'Try an action.'];

export function SceneIgniterActivity({
  students,
  generatedContent,
  onPhaseChange,
  onScore,
}: ActivityProps) {
  const content = generatedContent as SceneIgniterContent;
  const { scenes } = content;

  // Which scene/group we're currently on (0 = group 1, 1 = group 2)
  const [sceneIndex, setSceneIndex] = useState<0 | 1>(0);
  // Whether we're using the alt (pre-generated replacement) scene
  const [useAltScene, setUseAltScene] = useState(false);

  // Split students into groups once on mount
  const groupStudents = useMemo(() => {
    const g1 = students.slice(0, 4);
    const g2 = students.slice(4);
    return [g1, g2] as const;
  }, [students]);

  const hasGroup2 = groupStudents[1].length >= 2;

  const currentScene: SceneIgniterScene =
    scenes[sceneIndex + (useAltScene ? 2 : 0)] ?? scenes[sceneIndex];
  const currentGroup = groupStudents[sceneIndex];
  const hasAltScene = Boolean(scenes[sceneIndex + 2]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [charToStudent, setCharToStudent] = useState<Map<string, Student>>(
    () => assignRoles(scenes[0].lines, groupStudents[0])
  );

  // Improv: student order for round-robin; can be reshuffled independently
  const [improvStudentOrder, setImprovStudentOrder] = useState<Student[]>([]);
  const [improvShuffled, setImprovShuffled] = useState(false);

  // Track scored lines per group separately so summary can combine them
  const [scoredLines, setScoredLines] = useState<Set<number>>(new Set());
  const group1ScoredLinesRef = useRef<Set<number>>(new Set());
  // Mapping from line index to student name (for combined summary)
  const group1StudentMapRef = useRef<Map<string, Student>>(new Map());

  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll current line into view
  useEffect(() => {
    if (phase === 'running' || phase === 'improv-running') {
      lineRefs.current[currentIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIdx, phase]);

  const handleReroll = useCallback(() => {
    setCharToStudent(assignRoles(currentScene.lines, shuffled(currentGroup)));
  }, [currentScene.lines, currentGroup]);

  const handleStart = useCallback(() => {
    setCurrentIdx(0);
    setScoredLines(new Set());
    setPhase('running');
    onPhaseChange?.('running');
  }, [onPhaseChange]);

  const handleNext = useCallback(async () => {
    const line = currentScene.lines[currentIdx];
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
    if (currentIdx + 1 >= currentScene.lines.length) {
      handleEndScene();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene.lines, currentIdx, scoredLines, charToStudent, onScore]);

  const handleSkip = useCallback(() => {
    if (currentIdx + 1 >= currentScene.lines.length) {
      handleEndScene();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, currentScene.lines.length]);

  const handlePrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);

  // Enter improv: initialize student order and reset cursor
  const handleEnterImprov = useCallback(() => {
    setImprovStudentOrder([...currentGroup]);
    setImprovShuffled(false);
    setCurrentIdx(0);
    setPhase('improv-running');
    onPhaseChange?.('improv-running');
  }, [currentGroup, onPhaseChange]);

  const handleEndScene = useCallback(() => {
    if (sceneIndex === 0 && hasGroup2) {
      // Save group 1 data before transitioning
      group1ScoredLinesRef.current = new Set(scoredLines);
      group1StudentMapRef.current = new Map(charToStudent);
      setPhase('group_done');
      onPhaseChange?.('group_done');
    } else {
      // Final group → flow directly into improv
      handleEnterImprov();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIndex, hasGroup2, scoredLines, charToStudent, onPhaseChange, handleEnterImprov]);

  // Improv navigation (no scoring)
  const handleImprovNext = useCallback(() => {
    if (currentIdx + 1 >= currentScene.improvScript.length) {
      setPhase('summary');
      onPhaseChange?.('summary');
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, currentScene.improvScript.length, onPhaseChange]);

  const handleImprovPrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);

  const handleStartGroup2 = useCallback(() => {
    const g2 = groupStudents[1];
    const s2 = scenes[1];
    setSceneIndex(1);
    setCharToStudent(assignRoles(s2.lines, g2));
    setCurrentIdx(0);
    setScoredLines(new Set());
    setUseAltScene(false);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [groupStudents, scenes, onPhaseChange]);

  const handleRunAgain = useCallback(() => {
    const g1 = groupStudents[0];
    const s1 = scenes[0];
    setSceneIndex(0);
    setCharToStudent(assignRoles(s1.lines, shuffled(g1)));
    setCurrentIdx(0);
    setScoredLines(new Set());
    group1ScoredLinesRef.current = new Set();
    group1StudentMapRef.current = new Map();
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [groupStudents, scenes, onPhaseChange]);

  const handleNewScene = useCallback(() => {
    const altIdx = sceneIndex + 2;
    const altScene = scenes[altIdx];
    if (!altScene) return;
    setUseAltScene(true);
    setCharToStudent(assignRoles(altScene.lines, shuffled(currentGroup)));
    setCurrentIdx(0);
    setScoredLines(new Set());
    group1ScoredLinesRef.current = new Set();
    group1StudentMapRef.current = new Map();
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [sceneIndex, scenes, currentGroup, onPhaseChange]);

  // Combined lines-per-student across both groups for summary
  const combinedLinesPerStudent = useCallback((): { name: string; count: number }[] => {
    const counts = new Map<string, number>();

    // Group 1
    for (const lineIndex of Array.from(group1ScoredLinesRef.current)) {
      const line = scenes[0].lines.find((l) => l.lineIndex === lineIndex);
      if (!line) continue;
      const student = group1StudentMapRef.current.get(line.character);
      if (!student) continue;
      counts.set(student.name, (counts.get(student.name) ?? 0) + 1);
    }

    // Group 2 (current group when at summary)
    for (const lineIndex of Array.from(scoredLines)) {
      const scene = sceneIndex === 0 ? scenes[0] : scenes[1];
      const line = scene.lines.find((l) => l.lineIndex === lineIndex);
      if (!line) continue;
      const student = charToStudent.get(line.character);
      if (!student) continue;
      counts.set(student.name, (counts.get(student.name) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [scoredLines, scenes, charToStudent, sceneIndex]);

  const totalScoredLines = (sceneIndex === 0 ? 0 : group1ScoredLinesRef.current.size) + scoredLines.size;
  const totalLines = (hasGroup2 ? scenes[0].lines.length + scenes[1].lines.length : scenes[0].lines.length);

  const chars = Array.from(new Set(currentScene.lines.map((l) => l.character))).sort();

  // ─── IDLE ─────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    const groupLabel = hasGroup2 ? (sceneIndex === 0 ? 'Group 1 of 2' : 'Group 2 of 2') : null;
    return (
      <div className="space-y-5">
        {/* Title */}
        <div className="text-center space-y-1">
          {groupLabel && (
            <span className="inline-block text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-medium mb-1">
              {groupLabel}
            </span>
          )}
          <p className="text-2xl font-bold opacity-90">{currentScene.title}</p>
          <p className="text-xs opacity-40">{currentScene.lines.length} lines · {chars.length} characters</p>
        </div>

        {/* Context card */}
        <div className="glass p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-1">
          <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wide">The Scene</p>
          <p className="text-sm opacity-80 leading-relaxed">{currentScene.context}</p>
        </div>

        {/* Role assignments */}
        <div className="grid grid-cols-2 gap-3">
          {chars.map((char) => {
            const student = charToStudent.get(char);
            const charLines = currentScene.lines.filter((l) => l.character === char).length;
            return (
              <div
                key={char}
                className="glass p-3 rounded-2xl border border-emerald-500/20 space-y-1"
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

        {/* Full script preview */}
        <div className="space-y-1">
          <p className="text-xs font-semibold opacity-40 uppercase tracking-wide">Full Script</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {currentScene.lines.map((line) => {
              const student = charToStudent.get(line.character);
              return (
                <div key={line.lineIndex} className="flex items-start gap-2 text-sm">
                  <span className="text-xs opacity-40 w-4 shrink-0 pt-0.5 text-right">{line.lineIndex}</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 rounded text-xs font-mono font-bold shrink-0">{line.character}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs opacity-50 mr-1">{student?.name ?? '—'}</span>
                    {line.direction && (
                      <span className="italic text-amber-400/70 text-xs mr-1">({line.direction})</span>
                    )}
                    <span className="opacity-80">{line.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
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
    );
  }

  // ─── RUNNING ───────────────────────────────────────────────────────────────
  if (phase === 'running') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-emerald-400">{currentScene.title}</h3>
          <span className="text-sm opacity-60">Line {currentIdx + 1} / {currentScene.lines.length}</span>
        </div>

        {/* Full script with highlight */}
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
          {currentScene.lines.map((line, idx) => {
            const student = charToStudent.get(line.character);
            const isCurrent = idx === currentIdx;
            const isPast = idx < currentIdx;
            return (
              <div
                key={line.lineIndex}
                ref={(el) => { lineRefs.current[idx] = el; }}
                className={[
                  'flex items-start gap-2 px-3 py-2 rounded-xl transition-all',
                  isCurrent
                    ? 'bg-emerald-500/10 border-l-2 border-emerald-400'
                    : 'border-l-2 border-transparent',
                  isPast ? 'opacity-35' : isCurrent ? 'opacity-100' : 'opacity-60',
                ].join(' ')}
              >
                <span className="text-xs opacity-40 w-4 shrink-0 pt-0.5 text-right">{line.lineIndex}</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 rounded text-xs font-mono font-bold shrink-0">{line.character}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs opacity-50 mr-1">{student?.name ?? '—'}</span>
                  {line.direction && (
                    <span className="italic text-amber-400/70 text-xs mr-1">({line.direction})</span>
                  )}
                  <span className={isCurrent ? 'text-base font-medium' : 'text-sm'}>{line.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nav bar */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors text-sm font-medium"
          >
            ← Prev
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl transition-colors text-sm font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            {currentIdx + 1 >= currentScene.lines.length ? 'Finish Scene ✓' : 'Next Line ▶'}
          </button>
          <button
            onClick={handleEndScene}
            className="px-4 py-2.5 text-sm opacity-40 hover:opacity-60 transition-opacity bg-white/5 rounded-xl"
          >
            End Scene
          </button>
        </div>
      </div>
    );
  }

  // ─── GROUP DONE ────────────────────────────────────────────────────────────
  if (phase === 'group_done') {
    const g1Lines = combinedLinesPerStudent();
    const g2 = groupStudents[1];
    const s2chars = Array.from(new Set(scenes[1].lines.map((l) => l.character))).sort();
    // Preview role assignment for group 2
    const previewRoles = assignRoles(scenes[1].lines, g2);

    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-emerald-400">Group 1 — Scene Complete!</p>
        </div>

        {/* Lines per student for group 1 */}
        <div className="space-y-2">
          {g1Lines.map(({ name, count }) => (
            <div
              key={name}
              className="flex items-center justify-between glass px-4 py-3 rounded-xl"
            >
              <span className="font-medium text-sm">{name}</span>
              <span className="text-sm opacity-60">{count} line{count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>

        {/* Group 2 preview */}
        <div className="space-y-2">
          <p className="text-xs font-semibold opacity-40 uppercase tracking-wide">Next up: Group 2</p>
          <div className="grid grid-cols-2 gap-3">
            {s2chars.map((char) => {
              const student = previewRoles.get(char);
              return (
                <div
                  key={char}
                  className="glass p-3 rounded-2xl border border-emerald-500/20 space-y-1"
                >
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-bold">
                    {char}
                  </span>
                  <p className="font-semibold text-sm truncate">{student?.name ?? '—'}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleStartGroup2}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            Start Group 2 ▶
          </button>
        </div>
      </div>
    );
  }

  // ─── IMPROV RUNNING ────────────────────────────────────────────────────────
  if (phase === 'improv-running') {
    const isLastImprovLine = currentIdx + 1 >= currentScene.improvScript.length;
    const activeOrder = improvStudentOrder.length > 0 ? improvStudentOrder : currentGroup;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-400">Act 2 — Improv</h3>
          <span className="text-sm opacity-60">Line {currentIdx + 1} / {currentScene.improvScript.length}</span>
        </div>

        {/* Twist card */}
        <div className="glass p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-1">
          <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wide">The Twist</p>
          <p className="text-base font-medium leading-snug">{currentScene.improvPrompt}</p>
        </div>

        {/* Escalation rule */}
        <div className="glass px-4 py-3 rounded-xl border border-white/10 text-xs opacity-55 space-y-0.5">
          <p className="font-semibold uppercase tracking-wide">Improv Rule</p>
          <p>Each new line must: add a problem · add emotion · or add a new idea</p>
        </div>

        {/* Actor reshuffle toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setImprovStudentOrder([...currentGroup]); setImprovShuffled(false); }}
            className={[
              'px-3 py-1.5 text-xs rounded-lg transition-colors',
              !improvShuffled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 opacity-60 hover:opacity-80',
            ].join(' ')}
          >
            Keep Same Roles
          </button>
          <button
            onClick={() => { setImprovStudentOrder(shuffled(currentGroup)); setImprovShuffled(true); }}
            className={[
              'px-3 py-1.5 text-xs rounded-lg transition-colors',
              improvShuffled ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 opacity-60 hover:opacity-80',
            ].join(' ')}
          >
            Shuffle Roles
          </button>
        </div>

        {/* Line-by-line improv script */}
        <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
          {currentScene.improvScript.map((line, idx) => {
            const assignedStudent = activeOrder[idx % activeOrder.length];
            const isCurrent = idx === currentIdx;
            const isPast = idx < currentIdx;
            const hasBlank = line.text.includes('___');
            return (
              <div
                key={idx}
                ref={(el) => { lineRefs.current[idx] = el; }}
                className={[
                  'px-3 py-2 rounded-xl transition-all',
                  isCurrent
                    ? 'bg-amber-500/10 border-l-2 border-amber-400'
                    : 'border-l-2 border-transparent',
                  isPast ? 'opacity-35' : isCurrent ? 'opacity-100' : 'opacity-60',
                ].join(' ')}
              >
                <div className="flex items-start gap-2 text-sm">
                  <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-300 rounded text-xs font-mono font-bold shrink-0">{line.character}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs opacity-50 mr-1">{assignedStudent?.name ?? '—'}</span>
                    <span className={isCurrent ? 'text-base font-medium' : 'text-sm'}>{renderWithBlanks(line.text)}</span>
                    {isCurrent && hasBlank && (
                      <p className="text-xs opacity-50 italic mt-1">{BLANK_HINTS[idx % BLANK_HINTS.length]}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nav bar */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleImprovPrev}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors text-sm font-medium"
          >
            ← Prev
          </button>
          <button
            onClick={handleImprovNext}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            {isLastImprovLine ? 'Improv Complete ✓' : 'Next Line ▶'}
          </button>
        </div>
      </div>
    );
  }

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  const activeScene = scenes[sceneIndex];
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <p className="text-2xl font-bold text-emerald-400">Scene Complete!</p>
        <p className="text-sm opacity-50">{totalScoredLines} / {totalLines} lines spoken</p>
      </div>

      {/* Lines per student (combined) */}
      <div className="space-y-2">
        {combinedLinesPerStudent().map(({ name, count }) => (
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

      {/* Improv Twist card */}
      <div className="glass p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wide">Optional Improv Twist</p>
          <p className="text-base font-medium leading-snug">{activeScene.improvPrompt}</p>
        </div>
        <button
          onClick={handleEnterImprov}
          className="px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-sm font-medium transition-colors"
        >
          Run Improv ▶
        </button>
      </div>

      <div className="flex items-center justify-end gap-3">
        {hasAltScene && !useAltScene && (
          <button
            onClick={handleNewScene}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
          >
            New Scene ✨
          </button>
        )}
        <button
          onClick={handleRunAgain}
          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
        >
          Run Again
        </button>
      </div>
    </div>
  );
}
