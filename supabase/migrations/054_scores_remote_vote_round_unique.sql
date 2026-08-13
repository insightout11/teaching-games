-- Enforce one durable direct response per student device and activity round.
-- Multi-round activities retain prior questions because roundId is part of the key.
CREATE UNIQUE INDEX IF NOT EXISTS scores_remote_vote_round_unique
  ON public.scores (
    session_id,
    client_id,
    (response_data->>'gameKey'),
    (response_data->>'roundId')
  )
  WHERE response_data->>'type' = 'remote_vote'
    AND response_data->>'roundId' IS NOT NULL
    AND client_id IS NOT NULL;
