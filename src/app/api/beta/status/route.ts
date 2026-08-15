import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { betaAnalyticsProperties, sanitizeBetaAttribution } from '@/lib/beta/attribution';

export const dynamic = 'force-dynamic';

// Atomically reserves beta_signup_completed for one authenticated browser.
// Supabase remains authoritative; PostHog delivery after a claim is best-effort.
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
    .select('landing_path, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term');

  if (error) {
    console.error('[beta/status] atomic claim error', error.message);
    return NextResponse.json({ error: 'Unable to claim beta analytics' }, { status: 500 });
  }

  const claimed = data?.[0];
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
  return NextResponse.json({ claimed: true, properties: betaAnalyticsProperties(attribution) });
}
