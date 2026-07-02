import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { MOCK_USER } from '@/lib/mock/data';
import type { User } from '@supabase/supabase-js';
import { SkyBackground } from '@/components/ui/sky-background';
import { BrandStingGate } from '@/components/ui/brand-sting-gate';
import { TeacherIdentify } from '@/components/analytics/TeacherIdentify';

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
      {/* Signature reveal — plays once per browser session on first app load. */}
      <BrandStingGate variant="full" storageKey="lc-sting-splash" holdMs={320} />
      <TeacherIdentify />

      <SkyBackground weatherState="golden" altitude={0.75} intensity="subtle" showCityLights={false} className="!left-64" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-lc-blue focus:text-white focus:font-medium focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Mobile fallback — the teaching dashboard requires a larger screen */}
      <div className="md:hidden fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 p-8 text-center bg-[#07111f]">
        <div className="space-y-3 max-w-xs">
          <div className="w-12 h-12 rounded-2xl bg-lc-blue/15 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-lc-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white">Open on a laptop or tablet</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            LessonCaptain is designed for screen sharing and live classroom control. The teaching dashboard works best on a larger screen.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a
            href="/pro"
            className="block w-full py-2.5 rounded-xl bg-lc-blue text-[#070B14] font-semibold text-sm"
          >
            View pricing
          </a>
          <a
            href="/"
            className="block w-full py-2.5 rounded-xl border border-white/15 text-white/70 font-medium text-sm"
          >
            Back to homepage
          </a>
        </div>
      </div>

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
