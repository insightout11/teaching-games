'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Ban, Check, Clock, Mic, SkipForward, Trophy, Users, User } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { TabooSprintContent, TabooRound } from '../types';
import type { Student } from '@/lib/supabase/types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { TabooPhoneCard } from '@/components/student/taboo-sprint-panel';

// Everyone guesses, or two teams take turns (only the describer's team guesses).
type Mode = 'everyone' | 'teams';
type Phase = 'idle' | 'ready' | 'turn' | 'summary' | 'done';
type Team = 'A' | 'B';
type CardResult = { card: TabooRound; outcome: 'got' | 'skip' | 'taboo'; by?: string };

const TURN_SECONDS = 60;
const TEAM = {
  A: { label: 'Team Amber', text: 'text-amber-300', border: 'border-amber-300/45', bg: 'bg-amber-300/10' },
  B: { label: 'Team Cyan', text: 'text-cyan-300', border: 'border-cyan-300/45', bg: 'bg-cyan-400/10' },
} as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Forgiving match: case, punctuation, and a simple plural/verb ending.
const norm = (s: string) => s.toLowerCase().replace(/[^a-zÀ-ɏ]/g, '');
const stem = (s: string) => norm(s).replace(/(ing|ed|es|s)$/, '');
const isMatch = (guess: string, word: string) => {
  const g = norm(guess);
  const w = norm(word);
  return g.length > 0 && (g === w || (w.length > 3 && stem(g) === stem(w)));
};

