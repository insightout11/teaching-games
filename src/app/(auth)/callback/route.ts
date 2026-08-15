import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { BETA_APPLICATION_COOKIE, isUuid } from '@/lib/beta/application';
import { decideBetaLink } from '@/lib/beta/linkage';
import { NextResponse } from 'next/server';

const AUTH_NEXT_COOKIE = 'lc-auth-next';
const BETA_CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 0,
};

function getSafeRedirectPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextPath = searchParams.get('next');
  const cookieNextPath = getCookieValue(request.headers.get('cookie'), AUTH_NEXT_COOKIE);
  const safeNextPath =
    getSafeRedirectPath(nextPath) ??
    getSafeRedirectPath(cookieNextPath) ??
    '/home';

  if (code) {
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const betaApplicationId = getCookieValue(
        request.headers.get('cookie'),
        BETA_APPLICATION_COOKIE
      );

      if (isUuid(betaApplicationId)) {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (user?.email) {
          try {
            const service = createServiceClient();
            const { data: application, error: applicationError } = await service
              .from('beta_applications')
              .select('id, email_normalized, status, teacher_id, signed_up_at')
              .eq('id', betaApplicationId)
              .maybeSingle();

            if (applicationError) throw applicationError;
            if (!application) throw new Error('Beta application not found');

            const decision = decideBetaLink(application, { id: user.id, email: user.email });
            if (decision.kind === 'mismatch') {
              const mismatch = NextResponse.redirect(`${origin}/beta?status=account-mismatch`);
              mismatch.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 });
              mismatch.cookies.set(BETA_APPLICATION_COOKIE, '', BETA_CLEAR_COOKIE_OPTIONS);
              return mismatch;
            }

            if (decision.kind === 'link') {
              const { error: linkError } = await service
                .from('beta_applications')
                .update(decision.update)
                .eq('id', application.id);
              if (linkError) throw linkError;
            }
          } catch (linkError) {
            // Authentication still succeeds if beta linkage has a transient failure.
            // Keep the opaque cookie so the teacher can retry sign-in within 30 days.
            console.error('[auth/callback] beta linkage error', linkError instanceof Error ? linkError.message : 'unknown');
            const response = NextResponse.redirect(`${origin}/beta?status=linkage-error`);
            response.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 });
            return response;
          }
        }
      }

      const response = NextResponse.redirect(`${origin}${safeNextPath}`);
      response.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 });
      if (isUuid(betaApplicationId)) {
        response.cookies.set(BETA_APPLICATION_COOKIE, '', BETA_CLEAR_COOKIE_OPTIONS);
      }
      return response;
    }
  }

  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'auth');
  loginUrl.searchParams.set('next', safeNextPath);
  return NextResponse.redirect(loginUrl);
}
