'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SkyRace, LandingOrder, type SkyPilot } from '@/components/quiz/sky-race';
import { Flag, Image as ImageIcon, Landmark, Lightbulb, Map as MapIcon, MapPin, MessageCircle, Plane, Scale, Shuffle, Stamp } from 'lucide-react';
import { WorldLensMap, type WorldLensGuess } from '../world-lens/world-lens-map';
import { parseWorldLensGuess } from '../world-lens/scoring';
import { haversineKm } from '../mystery-flight/logic';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import type { GameProps, GameRemoteVote } from '../types';
import { useSessionStore } from '@/stores/session-store';
import { ANSWERS_OPEN_GRACE_MS, type InputSpec } from '@/lib/input-spec';
import { useSyncedTimer } from '@/hooks/use-synced-timer';
import { buildQuiz, type WorldQuestion, type WorldQuizMode } from '@/lib/world-quiz/questions';
import { flagUrl } from '@/lib/world-quiz/countries';

/**
 * World Quiz (Oct 2026): guess the country, Kahoot-style, from its flag, its shape or a ladder of clues. Questions are
 * made in the browser (no AI, instant). Phones answer; the fastest right answers score most. Junior classes play as one
 * class team (never ranked).
 */

type Phase = 'setup' | 'loading' | 'answering' | 'revealing' | 'end';
interface Answer { studentId: string; clientId: string; name: string; choice: number; correct: boolean; points: number; lat?: number; lng?: number; km?: number }

const MODES: Array<{ key: WorldQuizMode; label: string; detail: string; icon: typeof Flag }> = [
  { key: 'flags', label: 'Flags', detail: 'Whose flag is this?', icon: Flag },
  { key: 'shapes', label: 'Shapes', detail: 'The country\'s shape, zooming out', icon: MapIcon },
  { key: 'clues', label: 'Clue ladder', detail: 'Clues from hard to easy: guess early for more points', icon: Lightbulb },
  { key: 'postcards', label: 'Postcards', detail: 'Which city is this? Our illustrated cities', icon: ImageIcon },
  { key: 'pins', label: 'Pin drop', detail: 'Pin the place on your phone map: closest wins', icon: MapPin },
  { key: 'bigger', label: 'Which is bigger?', detail: 'More people or more land? Then the real numbers', icon: Scale },
  { key: 'capitals', label: 'Capitals', detail: 'What is the capital of…?', icon: Landmark },
  { key: 'hello', label: 'Hello around the world', detail: 'How do people say hello there?', icon: MessageCircle },
  { key: 'flight', label: 'Our flight', detail: 'Questions about today\'s journey', icon: Plane },
  { key: 'mix', label: 'Mix', detail: 'A bit of everything', icon: Shuffle },
];
const REVEAL_GRACE_MS = 1200;

/** The question as the class sees it. */
function headingOf(q: WorldQuestion): string {
  if (q.prompt) return q.prompt;
  return q.kind === 'flag' ? 'Whose flag is this?' : q.kind === 'shape' ? 'Which country has this shape?' : q.kind === 'postcard' ? 'Which city is this?' : q.kind === 'pin' ? 'Where is it?' : 'Which country is it?';
}
const fmtNumber = (n: number, unit: string) => unit === 'km2' ? `${n.toLocaleString()} km²` : `${n.toLocaleString()} people`;

