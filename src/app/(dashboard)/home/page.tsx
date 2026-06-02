export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { TeacherHomeClient, type RecentSession } from '@/components/discovery/TeacherHomeClient';

async function getRecentSessions(userId: string): Promise<RecentSession[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('sessions')
    .select('id, topic, custom_topic, started_at, status, classes!inner(name, teacher_id)')
    .eq('classes.teacher_id', userId)
    .order('started_at', { ascending: false })
    .limit(5);

  if (!data) return [];

  return data.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    topic: s.topic as string,
    custom_topic: s.custom_topic as string | null,
    started_at: s.started_at as string,
    status: s.status as string,
    class_name: (s.classes as { name: string }).name,
  }));
}

async function getTeacherCredits(userId: string): Promise<number> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('teachers')
    .select('generation_credits, subscription_status, is_developer, promo_expires_at')
    .eq('id', userId)
    .single();

  if (!data) return 0;

  const isPro =
    data.is_developer ||
    data.subscription_status === 'active' ||
    (data.promo_expires_at != null && new Date(data.promo_expires_at) > new Date());

  return isPro ? -1 : (data.generation_credits as number);
}

export default async function HomePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [recentSessions, credits] = await Promise.all([
    getRecentSessions(user.id),
    getTeacherCredits(user.id),
  ]);

  return (
    <TeacherHomeClient
      recentSessions={recentSessions}
      isPro={credits === -1}
      credits={credits === -1 ? 0 : credits}
      isFirstVisit={recentSessions.length === 0}
    />
  );
}
