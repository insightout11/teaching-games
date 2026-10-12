'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Link2, Link, Search, Ban, KeyRound, Gamepad2, LayoutGrid, Shuffle, Timer, HelpCircle, Swords, Armchair, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import { getAllGames, getGame } from '@/games/registry';
import { getAllActivities, getActivity } from '@/activities/registry';
import { createClient } from '@/lib/supabase/client';
import type { Score } from '@/lib/supabase/types';
import { isParticipantCompatible } from '@/lib/participant-compatibility';
import { Flaps, FlapStyles } from '@/components/ui/split-flap';

interface RouteChoicePanelProps {
  sessionId: string;
  /** The end-game slot's pool (the per-preset trio). Falls back to a default trio. */
  pool?: string[];
  onRouteChosen: (key: string, type: 'game' | 'activity', name: string) => void;
}

type EndGameOption = { key: string; type: 'game' | 'activity'; name: string; Icon: LucideIcon; blurb: string | null };

const ICON_BY_KEY: Record<string, LucideIcon> = {
  'flash-quiz': Zap,
  connections: Link2,
  'word-chain': Link,
  imposter: Search,
  'taboo-sprint': Ban,
  password: KeyRound,
  'grid-rush': LayoutGrid,
  'synonym-showdown': Shuffle,
  'vocab-sprint': Timer,
  'twenty-questions': HelpCircle,
  'sector-strike': Swords,
  'hot-seat': Armchair,
  'story-sprint': BookOpen,
};

/** What each game is, in a few words, so the class knows what it is voting for. */
const BLURB_BY_KEY: Record<string, string> = {
  'flash-quiz': 'Fast questions on today',
  connections: 'Find the four that go together',
  imposter: 'Who has the different word?',
  'taboo-sprint': "Describe it, don't say it",
  'grid-rush': 'Race to fill the grid',
  'synonym-showdown': 'Same meaning, better word',
  'vocab-sprint': "Race through today's words",
  'twenty-questions': 'Ask questions, find the secret',
  'sector-strike': 'Teams win the board',
  'hot-seat': 'Clues from the whole class',
  'story-sprint': 'One sentence each, out loud',
};

const DEFAULT_POOL = ['flash-quiz', 'connections', 'grid-rush'];

function resolveOption(key: string): EndGameOption {
  const a = getAllActivities().find((act) => act.key === key);
  if (a) return { key, type: 'activity', name: a.name, Icon: ICON_BY_KEY[key] ?? Gamepad2, blurb: BLURB_BY_KEY[key] ?? null };
  const g = getAllGames().find((gm) => gm.key === key);
  return { key, type: 'game', name: g?.name ?? key, Icon: ICON_BY_KEY[key] ?? Gamepad2, blurb: BLURB_BY_KEY[key] ?? null };
}

function fitsParticipantCount(key: string, participantCount: number): boolean {
  const plugin = getGame(key) ?? getActivity(key);
  return plugin ? isParticipantCompatible(plugin, Math.max(1, participantCount)) : false;
}

const COUNTDOWN_SECONDS = 20;
const REVEAL_MS = 2000;

// SVG ring dimensions
const RING_R = 20;
const RING_CIRC = 2 * Math.PI * RING_R;