export function TabooSprintActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as TabooSprintContent;
  const deckAll = useMemo(() => content.rounds ?? [], [content.rounds]);

  const [mode, setMode] = useState<Mode>('everyone');
  const [phase, setPhase] = useState<Phase>('idle');
  const [teams, setTeams] = useState<{ A: Student[]; B: Student[] }>({ A: [], B: [] });
  const [teamScore, setTeamScore] = useState({ A: 0, B: 0 });
  const [turnTeam, setTurnTeam] = useState<Team>('A');
  const [turnsTaken, setTurnsTaken] = useState<Record<string, number>>({});
  const [describer, setDescriber] = useState<Student | null>(null);
  const [deck, setDeck] = useState<TabooRound[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [results, setResults] = useState<CardResult[]>([]);
  const [guesses, setGuesses] = useState<Array<{ id: number; name: string; text: string }>>([]);
  const [flash, setFlash] = useState<null | { kind: 'got' | 'taboo' | 'skip'; text: string }>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const promptIndexRef = useRef(1);
  const guessIdRef = useRef(0);

  const card = deck[cardIdx] ?? null;
  const got = results.filter((r) => r.outcome === 'got').length;
  const describerTeam: Team | null = describer ? (teams.A.some((s) => s.id === describer.id) ? 'A' : teams.B.some((s) => s.id === describer.id) ? 'B' : null) : null;
  const minPlayers = mode === 'teams' ? 4 : 2;

  // ─── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'turn') return;
    if (timeLeft <= 0) { setPhase('summary'); onPhaseChange?.('summary'); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, onPhaseChange]);

  // ─── Phones ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'turn' || !describer || !card) { onSetInputSpec?.(null); return; }
    const data: Record<string, TabooPhoneCard> = {};
    const put = (s: Student, c: TabooPhoneCard) => { data[s.id] = c; data[s.name] = c; };
    put(describer, { role: 'describer', word: card.word, forbidden: card.forbiddenWords });
    if (mode === 'teams' && describerTeam) {
      teams[describerTeam === 'A' ? 'B' : 'A'].forEach((s) => put(s, { role: 'bench' }));
    }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'taboo-sprint',
      prompt: 'Guess the word',
      // Many guesses per student: no roundId (the server keeps only the first per round).
      allowMultiple: true,
      perStudentData: data,
    });
  }, [phase, describer, card, mode, describerTeam, teams, onSetInputSpec]);

  // ─── Card flow ────────────────────────────────────────────────────────────
  const showFlash = (kind: 'got' | 'taboo' | 'skip', text: string) => {
    setFlash({ kind, text });
    setTimeout(() => setFlash(null), 1600);
  };

  const nextCard = useCallback((result: CardResult) => {
    setResults((prev) => [...prev, result]);
    setGuesses([]);
    setCardIdx((i) => {
      const n = i + 1;
      if (n >= deck.length) { setPhase('summary'); onPhaseChange?.('summary'); }
      return n;
    });
  }, [deck.length, onPhaseChange]);

  const score = useCallback((who: { studentId: string | null; clientId: string | null; name: string }, points: number) => {
    void onScore?.({ studentId: who.studentId, clientId: who.clientId, displayName: who.name, promptIndex: promptIndexRef.current++, points, isCorrect: points > 0 ? true : null });
  }, [onScore]);

  const isDescriber = useCallback((v: { studentId?: string | null; clientId: string; displayName: string }) =>
    !!describer && (v.studentId === describer.id || v.clientId === describer.id || v.displayName === describer.name), [describer]);

  useEffect(() => {
    if (phase !== 'turn' || !card || !describer) return;
    onRegisterRemoteVoteHandler?.((vote) => {
      const choice = vote.choice ?? '';
      if (isDescriber(vote)) {
        if (choice === 'skip') { showFlash('skip', card.word); nextCard({ card, outcome: 'skip' }); }
        return;
      }
      if (!choice.startsWith('guess:')) return;
      if (mode === 'teams' && describerTeam) {
        const mine = teams[describerTeam].some((s) => s.id === vote.studentId || s.id === vote.clientId || s.name === vote.displayName);
        if (!mine) return;
      }
      const text = choice.slice(6).trim();
      if (!text) return;
      if (isMatch(text, card.word)) {
        score({ studentId: vote.studentId ?? null, clientId: vote.clientId, name: vote.displayName }, 3);
        score({ studentId: describer.id, clientId: null, name: describer.name }, 2);
        if (mode === 'teams' && describerTeam) setTeamScore((t) => ({ ...t, [describerTeam]: t[describerTeam] + 1 }));
        showFlash('got', `${vote.displayName} got it: ${card.word}`);
        nextCard({ card, outcome: 'got', by: vote.displayName });
      } else {
        setGuesses((prev) => [{ id: ++guessIdRef.current, name: vote.displayName, text }, ...prev].slice(0, 14));
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, card, describer, mode, describerTeam, teams, isDescriber, nextCard, score, onRegisterRemoteVoteHandler]);

  const taboo = () => {
    if (!card || !describer) return;
    score({ studentId: describer.id, clientId: null, name: describer.name }, -1);
    if (mode === 'teams' && describerTeam) setTeamScore((t) => ({ ...t, [describerTeam]: t[describerTeam] - 1 }));
    showFlash('taboo', card.word);
    nextCard({ card, outcome: 'taboo' });
  };

  // ─── Turns ────────────────────────────────────────────────────────────────
  const pickDescriber = useCallback((team: Team | null, taken: Record<string, number>, t = teams) => {
    const pool = team ? t[team] : students;
    if (!pool.length) return null;
    const least = Math.min(...pool.map((s) => taken[s.id] ?? 0));
    const fresh = pool.filter((s) => (taken[s.id] ?? 0) === least);
    return fresh[Math.floor(Math.random() * fresh.length)];
  }, [students, teams]);

  const setUp = () => {
    let t = teams;
    if (mode === 'teams') {
      const sh = shuffle(students);
      const mid = Math.ceil(sh.length / 2);
      t = { A: sh.slice(0, mid), B: sh.slice(mid) };
      setTeams(t);
      setTeamScore({ A: 0, B: 0 });
    }
    setTurnTeam('A');
    setDescriber(pickDescriber(mode === 'teams' ? 'A' : null, turnsTaken, t));
    setPhase('ready');
    onPhaseChange?.('ready');
  };

  const startTurn = () => {
    if (!describer) return;
    // Each turn draws a fresh shuffle of the cards not yet used this game.
    const used = new Set(results.map((r) => r.card.word));
    const left = deckAll.filter((c) => !used.has(c.word));
    setDeck(shuffle(left.length ? left : deckAll));
    setCardIdx(0);
    setGuesses([]);
    setTimeLeft(TURN_SECONDS);
    setPhase('turn');
    onPhaseChange?.('turn');
  };

  const nextTurn = () => {
    if (!describer) return;
    const taken = { ...turnsTaken, [describer.id]: (turnsTaken[describer.id] ?? 0) + 1 };
    setTurnsTaken(taken);
    const nextTeam: Team = turnTeam === 'A' ? 'B' : 'A';
    setTurnTeam(nextTeam);
    setDescriber(pickDescriber(mode === 'teams' ? nextTeam : null, taken));
    setPhase('ready');
    onPhaseChange?.('ready');
  };

  const turnResults = results.slice(results.length - cardIdx);
  const cardsLeft = deckAll.length - new Set(results.map((r) => r.card.word)).size;

  const TeamBar = () => mode === 'teams' ? (
    <div className="grid grid-cols-2 gap-3">
      {(['A', 'B'] as const).map((k) => (
        <div key={k} className={`flex items-center justify-between rounded-2xl border px-4 py-2 ${TEAM[k].border} ${TEAM[k].bg} ${phase !== 'idle' && describerTeam === k ? 'ring-1 ring-white/40' : ''}`}>
          <span className={`font-mono text-xs uppercase tracking-[0.16em] ${TEAM[k].text}`}>{TEAM[k].label}</span>
          <span className="font-display text-3xl">{teamScore[k]}</span>
        </div>
      ))}
    </div>
  ) : null;

  // ─── IDLE ─────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-white">
        <div className="text-center">
          <KitLabel tone="rose">Taboo Sprint{content.topic ? ` · ${content.topic}` : ''}</KitLabel>
          <p className="mt-2 font-display text-5xl">Describe it. Don&apos;t say it.</p>
          <p className="mx-auto mt-2 max-w-xl text-lg text-white/70">One student gets a secret word on their phone, with four words they can&apos;t say. Everyone else types guesses. Get as many as you can in {TURN_SECONDS} seconds.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { key: 'everyone', icon: User, title: 'Everyone guesses', blurb: 'The whole class races to guess. Works from 2 students.' },
            { key: 'teams', icon: Users, title: 'Two teams', blurb: 'Teams take turns. Only the describer’s team guesses. 4+ students.' },
          ] as const).map((m) => {
            const on = mode === m.key;
            const Icon = m.icon;
            return (
              <button key={m.key} type="button" onClick={() => setMode(m.key)} className={`rounded-2xl border p-4 text-left ${on ? 'border-rose-300 bg-rose-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                <Icon className={`h-5 w-5 ${on ? 'text-rose-300' : 'text-white/50'}`} />
                <p className="mt-2 font-display text-2xl">{m.title}</p>
                <p className="mt-1 text-sm text-white/65">{m.blurb}</p>
              </button>
            );
          })}
        </div>
        {students.length < minPlayers && <p className="text-center text-sm text-amber-200">Needs at least {minPlayers} students on phones ({students.length} joined).</p>}
        <div className="flex justify-center">
          <KitButton tone="rose" solid disabled={students.length < minPlayers || deckAll.length === 0} onClick={setUp} className="!px-8 !py-3 !text-base" icon={<Ban className="h-4 w-4" />}>Deal the cards</KitButton>
        </div>
      </div>
    );
  }

  // ─── READY: next describer ───────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center text-white">
        <TeamBar />
        <KitLabel tone={describerTeam ? (describerTeam === 'A' ? 'amber' : 'cyan') : 'rose'}>{describerTeam ? `${TEAM[describerTeam].label} · ` : ''}Next describer</KitLabel>
        <p className="font-display text-6xl">{describer?.name ?? '—'}</p>
        <p className="text-lg text-white/70">Your words appear on your phone when the clock starts. Everyone else: get ready to type guesses.</p>
        <div className="flex justify-center gap-2">
          <KitButton onClick={() => setDescriber(pickDescriber(mode === 'teams' ? turnTeam : null, { ...turnsTaken, ...(describer ? { [describer.id]: 99 } : {}) }))}>Someone else</KitButton>
          <KitButton tone="rose" solid disabled={!describer} onClick={startTurn} className="!px-7 !py-2.5 !text-sm" icon={<Mic className="h-4 w-4" />}>Start {TURN_SECONDS}s</KitButton>
        </div>
        <KitReadout>{cardsLeft} cards left</KitReadout>
      </div>
    );
  }

  // ─── TURN (word stays secret on this shared screen) ──────────────────────
  if (phase === 'turn') {
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <TeamBar />
        <div className="flex items-center justify-between">
          <div>
            <KitLabel tone="rose">Describing</KitLabel>
            <p className="font-display text-4xl">{describer?.name}</p>
          </div>
          <div className="text-right">
            <KitLabel>Got</KitLabel>
            <p className="font-display text-4xl text-emerald-300">{turnResults.filter((r) => r.outcome === 'got').length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Clock className={`h-5 w-5 ${timeLeft <= 10 ? 'text-rose-300' : 'text-white/60'}`} />
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className={`h-full ${timeLeft <= 10 ? 'bg-rose-400' : 'bg-amber-300'}`} animate={{ width: `${(timeLeft / TURN_SECONDS) * 100}%` }} transition={{ ease: 'linear', duration: 1 }} />
          </div>
          <span className={`w-14 text-right font-mono text-3xl ${timeLeft <= 10 ? 'text-rose-300' : ''}`}>{timeLeft}</span>
          <KitButton onClick={() => setTimeLeft((t) => t + 30)}>+30s</KitButton>
        </div>

        {/* Mystery card + flash */}
        <div className="relative flex min-h-[170px] items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/12 bg-slate-950/45">
          <AnimatePresence mode="wait">
            {flash ? (
              <motion.div key={`${flash.kind}-${flash.text}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                {flash.kind === 'got' && <p className="font-display text-4xl text-emerald-300"><Check className="mr-2 inline h-8 w-8" />{flash.text}</p>}
                {flash.kind === 'taboo' && <p className="font-display text-5xl text-rose-300"><Ban className="mr-2 inline h-9 w-9" />Taboo! <span className="text-white/60">({flash.text})</span></p>}
                {flash.kind === 'skip' && <p className="font-display text-4xl text-white/70"><SkipForward className="mr-2 inline h-8 w-8" />Skipped: {flash.text}</p>}
              </motion.div>
            ) : (
              <motion.div key={`card-${cardIdx}`} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} className="text-center">
                <p className="font-display text-6xl tracking-[0.3em] text-white/25">? ? ?</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-white/45">Card {cardIdx + 1} · the word is on {describer?.name}&apos;s phone</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Guess feed (wrong guesses only) */}
        <div className="flex min-h-[44px] flex-wrap gap-2">
          <AnimatePresence>
            {guesses.map((g) => (
              <motion.span key={g.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-base">
                <span className="text-white/45">{g.name}:</span> {g.text}
              </motion.span>
            ))}
          </AnimatePresence>
          {guesses.length === 0 && <p className="text-sm text-white/40">Guesses appear here…</p>}
        </div>

        <div className="flex items-center justify-between gap-2">
          <KitButton tone="rose" solid onClick={taboo} className="!px-6 !py-2.5 !text-sm" icon={<Ban className="h-4 w-4" />}>Taboo! (-1)</KitButton>
          <div className="flex gap-2">
            <KitButton onClick={() => card && (showFlash('skip', card.word), nextCard({ card, outcome: 'skip' }))} icon={<SkipForward className="h-3.5 w-3.5" />}>Skip</KitButton>
            <KitButton onClick={() => { setPhase('summary'); onPhaseChange?.('summary'); }}>End turn</KitButton>
          </div>
        </div>
      </div>
    );
  }

  // ─── SUMMARY: reveal this turn's cards ───────────────────────────────────
  if (phase === 'summary') {
    const turnGot = turnResults.filter((r) => r.outcome === 'got').length;
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <TeamBar />
        <div className="text-center">
          <KitLabel tone="emerald">Time!</KitLabel>
          <p className="mt-1 font-display text-5xl">{describer?.name}: {turnGot} word{turnGot === 1 ? '' : 's'}</p>
        </div>
        <div className="space-y-2">
          {turnResults.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-2.5 ${r.outcome === 'got' ? 'border-emerald-300/40 bg-emerald-400/10' : r.outcome === 'taboo' ? 'border-rose-300/40 bg-rose-400/10' : 'border-white/10 bg-white/[0.03]'}`}>
              {r.outcome === 'got' ? <Check className="h-5 w-5 text-emerald-300" /> : r.outcome === 'taboo' ? <Ban className="h-5 w-5 text-rose-300" /> : <SkipForward className="h-5 w-5 text-white/45" />}
              <span className="font-display text-2xl">{r.card.word}</span>
              <span className="text-sm text-white/60">{r.card.description}</span>
              {r.by && <span className="ml-auto font-mono text-xs text-emerald-200">{r.by}</span>}
            </motion.div>
          ))}
          {turnResults.length === 0 && <p className="text-center text-white/50">No cards played this turn.</p>}
        </div>
        <div className="flex justify-center gap-2">
          <KitButton onClick={() => { setPhase('done'); onPhaseChange?.('finished'); }}>Finish game</KitButton>
          <KitButton tone="rose" solid disabled={cardsLeft <= 0} onClick={nextTurn} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{cardsLeft > 0 ? 'Next describer' : 'Deck finished'}</KitButton>
        </div>
      </div>
    );
  }

  // ─── DONE ─────────────────────────────────────────────────────────────────
  const winner: Team | null = mode === 'teams' ? (teamScore.A > teamScore.B ? 'A' : teamScore.B > teamScore.A ? 'B' : null) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-5 py-8 text-center text-white">
      <Trophy className="mx-auto h-10 w-10 text-amber-300" />
      <p className="font-display text-5xl">{mode === 'teams' ? (winner ? `${TEAM[winner].label} wins!` : 'It’s a tie!') : 'Great describing!'}</p>
      <TeamBar />
      <p className="text-lg text-white/70">{got} of {results.length} words guessed</p>
      <div className="flex flex-wrap justify-center gap-2">
        {results.map((r, i) => (
          <span key={i} className={`rounded-full border px-3 py-1 text-base ${r.outcome === 'got' ? 'border-emerald-300/40 text-emerald-100' : 'border-white/15 text-white/55'}`}>{r.card.word}</span>
        ))}
      </div>
    </div>
  );
}
