'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Gamepad2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { isMockMode } from '@/lib/mock/auth';
import { MarketingSkyDescent } from '@/components/homepage/MarketingSkyDescent';
import { getPlaneAsset } from '@/lib/plane-progression';

const AUTH_NEXT_COOKIE = 'lc-auth-next';

function getSafeNextPath(): string {
  const params = new URLSearchParams(window.location.search);
  const nextPath = params.get('next');
  return nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
    ? nextPath
    : '/home';
}

function rememberAuthNext(nextPath: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(nextPath)}; Max-Age=600; Path=/; SameSite=Lax${secure}`;
}

export default function LoginPage() {
  const router = useRouter();
  const mockMode = isMockMode();

  const handleLogin = async () => {
    const supabase = createClient();
    const safeNextPath = getSafeNextPath();
    rememberAuthNext(safeNextPath);
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
    router.push(getSafeNextPath());
  };

  // The gate: a paper boarding pass on the same morning sky as the home page. Sign-in is the one thing to do here.
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-lc-bg px-4 py-10">
      <MarketingSkyDescent />
      <div className="relative z-10 w-full max-w-3xl">
        <div className="-mb-3 flex justify-end pr-8">
          <Image src={getPlaneAsset('scout-monoplane').png} alt="" width={260} height={130} className="h-auto w-[min(230px,55%)] drop-shadow-[0_10px_18px_rgba(0,0,0,.55)]" priority />
        </div>
        <div className="grid overflow-hidden rounded-2xl bg-[#f4efe3] text-[#1b2233] shadow-[0_30px_80px_rgba(0,0,0,.55)] sm:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex min-w-0 flex-col gap-3 p-6 sm:p-8">
            <Image src="/lessoncaptain-logo-on-light.svg" alt="LessonCaptain" width={200} height={32} className="h-auto w-[190px]" unoptimized />
            <p className="font-instrument mt-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#4b566b]">Boarding pass · Test Flight</p>
            <h1 className="font-game text-4xl leading-[1.05] sm:text-5xl">Welcome aboard, Captain.</h1>
            <p className="text-lg text-[#333d52]">Sign in to open your classroom. You get 4 full lessons free every month, for good.</p>
            <ul className="mt-1 space-y-1.5 text-[17px]">
              {['Your classes, lessons and class journeys are saved', 'Students never need accounts', 'No card needed'].map((line) => (
                <li key={line} className="flex items-start gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0 text-[#0b6bd0]" aria-hidden />{line}</li>
              ))}
            </ul>
          </div>

          {/* The stub: perforation, die-cut notches, and the one thing to do. */}
          <div className="relative flex flex-col items-center justify-center gap-4 border-t-[3px] border-dashed border-[#1b2233]/30 p-6 sm:border-l-[3px] sm:border-t-0">
            <span aria-hidden className="absolute -left-[11px] -top-[12px] h-[22px] w-[22px] rounded-full bg-[#27456f] sm:-left-[12px] sm:-top-[11px]" />
            <span aria-hidden className="absolute -right-[11px] -top-[12px] h-[22px] w-[22px] rounded-full bg-[#27456f] sm:-bottom-[11px] sm:-left-[12px] sm:right-auto sm:top-auto" />
            <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-[#4b566b]">Gate open</p>
            <div aria-hidden className="h-10 w-[120px]" style={{ background: 'repeating-linear-gradient(90deg,#1b2233 0 3px,transparent 3px 5px,#1b2233 5px 6px,transparent 6px 10px)' }} />
            {mockMode ? (
              <button onClick={handleDemoLogin} className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#1b2233] px-4 text-base font-semibold text-white transition hover:brightness-110">
                <Gamepad2 className="h-5 w-5" aria-hidden />
                Enter as Demo User
              </button>
            ) : (
              <button onClick={handleLogin} className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-[#1b2233]/25 bg-white px-4 text-base font-semibold text-[#1b2233] shadow-sm transition hover:bg-[#f7f7f7]">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
                Sign in with Google
              </button>
            )}
            {mockMode && <p className="rounded-lg bg-amber-200/60 px-2 py-1 text-center text-sm text-[#5a4300]">Demo Mode: no sign-in needed</p>}
          </div>
        </div>
        <p className="mt-5 text-center text-[15px] text-white/85">
          New here? <Link href="/" className="font-semibold text-white underline underline-offset-4">See what LessonCaptain does</Link>
        </p>
      </div>
    </div>
  );
}
