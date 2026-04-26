import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { generateJSON } from '@/lib/ai';
import { createServiceClient } from '@/lib/supabase/service';
import type { SourceType } from '@/types/source-material';
import tedLibrary from '@/data/ted-library.json';
import tededLibrary from '@/data/teded-library.json';
import voaLibrary from '@/data/voa-library.json';
import storiesLibrary from '@/data/stories-library.json';
import bbcLibrary from '@/data/bbc-library.json';
import kurzgesagtLibrary from '@/data/kurzgesagt-library.json';
import bbcIdeasLibrary from '@/data/bbc-ideas-library.json';
import bigthinkLibrary from '@/data/bigthink-library.json';
import voxLibrary from '@/data/vox-library.json';
import kidsLibrary from '@/data/kids-library.json';

type TedTalk = {
  id: string;
  title: string;
  speaker: string;
  url: string;
  youtubeId?: string | null;
  durationSecs: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  summary: string;
};

type TextEntry = {
  id: string;
  title: string;
  author?: string;
  speaker?: string;
  wordCount?: number;
  topicTags: string[];
  difficultyLevel: string;
  description: string;
  summary: string;
};

// ─── YouTube via Supadata (optional) ────────────────────────────────────────

interface TranscriptSegment {
  text: string;
  offset: number; // milliseconds
  duration: number; // milliseconds
}

