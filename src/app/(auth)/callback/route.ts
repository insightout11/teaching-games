import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const AUTH_NEXT_COOKIE = 'lc-auth-next';

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
      const response = NextResponse.redirect(`${origin}${safeNextPath}`);
      response.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 });
      return response;
    }
  }

  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'auth');
  loginUrl.searchParams.set('next', safeNextPath);
  return NextResponse.redirect(loginUrl);
}
