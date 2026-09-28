import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { SourcesPopout } from '@/components/session/live-room/sources-popout';

/** Pop-out Sources window for the Live Room. The API enforces session ownership. */
export default async function SourcesPopoutPage({ params }: { params: { sessionId: string } }) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE !== 'true') {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/login?next=/sessions/${params.sessionId}/sources`);
  }
  return <SourcesPopout sessionId={params.sessionId} />;
}