export function RouteChoicePanel({ sessionId, pool, onRouteChosen }: RouteChoicePanelProps) {
  const rosterSize = useSessionStore((s) => s.students.length);
  const options = useMemo<EndGameOption[]>(() => {
    const keys = pool && pool.length > 0 ? pool : DEFAULT_POOL;
    // Drop options the current roster can't actually play (e.g. Imposter needs 3+
    // students) rather than offering a vote that dead-ends when it wins.
    const fitting = keys.filter((key) => fitsParticipantCount(key, rosterSize));
    return (fitting.length > 0 ? fitting : ['flash-quiz']).map(resolveOption);
  }, [pool, rosterSize]);
  const optionKeys = useMemo(() => options.map((o) => o.key), [options]);

  const [tallies, setTallies] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((o) => [o.key, 0])),
  );
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [phase, setPhase] = useState<'voting' | 'revealing'>('voting');
  const [revealKey, setRevealKey] = useState<string | null>(null);

  const votedClientsRef = useRef<Set<string>>(new Set());
  const hasClosedRef = useRef(false);
  const talliesRef = useRef(tallies);
  const optionsRef = useRef(options);
  const setInputSpec = useSessionStore((s) => s.setInputSpec);

  // Keep refs current so the countdown can read latest votes/options without deps
  useEffect(() => { talliesRef.current = tallies; }, [tallies]);
  useEffect(() => { optionsRef.current = options; }, [options]);

  // Defined inline so it always closes over latest state via refs
  function closeVote(forcedKey?: string) {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;

    const snapshot = talliesRef.current;
    const opts = optionsRef.current;
    let winKey = opts[0]?.key ?? 'flash-quiz';
    let winVotes = -1;
    if (forcedKey) { winKey = forcedKey; winVotes = Infinity; }
    for (const opt of opts) {
      const count = snapshot[opt.key] ?? 0;
      if (count > winVotes) {
        winVotes = count;
        winKey = opt.key;
      }
    }

    setRevealKey(winKey);
    setPhase('revealing');
    setInputSpec(null);

    setTimeout(() => {
      const winner = opts.find((o) => o.key === winKey) ?? opts[0];
      if (winner) onRouteChosen(winner.key, winner.type, winner.name);
    }, REVEAL_MS);
  }

  // Stable ref so the countdown interval can call the latest closeVote
  const closeVoteRef = useRef(closeVote);
  closeVoteRef.current = closeVote;
  const pickNow = (key: string) => closeVoteRef.current(key);

  // Only one game fits this class: no vote to hold, just play it.
  useEffect(() => {
    if (options.length === 1) closeVoteRef.current(options[0].key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Broadcast vote input to student devices
  useEffect(() => {
    setInputSpec({
      type: 'choice',
      gameKey: 'route-choice',
      prompt: 'Which game shall we play?',
      options: optionKeys,
      optionLabels: options.map((o) => o.name),
    });
    return () => { setInputSpec(null); };
  }, [setInputSpec, optionKeys, options]);

  // 20-second countdown — fires closeVote when it reaches 0
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          closeVoteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime vote subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`route-choice-votes-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scores',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: Score }) => {
          const score = payload.new;
          const rd = score.response_data as Record<string, unknown> | null;
          if (rd?.type !== 'remote_vote' || rd?.gameKey !== 'route-choice') return;

          const clientId = score.client_id ?? '';
          if (votedClientsRef.current.has(clientId)) return;
          votedClientsRef.current.add(clientId);

          const choice = rd.choice as string;
          if (optionsRef.current.some((o) => o.key === choice)) {
            setTallies((prev) => ({ ...prev, [choice]: (prev[choice] ?? 0) + 1 }));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const totalVotes = Object.values(tallies).reduce((a, b) => a + b, 0);
  const maxVotes = options.length ? Math.max(...options.map((o) => tallies[o.key] ?? 0)) : 0;
  const ringOffset = RING_CIRC * (secondsLeft / COUNTDOWN_SECONDS);
  const isUrgent = secondsLeft <= 5;

  // ── Winner reveal ──
  if (phase === 'revealing') {
    const winner = revealKey ? options.find((o) => o.key === revealKey) : null;
    const WinIcon = winner?.Icon ?? Gamepad2;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/85 backdrop-blur-sm">
        <FlapStyles />
        <div className="space-y-5 text-center">
          <WinIcon className="mx-auto h-12 w-12 text-amber-300" aria-hidden />
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">The class chose</p>
          <div className="flex justify-center"><Flaps text={winner?.name ?? 'Game'} size="lg" max={20} /></div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Getting it ready</p>
        </div>
      </div>
    );
  }

  // ── Voting panel ──
  const cols = options.length <= 2 ? 'grid-cols-2' : options.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/80 p-4 backdrop-blur-sm">
      <div className={`w-full ${options.length > 4 ? 'max-w-3xl' : 'max-w-2xl'} space-y-5 rounded-2xl border border-white/[0.07] bg-[#0a121e]/95 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)] sm:p-8`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">Class vote · last game</p>
            <h2 className="mt-1 font-display text-3xl text-white sm:text-4xl">Which game shall we <em className="text-amber-300">play</em>?</h2>
            <p className="mt-1 text-sm text-white/55">
              {totalVotes === 0 ? 'Vote on your phone, or tell your teacher.' : `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} in`}
            </p>
          </div>
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="28" cy="28" r={RING_R}
                fill="none"
                stroke={isUrgent ? '#f87171' : '#fcd34d'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={RING_CIRC - ringOffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className={`font-mono text-lg font-bold tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}>{secondsLeft}</span>
          </div>
        </div>

        {/* The teacher can also just pick: tap a game to choose it for the class. */}
        <div className={`grid gap-3 ${cols}`}>
          {options.map((opt) => {
            const count = tallies[opt.key] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isLeading = count > 0 && count === maxVotes;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => pickNow(opt.key)}
                title={`Play ${opt.name} now`}
                className={`relative flex flex-col items-start gap-1.5 overflow-hidden rounded-xl border px-4 pb-5 pt-4 text-left transition-colors ${
                  isLeading ? 'border-amber-300/60 bg-amber-300/10' : 'border-white/[0.09] bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <Icon className={`h-6 w-6 ${isLeading ? 'text-amber-300' : 'text-white/70'}`} aria-hidden />
                  <span className={`font-mono text-sm font-semibold tabular-nums ${isLeading ? 'text-amber-200' : 'text-white/45'}`}>{count}</span>
                </span>
                <span className="text-lg font-bold leading-tight text-white">{opt.name}</span>
                {opt.blurb && <span className="text-sm leading-snug text-white/55">{opt.blurb}</span>}
                <span className="absolute inset-x-0 bottom-0 h-1.5 bg-white/5">
                  <span className={`block h-full transition-all duration-500 ${isLeading ? 'bg-amber-300' : 'bg-white/25'}`} style={{ width: `${pct}%` }} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/40">Tap a game to pick it yourself. With no votes, the first one plays.</p>
          <button
            type="button"
            onClick={() => closeVoteRef.current()}
            className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Close the vote
          </button>
        </div>
      </div>
    </div>
  );
}
