-- Pre-generated content cache for AI latency reduction
-- Stores batches of AI-generated content per game/topic/difficulty
-- so live class requests can be served from cache (zero AI latency)

CREATE TABLE public.generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key text NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL,
  content_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_count int NOT NULL DEFAULT 0
);

-- Index for efficient cache lookups by game/topic/difficulty combo
CREATE INDEX idx_generated_content_lookup
  ON generated_content(game_key, topic, difficulty);

-- Enable RLS (all access via service role only — no public policies)
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Atomic increment function (avoids read-modify-write race condition on used_count)
CREATE OR REPLACE FUNCTION public.increment_content_used_count(content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.generated_content
  SET used_count = used_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
