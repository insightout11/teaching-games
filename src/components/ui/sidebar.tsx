'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isMockMode } from '@/lib/mock/auth';
import type { User } from '@supabase/supabase-js';
import { CreditBadge } from './credit-badge';
import { ThemeToggle } from './theme-toggle';
import { Compass, GraduationCap, Plane, Library } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ComponentType } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  subtitle: string | null;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/explore',        label: 'Explore',       icon: Compass,       subtitle: null,               exact: false },
  { href: '/classes',        label: 'Classes',        icon: GraduationCap, subtitle: null,               exact: false },
  { href: '/lesson-planner', label: 'Lesson Planner', icon: Plane,         subtitle: null,               exact: false },
  { href: '/library',        label: 'Library',        icon: Library,       subtitle: null,               exact: false },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const mockMode = isMockMode();
  const { resolvedTheme } = useTheme();

  const handleSignOut = async () => {
    if (mockMode) {
      router.push('/login');
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="w-64 bg-lc-surface border-r border-lc-border flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-lc-border-subtle">
        <div className="flex items-center justify-between">
          <Link href="/home" className="cursor-pointer">
            <Image
              src={resolvedTheme === 'light' ? '/lessoncaptain-logo-on-light.svg' : '/lessoncaptain-logo-on-dark-v2.svg'}
              alt="LessonCaptain"
              width={180}
              height={29}
              className="h-auto"
              unoptimized
            />
          </Link>
          <ThemeToggle className="text-lc-text3 hover:text-lc-text transition-colors" />
        </div>
        {mockMode && (
          <span className="text-xs text-lc-warn bg-lc-warn/10 px-2 py-0.5 rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.subtitle ? `${item.label} – ${item.subtitle}` : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-lc-amber/10 text-lc-amber border-l-2 border-lc-amber'
                  : 'text-lc-text3 hover:bg-lc-card hover:text-lc-text border-l-2 border-transparent'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex flex-col">
                <span>{item.label}</span>
                {item.subtitle && (
                  <span className="text-xs text-lc-text3 font-normal" aria-hidden="true">{item.subtitle}</span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-lc-border-subtle">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-lc-amber/15 flex items-center justify-center text-lc-amber text-sm font-medium">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-lc-text3 truncate block">{user.email}</span>
          </div>
        </div>
        <div className="px-3 mb-2">
          <CreditBadge />
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left text-sm text-lc-text3 hover:text-lc-text px-3 py-1"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
