'use client';

import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { isMockMode } from '@/lib/mock/auth';
import { SkyBackground } from '@/components/ui/sky-background';

export default function LoginPage() {
  const router = useRouter();
  const mockMode = isMockMode();

  const handleLogin = async () => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get('next');
    const safeNextPath = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
      ? nextPath
      : '/home';
    const callbackUrl = new URL('/callback', window.location.origin);
    callbackUrl.searchParams.set('next', safeNextPath);

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  };

  const handleDemoLogin = () => {
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get('next');
    router.push(nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/classes');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-lc-bg">
      <SkyBackground weatherState="climbing" altitude={0.75} intensity="moderate" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 5, background: 'linear-gradient(180deg, rgba(7,11,20,0.55) 0%, rgba(7,11,20,0.65) 40%, rgba(7,11,20,0.72) 100%)' }}
      />
      <div className="relative z-10 bg-lc-card/85 backdrop-blur-md border border-lc-blue/20 rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full mx-4 text-center">
        <Image src="/lessoncaptain-logo-on-dark-v2.svg" alt="LessonCaptain" width={200} height={32} className="h-auto mx-auto mb-2" unoptimized />
        <p className="text-lc-text2 mb-2">Sign in to get Test Flight credits and save your lessons.</p>
        <p className="text-xs text-lc-text3 mb-6">Your account keeps your Flight Plans, class history, and debriefs. Students never need accounts.</p>

        {mockMode ? (
          <button
            onClick={handleDemoLogin}
            className="w-full flex items-center justify-center gap-3 bg-lc-blue rounded-xl px-6 py-3 text-white font-medium hover:bg-lc-blue-hover transition-all"
          >
            <span className="text-xl">🎮</span>
            Enter as Demo User
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-lc-surface border-2 border-lc-border rounded-xl px-6 py-3 text-lc-text font-medium hover:bg-lc-card hover:border-lc-blue/30 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        )}

        {mockMode && (
          <p className="mt-4 text-sm text-lc-warn bg-lc-warn/10 rounded-lg p-2">
            Demo Mode: No authentication required
          </p>
        )}
      </div>
    </div>
  );
}
