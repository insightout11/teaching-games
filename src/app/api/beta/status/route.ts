import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { betaAnalyticsProperties, sanitizeBetaAttribution } from '@/lib/beta/attribution';

export const dynamic = 'force-dynamic';

const STATUS_FIELDS = 'id, landing_path, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term';
type BetaStatusRow = {
  id: string;
  landing_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

// Atomically records the first signup observation. Already-recorded rows remain
// eligible for delivery retries; the client supplies a deterministic PostHog UUID
// derived from the application ID, so those retries are deduplicated at ingestion.
export async function POST() {
  const supabase = createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  const teacherId = authData.user?.id;
  if (!teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('beta_applications')
    .update({ analytics_signup_completed_at: new Date().toISOString() })
    .eq('teacher_id', teacherId)
    .is('analytics_signup_completed_at', null)
    .select(STATUS_FIELDS);

  if (error) {
    console.error('[beta/status] atomic claim error', error.message);
    return NextResponse.json({ error: 'Unable to claim beta analytics' }, { status: 500 });
  }

  let claimed: BetaStatusRow | null = (data?.[0] as BetaStatusRow | undefined) ?? null;
  if (!claimed) {
    const { data: existing, error: existingError } = await service
      .from('beta_applications')
      .select(STATUS_FIELDS)
      .eq('teacher_id', teacherId)
      .maybeSingle();
    if (existingError) {
      console.error('[beta/status] retry lookup error', existingError.message);
      return NextResponse.json({ error: 'Unable to retry beta analytics' }, { status: 500 });
    }
    claimed = (existing as BetaStatusRow | null) ?? null;
  }
  if (!claimed) return NextResponse.json({ claimed: false });
  const attribution = sanitizeBetaAttribution({
    landingPath: claimed.landing_path,
    referrer: claimed.referrer,
    utmSource: claimed.utm_source,
    utmMedium: claimed.utm_medium,
    utmCampaign: claimed.utm_campaign,
    utmContent: claimed.utm_content,
    utmTerm: claimed.utm_term,
  });
  return NextResponse.json({
    claimed: true,
    applicationId: claimed.id,
    properties: betaAnalyticsProperties(attribution),
  });
}
