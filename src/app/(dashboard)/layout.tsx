import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { MOCK_USER } from '@/lib/mock/data';
import type { User } from '@supabase/supabase-js';
import { SkyBackground } from '@/components/ui/sky-background';

function isMockModeServer(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user: User | null = null;

  if (isMockModeServer()) {
    // In mock mode, use the mock user directly
    user = MOCK_USER as unknown as User;
  } else {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

  if (!user) redirect('/login');

  return (
    <div className="relative min-h-screen flex text-lc-text">
      <SkyBackground weatherState="climbing" earthState="takeoff" intensity="subtle" className="!left-64" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-lc-blue focus:text-white focus:font-medium focus:outline-none"
      >
        Skip to main content
      </a>
      <div className="relative z-10 flex flex-1 min-w-0">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0">
          <main id="main-content" className="flex-1 p-6 lg:p-8 overflow-auto">
            {children}
          </main>
          <footer className="sr-only" aria-label="LessonCaptain app footer" />
        </div>
      </div>
    </div>
  );
}
