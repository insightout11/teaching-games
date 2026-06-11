import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import {
  parseYouTubeId,
  getCachedExtraction,
  storeExtraction,
  fetchYouTubeTranscript,
  fetchOEmbedTitle,
} from '@/lib/youtube-extraction';
import { generateVideoPreview, buildDegradedPreview, type VideoPreviewContent } from '@/lib/video-preview';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';

export const dynamic = 'force-dynamic';

// Public, UNAUTHENTICATED preview endpoint for /video-lesson. The abuse controls below
// are mandatory: cache-first (cache hits are free + uncounted), a per-IP distinct-video
// cap, and a global daily cap on uncached previews.

const PREVIEW_GAME_KEY = 'video-lesson-preview';
const PREVIEW_DIFFICULTY = 'Intermediate';
const PER_IP_MAX_NEW_VIDEOS = 3; // distinct new videos / 24h
const GLOBAL_MAX_UNCACHED = 150; // uncached previews / 24h
const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Stage labels for the preview skeleton, rendered from the featured preset (never hardcoded). */
function getStageLabels(): string[] {
  const preset = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'all-around-flight-60');
  return preset?.flightConfig?.stages.map((s) => s.label) ?? [];
}

function hashIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0].trim() || 'unknown';
  const salt = process.env.PUBLIC_DEMO_IP_SALT ?? '';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function buildResponse(
  videoId: string,
  content: VideoPreviewContent,
  cached: boolean,
) {
  return NextResponse.json({
    videoId,
    title: content.title,
    thumbnail: thumbnailFor(videoId),
    cached,
    transcriptUsed: content.transcriptUsed,
    suggestedLevel: content.suggestedLevel,
    hook: content.hook,
    keyVocab: content.keyVocab,
    comprehensionQuestions: content.comprehensionQuestions,
    discussionPrompts: content.discussionPrompts,
    stageLabels: getStageLabels(),
  });
}

export async function POST(request: NextRequest) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const url = (body.url ?? '').trim();
  if (!url) {
    return NextResponse.json({ error: 'Paste a YouTube link to build a lesson.' }, { status: 400 });
  }

  const videoId = parseYouTubeId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be URL." },
      { status: 400 },
    );
  }

  // 1. Preview cache — a hit is free and does NOT count against any limit.
  const cachedPreview = await getCachedContent(PREVIEW_GAME_KEY, videoId, PREVIEW_DIFFICULTY);
  if (cachedPreview) {
    return buildResponse(videoId, cachedPreview.content_json as VideoPreviewContent, true);
  }

  // 2. This is an uncached preview — enforce abuse controls before any expensive work.
  const supabase = createServiceClient();
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const ipHash = hashIp(request);

  const { data: ipRows } = await supabase
    .from('public_demo_usage')
    .select('video_id')
    .eq('ip_hash', ipHash)
    .gte('created_at', windowStart);
  const distinctVideos = new Set((ipRows ?? []).map((r) => r.video_id));
  if (distinctVideos.size >= PER_IP_MAX_NEW_VIDEOS && !distinctVideos.has(videoId)) {
    return NextResponse.json(
      { error: "You've previewed a few videos today. Sign up free to keep building lessons.", code: 'DEMO_LIMIT' },
      { status: 429 },
    );
  }

  const { count: globalCount } = await supabase
    .from('public_demo_usage')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', windowStart);
  if ((globalCount ?? 0) >= GLOBAL_MAX_UNCACHED) {
    return NextResponse.json(
      { error: "We're at capacity right now — here are lessons from popular videos.", code: 'DEMO_BUSY' },
      { status: 429 },
    );
  }

  // Record the uncached attempt (bounds Supadata/AI usage even if extraction fails).
  await supabase.from('public_demo_usage').insert({ ip_hash: ipHash, video_id: videoId });

  // 3. Extraction — cache-first, then Supadata, then oEmbed title-only, never a dead end.
  let title = `YouTube Video (${videoId})`;
  let summary = '';
  let transcriptUsed = false;

  const cachedExtraction = await getCachedExtraction('youtube', videoId);
  if (cachedExtraction) {
    title = cachedExtraction.title;
    summary = cachedExtraction.summary ?? '';
    transcriptUsed = !!summary;
  } else {
    try {
      const extracted = await fetchYouTubeTranscript(videoId);
      title = extracted.title;
      summary = extracted.summary;
      transcriptUsed = true;
      void storeExtraction({
        sourceType: 'youtube',
        sourceKey: videoId,
        title: extracted.title,
        summary: extracted.summary,
        rawTranscript: extracted.rawTranscript,
      });
    } catch {
      // No transcript (Supadata unset or no captions) — fall back to the title alone.
      const oembedTitle = await fetchOEmbedTitle(videoId);
      if (oembedTitle) title = oembedTitle;
      transcriptUsed = false;
    }
  }

  // 4. One AI call → preview. Degrade to a topic-aware preview if generation fails.
  let content: VideoPreviewContent;
  try {
    content = await generateVideoPreview(title, summary, transcriptUsed);
    void storeCachedContent(PREVIEW_GAME_KEY, videoId, PREVIEW_DIFFICULTY, content);
  } catch {
    content = buildDegradedPreview(title, transcriptUsed);
  }

  return buildResponse(videoId, content, false);
}
