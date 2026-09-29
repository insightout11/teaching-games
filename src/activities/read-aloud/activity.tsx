'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ActivityProps } from '../types';
import type { ReadAloudContent } from '../types';
import type { ReadAloudQueueEntry } from '@/lib/input-spec';
import { ComprehensionQuiz } from '../shared/comprehension-quiz';
import { PredictionReveal } from '../shared/prediction-reveal';
import { AlertTriangle, BookOpen, ChevronRight, Crosshair, ListChecks, Pause, Play, RotateCcw, SkipForward, Sparkles } from 'lucide-react';
import { splitReadingTurns } from '@/lib/read-aloud';
import { useSessionStore } from '@/stores/session-store';
import { useFocusBus } from '@/stores/focus-bus-store';
import { openTrickyChannel } from '@/lib/live-room/word-bank';
import { KitButton, KitChip, KitLabel, KitReadout, KitStatus } from '@/components/session/widget-kit';

/**
 * Read it together: students take turns reading short passages aloud while
 * everyone follows on their phones. Upgrades: a class version at the class's
 * level (original one tap away) with a kid-safety check for news, a big
 * windscreen reading view with sentence-by-sentence follow-along, and tricky
 * words students tap on their phones, collected for a vocabulary round.
 */
type Phase = 'idle' | 'reading' | 'complete' | 'quiz';

function highlightVocab(text: string, vocabWords: string[]): React.ReactNode {
  if (!vocabWords.length) return text;
  const escaped = vocabWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  return text.split(pattern).map((part, i) =>
    pattern.test(part)
      ? <mark key={i} className="rounded bg-emerald-300/25 px-0.5 font-medium text-emerald-100">{part}</mark>
      : part,
  );
}

