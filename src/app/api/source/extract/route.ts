import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { generateJSON } from '@/lib/ai';
import { createServiceClient } from '@/lib/supabase/service';
import type { SourceType } from '@/types/source-material';

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
    .slice(0, 60000); // ~15k words max
}

async function summariseText(text: string, title: string): Promise<string> {
  const schema = {
    type: 'object' as const,
    properties: {
      summary: { type: 'string' as const },
    },
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

async function getCachedExtraction(sourceType: string, sourceKey: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('source_extractions')
    .select('summary, title, duration_secs, raw_transcript')
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
  rawTranscript?: string;
  durationSecs?: number;
}) {
  const supabase = createServiceClient();
  await supabase.from('source_extractions').upsert(
    {
      source_type: params.sourceType,
      source_key: params.sourceKey,
      title: params.title,
      summary: params.summary,
      raw_transcript: params.rawTranscript ?? null,
      duration_secs: params.durationSecs ?? null,
    },
    { onConflict: 'source_type,source_key', ignoreDuplicates: false },
  );
}

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
      case 'youtube': {
        const videoId = extractVideoId(payload.trim());
        if (!videoId) {
          return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 });
        }

        // Check cache first
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

        // Fetch transcript
        let transcriptItems: Array<{ text: string }>;
        try {
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        } catch {
          return NextResponse.json(
            {
              error: 'No transcript available for this video. Try pasting the text content manually.',
              code: 'NO_TRANSCRIPT',
            },
            { status: 422 },
          );
        }

        const rawTranscript = sanitizeText(
          transcriptItems.map((t) => t.text).join(' '),
        );

        if (!rawTranscript.trim()) {
          return NextResponse.json(
            { error: 'Transcript is empty. Try pasting the text content manually.', code: 'EMPTY_TRANSCRIPT' },
            { status: 422 },
          );
        }

        // Try to get title from YouTube oEmbed (no API key needed)
        let title = `YouTube Video (${videoId})`;
        try {
          const oEmbed = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          );
          if (oEmbed.ok) {
            const data = await oEmbed.json();
            if (data.title) title = data.title;
          }
        } catch {
          // title stays as fallback
        }

        const summary = await summariseText(rawTranscript, title);

        void storeExtraction({ sourceType: 'youtube', sourceKey: videoId, title, summary, rawTranscript });

        return NextResponse.json({ title, summary, sourceKey: videoId, sourceType: 'youtube' });
      }

      case 'text': {
        if (payload.length < 50) {
          return NextResponse.json({ error: 'Text is too short. Please paste at least a paragraph.' }, { status: 400 });
        }
        const cleaned = sanitizeText(payload);
        const title = 'Pasted Text';
        const summary = await summariseText(cleaned, title);
        return NextResponse.json({ title, summary, sourceType: 'text' });
      }

      default:
        return NextResponse.json({ error: `Source type "${type}" is not yet supported` }, { status: 400 });
    }
  } catch (err) {
    console.error('Source extraction error:', err);
    return NextResponse.json(
      { error: 'Failed to extract source content. Please try again.' },
      { status: 500 },
    );
  }
}
