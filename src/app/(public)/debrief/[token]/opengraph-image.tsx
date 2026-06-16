import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase/service';
import { countsForAccuracy, countsForLeaderboard, isCorrectScore } from '@/lib/scoring-reporting';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEBRIEF_MAX_AGE_DAYS = 30;

interface Card {
  firstName: string;
  topic: string;
  points: number;
  accuracy: number | null;
  bestStreak: number;
  rank: number | null;
  participants: number;
}

// Public-safe brag card: first name + lesson topic + stats only. Never embeds the
// access link (the token URL is a credential and travels separately).
async function loadCard(token: string): Promise<Card | null> {
  if (!UUID_RE.test(token)) return null;
  const supabase = createServiceClient();

  const { data: participant } = await supabase
    .from('session_participants')
    .select('session_id, client_id, student_id, display_name')
    .eq('debrief_token', token)
    .maybeSingle();
  if (!participant) return null;

  const { data: session } = await supabase
    .from('sessions')
    .select('topic, custom_topic, ended_at')
    .eq('id', participant.session_id)
    .maybeSingle();

  // Respect the 30-day expiry the page enforces.
  if (session?.ended_at) {
    const ageMs = Date.now() - new Date(session.ended_at).getTime();
    if (ageMs > DEBRIEF_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) return null;
  }

  // Match the session_leaderboard view's COALESCE(student_id, client_id) key set.
  const scoreFilter = participant.student_id
    ? `client_id.eq.${participant.client_id},student_id.eq.${participant.student_id}`
    : `client_id.eq.${participant.client_id}`;

  const [{ data: myScores }, { data: lb }] = await Promise.all([
    supabase
      .from('scores')
      .select('points, streak_bonus, is_correct, accuracy_status, counts_for_accuracy, counts_for_leaderboard, scoring_version, streak_count')
      .eq('session_id', participant.session_id)
      .or(scoreFilter),
    supabase
      .from('session_leaderboard')
      .select('total_points')
      .eq('session_id', participant.session_id)
      .order('total_points', { ascending: false }),
  ]);

  const rows = (myScores ?? []) as Array<{
    points: number; streak_bonus?: number | null; is_correct: boolean; accuracy_status?: string | null;
    counts_for_accuracy?: boolean | null; counts_for_leaderboard?: boolean | null;
    scoring_version?: number | null; streak_count: number;
  }>;
  const leaderboardRows = rows.filter(countsForLeaderboard);
  const points = leaderboardRows.reduce((s, r) => s + (r.points ?? 0), 0);
  const leaderboardTotal = leaderboardRows.reduce((s, r) => s + (r.points ?? 0) + (r.streak_bonus ?? 0), 0);
  const scorable = leaderboardRows.filter(countsForAccuracy);
  const accuracy = scorable.length > 0
    ? Math.round((scorable.filter(isCorrectScore).length / scorable.length) * 100)
    : null;
  const bestStreak = rows.length > 0 ? Math.max(...rows.map((r) => r.streak_count ?? 0)) : 0;

  const lbRows = lb ?? [];
  const rank = lbRows.length > 0 ? lbRows.filter((e) => e.total_points > leaderboardTotal).length + 1 : null;

  const firstName = (participant.display_name || 'Pilot').trim().split(/\s+/)[0];
  const topic = session?.custom_topic || session?.topic || 'today’s lesson';

  return { firstName, topic, points, accuracy, bestStreak, rank, participants: lbRows.length };
}

export default async function DebriefOgImage({ params }: { params: { token: string } }) {
  const card = await loadCard(params.token);

  const stats: Array<{ label: string; value: string }> = card
    ? [
        { label: 'POINTS', value: String(card.points) },
        ...(card.accuracy !== null ? [{ label: 'ACCURACY', value: `${card.accuracy}%` }] : []),
        ...(card.bestStreak >= 2 ? [{ label: 'BEST STREAK', value: `${card.bestStreak}` }] : []),
        ...(card.rank !== null && card.participants > 1 ? [{ label: 'RANK', value: `#${card.rank}` }] : []),
      ]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #061325 0%, #0a1f3a 55%, #07111f 100%)',
          color: '#eaf1ff',
          padding: 56,
          position: 'relative',
        }}
      >
        {/* Boarding-pass card */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            borderRadius: 28,
            border: '1px solid rgba(103,232,249,0.25)',
            background: 'rgba(8,18,33,0.72)',
            overflow: 'hidden',
          }}
        >
          {/* Main body */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '52px 56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 800 }}>
                <span style={{ color: '#eaf1ff' }}>Lesson</span>
                <span style={{ color: '#4da3ff' }}>Captain</span>
              </div>
              <div style={{ display: 'flex', color: '#67e8f9', fontSize: 17, fontWeight: 700, letterSpacing: 5 }}>
                BOARDING PASS
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
              <div style={{ display: 'flex', color: '#8aa0b6', fontSize: 18, letterSpacing: 3 }}>PILOT</div>
              <div style={{ display: 'flex', color: '#ffffff', fontSize: 70, fontWeight: 800, lineHeight: 1.05, marginTop: 6 }}>
                {card ? card.firstName : 'Flight log'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26 }}>
              <div style={{ display: 'flex', color: '#8aa0b6', fontSize: 18, letterSpacing: 3 }}>FLIGHT LOG</div>
              <div style={{ display: 'flex', color: '#cddcec', fontSize: 32, fontWeight: 600, marginTop: 4 }}>
                {card ? card.topic : 'Results unavailable'}
              </div>
            </div>

            {stats.length > 0 && (
              <div style={{ display: 'flex', marginTop: 'auto', gap: 48 }}>
                {stats.map((s) => (
                  <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', color: '#67e8f9', fontSize: 52, fontWeight: 800 }}>{s.value}</div>
                    <div style={{ display: 'flex', color: '#8aa0b6', fontSize: 16, letterSpacing: 2, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Perforated stub */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 240,
              borderLeft: '2px dashed rgba(103,232,249,0.35)',
              background: 'rgba(77,163,255,0.07)',
              padding: 40,
            }}
          >
            <svg width="92" height="92" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 22h20" />
              <path d="M3.77 10.77 2 9l2-4.5 1.1.55c.6.3 1.34.06 1.64-.54L8 2l3 1.5-.45 2.27a1.2 1.2 0 0 0 .65 1.32L17 10l-1 3-5.5-1.6a1.2 1.2 0 0 0-1.32.45L7 15l-3-1.5.55-1.1c.3-.6.06-1.34-.78-1.63Z" />
            </svg>
            <div style={{ display: 'flex', color: '#8aa0b6', fontSize: 15, letterSpacing: 3, marginTop: 22, textAlign: 'center' }}>
              LIVE LESSON
            </div>
            <div style={{ display: 'flex', color: '#cddcec', fontSize: 18, fontWeight: 700, marginTop: 4, textAlign: 'center' }}>
              ARRIVED
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