export function WorldQuizGame({ students, onScore, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler, onPhaseChange }: GameProps) {
  const junior = useSessionStore((s) => s.junior);
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<WorldQuizMode>('mix');
  const [count, setCount] = useState(10);
  // Pin drop maps: with country borders (easier) or without (harder)
  const [borders, setBorders] = useState(true);
  const bordersRef = useRef(borders); bordersRef.current = borders;
  const [questions, setQuestions] = useState<WorldQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [scores, setScores] = useState<Map<string, { name: string; points: number; right: number }>>(() => new Map());
  const [classRight, setClassRight] = useState(0);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const qRef = useRef(questions); qRef.current = questions;
  const iRef = useRef(index); iRef.current = index;
  const answersRef = useRef(answers); answersRef.current = answers;
  const startRef = useRef(0);
  const [nonce, setNonce] = useState(0);
  useEffect(() => { onPhaseChange?.(phase === 'end' ? 'complete' : phase); }, [phase, onPhaseChange]);

  // clue questions take longer (the clues arrive one by one)
  const q = questions[index];
  const timer = q?.kind === 'clues' ? 40 : q?.kind === 'pin' ? 35 : Math.max(15, Math.min(30, sessionSettings.timerSeconds ?? 20));
  const timerRef = useRef(timer); timerRef.current = timer;
  const { timeLeft } = useSyncedTimer(timer, phase === 'answering', nonce);
  const elapsed = timer - timeLeft;
  const cluesShown = q?.clues ? Math.min(q.clues.length, 1 + Math.floor(elapsed / Math.max(6, timer / (q.clues.length + 0.5)))) : 0;

  const broadcast = useCallback((question: WorldQuestion, perStudentData: Record<string, unknown> = {}) => {
    if (question.kind === 'pin' && question.place) {
      onSetInputSpec?.({
        type: 'geo-point', gameKey: 'world-quiz', prompt: `Where is ${question.place.name}? Pin it on the map!`,
        roundId: `wq-${startRef.current}`, stableInput: true, mapCenter: [10, 18], mapZoom: 0.8, mapLabels: false, mapBorders: bordersRef.current,
        timerSeconds: timerRef.current, startedAt: startRef.current, perStudentData,
      } as InputSpec);
      return;
    }
    onSetInputSpec?.({
      type: 'choice', gameKey: 'world-quiz',
      prompt: headingOf(question),
      options: question.options, timerSeconds: timerRef.current, startedAt: startRef.current, perStudentData,
    } as InputSpec);
  }, [onSetInputSpec]);

  const level = (sessionSettings.difficulty === 'Beginner' ? 1 : sessionSettings.difficulty === 'Advanced' ? 3 : 2) as 1 | 2 | 3;
  const start = async () => {
    setPhase('loading');
    const qs = await buildQuiz(mode, junior ? 1 : level, count).catch(() => [] as WorldQuestion[]);
    if (!qs.length) { setPhase('setup'); return; }
    setQuestions(qs);
    setScores(new Map());
    setClassRight(0);
    open(0, qs);
  };
  const open = (i: number, qs = qRef.current) => {
    setIndex(i);
    setAnswers([]);
    const now = Date.now();
    startRef.current = now;
    setNonce(now);
    setPhase('answering');
    if (qs[i]) broadcast(qs[i]);
  };

  const onVote = useCallback((vote: GameRemoteVote) => {
    if (phaseRef.current !== 'answering') return;
    const studentId = vote.studentId || vote.clientId;
    const question = qRef.current[iRef.current];
    if (!studentId || !question || answersRef.current.some((a) => a.studentId === studentId)) return;
    if (question.kind === 'pin' && question.place) {
      const g = parseWorldLensGuess(vote.choice);
      if (!g || g.roundId !== `wq-${startRef.current}`) return;
      const km = haversineKm(question.place, g);
      const points = Math.max(0, Math.round(150 * (1 - km / 4000)));
      const a: Answer = { studentId, clientId: vote.clientId, name: vote.displayName || 'A student', choice: -1, correct: km < 1000, points, lat: g.lat, lng: g.lng, km };
      setAnswers((prev) => {
        const next = [...prev, a];
        const lock: Record<string, unknown> = {};
        next.forEach((x) => { lock[x.clientId] = { locked: true }; });
        broadcast(question, lock);
        return next;
      });
      return;
    }
    const choice = parseInt(vote.choice, 10);
    if (isNaN(choice) || choice < 0 || choice > 3) return;
    const secs = (Date.now() - startRef.current - ANSWERS_OPEN_GRACE_MS) / 1000;
    const left = Math.max(0, timerRef.current - secs);
    const correct = choice === question.correctIndex;
    const points = correct ? 100 + Math.round((left / timerRef.current) * 50) : 0;
    const a: Answer = { studentId, clientId: vote.clientId, name: vote.displayName || 'A student', choice, correct, points };
    setAnswers((prev) => {
      const next = [...prev, a];
      const lock: Record<string, unknown> = {};
      next.forEach((x) => { lock[x.clientId] = { locked: true }; });
      broadcast(question, lock);
      return next;
    });
  }, [broadcast]);
  useEffect(() => { onRegisterRemoteVoteHandler?.(onVote); return () => onRegisterRemoteVoteHandler?.(null); }, [onRegisterRemoteVoteHandler, onVote]);

  const reveal = useCallback(() => {
    if (phaseRef.current !== 'answering') return;
    setPhase('revealing');
    const question = qRef.current[iRef.current];
    const list = answersRef.current;
    setScores((prev) => {
      const next = new Map(prev);
      list.forEach((a) => { const cur = next.get(a.studentId); next.set(a.studentId, { name: a.name, points: (cur?.points ?? 0) + a.points, right: (cur?.right ?? 0) + (a.correct ? 1 : 0) }); });
      return next;
    });
    setClassRight((n) => n + list.filter((a) => a.correct).length);
    list.forEach((a) => onScore(a.studentId, { isCorrect: a.correct, points: a.correct ? 3 : 1, responseData: { clientId: a.clientId, questionIndex: iRef.current, choiceIndex: a.choice, quizPoints: a.points } }));
    const res: Record<string, unknown> = {};
    list.forEach((a) => { res[a.clientId] = { locked: true, result: a.correct ? 'correct' : 'incorrect', pointsEarned: a.points }; });
    if (question) broadcast(question, res);
  }, [broadcast, onScore]);
  useEffect(() => {
    if (phase !== 'answering' || timeLeft !== 0) return;
    const t = setTimeout(reveal, REVEAL_GRACE_MS);
    return () => clearTimeout(t);
  }, [phase, timeLeft, reveal]);
  useEffect(() => { if (phase === 'answering' && students.length > 0 && answers.length >= students.length) reveal(); }, [phase, answers.length, students.length, reveal]);

  const next = () => {
    if (index + 1 < questions.length) open(index + 1);
    else { onSetInputSpec?.(null); setPhase('end'); }
  };
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  // ── screens ──────────────────────────────────────────────────────────────────────────────────────────────────────
  if (phase === 'setup' || phase === 'loading') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 p-8 text-white">
        <p className="font-display text-4xl">World Quiz</p>
        <p className="text-white/60">Guess the country. Answer on your phones: the faster, the more points.</p>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <button key={m.key} type="button" onClick={() => setMode(m.key)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left ${mode === m.key ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/12 bg-white/5 hover:border-white/30'}`}>
              <m.icon className="mt-0.5 h-6 w-6 text-amber-200" />
              <span><b className="block text-lg">{m.label}</b><span className="text-sm text-white/60">{m.detail}</span></span>
            </button>
          ))}
        </div>
        {(mode === 'pins' || mode === 'mix') && (
          <div className="flex items-center gap-2 text-sm text-white/70">
            Pin drop map
            <button type="button" onClick={() => setBorders(true)} className={`rounded-full border px-3 py-1 ${borders ? 'border-amber-300/70 text-amber-100' : 'border-white/15'}`}>With borders (easier)</button>
            <button type="button" onClick={() => setBorders(false)} className={`rounded-full border px-3 py-1 ${!borders ? 'border-amber-300/70 text-amber-100' : 'border-white/15'}`}>No borders (harder)</button>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-white/70">
          Questions
          {[5, 10, 15].map((n) => <button key={n} type="button" onClick={() => setCount(n)} className={`rounded-full border px-3 py-1 ${count === n ? 'border-amber-300/70 text-amber-100' : 'border-white/15'}`}>{n}</button>)}
        </div>
        <button type="button" disabled={phase === 'loading'} onClick={() => void start()} className="rounded-full bg-amber-300 px-8 py-3 font-semibold text-[#1b2233] hover:bg-amber-200 disabled:opacity-60">{phase === 'loading' ? 'Getting ready…' : 'Start'}</button>
      </div>
    );
  }

  if (phase === 'end') {
    const ranked = Array.from(scores.entries()).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.points - a.points).slice(0, 5);
    const pilots: SkyPilot[] = ranked.map((s) => ({ id: s.id, name: s.name, points: s.points, seed: students.find((st) => st.id === s.id)?.avatar_seed }));
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 p-8 text-white">
        <div className="w-full"><LandingOrder pilots={junior ? [{ id: 'class', name: 'Our class', points: classRight }] : pilots} junior={junior} /></div>
        {junior ? (
          <>
            <p className="font-display text-4xl">Great flying, class!</p>
            <p className="text-xl text-white/75">Together you got <b className="text-amber-200">{classRight}</b> right answers</p>
          </>
        ) : (
          <>
            <p className="font-display text-3xl">World Quiz champions</p>
            <div className="w-full space-y-2">
              {ranked.map((s, i) => (
                <div key={s.name + i} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-lg">
                  <span><b className="mr-3 text-amber-300">{i + 1}</b>{s.name}</span><span className="text-white/70">{s.points}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button type="button" onClick={() => setPhase('setup')} className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10">Play again</button>
      </div>
    );
  }

  if (!q) return null;
  const revealing = phase === 'revealing';
  const rightCount = answers.filter((a) => a.correct).length;
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 p-4 text-white">
      <div className="flex w-full items-center justify-between font-mono text-xs uppercase tracking-[0.16em] text-white/55">
        <span>Question {index + 1} of {questions.length}</span>
        <span>{revealing ? `${rightCount} of ${answers.length} right` : `${answers.length} answered · ${timeLeft}s`}</span>
      </div>
      <p className="max-w-3xl text-center font-display text-3xl">{headingOf(q)}</p>

      {/* the picture: a flag, a shape zooming out, or the clue ladder */}
      <div className="flex min-h-[200px] w-full items-center justify-center">
        {q.kind === 'flag' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flagUrl(q.country)} alt="A country's flag" className="max-h-[170px] rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />
        )}
        {q.kind === 'shape' && q.shape && (
          <svg viewBox="0 0 100 100" className="h-[200px] w-[200px] overflow-hidden rounded-2xl bg-white/[0.04]">
            <motion.g key={index} initial={{ scale: revealing ? 1 : 2.6 }} animate={{ scale: 1 }} transition={{ duration: revealing ? 0.3 : timer * 0.7, ease: 'easeOut' }} style={{ transformOrigin: '50px 50px' }}>
              <path d={q.shape} fill={revealing ? '#fcd34d' : '#e2e8f0'} stroke="#0b1220" strokeWidth={0.4} fillRule="evenodd" />
            </motion.g>
          </svg>
        )}
        {q.kind === 'bigger' && q.pair && (
          <div className="flex items-stretch justify-center gap-6">
            {q.pair.map((c, i) => (
              <div key={c.iso2} className={`flex w-56 flex-col items-center gap-2 rounded-2xl border p-3 ${revealing && i === q.correctIndex ? 'border-emerald-300 bg-emerald-400/15' : 'border-white/12 bg-white/5'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagUrl({ name: c.name, iso2: c.iso2, continent: 'Europe', level: 1 })} alt="" className="h-20 rounded shadow" />
                <p className="font-display text-2xl">{c.name}</p>
                {revealing && <p className="text-sm text-white/75">{fmtNumber(c.value, c.unit)} <span className="text-white/45">({c.year})</span></p>}
              </div>
            ))}
          </div>
        )}
        {q.kind === 'capital' && q.country.iso2 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flagUrl(q.country)} alt="" className="max-h-[140px] rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />
        )}
        {q.kind === 'hello' && (
          <div className="flex flex-col items-center gap-2">
            <MessageCircle className="h-14 w-14 text-amber-300" />
            {revealing && q.pronunciation && <p className="font-display text-3xl text-amber-100">“{q.options[q.correctIndex]}” · say it: {q.pronunciation}</p>}
          </div>
        )}
        {q.kind === 'pin' && q.place && (
          revealing ? (
            <div className="h-[260px] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10">
              <WorldLensMap answer={{ name: q.place.name, country: q.place.country, lat: q.place.lat, lng: q.place.lng }} guesses={answers.filter((a) => a.lat !== undefined).map((a, i): WorldLensGuess => ({ studentKey: `${a.studentId}-${i}`, displayName: '', lat: a.lat!, lng: a.lng!, distanceKm: Math.round(a.km ?? 0), basePoints: a.points, closestBonus: 0, lessonPoints: a.points }))} revealed borders={borders} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <MapPin className="h-12 w-12 text-amber-300" />
              <p className="font-display text-5xl">{q.place.name}</p>
              <p className="text-white/60">Pin it on the map on your phone</p>
            </div>
          )
        )}
        {q.kind === 'postcard' && q.scene && q.destinationId && (
          <div className="relative aspect-[16/7] w-full max-w-lg overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <DestinationArrivalScene destinationId={q.destinationId} scene={q.scene} phase="landed" progress={1} mode="arrival" timeOfDay="day" className="absolute inset-0" />
          </div>
        )}
        {q.kind === 'clues' && q.clues && (
          <ol className="w-full max-w-2xl space-y-2">
            {q.clues.map((c, i) => (i < (revealing ? q.clues!.length : cluesShown) ? (
              <motion.li key={c} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-xl">
                <span className="mr-3 font-mono text-sm text-amber-300">Clue {i + 1}</span>{c}
              </motion.li>
            ) : null))}
          </ol>
        )}
      </div>

      {q.kind === 'pin' && revealing && answers.length > 0 && (
        <p className="text-lg text-white/80">Closest pin: <b className="text-amber-200">{Math.round(Math.min(...answers.map((a) => a.km ?? Infinity)))} km</b> away · {answers.filter((a) => a.correct).length} of {answers.length} within 1,000 km</p>
      )}
      {/* the four choices (the phones have the same) */}
      <div className={`grid w-full gap-3 sm:grid-cols-2 ${q.kind === 'pin' ? 'hidden' : ''}`}>
        {q.options.map((o, i) => {
          const right = revealing && i === q.correctIndex;
          return (
            <div key={o} className={`relative overflow-hidden rounded-2xl border px-4 py-2.5 text-lg ${right ? 'border-emerald-300 bg-emerald-400/20 text-emerald-50' : revealing ? 'border-white/10 bg-white/5 text-white/40' : 'border-white/15 bg-white/8'}`}>
              <span className="mr-3 font-mono text-xs uppercase tracking-[0.18em] text-white/50">Gate {'ABCD'[i]}</span>{o}
              {right && (
                <motion.span initial={{ scale: 2.4, opacity: 0, rotate: -25 }} animate={{ scale: 1, opacity: 1, rotate: -10 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="absolute right-3 top-1/2 -mt-4 flex items-center gap-1 rounded-md border-[3px] border-emerald-300 px-2 py-0.5 font-mono text-base font-black text-emerald-300">
                  <Stamp className="h-4 w-4" /> CLEARED
                </motion.span>
              )}
            </div>
          );
        })}
      </div>

      {revealing && (
        <div className="flex w-full flex-col items-center gap-3">
          {q.fact && (
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex w-full max-w-2xl overflow-hidden rounded-xl bg-[#f6f1e4] text-[#1b2233]">
              <div className="flex-1 px-4 py-2.5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1b2233]/50">Boarding pass · fact</p><p className="text-lg">{q.fact}</p></div>
              <div className="w-24 border-l-2 border-dashed border-[#1b2233]/25 px-2 py-2.5 text-center"><p className="font-mono text-[10px] text-[#1b2233]/50">RIGHT</p><p className="font-display text-2xl">{answers.filter((a) => a.correct).length}/{answers.length}</p></div>
            </motion.div>
          )}
          {scores.size > 0 && <div className="w-full max-w-3xl"><SkyRace height={230} junior={junior} pilots={Array.from(scores.entries()).map(([id, v]) => ({ id, name: v.name, points: v.points, seed: students.find((st) => st.id === id)?.avatar_seed })).sort((a, b) => b.points - a.points)} /></div>}
          <button type="button" onClick={next} className="rounded-full bg-amber-300 px-8 py-2.5 font-semibold text-[#1b2233] hover:bg-amber-200">{index + 1 < questions.length ? 'Next' : 'See the results'}</button>
        </div>
      )}
      {!revealing && <button type="button" onClick={reveal} className="text-sm text-white/50 hover:text-white">Reveal now</button>}
    </div>
  );
}
