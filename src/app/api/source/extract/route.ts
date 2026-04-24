import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { generateJSON } from '@/lib/ai';
import { createServiceClient } from '@/lib/supabase/service';
import type { SourceType } from '@/types/source-material';
import tedLibrary from '@/data/ted-library.json';

type TedTalk = {
  id: string;
  title: string;
  speaker: string;
  url: string;
  durationSecs: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  summary: string;
};

// ─── YouTube via Supadata (optional) ────────────────────────────────────────

async function fetchYouTubeSummary(videoId: string): Promise<{ title: string; summary: string }> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error('SUPADATA_NOT_CONFIGURED');

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}&text=true`,
    { headers: { 'x-api-key': apiKey }, cache: 'no-store' },
  );
  if (!res.ok) {
    const body = await res.text();
    console.error(`[supadata] ${res.status}:`, body);
    throw new Error('NO_TRANSCRIPT');
  }
  const data = await res.json() as { content?: string; lang?: string };
  if (!data.content?.trim()) throw new Error('NO_TRANSCRIPT');

  // Get title via oEmbed
  let title = `YouTube Video (${videoId})`;
  try {
    const oEmbed = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (oEmbed.ok) {
      const d = await oEmbed.json() as { title?: string };
      if (d.title) title = d.title;
    }
  } catch { /* keep fallback title */ }

  const summary = await summariseText(sanitizeText(data.content), title);
  return { title, summary };
}

// ─── Text sanitisation ───────────────────────────────────────────────────────

function sanitizeText(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const lower = line.toLowerCase().trim();
      return !(
        lower.startsWith('ignore') ||
        lower.startsWith('system:') ||
        lower.startsWith('assistant:') ||
        lower.startsWith('<|') ||
        lower.startsWith('[inst]')
      );
    })
    .join('\n')
    .slice(0, 60000);
}

// ─── AI summarisation ────────────────────────────────────────────────────────

async function summariseText(text: string, title: string): Promise<string> {
  const schema = {
    type: 'object' as const,
    properties: { summary: { type: 'string' as const } },
    required: ['summary'],
  };

  const prompt = `Summarise the following educational content in 400–500 words of plain prose.
Title: ${title}

Preserve:
- Key vocabulary and domain-specific terms (bold them with *word*)
- Main arguments and claims made
- Memorable examples, statistics, or quotes
- The overall structure and flow of ideas

Write for an ESL teacher who will use this summary to generate interactive classroom activities.

Content:
${text.slice(0, 12000)}

Return JSON with a single "summary" field.`;

  const result = await generateJSON<{ summary: string }>(prompt, schema, { taskClass: 'bulk-generation' });
  return result.summary;
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

async function getCachedExtraction(sourceType: string, sourceKey: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('source_extractions')
    .select('summary, title, duration_secs')
    .eq('source_type', sourceType)
    .eq('source_key', sourceKey)
    .single();
  return data ?? null;
}

async function storeExtraction(params: {
  sourceType: string;
  sourceKey: string;
  title: string;
  summary: string;
  durationSecs?: number;
}) {
  const supabase = createServiceClient();
  await supabase.from('source_extractions').upsert(
    {
      source_type: params.sourceType,
      source_key: params.sourceKey,
      title: params.title,
      summary: params.summary,
      duration_secs: params.durationSecs ?? null,
    },
    { onConflict: 'source_type,source_key', ignoreDuplicates: false },
  );
}

// ─── Video ID extraction ─────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration({ requestHasProModules: true });
  if (authError) return authError;

  let body: { type: SourceType; payload: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type, payload } = body;
  if (!type || !payload) {
    return NextResponse.json({ error: 'Missing type or payload' }, { status: 400 });
  }

  try {
    switch (type) {

      // ── YouTube ─────────────────────────────────────────────────────────────
      case 'youtube': {
        const videoId = extractVideoId(payload.trim());
        if (!videoId) {
          return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 });
        }

        const cached = await getCachedExtraction('youtube', videoId);
        if (cached) {
          return NextResponse.json({
            title: cached.title,
            summary: cached.summary,
            sourceKey: videoId,
            sourceType: 'youtube',
            duration: cached.duration_secs ?? undefined,
            fromCache: true,
          });
        }

        try {
          const { title, summary } = await fetchYouTubeSummary(videoId);
          void storeExtraction({ sourceType: 'youtube', sourceKey: videoId, title, summary });
          return NextResponse.json({ title, summary, sourceKey: videoId, sourceType: 'youtube' });
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (msg === 'SUPADATA_NOT_CONFIGURED') {
            return NextResponse.json(
              { error: 'YouTube extraction is not enabled. Paste the transcript using Plain Text instead.', code: 'NOT_CONFIGURED' },
              { status: 422 },
            );
          }
          return NextResponse.json(
            { error: 'No transcript available for this video. Try pasting the content manually.', code: 'NO_TRANSCRIPT' },
            { status: 422 },
          );
        }
      }

      // ── TED Library ─────────────────────────────────────────────────────────
      case 'ted': {
        const talkId = payload.trim();
        const talk = (tedLibrary as TedTalk[]).find((t) => t.id === talkId);
        if (!talk) {
          return NextResponse.json({ error: 'TED talk not found' }, { status: 404 });
        }

        // TED summaries are pre-written — no AI call needed, just cache and return
        void storeExtraction({
          sourceType: 'ted',
          sourceKey: talkId,
          title: `${talk.title} — ${talk.speaker}`,
          summary: talk.summary,
          durationSecs: talk.durationSecs,
        });

        return NextResponse.json({
          title: `${talk.title} — ${talk.speaker}`,
          summary: talk.summary,
          sourceKey: talkId,
          sourceType: 'ted',
          duration: talk.durationSecs,
        });
      }

      // ── Plain Text / Notes ───────────────────────────────────────────────────
      case 'text': {
        if (payload.length < 50) {
          return NextResponse.json({ error: 'Text is too short. Please paste at least a paragraph.' }, { status: 400 });
        }
        const cleaned = sanitizeText(payload);

        // Cache by content hash so repeated pastes of the same text are instant
        const hash = Buffer.from(cleaned.slice(0, 500)).toString('base64').slice(0, 40);
        const cached = await getCachedExtraction('text', hash);
        if (cached) {
          return NextResponse.json({ title: cached.title, summary: cached.summary, sourceType: 'text', fromCache: true });
        }

        const title = 'Pasted Text';
        const summary = await summariseText(cleaned, title);
        void storeExtraction({ sourceType: 'text', sourceKey: hash, title, summary });
        return NextResponse.json({ title, summary, sourceType: 'text' });
      }

      default:
        return NextResponse.json({ error: `Source type "${type}" is not yet supported` }, { status: 400 });
    }
  } catch (err) {
    console.error('Source extraction error:', err);
    return NextResponse.json({ error: 'Failed to extract source content. Please try again.' }, { status: 500 });
  }
}