function sentencesOf(text: string): string[] {
  return (text.replace(/\*([^*]+)\*/g, '$1').match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
}

export function ReadAloudActivity({
  sessionId,
  generatedContent,
  students,
  sessionSettings,
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

  // Class version (level-adapted) + safety check, prepared once.
  const [classVersion, setClassVersion] = useState<{ text: string; safe: boolean; note: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [useClassVersion, setUseClassVersion] = useState(true);
  useEffect(() => {
    if (!sourceText || sourceText.length < 40) return;
    let cancelled = false;
    setPreparing(true);
    fetch('/api/read-aloud/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: sourceTitle, text: sourceText, difficulty: sessionSettings.difficulty }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.classText) setClassVersion({ text: d.classText, safe: d.safe !== false, note: d.safetyNote ?? '' }); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPreparing(false); });
    return () => { cancelled = true; };
  }, [sessionSettings.difficulty, sourceText, sourceTitle]);

  const readingText = useClassVersion && classVersion ? classVersion.text : sourceText;
  const readingTurns = useMemo(
    () => splitReadingTurns(readingText, students.length, readingTurnWords),
    [readingTurnWords, readingText, students.length],
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<ReadAloudQueueEntry[]>([]);
  const predictionResults = useSessionStore((s) => s.predictionResults);
  const makeFocus = useFocusBus((s) => s.makeFocus);
  const busVocab = useFocusBus((s) => s.vocab);
  const setBusVocab = useFocusBus((s) => s.setVocab);

  // Tricky words tapped on phones while following along.
  const [tricky, setTricky] = useState<Map<string, Set<string>>>(() => new Map());
  useEffect(() => {
    if (!sessionId) return;
    const ch = openTrickyChannel(sessionId, (u) => {
      setTricky((prev) => {
        const next = new Map(prev);
        const who = new Set(next.get(u.word) ?? []);
        who.add(u.name);
        next.set(u.word, who);
        return next;
      });
    });
    return () => ch.close();
  }, [sessionId]);
  const trickyList = useMemo(() => Array.from(tricky.entries()).map(([word, who]) => ({ word, count: who.size })).sort((a, b) => b.count - a.count), [tricky]);

  function getSlideUrl(index: number): string | undefined {
    if (!slides || slides.length === 0) return undefined;
    const slideIndex = Math.min(Math.floor(index * slides.length / Math.max(readingTurns.length, 1)), slides.length - 1);
    return slides[slideIndex];
  }

  const phaseRef = useRef(phase); phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex); currentIndexRef.current = currentIndex;
  const queueRef = useRef(queue); queueRef.current = queue;

  useEffect(() => {
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
      ...(sessionId ? { readAloudChannel: sessionId } : {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, queue, currentIndex, sourceTitle, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'reading') return;
      const active = queueRef.current[currentIndexRef.current];
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
      const finished = prev[idx];
      const reader = students.find((s) => s.name === finished?.studentName);
      if (reader) {
        onScore?.({ studentId: reader.id, clientId: null, displayName: reader.name, promptIndex: idx + 1, points: 1, isCorrect: null });
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
  function handleRestart() { setPhase('idle'); setCurrentIndex(0); setQueue([]); onSetInputSpec?.(null); }

  const activeEntry = queue[currentIndex];

  // Follow-along: highlight one sentence at a time (auto-paced or tapped).
  const sentences = useMemo(() => (activeEntry ? sentencesOf(activeEntry.text) : []), [activeEntry]);
  const [sentence, setSentence] = useState(0);
  const [autoPace, setAutoPace] = useState(false);
  useEffect(() => { setSentence(0); }, [currentIndex]);
  useEffect(() => {
    if (!autoPace || phase !== 'reading' || sentence >= sentences.length - 1) return;
    const words = sentences[sentence]?.split(/\s+/).length ?? 8;
    const wpm = sessionSettings.difficulty === 'Beginner' || sessionSettings.difficulty === 'Easy' ? 90 : 120;
    const t = setTimeout(() => setSentence((s) => s + 1), Math.max(1800, (words / wpm) * 60000));
    return () => clearTimeout(t);
  }, [autoPace, phase, sentence, sentences, sessionSettings.difficulty]);

  // ── IDLE ─────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    const unsafe = useClassVersion ? classVersion && !classVersion.safe : false;
    return (
      <div className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-white/12 bg-black/25 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <KitLabel tone="emerald">Read it together</KitLabel>
            <KitReadout className="mt-1 text-2xl">{sourceTitle}</KitReadout>
          </div>
          <KitStatus state="draft" />
        </div>
        {!sourceText ? (
          <p className="text-sm text-white/60">No text yet. Use Read it together on a cargo item with text, or add a text source.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <KitChip on={useClassVersion && !!classVersion} tone="emerald" disabled={!classVersion} onClick={() => setUseClassVersion(true)}>
                {preparing ? 'Preparing class version…' : classVersion ? `Class version (${sessionSettings.difficulty})` : 'Class version unavailable'}
              </KitChip>
              <KitChip on={!useClassVersion || !classVersion} tone="cyan" onClick={() => setUseClassVersion(false)}>Original</KitChip>
              <span className="ml-auto font-mono text-[11px] text-white/50">{readingTurns.length} turns · {students.length} readers</span>
            </div>
            {classVersion && !classVersion.safe && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span><b>Check before reading:</b> {classVersion.note || 'This text may not suit a kids/teens class.'}</span>
              </div>
            )}
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/75">{highlightVocab(readingText.slice(0, 900), vocabWords)}{readingText.length > 900 ? '…' : ''}</p>
            </div>
            {sourceCitations.length > 0 && (
              <p className="text-xs text-white/50">
                Source: {sourceCitations.map((c) => <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className="text-cyan-200/80 hover:underline">{c.publisher}: {c.title}</a>)}
              </p>
            )}
            <KitButton tone={unsafe ? 'rose' : 'emerald'} solid className="w-full py-3 text-sm" icon={<BookOpen className="h-4 w-4" />} disabled={students.length === 0} onClick={handleStart}>
              {unsafe ? 'Read anyway' : 'Start reading'}
            </KitButton>
            {students.length === 0 && <p className="text-center text-xs text-amber-200">Waiting for students to join…</p>}
          </>
        )}
      </div>
    );
  }

  // ── QUIZ ────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <KitLabel tone="emerald">{sourceTitle}</KitLabel>
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
      <div className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-white/12 bg-black/25 p-6 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-emerald-300" />
        <KitReadout className="text-3xl">Reading complete</KitReadout>
        <p className="text-sm text-white/60">{readingTurns.length} passage{readingTurns.length !== 1 ? 's' : ''} read by the class.</p>

        {trickyList.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] p-4 text-left">
            <KitLabel tone="amber">Tricky words the class tapped</KitLabel>
            <div className="flex flex-wrap gap-1.5">
              {trickyList.map((t) => (
                <span key={t.word} className="rounded-full border border-amber-300/40 px-2.5 py-1 text-sm text-amber-100">
                  {t.word}{t.count > 1 && <b className="ml-1 font-mono text-xs text-amber-300">×{t.count}</b>}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <KitButton tone="cyan" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => setBusVocab([...busVocab, ...trickyList.slice(0, 8).map((t) => ({ word: t.word, definition: '' }))])}>
                Add to the Word bank
              </KitButton>
              {makeFocus && (
                <KitButton tone="amber" icon={<Crosshair className="h-3.5 w-3.5" />} onClick={() => makeFocus({ title: `Tricky words from "${sourceTitle}"`, text: trickyList.map((t) => t.word).join(', ') })}>
                  Make them the topic
                </KitButton>
              )}
            </div>
          </div>
        )}

        {hasQuestions && (
          <KitButton tone="emerald" solid className="w-full py-3 text-sm" icon={<ListChecks className="h-4 w-4" />} onClick={() => setPhase('quiz')}>
            Comprehension questions ({comprehensionQuestions.length})
          </KitButton>
        )}
        {discussionPrompt && !hasQuestions && <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">Talk about it: {discussionPrompt}</p>}
        <PredictionReveal results={predictionResults} />
        <button type="button" onClick={handleRestart} className="mx-auto flex items-center gap-2 text-sm text-white/55 hover:text-white">
          <RotateCcw className="h-4 w-4" /> Read again
        </button>
      </div>
    );
  }

  // ── READING: the big windscreen view ─────────────────────────────────────
  const currentSlideUrl = getSlideUrl(currentIndex);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <KitStatus state="live" />
          <KitLabel tone="emerald">{sourceTitle}</KitLabel>
        </span>
        <span className="font-mono text-xs text-white/60">Passage {currentIndex + 1} / {readingTurns.length}</span>
      </div>

      {currentSlideUrl && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentSlideUrl} alt={`Illustration for ${sourceTitle}`} className="max-h-60 w-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }} />
        </div>
      )}

      {activeEntry && (
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-300 font-bold text-[#04200f]">{activeEntry.studentName.charAt(0).toUpperCase()}</span>
          <span className="font-semibold text-emerald-100">{activeEntry.studentName}</span>
          <span className="text-xs text-emerald-200/60">is reading</span>
          {tricky.size > 0 && <span className="ml-auto font-mono text-[11px] text-amber-200">{tricky.size} tricky word{tricky.size === 1 ? '' : 's'} tapped</span>}
        </div>
      )}

      {/* Follow-along: the current sentence is lit, the rest dimmed */}
      <div className="rounded-3xl border border-white/12 bg-black/30 p-6">
        <p className="font-display text-2xl leading-relaxed sm:text-3xl">
          {sentences.map((s, i) => (
            <motion.span
              key={i}
              onClick={() => setSentence(i)}
              animate={{ opacity: i === sentence ? 1 : i < sentence ? 0.45 : 0.7 }}
              className={`cursor-pointer ${i === sentence ? 'rounded bg-emerald-300/15 text-white' : 'text-white'}`}
            >
              {highlightVocab(s, vocabWords)}{' '}
            </motion.span>
          ))}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <KitChip on={autoPace} tone="emerald" onClick={() => setAutoPace((v) => !v)}>
          <span className="flex items-center gap-1">{autoPace ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} Follow-along pace</span>
        </KitChip>
        <KitButton icon={<SkipForward className="h-3.5 w-3.5" />} onClick={() => advance(activeEntry?.studentName)}>Skip reader</KitButton>
        <KitButton tone="emerald" solid className="ml-auto" icon={<ChevronRight className="h-3.5 w-3.5" />} onClick={() => advance()}>Next passage</KitButton>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <KitLabel className="mb-2">Reading queue</KitLabel>
        <div className="space-y-1">
          {queue.slice(Math.max(0, currentIndex - 1), currentIndex + 5).map((entry) => (
            <div key={entry.index} className={`flex items-center gap-2 text-sm ${entry.status === 'active' ? 'text-white' : entry.status === 'done' ? 'text-white/30' : 'text-white/60'}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${entry.status === 'active' ? 'bg-emerald-300 text-[#04200f]' : 'bg-white/10'}`}>{entry.index + 1}</span>
              <span>{entry.studentName}</span>
              {entry.status === 'active' && <span className="ml-auto text-xs text-emerald-200">reading</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
