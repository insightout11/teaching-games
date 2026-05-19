import { createServerSupabase } from '@/lib/supabase/server';
import { Sidebar } from '@/components/ui/sidebar';
import { MarketingNav } from '@/components/homepage/MarketingNav';
import { MarketingFooter } from '@/components/homepage/MarketingFooter';
import { SkyBackground } from '@/components/ui/sky-background';
import { MOCK_USER } from '@/lib/mock/data';
import type { User } from '@supabase/supabase-js';

function isMockModeServer(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let user: User | null = null;

  if (isMockModeServer()) {
    user = MOCK_USER as unknown as User;
  } else {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

  if (user) {
    return (
      <div className="relative min-h-screen flex text-lc-text">
        <SkyBackground weatherState="golden" altitude={0.75} intensity="subtle" className="!left-64" />
        <div className="relative z-10 flex flex-1 min-w-0">
          <Sidebar user={user} />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-lc-bg text-lc-text flex flex-col">
      <SkyBackground weatherState="climbing" intensity="moderate" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 5, background: 'linear-gradient(180deg, rgba(7,11,20,0.55) 0%, rgba(7,11,20,0.65) 40%, rgba(7,11,20,0.72) 100%)' }}
      />
      <div className="relative z-10 flex flex-col flex-1">
        <MarketingNav />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
