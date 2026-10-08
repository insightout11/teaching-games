'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Volume2 } from 'lucide-react';
import type { ActivityProps, RemoteVote } from '../types';
import { speak, warmUpSpeech } from '@/lib/speech';
import { participationFromResponders } from '@/lib/activity-participation';
import { JUNIOR_SETS, pickJuniorSet, stickerLabel, type JuniorSet } from './bank';

type Phase = 'choose' | 'asking' | 'revealed' | 'finished';

/**
 * Picture Quiz (Junior): one topic set of picture questions from the Junior bank. Phones show big picture tiles
 * (tap = answer); the teacher screen shows the same pictures, reads each question aloud, and reveals the answer with
 * class counts only (no names, no ranking).
 */
export function PictureQuizActivity({ customTopic, onSetInputSpec, onRegisterRemoteVoteHandler, onParticipationChange, onScore, onPhaseChange }: ActivityProps) {
  const [set, setSet] = useState<JuniorSet | null>(() => pickJuniorSet(customTopic));
  const [phase, setPhase] = useState<Phase>('choose');
  const [index, setIndex] = useState(0);
  // clientId -> { option, name }
  const [answers, setAnswers] = useState<Record<string, { option: string; name: string; studentId: string | null }>>({});
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const question = set?.questions[index];

  const sayQuestion = useCallback(() => {
    if (!question) return;
    warmUpSpeech();
    speak(question.say, 0.8);
  }, [question]);

  // Phones: picture tiles while asking.
  useEffect(() => {
    if (phase === 'asking' && question && set) {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'picture-quiz',
        roundId: `${set.id}:${question.id}`,
        prompt: question.prompt,
        options: question.options,
        optionLabels: question.options.map(stickerLabel),
        pictureOptions: true,
      });
    } else {
      onSetInputSpec?.(null);
    }
  }, [phase, question, set, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote: RemoteVote) => {
      if (vote.gameKey !== 'picture-quiz' || phaseRef.current !== 'asking') return;
      const id = vote.clientId || vote.studentId || vote.displayName;
      setAnswers((prev) => ({ ...prev, [id]: { option: vote.choice, name: vote.displayName, studentId: vote.studentId ?? null } }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler]);

  useEffect(() => {
    if (!question || phase === 'choose' || phase === 'finished') {
      onParticipationChange?.(null);
      return;
    }
    onParticipationChange?.(participationFromResponders('picture-quiz', question.id, Object.keys(answers)));
  }, [answers, onParticipationChange, phase, question]);

  // Read each new question aloud when it appears.
  useEffect(() => {
    if (phase === 'asking') sayQuestion();
  }, [phase, index, sayQuestion]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of Object.values(answers)) c[a.option] = (c[a.option] ?? 0) + 1;
    return c;
  }, [answers]);
  const answered = Object.keys(answers).length;

  const start = (chosen: JuniorSet) => {
    setSet(chosen);
    setIndex(0);
    setAnswers({});
    setPhase('asking');
    onPhaseChange?.('asking');
  };

  const reveal = () => {
    if (!question) return;
    setPhase('revealed');
    onPhaseChange?.('revealed');
    // Everyone who joined in scores; the right picture scores a little more. Never shown as a ranking in Junior.
    for (const [clientId, a] of Object.entries(answers)) {
      const isCorrect = question.answer ? a.option === question.answer : null;
      void onScore?.({
        studentId: a.studentId,
        clientId,
        displayName: a.name,
        promptIndex: index,
        points: isCorrect === false ? 5 : 10,
        isCorrect,
        idempotencyKey: `picture-quiz:${set?.id}:${question.id}:${clientId}`,
      });
    }
    if (question.answer) speak(`It's ${stickerLabel(question.answer)}!`, 0.85);
  };

  const next = () => {
    if (!set) return;
    if (index + 1 >= set.questions.length) {
      setPhase('finished');
      onPhaseChange?.('finished');
      return;
    }
    setIndex(index + 1);
    setAnswers({});
    setPhase('asking');
  };

  if (phase === 'choose' || !set || !question) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-lc-text">Picture Quiz</h3>
          <p className="text-sm text-lc-text2">Pick a topic. Phones show big pictures, and each question is read aloud.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {JUNIOR_SETS.map((s) => (
            <button
              key={s.id}
              onClick={() => start(s)}
              className={`flex items-center gap-2 rounded-xl border p-2 text-left text-sm font-semibold transition-colors ${
                set?.id === s.id ? 'border-amber-400 bg-amber-400/15 text-amber-100' : 'border-lc-border bg-lc-card text-lc-text hover:border-lc-text3'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${s.questions[0].options.find((o) => o === s.questions[0].answer) ?? s.questions[0].options[0]}.webp`} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain" />
              <span className="min-w-0">{s.topic}</span>
            </button>
          ))}
        </div>
        {set && (
          <button onClick={() => start(set)} className="rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">
            Start {set.topic}
          </button>
        )}
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-4xl text-amber-300">Well done, everyone!</p>
        <p className="text-lc-text2">{set.topic}: {set.questions.length} picture questions.</p>
        <button onClick={() => setPhase('choose')} className="rounded-xl border border-lc-border px-4 py-2 text-sm text-lc-text">Another topic</button>
      </div>
    );
  }

  const revealed = phase === 'revealed';
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-lc-text3">{set.topic} · {index + 1} / {set.questions.length}</p>
        <button onClick={sayQuestion} className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-200">
          <Volume2 className="h-4 w-4" aria-hidden /> Say it again
        </button>
      </div>
      <h3 className="text-center text-3xl font-bold text-lc-text sm:text-4xl">{question.prompt}</h3>
      <div className={`mx-auto grid max-w-3xl gap-4 ${question.options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : question.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {question.options.map((o) => {
          const right = revealed && question.answer === o;
          const dim = revealed && question.answer && question.answer !== o;
          return (
            <div key={o} className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all ${right ? 'border-emerald-400 bg-emerald-400/15' : 'border-lc-border bg-lc-card'} ${dim ? 'opacity-40' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${o}.webp`} alt="" className="aspect-square w-full rounded-xl bg-white object-contain" />
              <span className="text-xl font-bold text-lc-text">{stickerLabel(o)}</span>
              {revealed && <span className="text-sm text-lc-text2">{counts[o] ?? 0} {counts[o] === 1 ? 'tap' : 'taps'}</span>}
              {right && <Check className="absolute right-2 top-2 h-7 w-7 rounded-full bg-emerald-400 p-1 text-lc-bg" aria-hidden />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-lc-text2">{answered} answered</span>
        {!revealed ? (
          <button onClick={reveal} className="rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">
            {question.answer ? 'Show the answer' : 'Show the class choices'}
          </button>
        ) : (
          <button onClick={next} className="flex items-center gap-1 rounded-xl bg-amber-400 px-5 py-2.5 font-bold text-lc-bg">
            {index + 1 >= set.questions.length ? 'Finish' : 'Next picture'} <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
