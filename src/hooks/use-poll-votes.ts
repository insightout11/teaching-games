'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { PollVote } from '@/lib/supabase/types';

interface UsePollVotesReturn {
  votes: PollVote[];
  tallies: Record<string, number>;
  teamTallies: Record<string, Record<string, number>>; // { 'red': { 'Option A': 5 }, ... }
  isLoading: boolean;
}

export function usePollVotes(pollId: string | null): UsePollVotesReturn {
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!pollId) {
      setVotes([]);
      setIsLoading(false);
      return;
    }

    if (isMockMode()) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Load initial votes
    async function loadVotes() {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId);

      if (!error && data) {
        setVotes(data as PollVote[]);
      }
      setIsLoading(false);
    }

    loadVotes();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`poll_votes:${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT and UPDATE
          schema: 'public',
          table: 'poll_votes',
          filter: `poll_id=eq.${pollId}`,
        },
        (payload: { new: unknown; eventType: string }) => {
          const vote = payload.new as PollVote;

          setVotes((prev) => {
            // Update existing vote or add new one
            const existingIndex = prev.findIndex((v) => v.client_id === vote.client_id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = vote;
              return updated;
            }
            return [...prev, vote];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  // Calculate tallies
  const tallies = useMemo(() => {
    const result: Record<string, number> = {};
    votes.forEach((vote) => {
      result[vote.choice] = (result[vote.choice] || 0) + 1;
    });
    return result;
  }, [votes]);

  // Calculate team-specific tallies
  const teamTallies = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    votes.forEach((vote) => {
      if (vote.team) {
        if (!result[vote.team]) {
          result[vote.team] = {};
        }
        result[vote.team][vote.choice] = (result[vote.team][vote.choice] || 0) + 1;
      }
    });
    return result;
  }, [votes]);

  return { votes, tallies, teamTallies, isLoading };
}
