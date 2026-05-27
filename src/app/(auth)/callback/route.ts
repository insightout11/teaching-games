import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextPath = searchParams.get('next');
  const safeNextPath = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
    ? nextPath
    : '/home';

  if (code) {
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNextPath}`);
    }
  }

  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'auth');
  loginUrl.searchParams.set('next', safeNextPath);
  return NextResponse.redirect(loginUrl);
}