async function fetchYouTubeTranscript(videoId: string): Promise<{ title: string; summary: string; rawTranscript: string }> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error('SUPADATA_NOT_CONFIGURED');

  // Fetch without text=true to get timestamped segments
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}`,
    { headers: { 'x-api-key': apiKey }, cache: 'no-store' },
  );
  if (!res.ok) {
    const body = await res.text();
    console.error(`[supadata] ${res.status}:`, body);
    throw new Error('NO_TRANSCRIPT');
  }
  const data = await res.json() as { content?: TranscriptSegment[] | string; lang?: string };

  let segments: TranscriptSegment[] = [];
  let plainText = '';

  if (Array.isArray(data.content) && data.content.length > 0) {
    segments = data.content as TranscriptSegment[];
    plainText = segments.map((s) => s.text).join(' ');
  } else if (typeof data.content === 'string') {
    plainText = data.content;
  }

  if (!plainText.trim()) throw new Error('NO_TRANSCRIPT');

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

  const summary = await summariseText(sanitizeText(plainText), title);
  const rawTranscript = segments.length > 0 ? JSON.stringify(segments) : plainText;
  return { title, summary, rawTranscript };
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
  durationSecs?: number;
  rawTranscript?: string;
}) {
  const supabase = createServiceClient();
  await supabase.from('source_extractions').upsert(
    {
      source_type: params.sourceType,
      source_key: params.sourceKey,
      title: params.title,
      summary: params.summary,
      duration_secs: params.durationSecs ?? null,
      raw_transcript: params.rawTranscript ?? null,
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
          const { title, summary, rawTranscript } = await fetchYouTubeTranscript(videoId);
          void storeExtraction({ sourceType: 'youtube', sourceKey: videoId, title, summary, rawTranscript });
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

        const cachedTed = await getCachedExtraction('ted', talkId);
        if (cachedTed?.raw_transcript) {
          // If the summary looks like a raw transcript placeholder (< 600 chars, no sentence structure),
          // regenerate a proper AI summary and update the record async.
          const needsSummaryRegen = cachedTed.summary.length < 600 && !cachedTed.summary.includes('.');
          if (needsSummaryRegen) {
            void (async () => {
              try {
                const segments = JSON.parse(cachedTed.raw_transcript!) as Array<{ text: string }>;
                const plainText = segments.map((s) => s.text).join(' ');
                const newSummary = await summariseText(sanitizeText(plainText), cachedTed.title);
                await storeExtraction({
                  sourceType: 'ted', sourceKey: talkId,
                  title: cachedTed.title, summary: newSummary,
                  rawTranscript: cachedTed.raw_transcript!,
                  durationSecs: cachedTed.duration_secs ?? talk.durationSecs,
                });
              } catch { /* non-critical */ }
            })();
          }
          return NextResponse.json({
            title: cachedTed.title,
            summary: needsSummaryRegen ? talk.summary : cachedTed.summary,
            sourceKey: talkId,
            sourceType: 'ted',
            duration: cachedTed.duration_secs ?? talk.durationSecs,
            fromCache: true,
          });
        }

        // No transcript in DB yet — return pre-written summary so teacher isn't blocked.
        // Transcript will be populated by running: npm run prefetch-transcripts
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

      // ── TED-Ed Library ──────────────────────────────────────────────────────────
      case 'teded': {
        const talkId = payload.trim();
        const talk = (tededLibrary as TedTalk[]).find((t) => t.id === talkId);
        if (!talk) {
          return NextResponse.json({ error: 'TED-Ed talk not found' }, { status: 404 });
        }

        const cached = await getCachedExtraction('teded', talkId);
        if (cached?.raw_transcript) {
          const needsSummaryRegen = cached.summary.length < 600 && !cached.summary.includes('.');
          if (needsSummaryRegen) {
            void (async () => {
              try {
                const segments = JSON.parse(cached.raw_transcript!) as Array<{ text: string }>;
                const plainText = segments.map((s) => s.text).join(' ');
                const newSummary = await summariseText(sanitizeText(plainText), cached.title);
                await storeExtraction({
                  sourceType: 'teded', sourceKey: talkId,
                  title: cached.title, summary: newSummary,
                  rawTranscript: cached.raw_transcript!,
                  durationSecs: cached.duration_secs ?? talk.durationSecs,
                });
              } catch { /* non-critical */ }
            })();
          }
          return NextResponse.json({
            title: cached.title,
            summary: needsSummaryRegen ? talk.summary : cached.summary,
            sourceKey: talkId,
            sourceType: 'teded',
            duration: cached.duration_secs ?? talk.durationSecs,
            fromCache: true,
          });
        }

        // No transcript yet — return pre-written summary.
        // Populate via: npm run prefetch-transcripts
        void storeExtraction({
          sourceType: 'teded',
          sourceKey: talkId,
          title: `${talk.title} — ${talk.speaker}`,
          summary: talk.summary,
          durationSecs: talk.durationSecs,
        });

        return NextResponse.json({
          title: `${talk.title} — ${talk.speaker}`,
          summary: talk.summary,
          sourceKey: talkId,
          sourceType: 'teded',
          duration: talk.durationSecs,
        });
      }

      // ── Generic video library handler (BBC, Kurzgesagt, BBC Ideas, Big Think, Vox, Kids) ──
      case 'bbc':
      case 'kurzgesagt':
      case 'bbc-ideas':
      case 'bigthink':
      case 'vox':
      case 'kids': {
        const libraryMap: Record<string, TedTalk[]> = {
          bbc: bbcLibrary as TedTalk[],
          kurzgesagt: kurzgesagtLibrary as TedTalk[],
          'bbc-ideas': bbcIdeasLibrary as TedTalk[],
          bigthink: bigthinkLibrary as TedTalk[],
          vox: voxLibrary as TedTalk[],
          kids: kidsLibrary as unknown as TedTalk[],
        };
        const entryId = payload.trim();
        const library = libraryMap[type];
        const entry = library.find((t) => t.id === entryId);
        if (!entry) {
          return NextResponse.json({ error: `${type} video not found` }, { status: 404 });
        }

        const cachedEntry = await getCachedExtraction(type, entryId);
        if (cachedEntry?.raw_transcript) {
          const needsRegen = cachedEntry.summary.length < 600 && !cachedEntry.summary.includes('.');
          if (needsRegen) {
            void (async () => {
              try {
                const segments = JSON.parse(cachedEntry.raw_transcript!) as Array<{ text: string }>;
                const plainText = segments.map((s) => s.text).join(' ');
                const newSummary = await summariseText(sanitizeText(plainText), cachedEntry.title);
                await storeExtraction({
                  sourceType: type, sourceKey: entryId,
                  title: cachedEntry.title, summary: newSummary,
                  rawTranscript: cachedEntry.raw_transcript!,
                  durationSecs: cachedEntry.duration_secs ?? entry.durationSecs,
                });
              } catch { /* non-critical */ }
            })();
          }
          return NextResponse.json({
            title: cachedEntry.title,
            summary: needsRegen ? entry.summary : cachedEntry.summary,
            sourceKey: entryId,
            sourceType: type,
            duration: cachedEntry.duration_secs ?? entry.durationSecs,
            fromCache: true,
          });
        }

        void storeExtraction({
          sourceType: type,
          sourceKey: entryId,
          title: `${entry.title} — ${entry.speaker}`,
          summary: entry.summary,
          durationSecs: entry.durationSecs,
        });

        return NextResponse.json({
          title: `${entry.title} — ${entry.speaker}`,
          summary: entry.summary,
          sourceKey: entryId,
          sourceType: type,
          duration: entry.durationSecs,
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

      case 'voa':
      case 'stories': {
        const textLibraryMap: Record<string, TextEntry[]> = {
          voa:     voaLibrary as unknown as TextEntry[],
          stories: storiesLibrary as TextEntry[],
        };
        const textEntryId = payload.trim();
        const textEntry = textLibraryMap[type]?.find((e) => e.id === textEntryId);
        if (!textEntry) {
          return NextResponse.json({ error: `Text entry not found in ${type} library` }, { status: 404 });
        }
        const wc = textEntry.wordCount ?? Math.round(textEntry.summary.split(/\s+/).length);
        return NextResponse.json({
          title:      textEntry.title,
          summary:    textEntry.summary,
          sourceKey:  textEntryId,
          sourceType: type,
          wordCount:  wc,
        });
      }

      default:
        return NextResponse.json({ error: `Source type "${type}" is not yet supported` }, { status: 400 });
    }
  } catch (err) {
    console.error('Source extraction error:', err);
    return NextResponse.json({ error: 'Failed to extract source content. Please try again.' }, { status: 500 });
  }
}
