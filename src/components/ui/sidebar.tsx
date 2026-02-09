'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isMockMode } from '@/lib/mock/auth';
import type { User } from '@supabase/supabase-js';

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
      // In mock mode, just redirect to login
      router.push('/login');
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-indigo-600">TeachPlay</h1>
        {mockMode && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
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
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-gray-600 truncate">{user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
