'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';
import type { Score } from '@/lib/supabase/types';

interface RouteChoicePanelProps {
  sessionId: string;
  onRouteChosen: (key: string, type: 'game' | 'activity', name: string) => void;
}

type EndGameOption = {
  key: string;
  type: 'game' | 'activity';
  name: string;
  description: string;
};

const END_GAME_OPTIONS: EndGameOption[] = [
  { key: 'flash-quiz', type: 'game', name: 'Flash Quiz', description: 'Race to answer — speed and accuracy win' },
  { key: 'connections', type: 'game', name: 'Connections', description: 'Find the hidden links between words' },
  { key: 'password', type: 'activity', name: 'Password', description: 'Give clues to get your team to say the word' },
];

const OPTION_KEYS = END_GAME_OPTIONS.map((o) => o.key);

export function RouteChoicePanel({ sessionId, onRouteChosen }: RouteChoicePanelProps) {
  const [tallies, setTallies] = useState<Record<string, number>>({
    'flash-quiz': 0,
    'connections': 0,
    'password': 0,
  });
  const votedClientsRef = useRef<Set<string>>(new Set());
  const setInputSpec = useSessionStore((s) => s.setInputSpec);

  // Broadcast vote input to student devices
  useEffect(() => {
    setInputSpec({
      type: 'choice',
      gameKey: 'route-choice',
      prompt: 'Vote for your end game!',
      options: OPTION_KEYS,
      optionLabels: END_GAME_OPTIONS.map((o) => o.name),
    });
    return () => {
      setInputSpec(null);
    };
  }, [setInputSpec]);

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
          if (OPTION_KEYS.includes(choice)) {
            setTallies((prev) => ({ ...prev, [choice]: (prev[choice] ?? 0) + 1 }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleCloseVote = useCallback(() => {
    let winnerKey = 'flash-quiz';
    let winnerVotes = -1;
    for (const opt of END_GAME_OPTIONS) {
      const count = tallies[opt.key] ?? 0;
      if (count > winnerVotes) {
        winnerVotes = count;
        winnerKey = opt.key;
      }
    }
    const winner = END_GAME_OPTIONS.find((o) => o.key === winnerKey)!;
    onRouteChosen(winner.key, winner.type, winner.name);
  }, [tallies, onRouteChosen]);

  const totalVotes = Object.values(tallies).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(tallies));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-[#0d1117] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)] space-y-5">

        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300/60">
            Route Choice
          </p>
          <h2 className="text-xl font-bold text-white">Choose Your End Game</h2>
          <p className="text-sm text-white/50">
            {totalVotes === 0
              ? 'Waiting for votes…'
              : `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} in`}
          </p>
        </div>

        <div className="space-y-4">
          {END_GAME_OPTIONS.map((opt) => {
            const count = tallies[opt.key] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isLeading = count > 0 && count === maxVotes;

            return (
              <div key={opt.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${isLeading ? 'text-cyan-300' : 'text-white/75'}`}>
                    {opt.name}
                  </span>
                  <span className={`tabular-nums text-xs ${isLeading ? 'text-cyan-300' : 'text-white/40'}`}>
                    {count} {count === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isLeading ? 'bg-cyan-400' : 'bg-white/25'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-white/35">{opt.description}</p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCloseVote}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 active:bg-cyan-600"
        >
          Close Vote &amp; Continue
        </button>

        <p className="text-center text-xs text-white/30">
          Ties and zero votes default to Flash Quiz
        </p>
      </div>
    </div>
  );
}
