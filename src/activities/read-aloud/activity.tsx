'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ActivityProps } from '../types';
import type { ReadAloudContent } from '../types';
import type { ReadAloudQueueEntry } from '@/lib/input-spec';
import { ComprehensionQuiz } from '../shared/comprehension-quiz';
import { BookOpen, ChevronRight, SkipForward, RotateCcw, ListChecks } from 'lucide-react';
import { splitReadingTurns } from '@/lib/read-aloud';

type Phase = 'idle' | 'reading' | 'complete' | 'quiz';

function highlightVocab(text: string, vocabWords: string[]): React.ReactNode {
  if (!vocabWords.length) return text;
  const escaped = vocabWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part)
      ? <mark key={i} className="bg-emerald-500/25 text-emerald-200 rounded px-0.5 not-italic font-medium">{part}</mark>
      : part
  );
}

export function ReadAloudActivity({
  generatedContent,
  students,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as ReadAloudContent;
  const {
    sourceText = '',
    sourceTitle = 'Text',
    readingTurnWords,
    sourceCitations = [],
    slides,
    vocabWords = [],
    comprehensionQuestions = [],
    discussionPrompt,
  } = content;
  const hasQuestions = comprehensionQuestions.length > 0;

  const readingTurns = useMemo(
    () => splitReadingTurns(sourceText, students.length, readingTurnWords),
    [readingTurnWords, sourceText, students.length],
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<ReadAloudQueueEntry[]>([]);

  function getSlideUrl(index: number): string | undefined {
    if (!slides || slides.length === 0) return undefined;
    const slideIndex = Math.min(Math.floor(index * slides.length / Math.max(readingTurns.length, 1)), slides.length - 1);
    return slides[slideIndex];
  }

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const queueRef = useRef(queue);
  queueRef.current = queue;

  // Push input spec whenever queue/phase changes
  useEffect(() => {
    // During the quiz the ComprehensionQuiz owns the input spec — don't clobber it.
    if (phase === 'quiz') return;
    if (phase !== 'reading' || queue.length === 0) {
      onSetInputSpec?.(null);
      return;
    }
    const currentSlideUrl = getSlideUrl(currentIndex);
    onSetInputSpec?.({
      type: 'read-aloud',
      gameKey: 'read-aloud',
      prompt: `Reading: ${sourceTitle}`,
      readAloudQueue: queue,
      ...(vocabWords.length > 0 ? { readAloudVocabWords: vocabWords } : {}),
      ...(currentSlideUrl ? { currentSlideUrl } : {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, queue, currentIndex, sourceTitle, onSetInputSpec]);

  // Student taps "Done Reading" → advance
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'reading') return;
      const active = queueRef.current[currentIndexRef.current];
      // Match by displayName — the common identifier across student device and DB roster
      if (!active || vote.displayName !== active.studentName) return;
      advance();
    });
    return () => onRegisterRemoteVoteHandler?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler]);

  const advance = useCallback((skipName?: string) => {
    setQueue((prev) => {
      const next = [...prev];
      const idx = currentIndexRef.current;
      next[idx] = { ...next[idx], status: 'done' };

      const nextIdx = idx + 1;

      // If skipping, reassign upcoming passages for this student to others
      if (skipName && nextIdx < next.length) {
        const others = students.filter((s) => s.name !== skipName);
        if (others.length > 0) {
          for (let i = nextIdx; i < next.length; i++) {
            if (next[i].studentName === skipName) {
              const replacement = others[i % others.length];
              next[i] = { ...next[i], clientId: replacement.name, studentName: replacement.name };
            }
          }
        }
      }

      if (nextIdx >= next.length) {
        setTimeout(() => { setPhase('complete'); onSetInputSpec?.(null); }, 50);
        return next;
      }

      next[nextIdx] = { ...next[nextIdx], status: 'active' };

      // Score the student who just finished
      const finished = prev[idx];
      const reader = students.find((s) => s.name === finished?.studentName);
      if (reader) {
        onScore?.({
          studentId: reader.id,
          clientId: null,
          displayName: reader.name,
          promptIndex: idx + 1,
          points: 1,
          isCorrect: null,
        });
      }

      setCurrentIndex(nextIdx);
      return next;
    });
  }, [students, onSetInputSpec, onScore]);

  function handleStart() {
    if (students.length === 0 || readingTurns.length === 0) return;
    const q: ReadAloudQueueEntry[] = readingTurns.map((text, i) => {
      const s = students[i % students.length];
      return { index: i, text, clientId: s.name, studentName: s.name, status: i === 0 ? 'active' : 'upcoming' };
    });
    setQueue(q);
    setCurrentIndex(0);
    setPhase('reading');
  }

  function handleNext() { advance(); }
  function handleSkip() { advance(queue[currentIndex]?.studentName); }
  function handleRestart() { setPhase('idle'); setCurrentIndex(0); setQueue([]); onSetInputSpec?.(null); }

  const activeEntry = queue[currentIndex];

  // ── IDLE ─────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="glass rounded-3xl p-8 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold">{sourceTitle}</h2>
        </div>
        {!sourceText ? (
          <p className="text-lc-text3 text-sm">No source text found. Add a text source in the lesson planner.</p>
        ) : (
          <>
            <div className="text-sm text-lc-text3 space-y-1">
              <p>
                {readingTurns.length} reading turn{readingTurns.length !== 1 ? 's' : ''}
                {slides && slides.length > 0 ? ` · ${slides.length} slides` : ''}
                {` · ${students.length} student${students.length !== 1 ? 's' : ''}`}
              </p>
              <p className="opacity-60">Students take turns reading a short passage and tap &ldquo;Done&rdquo; when finished.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-white/60 leading-relaxed">{sourceText.slice(0, 400)}{sourceText.length > 400 ? '…' : ''}</p>
            </div>
            {sourceCitations.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-lc-text3">
                  Grounded in {sourceCitations.length} sources
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {sourceCitations.map((citation) => (
                    <a
                      key={citation.url}
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-lc-blue hover:underline"
                    >
                      {citation.publisher}: {citation.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={students.length === 0}
              className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold py-4 text-lg transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" /> Start Reading
            </button>
            {students.length === 0 && <p className="text-xs text-center text-amber-400">Waiting for students to join…</p>}
          </>
        )}
      </div>
    );
  }

  // ── QUIZ ────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-lc-text3">
          <BookOpen className="w-4 h-4" />
          <span>{sourceTitle}</span>
        </div>
        <ComprehensionQuiz
          questions={comprehensionQuestions}
          students={students}
          gameKey="read-aloud"
          discussionPrompt={discussionPrompt}
          promptIndexOffset={readingTurns.length}
          onSetInputSpec={onSetInputSpec}
          onRegisterRemoteVoteHandler={onRegisterRemoteVoteHandler}
          onScore={onScore}
          onComplete={() => setPhase('complete')}
        />
      </div>
    );
  }

  // ── COMPLETE ──────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className="glass rounded-3xl p-8 space-y-6 max-w-2xl mx-auto text-center">
        <BookOpen className="w-10 h-10 text-emerald-400 mx-auto" />
        <h2 className="text-2xl font-bold">Reading Complete!</h2>
        <p className="text-lc-text3">{readingTurns.length} passage{readingTurns.length !== 1 ? 's' : ''} read by the class.</p>
        {hasQuestions && (
          <button
            onClick={() => setPhase('quiz')}
            className="w-full rounded-2xl bg-lc-blue hover:bg-lc-blue/80 text-white font-bold py-3.5 transition-colors flex items-center justify-center gap-2"
          >
            <ListChecks className="w-5 h-5" /> Start Comprehension Questions
            <span className="text-xs font-normal opacity-80">({comprehensionQuestions.length})</span>
          </button>
        )}
        <button onClick={handleRestart} className="flex items-center gap-2 mx-auto text-sm text-lc-text3 hover:text-white transition-colors">
          <RotateCcw className="w-4 h-4" /> Read again
        </button>
      </div>
    );
  }

  const currentSlideUrl = getSlideUrl(currentIndex);

  // ── READING ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-lc-text3">
          <BookOpen className="w-4 h-4" />
          <span>{sourceTitle}</span>
        </div>
        <span className="text-sm text-lc-text3">{currentIndex + 1} / {readingTurns.length}</span>
      </div>

      {currentSlideUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSlideUrl}
            alt={`Illustration for ${sourceTitle}`}
            className="w-full object-contain max-h-64"
            onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}

      {activeEntry && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm font-bold">
            {activeEntry.studentName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-emerald-300">{activeEntry.studentName}</span>
          <span className="text-xs text-emerald-400/60">is reading…</span>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <p className="text-lg leading-relaxed">{activeEntry ? highlightVocab(activeEntry.text, vocabWords) : null}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-lc-text3 hover:text-white transition-colors"
        >
          <SkipForward className="w-4 h-4" /> Skip Student
        </button>
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-semibold transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="glass rounded-2xl p-4 space-y-2">
        <p className="text-xs text-lc-text3 uppercase tracking-widest mb-3">Queue</p>
        {queue.slice(Math.max(0, currentIndex - 1), currentIndex + 6).map((entry) => (
          <div key={entry.index} className={`flex items-center gap-3 text-sm py-1 ${
            entry.status === 'active' ? 'text-white' :
            entry.status === 'done'   ? 'opacity-30' : 'text-lc-text3'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              entry.status === 'active' ? 'bg-emerald-500 text-white' :
              entry.status === 'done'   ? 'bg-white/20 text-white/40' : 'bg-white/10'
            }`}>
              {entry.status === 'done' ? '✓' : entry.index + 1}
            </span>
            <span>{entry.studentName}</span>
            {entry.status === 'active' && <span className="ml-auto text-emerald-400 text-xs">reading…</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
