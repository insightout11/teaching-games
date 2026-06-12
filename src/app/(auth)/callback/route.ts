import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const AUTH_NEXT_COOKIE = 'lc-auth-next';

function getSafeRedirectPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieStore = cookies();

  const safeNextPath =
    getSafeRedirectPath(searchParams.get('next')) ??
    getSafeRedirectPath(cookieStore.get(AUTH_NEXT_COOKIE)?.value ?? null) ??
    '/home';

  if (code) {
    // Build the redirect response FIRST and bind the session cookies to it directly.
    // Returning a freshly-created NextResponse otherwise drops the Set-Cookie headers
    // that exchangeCodeForSession writes — the browser never persists the session and
    // bounces back to the logged-out homepage (the reported sign-in loop).
    const response = NextResponse.redirect(`${origin}${safeNextPath}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      response.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 });
      return response;
    }
  }

  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'auth');
  loginUrl.searchParams.set('next', safeNextPath);
  return NextResponse.redirect(loginUrl);
}
