import { NextRequest, NextResponse } from 'next/server';
import { BETA_APPLICATION_COOKIE, isUuid } from '@/lib/beta/application';
import { captureBetaConversionEvent, sanitizeAnalyticsDistinctId } from '@/lib/analytics/posthog-server';
import { betaAttributionFromRow } from '@/lib/beta/server-attribution';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const applicationId = request.cookies.get(BETA_APPLICATION_COOKIE)?.value ?? null;
  if (!isUuid(applicationId)) return NextResponse.json({ captured: false }, { status: 400 });

  const body = await request.json().catch(() => null) as { analyticsDistinctId?: unknown } | null;
  const analyticsDistinctId = sanitizeAnalyticsDistinctId(body?.analyticsDistinctId);
  const service = createServiceClient();
  const { data, error } = await service
    .from('beta_applications')
    .select('landing_path, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term')
    .eq('id', applicationId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ captured: false }, { status: 404 });
  const captured = await captureBetaConversionEvent({
    event: 'beta_google_signin_started',
    applicationId,
    analyticsDistinctId,
    attribution: betaAttributionFromRow(data),
  });
  return NextResponse.json({ captured }, { status: captured ? 200 : 503 });
}
