import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerSupabase } from '@/lib/supabase/server';
import { BETA_APPLICATION_COOKIE, parseBetaApplication } from '@/lib/beta/application';
import {
  BETA_BODY_MAX_BYTES,
  getBetaAbuseSalt,
  hashBetaClientIp,
  requestBodyTooLarge,
} from '@/lib/beta/abuse';

export const dynamic = 'force-dynamic';

const SUCCESS = { ok: true, next: '/login?next=/home' } as const;

export async function POST(request: NextRequest) {
  if (requestBodyTooLarge(request)) {
    return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
  }
  const rawBody = await request.text().catch(() => '');
  if (new TextEncoder().encode(rawBody).byteLength > BETA_BODY_MAX_BYTES) {
    return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
  }
  const body = (() => {
    try { return JSON.parse(rawBody) as unknown; } catch { return null; }
  })();
  const parsed = parseBetaApplication(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.honeypot) return NextResponse.json(SUCCESS);

  try {
    const salt = getBetaAbuseSalt();
    if (!salt) {
      console.error('[beta/apply] PUBLIC_DEMO_IP_SALT is required in production');
      return NextResponse.json({ error: 'Applications are temporarily unavailable' }, { status: 503 });
    }
    const service = createServiceClient();
    const ipHash = hashBetaClientIp(request, salt);
    const { data: attemptClaim, error: attemptError } = await service
      .rpc('claim_beta_application_attempt', { p_ip_hash: ipHash });
    if (attemptError) throw attemptError;
    if (attemptClaim === 'ip_limited' || attemptClaim === 'global_limited') {
      return NextResponse.json({ error: 'Too many applications. Please try again later.' }, { status: 429 });
    }
    if (attemptClaim !== 'allowed') throw new Error('Unexpected beta application attempt result');

    const supabase = createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    const { data: existing, error: readError } = await service
      .from('beta_applications')
      .select('id, teacher_id, status, signed_up_at')
      .eq('email_normalized', parsed.value.email_normalized)
      .maybeSingle();

    if (readError) throw readError;

    let applicationId = existing?.id as string | undefined;
    const editable = {
      email: parsed.value.email,
      first_name: parsed.value.first_name,
      teaching_format: parsed.value.teaching_format,
      learner_levels: parsed.value.learner_levels,
      learner_age_band: parsed.value.learner_age_band,
      typical_class_size: parsed.value.typical_class_size,
      teaching_platform: parsed.value.teaching_platform,
      biggest_challenge: parsed.value.biggest_challenge,
      contact_consent: true,
    };

    const ownsExisting = Boolean(applicationId && user && existing?.teacher_id === user.id);
    if (ownsExisting) {
      const { error } = await service
        .from('beta_applications')
        .update(editable)
        .eq('id', applicationId)
        .eq('teacher_id', user!.id);
      if (error) throw error;
    } else if (!applicationId) {
      const { data, error } = await service
        .from('beta_applications')
        .insert(parsed.value)
        .select('id')
        .single();

      if (error) {
        // A concurrent submission may win the unique-email race. Resolve it as
        // an idempotent repeat without changing first-touch attribution.
        if ((error as { code?: string }).code !== '23505') throw error;
        const { data: concurrent, error: concurrentError } = await service
          .from('beta_applications')
          .select('id')
          .eq('email_normalized', parsed.value.email_normalized)
          .single();
        if (concurrentError || !concurrent) throw concurrentError ?? error;
        applicationId = concurrent.id as string;
      } else {
        applicationId = data.id as string;
      }
    }

    const matchesAuthenticatedUser = Boolean(
      user?.email && user.email.trim().toLowerCase() === parsed.value.email_normalized
    );
    const canLinkAuthenticatedUser = Boolean(
      matchesAuthenticatedUser && user && (!existing?.teacher_id || existing.teacher_id === user.id)
    );
    if (canLinkAuthenticatedUser && user) {
      const linkUpdate: Record<string, unknown> = { teacher_id: user.id };
      if (!existing?.signed_up_at) linkUpdate.signed_up_at = new Date().toISOString();
      if (!existing || existing.status === 'applied') linkUpdate.status = 'signed_up';
      const { error: linkError } = await service
        .from('beta_applications')
        .update(linkUpdate)
        .eq('id', applicationId!);
      if (linkError) throw linkError;
    }

    const next = canLinkAuthenticatedUser
      ? '/home'
      : user
        ? '/beta?status=account-mismatch'
        : SUCCESS.next;
    const response = NextResponse.json({ ok: true, next, analyticsApplicationId: applicationId });
    if (!canLinkAuthenticatedUser) {
      response.cookies.set(BETA_APPLICATION_COOKIE, applicationId!, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  } catch (error) {
    console.error('[beta/apply] persistence error', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'We could not save your application. Please try again.' }, { status: 500 });
  }
}
