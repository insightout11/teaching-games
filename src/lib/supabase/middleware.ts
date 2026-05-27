import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isMockModeServer(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

function getSafeNextParam(request: NextRequest): string {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function getSafeRedirectPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export async function updateSession(request: NextRequest) {
  // In mock mode, skip Supabase auth entirely
  if (isMockModeServer()) {
    // Allow all routes through, but redirect root to /login
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // If Supabase auth fails (e.g. Edge Runtime issue, network error), pass through
    // rather than crashing with MIDDLEWARE_INVOCATION_FAILED
    return supabaseResponse;
  }

  // Protect dashboard routes
  const isDashboard = request.nextUrl.pathname.startsWith('/classes') ||
    request.nextUrl.pathname.startsWith('/sessions');

  if (!user && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', getSafeNextParam(request));
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login
  if (user && request.nextUrl.pathname === '/login') {
    const nextPath = getSafeRedirectPath(request.nextUrl.searchParams.get('next'));
    if (nextPath) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
