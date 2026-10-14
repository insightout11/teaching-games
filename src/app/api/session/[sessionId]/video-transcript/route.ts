import { NextResponse } from 'next/server';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { fetchYouTubeTranscript, getCachedExtraction, storeExtraction } from '@/lib/youtube-extraction';
import { isMockMode } from '@/lib/mock/auth';

export const dynamic = 'force-dynamic';

// A YouTube video found or pasted in the Live Room (not from the library) arrives with only its title. This reads
// the whole video once, so the topic's briefing and activities are about what it really says.
// Videos already read (by any teacher) come from the cache, free, for everyone. Reading a new video costs a paid
// transcript, so that part is for Pro (and developer) accounts; free accounts keep working from the title.
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (isMockMode()) return NextResponse.json({ error: 'No transcript', code: 'NO_TRANSCRIPT' }, { status: 404 });

  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const body = (await request.json().catch(() => null)) as { videoId?: unknown } | null;
  const videoId = typeof body?.videoId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(body.videoId) ? body.videoId : null;
  if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

  try {
    const cached = await getCachedExtraction('youtube', videoId);
    if (cached?.summary) return NextResponse.json({ summary: cached.summary, fromCache: true });

    const { data: rows } = await createServiceClient().rpc('get_teacher_credits', { teacher_id: teacher.id });
    const info = rows?.[0] as { is_pro?: boolean; is_developer?: boolean } | undefined;
    if (!info?.is_pro && !info?.is_developer) {
      return NextResponse.json({ error: 'Reading the whole video is part of Pro', code: 'PRO_REQUIRED' }, { status: 403 });
    }
    const overLimit = await checkAndRecordAiUsage(teacher, 'more');
    if (overLimit) return overLimit;

    const { title, summary, rawTranscript } = await fetchYouTubeTranscript(videoId);
    void storeExtraction({ sourceType: 'youtube', sourceKey: videoId, title, summary, rawTranscript });
    return NextResponse.json({ summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'NO_TRANSCRIPT') return NextResponse.json({ error: 'This video has no captions', code: 'NO_TRANSCRIPT' }, { status: 404 });
    console.error('[video-transcript]', e);
    return NextResponse.json({ error: 'Could not read the video' }, { status: 502 });
  }
}
