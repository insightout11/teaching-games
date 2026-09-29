import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { SourcesPopout } from '@/components/session/live-room/sources-popout';

/** The Live Room's private window: Messages and Sources. The API enforces session ownership. */
export default async function SourcesPopoutPage({ params, searchParams }: { params: { sessionId: string }; searchParams: { tab?: string } }) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE !== 'true') {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/login?next=/sessions/${params.sessionId}/sources`);
  }
  return <SourcesPopout sessionId={params.sessionId} initialTab={searchParams.tab === 'messages' ? 'messages' : searchParams.tab === 'board' ? 'board' : 'sources'} />;
}
