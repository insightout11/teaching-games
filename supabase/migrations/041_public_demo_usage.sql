-- Public video-lesson demo usage log
-- Tracks uncached preview generations for the anonymous /video-lesson page so we can
-- bound abuse: per-IP (hashed) distinct-video cap and a global daily cap.
-- Cache HITS are never recorded here — only uncached previews count.
-- Service-role only, no client policies (project convention since 001).

CREATE TABLE public.public_demo_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  video_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX public_demo_usage_ip ON public.public_demo_usage (ip_hash, created_at DESC);
CREATE INDEX public_demo_usage_created ON public.public_demo_usage (created_at DESC);

ALTER TABLE public.public_demo_usage ENABLE ROW LEVEL SECURITY;
-- No policies — service role bypasses RLS; anon/auth clients get nothing.
