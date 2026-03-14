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

const navItems = [
  { href: '/classes', label: 'Classes', icon: '📚' },
  { href: '/lesson-planner', label: 'Lesson Planner', icon: '📝' },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const mockMode = isMockMode();

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
    <aside className="w-64 bg-lc-surface border-r border-lc-border flex flex-col">
      <div className="p-6 border-b border-lc-border-subtle">
        <Image src="/lessoncaptain-logo-on-dark.svg" alt="LessonCaptain" width={180} height={29} className="h-auto" />
        {mockMode && (
          <span className="text-xs text-lc-warn bg-lc-warn/10 px-2 py-0.5 rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-lc-blue/10 text-lc-blue'
                : 'text-lc-text3 hover:bg-lc-card hover:text-lc-text'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-lc-border-subtle">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-lc-blue/15 flex items-center justify-center text-lc-blue text-sm font-medium">
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
    </aside>
  );
}
