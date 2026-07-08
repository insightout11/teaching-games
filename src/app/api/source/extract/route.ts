import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import {
  parseYouTubeId,
  fetchYouTubeTranscript,
  sanitizeText,
  summariseText,
  getCachedExtraction,
  storeExtraction,
} from '@/lib/youtube-extraction';
import type { SourceType } from '@/types/source-material';
import tedLibrary from '@/data/ted-library.json';
import tededLibrary from '@/data/teded-library.json';
import storiesLibrary from '@/data/stories-library.json';
import voaLibrary from '@/data/voa-library.json';
import pictureBookLibrary from '@/data/picture-books-library.json';
import bbcLibrary from '@/data/bbc-library.json';
import natgeoLibrary from '@/data/natgeo-library.json';
import crashCourseLibrary from '@/data/crash-course-library.json';
import travelEnglishLibrary from '@/data/travel-english-library.json';
import businessEnglishLibrary from '@/data/business-english-library.json';
import internetMemesLibrary from '@/data/internet-memes-library.json';
import minecraftLibrary from '@/data/minecraft-library.json';
import sportsLibrary from '@/data/sports-library.json';
import kurzgesagtLibrary from '@/data/kurzgesagt-library.json';
import bbcIdeasLibrary from '@/data/bbc-ideas-library.json';
import bigthinkLibrary from '@/data/bigthink-library.json';
import voxLibrary from '@/data/vox-library.json';
import kidsLibrary from '@/data/kids-library.json';

export const maxDuration = 60;

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

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration({ requiresEntitlement: true });
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
        const videoId = parseYouTubeId(payload.trim());
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
      case 'kids':
      case 'natgeo':
      case 'crash-course':
      case 'travel-english':
      case 'business-english':
      case 'internet-memes':
      case 'minecraft':
      case 'sports': {
        const libraryMap: Record<string, TedTalk[]> = {
          bbc: bbcLibrary as unknown as TedTalk[],
          kurzgesagt: kurzgesagtLibrary as unknown as TedTalk[],
          'bbc-ideas': bbcIdeasLibrary as unknown as TedTalk[],
          bigthink: bigthinkLibrary as unknown as TedTalk[],
          vox: voxLibrary as unknown as TedTalk[],
          kids: kidsLibrary as unknown as TedTalk[],
          natgeo: natgeoLibrary as unknown as TedTalk[],
          'crash-course': crashCourseLibrary as unknown as TedTalk[],
          'travel-english': travelEnglishLibrary as unknown as TedTalk[],
          'business-english': businessEnglishLibrary as unknown as TedTalk[],
          'internet-memes': internetMemesLibrary as unknown as TedTalk[],
          minecraft: minecraftLibrary as unknown as TedTalk[],
          sports: sportsLibrary as unknown as TedTalk[],
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
          return NextResponse.json({ title: cached.title, summary: cached.summary, rawText: cleaned, sourceType: 'text', fromCache: true });
        }

        const title = 'Pasted Text';
        const summary = await summariseText(cleaned, title);
        void storeExtraction({ sourceType: 'text', sourceKey: hash, title, summary });
        return NextResponse.json({ title, summary, rawText: cleaned, sourceType: 'text' });
      }

      case 'stories': {
        type StoryEntry = { id: string; title: string; author: string; wordCount: number; topicTags: string[]; difficultyLevel: string; description: string; summary: string; };
        const entry = (storiesLibrary as StoryEntry[]).find((e) => e.id === payload.trim());
        if (!entry) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
        return NextResponse.json({ title: entry.title, summary: entry.summary, rawText: entry.summary, sourceKey: entry.id, sourceType: 'stories', wordCount: entry.wordCount });
      }

      case 'voa': {
        type VoaEntry = { id: string; title: string; author: string; wordCount: number; topicTags: string[]; difficultyLevel: string; description: string; summary: string; };
        const entry = (voaLibrary as VoaEntry[]).find((e) => e.id === payload.trim());
        if (!entry) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        return NextResponse.json({ title: entry.title, summary: entry.summary, rawText: entry.summary, sourceKey: entry.id, sourceType: 'voa', wordCount: entry.wordCount });
      }

      case 'picture-books': {
        type PictureBookEntry = { id: string; title: string; author: string; wordCount: number; topicTags: string[]; difficultyLevel: string; description: string; summary: string; slides: string[]; };
        const entry = (pictureBookLibrary as PictureBookEntry[]).find((e) => e.id === payload.trim());
        if (!entry) return NextResponse.json({ error: 'Picture book not found' }, { status: 404 });
        return NextResponse.json({ title: entry.title, summary: entry.summary, rawText: entry.summary, sourceKey: entry.id, sourceType: 'picture-books', wordCount: entry.wordCount, slides: entry.slides });
      }

      default:
        return NextResponse.json({ error: `Source type "${type}" is not yet supported` }, { status: 400 });
    }
  } catch (err) {
    console.error('Source extraction error:', err);
    return NextResponse.json({ error: 'Failed to extract source content. Please try again.' }, { status: 500 });
  }
}
