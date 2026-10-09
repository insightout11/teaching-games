'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { User } from '@supabase/supabase-js';
import { Globe2, LogOut, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { isMockMode } from '@/lib/mock/auth';
import { resetPostHog } from '@/lib/analytics/posthog';
import { CreditBadge } from './credit-badge';

// The app's one navigation bar (Oct 2026, replaced the 16rem sidebar so Home and the room get the full width on a
// laptop that is also sharing in Zoom). Class "lc-sidebar" keeps the session full-screen rule hiding it.
const NAV = [
  { href: '/home', label: 'Home' },
  { href: '/classes', label: 'Classes' },
  { href: '/lesson-planner', label: 'Plan' },
  { href: '/courses', label: 'Courses' },
  { href: '/library', label: 'Library' },
  { href: '/explore', label: 'Explore' },
];

export function TopBar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const mockMode = isMockMode();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const signOut = async () => {
    resetPostHog();
    if (!mockMode) await createClient().auth.signOut();
    router.push('/login');
  };

  return (
    <header className="lc-sidebar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-6 border-b border-white/[0.07] bg-[#04080e]/75 px-5 backdrop-blur-md lg:px-8">
      <Link href="/home" className="shrink-0">
        <Image
          src={resolvedTheme === 'light' ? '/lessoncaptain-logo-on-light.svg' : '/lessoncaptain-logo-on-dark-v2.svg'}
          alt="LessonCaptain"
          width={150}
          height={24}
          className="h-auto"
          unoptimized
        />
      </Link>
      <nav aria-label="Main" className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active ? 'bg-white/[0.08] text-lc-text' : 'text-lc-text3 hover:bg-white/[0.04] hover:text-lc-text',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {mockMode && <span className="rounded-full bg-lc-warn/10 px-2 py-0.5 text-xs text-lc-warn">Demo Mode</span>}
        <CreditBadge />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Account menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-lc-amber/15 text-sm font-semibold text-lc-amber ring-1 ring-lc-amber/30 hover:bg-lc-amber/25"
          >
            {user.email?.[0]?.toUpperCase()}
          </button>
          {open && (
            <div className="absolute right-0 top-10 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#0a121e] py-1 shadow-2xl">
              <p className="truncate px-4 py-2 text-xs text-lc-text3">{user.email}</p>
              <Link href="/world-flight" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-lc-text2 hover:bg-white/[0.05] hover:text-lc-text">
                <Globe2 className="h-4 w-4" />World Flight map
              </Link>
              <Link href="/pro" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-lc-text2 hover:bg-white/[0.05] hover:text-lc-text">
                <Sparkles className="h-4 w-4" />Plans and billing
              </Link>
              <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-lc-text2 hover:bg-white/[0.05] hover:text-lc-text">
                <LogOut className="h-4 w-4" />Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
