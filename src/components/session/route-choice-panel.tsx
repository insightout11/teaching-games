'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Link2, Link, Search, Ban, KeyRound, Gamepad2, LayoutGrid, Shuffle, Timer, HelpCircle, Swords } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import { getAllGames, getGame } from '@/games/registry';
import { getAllActivities, getActivity } from '@/activities/registry';
import { createClient } from '@/lib/supabase/client';
import type { Score } from '@/lib/supabase/types';

interface RouteChoicePanelProps {
  sessionId: string;
  /** The end-game slot's pool (the per-preset trio). Falls back to a default trio. */
  pool?: string[];
  onRouteChosen: (key: string, type: 'game' | 'activity', name: string) => void;
}

type EndGameOption = { key: string; type: 'game' | 'activity'; name: string; Icon: LucideIcon };

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
};

const DEFAULT_POOL = ['flash-quiz', 'connections', 'word-chain', 'grid-rush'];

function resolveOption(key: string): EndGameOption {
  const a = getAllActivities().find((act) => act.key === key);
  if (a) return { key, type: 'activity', name: a.name, Icon: ICON_BY_KEY[key] ?? Gamepad2 };
  const g = getAllGames().find((gm) => gm.key === key);
  return { key, type: 'game', name: g?.name ?? key, Icon: ICON_BY_KEY[key] ?? Gamepad2 };
}

function minStudentsForKey(key: string): number {
  return (getGame(key)?.minStudents ?? getActivity(key)?.minStudents) ?? 1;
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
    const fitting = keys.filter((key) => minStudentsForKey(key) <= rosterSize);
    return (fitting.length > 0 ? fitting : keys).map(resolveOption);
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
  function closeVote() {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;

    const snapshot = talliesRef.current;
    const opts = optionsRef.current;
    let winKey = opts[0]?.key ?? 'flash-quiz';
    let winVotes = -1;
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

  // Broadcast vote input to student devices
  useEffect(() => {
    setInputSpec({
      type: 'choice',
      gameKey: 'route-choice',
      prompt: 'Vote for your end game!',
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center space-y-5">
          <WinIcon className="mx-auto h-14 w-14 text-cyan-300" aria-hidden />
          <p className="text-[13px] font-semibold uppercase tracking-widest text-cyan-300/60">
            Class Chose
          </p>
          <h2 className="text-5xl font-extrabold text-white tracking-tight">
            {winner?.name ?? 'End Game'}
          </h2>
          <p className="text-sm text-white/40">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Voting panel ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`w-full ${options.length > 4 ? 'max-w-2xl' : 'max-w-lg'} rounded-2xl border border-cyan-400/20 bg-[#0d1117] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.6)] space-y-6`}>

        {/* Header + countdown ring */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300/60">
              Route Choice
            </p>
            <h2 className="text-2xl font-bold text-white">Choose Your End Game</h2>
          </div>

          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="28" cy="28" r={RING_R}
                fill="none"
                stroke={isUrgent ? '#f87171' : '#22d3ee'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={RING_CIRC - ringOffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className={`text-lg font-bold tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* Vote count */}
        <p className="text-sm text-white/40 -mt-2">
          {totalVotes === 0
            ? 'Waiting for votes…'
            : `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} in`}
        </p>

        {/* Option cards — column count adapts so 4 tiles as 2×2 and 5–6 fill two rows of 3 */}
        <div className={`grid gap-3 ${options.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {options.map((opt) => {
            const count = tallies[opt.key] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isLeading = count > 0 && count === maxVotes;
            const Icon = opt.Icon;

            return (
              <div
                key={opt.key}
                className={`relative flex flex-col items-center gap-2 rounded-xl border pb-5 pt-4 px-3 text-center transition-all duration-300 ${
                  isLeading
                    ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <Icon className={`h-7 w-7 ${isLeading ? 'text-cyan-300' : 'text-white/70'}`} aria-hidden />
                <span className={`text-sm font-bold leading-snug ${isLeading ? 'text-cyan-300' : 'text-white/80'}`}>
                  {opt.name}
                </span>
                <span className={`text-xs tabular-nums ${isLeading ? 'text-cyan-300/70' : 'text-white/35'}`}>
                  {count} {count === 1 ? 'vote' : 'votes'}
                </span>
                {/* thin vote bar pinned to bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden rounded-b-xl bg-white/5">
                  <div
                    className={`h-full transition-all duration-500 ${isLeading ? 'bg-cyan-400' : 'bg-white/20'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => closeVoteRef.current()}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 active:bg-cyan-600"
        >
          Close Vote &amp; Continue
        </button>

        <p className="text-center text-xs text-white/30">
          Ties and zero votes default to the first option
        </p>
      </div>
    </div>
  );
}
